# 論文筆記 1-bit Adam: Communication Efficient Large-Scale Training with Adam’s Convergence Speed

<document-info>
- tags: #論文筆記#1-bit#Adam
- date: 2023/05/24
</document-info>

論文連結: https://arxiv.org/abs/2102.02888

從系統的角度來看，通信已成為主要瓶頸。1-bit Adam，最多可將通信量減少 5 倍，提供更好的可擴展性，並提供與未壓縮 Adam 相同的樣本收斂速度。

作者的主要發現是 Adam 的 variance（非線性項）在訓練期間變得穩定，因此我們可以在開始時（預熱階段）運行 Adam，並在其餘訓練（壓縮階段）中將其用作動量 SGD 的先決條件。 
> 作者首先基於基於壓縮和誤差補償的的 SGD 方法為 Adam 實施了基本壓縮策略，並發現該方法在 Adam 上有效但是無法達到與原本 Adam 相同效果。


作者通過預熱階段找到穩定的 variance $v_t$ 並假設$v_t$是一個常數項使得誤差補償機制發會作用。

最後實驗在多達 256 個 GPU 上進行的實驗表明，1-bit Adam 使 BERT-Large 預訓練的吞吐量提高了 3.3 倍，而 SQuAD 微調的吞吐量提高了 2.9 倍。

### 通訊瓶頸

All-Reduce 通信佔每步訓練時間的很大一部分，對於我們在上述兩個具有不同節點間網絡的集群上的實驗，高達 94% 和 75%。 當節點數量較多、批量大小/梯度累積步長較小或網絡帶寬較低時，通信開銷成比例地較大。這些是通信壓縮可以提供最大好處的情況。

### 回顧 Adam

原始的Adam可以用以下公式表示

![](./adam-formula.png)
> Here $x_t$ is the model at t-iteration, $g_t = ∇F(xt; ζt)$ is the stochastic gradient, $γ$ is the learning rate, $η$ usually is a very small constant, $β_1$ and $β_2$ are decaying factor that controls the speed of forgetting history information. Notice that we disable the bias correction term in the original Adam. Here we refer mt as the momentum term and $v_t$ as the variance term.

$m_{t+1}$ 整條式子是一個移動平均，所以$m_t$表示歷史平均；可理解為**歷史梯度大小+當前梯度**。

$v_{t+1}$ 這條式子則是衡量當前梯度與歷史梯度的**距離**(無關方向，第三條式子中開平方)。

這邊注意當$v_t$變成常數項的時候，Adam 則與 Momentum SGD 相等。

#### SGD (Vanilla SGD)
$x_{t+1} = x_t - \gamma g_t$

#### Momentum SGD
$m_{t+1} = \beta_1 m_t + (1 - \beta_1)g_t$,

$x_{t+1} = x_t - \gamma m_{t+1}$


### 誤差補償

[1-Bit Stochastic Gradient Descent and its Application to Data-Parallel Distributed Training of Speech DNNs](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/IS140694.pdf)

首先我們先理解一下誤差補償的工作方式:

將當前梯度加上上一次量化前的誤差，再進行量化。
> 量化到僅有正負(即1 bit)

舉個例子，假設第一輪量化時梯度為(2.8, -2.8)，則量化後的結果為(1, -1)，量化誤差為(-1.8, 1.8)，第二輪量化時梯度為(1.6, -1.6)，則需要加上前一輪的量化誤差後再進行量化，即對(1.6-1.8, -1.6+1.8)進行量化，量化結果為(-1, 1)，後續操作以此類推。
> 例子來源: https://zhuanlan.zhihu.com/p/502572483

> 1\) 進行壓縮，2\) 記住壓縮誤差，然後 3\) 在下一次迭代中將壓縮誤差加回

對於 SGD，進行誤差壓縮：

$x_t = x_{t-1} - \gamma C(g_t+\delta_{t-1}),\ \delta_t = g_t+\delta_{t-1}-C(g_t+\delta_{t-1})$

其中 $C(⋅)$ 是 1 位壓縮運算符。進行此錯誤補償的好處是歷史壓縮錯誤$\delta_t$ 和 $\delta_{t-1}$最終會自行抵銷：

$x_t=x_{t-1}-\gamma(g_t-\delta_t+\delta_{t-1})$

### 為什麼 Adam 不能與誤差補償相結合

Adam 非線性地依賴於梯度，這種非線性被廣泛認為對於 Adam 的優越性至關重要。 在這裡我們討論為什麼這種非線性使得 Adam 與誤差補償不相容。

若將誤差補償用於 Variance 會有非線性項產生從而難以估計。
![](./variance-with-error-correction.png)

誤差 $(\delta_{t-1} - \delta_t)^2$ 是一個非線性項，因而無法補償(下圖) 

![](./adam-compression.png)

### 隨訓練時間穩變得穩定的 variance
作者根據實驗，分析長時間下$v_t$項會趨近穩定。

![](./variance.png)

這個發現使得 1-bit Adam 能夠在 Adam variance 變得穩定後"凍結"它，然後在 1-bit 誤差補償和壓縮階段將其用作前提條件。

### 1-bit Adam
Adam 的 variance 項在早期變得穩定(大約15%~20%的訓練階段)。首先使用 vanilla Adam 進行幾個 epoch 作為熱身。 在預熱階段之後，壓縮階段開始，我們**停止更新方差項 $v$ 使其變成常數項**，當$v$變成常數項我們便可以應用壓縮補償。 在壓縮階段，我們基於採用誤差補償 1-bit壓縮的動量進行通信。 與原始的 float32 和 float16 訓練相比，這種 1-bit壓縮可以分別降低 97% 和 94% 的通訊成本。


![](./one-bit-adam-flow.png)

### 實驗
1-bit Adam 提供與未壓縮 Adam 相同的採樣收斂速度，並且在有限頻寬下運行速度比未壓縮算法快 n 倍。

![](./adam-vs-one-bit-adam.png)

![](./exp1.png)

![](./exp2.png)

