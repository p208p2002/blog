# Mixture of experts (MoE) 的路由設計與訓練

<document-info>
- tags: #論文筆記#MoE#Mixtral
- date: 2024/05/09
</document-info>

論文連結：[Switch Transformers](https://arxiv.org/pdf/2101.03961)

MoE 的特色在於它會將輸入導向對應的”專家“，這項機制前提是路由如何被訓練出來的，從預訓練上想要事先為每一筆訓練資料標註對應的類別幾乎不太可能；如果說要讓路由自動從資料中學習，那要如何避免“贏者全拿”產生的不平衡性問題？

![image](./switch-transformer.png)
> 將 Transformer 中的 FFN 層替換為稀疏的 Switch FFN 層（淺藍色）。

由上圖 Switch Transformers 的架構可知， MoE 的路由分發是 token-level 而非 sentence-level 或 document-level；這可能會是一般常見的誤解。

## 理解稀疏路由
### MoE Routing
MoE 層將 token representation 作為輸入 $x$，然後透過路由將資訊轉送到
總共 N 位專家 $\{E_{i}(x)\}^N_{i=1}$ 中最適合的 k 位專家。

路由是一個簡單的線性分類層，並且擁有可訓練權重$W_r$，透過與輸入 $x$ 內積得到輸出 logits：

$$
l_{x} = h(x) = W_r \cdot x 
$$

將分類器輸出套上 Softmax 得到路由權重，對應每一位專家的合適性分數：

$$
R = [p_1,p_2,...p_N]=\text{Softmax}(l_{x})
$$

選取分數最高的 k 位專家來處理 token 輸入 $x$ ，其中 $\tau$ 是路由 top-k 的索引集合：

$$
y=\underset{i \in \tau}{\sum} \ p_{i}(x)E_i(x)
$$

在 [Shazeer (2017)](https://arxiv.org/abs/1701.06538) 的 MoE 中 k>1 被視為是必要的，因為這可以為路由函數提供重要的梯度資訊，從而避免不平衡。

### Switch Routing

![image](https://hackmd.io/_uploads/rykiGcdGR.png)
> 示意圖展示了 token 的動態路由。每個專家處理一個由 capacity factor 調節的固定批次數量的 tokens。

Switch Routung 是一種簡化的策略，只將數據分配給一位專家。作者展示了這種簡化策略能夠保持模型的質量，減少分配計算並且性能更好。這種 k=1 的分配策略後來被稱為 Switch layer。

1. 路由器計算量減少，因為我們只將一個 token 路由到一位專家。
2. 每位專家的批次大小（專家容量）至少可以減半，因為每個 token 只會被路由到一位專家。
3. 路由的實現方式得到簡化，通信成本也降低了。上圖展示了在不同的專家容量因子下路由的例子。


## 稀疏路由的負載平衡
### 專家負載量
訓練過程中，token的分配是動態的，因此有可能某些專家分配到較多 token，最終形成贏者全拿的局面；因此作者設計了 expert capacity 指標去衡量分配情況，並且通過 capacity factor 允許一定程度的不平衡，當 capacity factor > 1 表示設置一個不平衡的緩衝。

$$
\text{expert capacity}=(\frac{\text{token per batch}}{\text{number of experts}})\times \text{capacity factor}
$$

當 expert 承接的 token 數量超過負載，則丟棄那些過量的 token （上圖紅線部份），這些數量通常 <1%。

### 負載平衡損失
為了進一步平衡負載，作者引入了輔助損失，這個輔助損失在訓練期間會與模型的訓練目標損失相加。

給予$N$位專家，並且由 $i=1...N$ 指示專家索引；以及一個批次 $\mathcal{B}$，內含有許多 tokens $T$。


計算 tokens 派送到專家$i$的比例：

$$
f_i=\frac{1}{T}\underset{x\in\mathcal{B}}{\sum}\mathbb{1}\{\text{arg max}\ p(x)=i\}
$$

> $\mathbb{1}\{\text{ ... }\}$： 當內部條件為真時返回 1，否則返回 0。


$P_i$ 是在整個批次 $B$ 中將 tokens 分配給專家 $i$ 的期望值（專家被路由分配到的機率）：

$$
P_i=\frac{1}{T}\underset{x\in\mathcal{B}}{\sum}p_i(x)
$$


輔助損失為向量 $f$ 和 $P$ 之間的內積：

$$
\mathcal{L}_{aux} = \alpha \cdot N \cdot \sum_{i=1}^N f_i \cdot P_i
$$

輔助損失函數的最小值會發生在每一位專家的 $f_i$ 和 $P_i$ 相等處，即 Token 被平均分配到每一位專家。
