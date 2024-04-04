# 論文筆記 Direct Preference Optimization: Your Language Model is Secretly a Reward Model

<document-info>
- tags: #論文筆記#DPO#PPO#RLHF
- date: 2024/04/02
</document-info>

論文連結: [https://arxiv.org/abs/2305.18290](https://arxiv.org/abs/2305.18290)

RLHF 的訓練流程複雜而且不穩定；首先我們訓練一個獎勵模型以反應人類偏好，然後利用強化學習微調語言模型來最大化估計獎勵，在過程中約束微調的模型不可以偏離原始模型太多。
> 標準的RLHF背後使用PPO技術。

我們介紹一個可用於RLHF的參數化隱式獎勵模型，讓我們可以僅用自監督方法解決標準RLHF問題。

![image](./dpo-vs-ppo.png)

> DPO優化人類偏好，同時不需要使用強化學習。現有的 RLHF 方法首先將獎勵模型擬合到一個包含提示和人類對不同回應對的偏好的數據集中，然後使用強化學習找到最大化學習獎勵的策略。相比之下，DPO直接優化最能滿足偏好的策略，使用簡單的分類目標，擬合一個隱式獎勵模型，其相應的最優策略可以以封閉形式提取。

我們將展示現有 RL 方法的訓練目標可以透過 cross-entropy 優化，大幅度的簡化訓練流程。

在較高層面上，現有方法使用標註的人類偏好集將所需的行為灌輸到語言模型中，這些偏好集代表了人類認為安全和有幫助的行為類型。

這個偏好學習階段發生在對大型文字資料集進行大規模無監督預訓練的初始階段之後。

## 回顧 PPO-based RLHF
1. 監督微調（SFT）。
2. 偏好抽樣和獎勵學習。
3. 強化學習調參。

### 自監督訓練階段 
在預訓練模型上微調高品質的下游任務(dialogue, summarization, etc.)是RLHF的起點，在這個過程中我們可以獲得*策略*$\pi^{SFT}$，相當於基礎模型。
> *策略* (Policy) 可以理解為通過某種方式解決給定問題的模型。
> 一個問題可以被多種策略解決，而我們希望透過RL找到最佳*策略*。
### 獎勵模型建模階段
$\pi^{SFT}$會由許多提示 $x$ 驅動以獲得一對答案：

$(y_1,y_2)\sim\pi^{SFT}(y|x)$

接著僱用人工標注偏好資料：
$y_w \succ y_l|x$

>$\succ$: 偏好方向。
> $y_w$: 偏好答案。
> $y_l$: 次佳或不偏好。

偏好是由某種潛在獎勵模型產生的，我們沒辦法直接存取：

$r^*(y,x)$

有幾種方法可以取得偏好獎勵
- *Bradley-Terry*: 1v1對戰模型，預測獲勝的一方。
- *Plackett-Luce*: 是一種排序模型。

考慮 Bradley-Terry 模型，我們可以將人類偏好分佈$p^*$寫成

$$p^*(y_1 \succ y_2\ |\ x)=\frac{\exp(r^*(x,y_1))}{\exp(r^*(x,y_1))+\exp(r^*(x,y_2))}\tag{1}$$

假設我們有一資料集從 $p^*$ 抽樣 $\mathcal{D}=\{x^{(i)},y_w^{(i)},y_l^{(i)}\}^N_{i=1}$ 我們可以參數化獎勵模型$r_\phi(x,y)$，並且藉由[最大概似估計](https://medium.com/qiubingcheng/%E6%9C%80%E5%A4%A7%E6%A6%82%E4%BC%BC%E4%BC%B0%E8%A8%88-maximum-likelihood-estimation-mle-78a281d5f1d)找到合適的模型參數。

將問題定調為二元分類，我們現在有 negative log-likelihood loss :

$$\mathcal{L}_R(r_{\phi},\mathcal{D})=-\mathbb{E}_{(x,y_w,y_l)~\sim \mathcal{D}}[\log\  \sigma(r_{\phi}(x,y_w)-r_{\phi}(x,y_l))]\tag{2}$$

> $\sigma$ 表示 sigmoid 函數。

> $r_{\phi}(x,y_w)$ 與 $r_{\phi}(x,y_l)$ 拉的越開，損失會越趨近於0。

### 強化學習微調階段
在RL訓練階段，我們使用可學習的獎勵函式來提供回饋給語言模型。具體來說我們制定了最佳化問題：

$$\underset{\pi_{\theta}}{\operatorname{max}} \mathbb{E}_{x\sim \mathcal{D},y\sim\pi_{\theta}(y|x)}[r_{\phi}(x,y)]-\beta\mathbb{D}_{KL}[\pi_{\theta(y|x)}||\pi_{ref}(y|x)]\tag{3}$$


> 找到$\pi_{\theta}$能最大化獎勵$r_{\phi}$並且很靠近$\pi_{ref}$。

> $\beta$ 是控制與 $\pi_{ref}$ 偏差的參數。


在實踐中，$\pi_{\theta}$ 由 $\pi^{SFT}$初始化而來。這附加約束很重要，因為它可以防止模型偏離獎勵模型準確的分佈太遠，在保持生成多樣性的同時防止模型因為單一過高的獎勵答案發生崩潰。

由於自然語言生成的離散性，目標函式通常不可微分，並且透過RL技術來學習，標準的PPO獎勵函式如下：
$$r(x,y) = r_\phi(x,y) - \beta(\log\pi_\theta(y|x) - \log\pi_{ref}(y|x))$$

## Direct Preference Optimization

受到在大規模問題上應用強化學習算法（如微調語言模型）的挑戰所激發，我們的目標是提出一種直接使用偏好進行策略優化的簡單方法。

我們的主要見解是利用從獎勵函數到最優*策略*的分析映射，這使我們能夠將獎勵函數的損失函數轉換為*策略*的損失函數。

跟隨之前的 RL 研究與 RL 優化目標 (Eq.3)，獎勵函式 $r$ 在考量KL約束要最大化獎勵值，我們已知最優解：

$$\pi_r(y|x)=\frac{1}{Z(x)}\pi_{ref}(y|x)\exp(\frac{1}{\beta}r(x,y))\tag{4}$$

> $Z(x)$: 分配函數。

> $\pi_r$: 最佳化獎勵*策略*


重新排列方程式 Eq.4 (通過對等式兩邊取對數和代數運算)，得到一個用獎勵函數來表示：
- 最佳化獎勵*策略*$\pi_r$
- 參考策略$\pi_{ref}$
- 以及配分函數$Z(x)$：

$$r(x,y)= \beta\log(\frac{\pi_r(y|x)}{\pi_{ref}(y|x)})+\beta\log Z(x)\tag{5}$$

我們將重參數化得到的 $r(x,y)$ 應用到 Eq.1 上的真實獎勵 $r^*(x,y)$，分配函數$Z(x)$將會被消除，並且我們用 $\pi^*$ 來表示最佳*策略*。因此，最佳的 RLHF *策略* $\pi^*$ 在 Bradley-Terry 模型下滿足人類偏好分佈：

$$p^*(y_1\succ y_2\ |\ x)=\frac{1}{1+\exp(\beta\log\frac{\pi^*(y2|x)}{\pi_{ref}(y2|x)}-\beta\log\frac{\pi^*(y1|x)}{\pi_{ref}(y1|x)})}\tag{6}$$


現在我們有基於最佳*策略*的人類偏好分佈而非獎勵模型，我們可以為*策略* $\pi_\theta$ 制定最大似然目標以擬合參數。與獎勵建模方法（Eq.2）類似，我們的*策略*的訓練目標變成：

$$\mathcal{L}_{DPO}(\pi_\theta;\pi_{ref})=-\mathbb{E}_{(x,y_w,y_l)\sim\mathcal{D}}[\log \sigma(\beta\log\frac{\pi_\theta(y_w|x)}{\pi_{ref}(y_w|x)}-\beta\log\frac{\pi_\theta(y_l|x)}{\pi_{ref}(y_l|x)})]\tag{7}$$

我們使用參數化的方法替代了顯式獎勵模型，讓最佳*策略*是簡單的 $\pi_\theta$。

### DPO 更新了什麼？
要從原理上理解DPO，分析損失函數 $\mathcal{L}_{DPO}$ 的梯度是很有幫助的。

與參數 $\theta$ 有關的梯度可以寫成：

$\nabla_\theta\mathcal{L}_{DPO}(\pi_\theta;\pi_{ref})=$

$-\beta\mathbb{E}_{(x,y_w,y_l)\sim\mathcal{D}}[\underset{\text{擁有較高的權重當獎勵估計錯誤}}{\ \sigma({\hat{r}_\theta(x,y_l)-\hat{r}_\theta(x,y_w))\ }}[\underset{\text{增加}y_w\text{的概似性}}{\ \nabla_\theta\log\pi(y_w|x)}-\underset{\text{降低}y_l\text{的概似性}}{\nabla_\theta\log\pi(y_l|x)\ }]]$

> $\hat{r}_\theta(x,y)=\beta\log\frac{\pi_\theta(y|x)}{\pi_{ref}(y|x)}$ 是由語言模型 $\pi_\theta$ 定義的隱式獎勵，詳見論文第5章。


> 當$\hat{r}_\theta(x,y_l)>\hat{r}_\theta(x,y_w)$，算式 $\sigma({\hat{r}_\theta(x,y_l)-\hat{r}_\theta(x,y_w))}$ 越接近1，反之接近0，若兩者趨近則該權重接近0.5。

直觀上，我們透過損失函數 $\mathcal{L}_{DPO}$ 增加偏好$y_w$的概似，並且降低了不偏好$y_l$的概似。

### 總結 DPO
DPO的流程如下：
1. 從許多提示 prompt $x$ 採樣一些輸出 $y_1,y_2\sim\pi_{ref}(·|x)$，接著使用人工標註的方式得到離線偏好資料集 $\mathcal{D}=\{x^{(i)},y_w^{(i)},y_l^{(i)}\}_{i=1}^N$。
2. 使用 $\mathcal{L}_{DPO}$、資料集 $\mathcal{D}$ 和偏差參數 $\beta$ 優化語言模型 $\pi_\theta$ 。
> 相比 PPO-based RLHF 省略了獎勵建模階段。

實務上，我們會想要使用公開的偏好資料集，而非採樣後使用人工標記。偏好資料集通常是使用 $\pi^{SFT}$ 採樣得到。

當可以取得 $\pi^{SFT}$，我們初始化 $\pi_{ref}=\pi^{SFT}$。

當 $\pi^{SFT}$ 不可取得，我們藉由最大概似估計偏好目標 $(x,y_w)$ 來獲得 $\pi_{ref}$：

$$\pi_{ref}=\underset{\pi}{\text{arg max}}\ \mathbb{E}_{x,y_w\sim\mathcal{D}}[\log\pi(y_w|x)]$$

## 實驗
實驗聚焦在兩個面向:
1. DPO如何有效的去權衡，$^1$最大化獎勵和$^2$最小化$\pi_\theta$ 和 $\pi_{ref}$ 的KL散度
2. 評估 DPO 在更大模型和更困難的 RLHF 任務，包括總結和對話。

我們發現在幾乎不調整超參數的狀況下，DPO的表現等同或超過基線(PPO-based RLHF)。

<!-- ![image](https://hackmd.io/_uploads/BJDuIg_JC.png) -->

<!-- ![image](https://hackmd.io/_uploads/HyPrsAdyA.png) -->

### 可控情緒生成

![image](./exp1.png)

- DPO: 論文方法。
- Unlikelihood: 簡單的最大化 $y_w$ 和最小化 $y_l$ 的概似。
- PPO: 使用*獎勵函數*去學習偏好資料。
- PPO-GT: 使用真實答案 (ground truth) 的*獎勵函數*(僅在可空情緒生成可取得)去學習。
- Preferred-FT: 在 $y_w$ 上進行監督式學習的微調。

輸入是IMDb資料集中的電影評論，*策略*必須產生正面情緒的回應。為了控制評估，我們針對這個實驗用預訓練的情緒分類器產生了偏好對 $y_w$ 和 $y_l$，並且 $p(positive | x, yw) > p(positive | x, yl)$ 。

實驗顯示 DPO 能在獲得較高的獎勵下，同時保持較低的KL。


### 摘要生成

![image](./exp2.png)

- PPO: 使用*獎勵函數*去學習偏好資料。
- SFT: 使用資料集的資料進行自監督微調。
- Preferred-FT: 使用來自SFT模型偏好的 $y_w$ 進行自監督微調。
- GPT-J: Zero-shot prompting。
- Best of N: 從 SFT 模型中取樣 N 個反應，並根據從偏好資料集中學習到的獎勵函數傳回得分最高的反應。

使用GPT-4作為裁判，與人類撰寫總結進行1v1對戰，結果顯示DPO的表現最佳，並且在較高的溫度(sampling temperature)下也保持較佳的表現。

### 單輪對話

在單輪對話中，我們在[Anthropic HH數據集](https://huggingface.co/datasets/Anthropic/hh-rlhf)的測試集子集上評估不同的方法。

![image](./exp3.png)

- Preferred-FT: 使用來自通用語言模型偏好的 $y_w$ 進行自監督微調。
- Best of N: 從 Preferred-FT 模型中取樣 N 個反應，並根據從偏好資料集中學習到的獎勵函數傳回得分最高的反應。
- Pythia-2.8B: 2-shot prompting。

DPO是唯一能在Anthropic HH測試集中高效率計算並且改進偏好生成的方法。

> 作者也有在 Anthropic HH 使用 PPO 進行訓練，但是沒有能發現合適的超參數讓該模型表現贏過 Pythia-2.8B。根據文章總結的實驗結果，作者認為 Best of 128 大致上能替代表示 PPO 的性能。

<!-- 
![image](https://hackmd.io/_uploads/ByL7Jxt1C.png)

基於 GPT-4 評估，在 Anthropic HH 單論對話中的勝率。DPO在不同溫度取樣下表現非常穩定。 -->

## 總結
DPO的性能與現有的RLHF算法相似或更好，而且有效降低了從人類偏好中訓練更多語言模型的障礙；與標準的RL設置不同，DPO確定了語言模型策略和獎勵函數之間的映射，這使得可以使用簡單的 binary cross-entropy loss 直接訓練語言模型以滿足人類的偏好，而無需使用強化學習。

