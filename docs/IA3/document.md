# Few-Shot Parameter-Efficient Fine-Tuning is Better and Cheaper than In-Context Learning

<document-info>
- tags: #論文筆記#PEFT#IA3
- date: 2023/12/05
</document-info>

論文連結: [Few-Shot Parameter-Efficient Fine-Tuning is Better and Cheaper than In-Context Learning](https://arxiv.org/abs/2205.05638.pdf)

### 摘要
少樣本情境學習（ICL）使預先訓練的語言模型能夠在沒有基於梯度的訓練的情況下執行以前未見的任務，方法是將少量的訓練示例作為輸入的一部分。ICL 產生相當大的計算、記憶體和存儲成本，因為它涉及在每次進行預測時處理所有的訓練示例。參數高效微調（PEFT）（例如適配器模塊、提示微調、稀疏更新方法等）提供了一種替代範式，其中訓練一小組參數以使模型能夠執行新任務。

雖然 PEFT 的優勢解決了微調相對於 ICL 的一些不足，但相對於極少標記數據的情況下，對於 PEFT 方法是否能夠很好地工作，目前相對較少的關注。本文的主要目標是通過提出一種配方（即模型、PEFT 方法和一組固定的超參數），來填補這一空白。

IA3 達到比全調參更強的性能，並且需要更新的參數量非常少。

### ICL分析
#### ICL的優點
ICL方法允許模型立即執行許多任務，並且無須微調。ICL通常適用於受限標記資料的任務類型(又稱 few-shot learning)。ICL具有data-efficient。

#### ICL的缺點
首先，處理所有的 Prompt 輸入，然後讓模型產生預測花費大量的計算成本。

其次，ICL通常僅能提供次於微調的性能。

最後，對於輸入的格式或是提供的範例差異，可以極大地影響模型性能，使的一些模型行為變得不可預測。

### PEFT
Parameter-efficient fine-tuing (PEFT) 提供了一種選擇，通過小量的參數微調來影響模型。近期的PEFT方法可以與 fine-tuning 方法有相同性能表現。

PEFT 需要支付的另一項成本是微調本身的成本，這必須執行一次，然後在模型用於推論時攤提。然而，作者將展示，在考慮微調和推論兩者的情況下，PEFT 可以在更好的精度下實現截然不同的計算效率，勝過 ICL。

### Unlikelihood Training and Length Normalization
#### Unlikelihood Training
語言模型通使用 cross-entropy loss $L_{LM}$ 進行訓練

$L_{LM}=-\frac{1}{T} \sum_{t} \log{p}(y_{t}|x,y_{<t})$

為了避免讓模型學到錯誤選項，作者使用了unlikelihood loss $L_{UL}$

$L_{UL}=-\frac{\sum_{n=1}^{N}\sum_{t=1}^{T^{(n)}}\log(1-p(\hat{y}^{(n)}|x,\hat{y}_{<t}^{(n)}))}{\sum_{n=1}^{N}T^{(n)}}$

$\hat{y}^{(n)}=(\hat{y}_{1},\hat{y}_{2}...,\hat{y}_{T^{(n)}})$ 表示第 $n$-th個不正確的候選句($N$)。

作者提出的假設是，添加 unlikelihood loss（$L_{UL}$）將改善排名分類的結果，因為模型將被訓練為將較低的概率分配給不正確的選擇，從而提高正確選擇被排名最高的機會。

#### Length Normalization
對於給定的訓練示例，可能的目標序列在長度上可以有顯著不同，尤其是在多選任務中。基於概率對每個選擇進行排名可能會「偏向」較短的選擇，因為模型分配給每個標記的概率 ≤ 1。為了糾正這一點，作者在進行排名分類時考慮使用長度歸一化，這將模型對每個可能的答案選擇的分數除以該選擇中的標記數（就像在GPT-3 中使用的方式）。在評估過程中使用長度歸一化時，作者在訓練期間引入了一個額外的損失項，更接近於反映經過長度歸一化的評估。

首先，作者計算給定輸出序列的長度歸一化對數機率。

$\beta(x,y)=\frac{1}{T}\sum_{t=1}^{T}\log{p}(y_{t}|x,y_{<t})$

接著，通過最小化 cross-entropy loss，來最大化正確答案選擇的長度歸一化對數機率

$L_{LN}=-\log{\frac{\exp(\beta(x,y))}{\exp(\beta(x,y))+\sum_{n=1}^{N}\exp{(\beta(x,\hat{y}^{(n)}))}}}$

當訓練模型的時候作者直接將這些損失相加

$L=L_{LM}+L_{UL}+L_{LN}$

作者發現使用額外的 $L_{UL}$ 和 $L_{LN}$ 將模型正確率從60.7%提升到63.3%。

### Parameter-efficient fine-tuning with IA3

1. 模型增加或是可訓練參數必須盡可能的少，藉此來避免增加儲存和記憶體開銷。

2. 該方法的性能在 few-shot training 上的表現也必須足夠好。

3. PEFT方法應該避免去更動到模型本來的結構，但是允許新增獨立的區塊。

作為一種替代方法，作者探討了模型的激活與一個學習向量進行逐元素乘法（即重新縮放）的方法。

![image](./1.png)

具體來說作者修改了attention，對其加入$l_{k}$和$l_{v}$

$softmax(\frac{Q(l_{k}\cdot K^{T})}{\sqrt{d_{k}}})(l_{v}\cdot V)$

然後在 position-wise feed-forward networks 加入 $l_{ff}$

$(l_{ff}\cdot \gamma(W_{1}x))W_{2}$

$\gamma$ 是網路中的非線性層。

作者對每一個 Transformer layer 都做了一樣的改動。

#### IA3 Pseudocode
```python
def transformer_block_with_ia3(x):
    residual = x
    x = ia3_self_attention(x)
    x = LN(x + residual)
    residual = x
    x = x @ W_1 # FFN in
    x = l_ff * gelu(x) # (IA)3 scaling
    x = x @ W_2 # FFN out
    x = LN(x + residual)
    return x

def ia3_self_attention(x):
    k, q, v = x @ W_k, x @ W_q, x @ W_v
    k = l_k * k
    v = l_v * v
    return softmax(q @ k.T) @ V
```

### Experiments
![image](./2.png)

在 few-shot 資料集上面，IA3用少量參數贏過競爭對手，並且表現比Full Fine-tune更好。

![image](./3.png)

不同少樣本學習方法的準確度。T-Few 使用 (IA)3 作為 T0 的 PEFT 方法，T0 使用零樣本學習，T5+LM 和 GPT-3 使用 few-shot ICL。

![image](./4.png)

T-Few僅用對比於 GPT-3 175B 的千分之一算力，就達到了72.4%的準確率，甚至比 GPT-3 175B 還要高出6%。T-Few 的訓練成本相當於給 GPT-3 175B 看20個ICL範例。

> 估計一個 decoder-only 的 Transformer（例如GPT系列）具有 N 個參數，每個 token 在推理時使用 2N FLOPs，而在訓練時使用6N FLOPs。像T0和T5這樣的 encoder-decoder 模型（其中 encoder 和 decoder 具有相同數量的層和大小）僅使用 encoder 或 decoder 處理每個 token，因此每個 token 的FLOPs估計值減半為推理和訓練時的 N 和 3N FLOPs。

![image](./5.png)

T-Few 在 RAFT 資料集上的表現首次超越人類基準。

### Conclusion
作者引入了T-Few，這是一種參數高效的少數樣本學習方法，以比少數樣本ICL更低的計算成本實現更高的準確性。T-Few使用(IA)3，一種新的PEFT方法，通過學習的向量對內部激活進行重新縮放。使用(IA)3相比於對整個模型進行微調，可以獲得更好的性能，同時僅引入了微小量的額外參數。