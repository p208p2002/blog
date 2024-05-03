# 旋轉位置編碼 (RoPE) 筆記與外推方法 

<document-info>
- tags: #旋轉矩陣#RoPE#position-embedding
- date: 2024/05/03
</document-info>

- [图解RoPE旋转位置编码及其特性](https://mp.weixin.qq.com/s/-1xVXjoM0imXMC7DKqo-Gw)
- [详解基于调整RoPE旋转角度的大模型长度外推方法](https://mp.weixin.qq.com/s?__biz=MzA3MTgwODE1Ng==&mid=2247484826&idx=1&sn=8935f0bcb2e09f438cbf3ae63825d671&chksm=9f26a069a851297f568ba7cd111082e603108716928b8444a253457233f24d09d3a18447d6b9&cur_album_id=3199751010206973953&scene=189)

### 簡單旋轉矩陣
一個簡單的二維旋轉矩陣，其中$\theta$表示弧度：

$$
M(\theta) = \begin{pmatrix}
\cos \theta & -\sin \theta \\
\sin \theta & \cos \theta 
\end{pmatrix}
$$

將一個二維的向量乘上該旋轉矩陣可以進行旋轉，而不改變其長度。

我們還可以引入位置資訊 $m$ (token 位置) 來讓不同位置擁有不同的旋轉弧度：

$$
R_m = \begin{pmatrix}
\cos m\theta & -\sin m\theta \\
\sin m\theta & \cos m\theta 
\end{pmatrix}
$$

現在我們有 RoPE 位置編碼函數，可以對一個二維的 token query 向量 $q$ 加上位置資訊：

$$
f(q,m)=q\times R_m=\begin{pmatrix}
\cos m\theta & -\sin m\theta \\
\sin m\theta & \cos m\theta 
\end{pmatrix}\begin{pmatrix}q_0\\q_1\end{pmatrix}
$$

### 高維旋轉矩陣

透過將高維度向量兩兩一組分別旋轉，我們可以得到高維度的旋轉矩陣：
$$
R_m=
\begin{pmatrix}
\cos m\theta_0 & -\sin m\theta_0 & 0 & \cdots & 0 \\
\sin m\theta_0 & \cos m\theta_0 & 0 & \cdots & 0 \\
0 & 0 & \cos m\theta_1 & -\sin m\theta_1 & \vdots \\
0 & 0 & \sin m\theta_1 & \cos m\theta_1 & \vdots \\
\vdots & \vdots & \vdots & \vdots & \ddots \\
0 & 0 & 0 & 0 & \cos m\theta_{d/2-1} & -\sin m\theta_{d/2-1} \\
0 & 0 & 0 & 0 & \sin m\theta_{d/2-1} & \cos m\theta_{d/2-1}
\end{pmatrix}
$$

我們注重弧度如何變化，$d$ 表示維度，$i$ 表示分量，$base$ 是常數，在 LLaMA 中設定為10000：

$$
\theta_i=base^{-2i/d}
$$

在這邊我們還可以發現在每一個分量中，會有不同的旋轉頻率。

## 拓展方法
### Position Interpolation
- [Extending Context Window of Large Language Models via Positional Interpolation](https://arxiv.org/abs/2306.15595)

![image](./pi.png)
考慮一個預訓練的Llama模型，其上下文窗口長度為2048。左上角展示了LLM模型的常規使用方式：輸入位置索引（藍點）位於預訓練範圍內。右上角展示了長度外推，其中模型需要操作未見過的位置（紅點），達到4096。左下角展示了位置插值，我們將位置索引（藍點和綠點）從[0, 4096]縮小到[0, 2048]，以強制它們位於預訓練範圍內。 

設原始訓練長度 $L$ 要外推到 $L'$， PI 方法縮小每個位置的旋轉弧度，讓向量旋轉得慢一些，每個位置的旋轉弧度變為原來的$\frac{L}{L'}$，長度擴大幾倍，則旋轉弧度縮小幾倍。

$$
\theta_i=base^{-2i/d}\times\frac{L}{L^{'}}
$$


### NTK-Aware

- [NTK-Aware Scaled RoPE](https://www.reddit.com/r/LocalLLaMA/comments/14lz7j5/ntkaware_scaled_rope_allows_llama_models_to_have/)

![image](./ntk.png)
> Previous method = Position Interpolation


NTK-Aware 是一種非線性插值方法，它不是直接均勻地縮放弧度而是通過改變base去達到調整旋轉頻率的目的：
$$
\theta_i = (base\times\alpha)^{-2i/d}
$$

該插值方案沒有直接對傅立葉特徵進行縮放，因此不同位置間的特徵保持獨特和可識別。在傅立葉特徵中，每一個位置都有其對應的特徵波形，直接縮放傅立葉特徵可能會導致不同位置的特徵波形重疊或變得難以區分。但是，通過改變 base 而非 $\theta$，每個位置的特徵仍然保持獨特，即使在極端擴展下也能夠被精確地識別。

- [Dynamically Scaled RoPE](https://www.reddit.com/r/LocalLLaMA/comments/14mrgpr/dynamically_scaled_rope_further_increases/)

![image](./dynamic-ntk.png)

當文本長度大於訓練長度才使用 NTK-Aware。