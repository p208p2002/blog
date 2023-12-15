# 概覽 Parameter-Efficient Fine-Tuning (PEFT)

<document-info>
- tags: #peft#overview#LLM#fine-tune#LoRA#Adapter
- date: 2023/12/15
</document-info>

語言模型（LM）技術已經實現一些重大突破，使得模型的規模更加龐大。然而，對大部份的人說，要微調如此巨大的模型所需的門檻太高。Parameter-efficient fine-tuning（PEFT）提供了一種新的訓練方法，即通過訓練一小組參數，使微調門檻降低，並且讓模型能夠適應和執行新的任務。

### LM fine-tuning 演進
![image](./1.png)

1. Full fine-tuning
Transformer 架構模型剛推出時(BERT,GPT, etc.)，普遍模型大小落在500M~700M左右，這時候高端的消費級顯卡可以負擔微調所需的硬體門檻。

2. In-Context learning
隨時間推進，LM研究開始堆疊模型參數，GPT-3推出的時候該模型有175B，一般的硬體設備連推論都無法負擔，僅能透過特定API存取。而開發者OpenAI對於GPT-3應用到下游任務的解方便是ICL。

3. Parameter-efficient fine-tuning (PEFT)
ICL無法完整發揮模型能力，並且效率較低，有研究開始透過訓練少量模型參數來達到微調效果，藉此大幅度降低硬體負擔並讓模型變得更穩健與可控。

### In-Context Learning 是什麼?
![image](./2.png)
> ICL中的範例其實包含四個不同面向：輸入標籤映射、輸入文本的分佈、標籤空間以及將輸入標籤配對。

少樣本情境學習（ICL）使預先訓練的語言模型能夠在沒有任何基於梯度的訓練的情況下執行先前未見過的任務，方法是將少量的訓練示例作為輸入的一部分。ICL 產生相當大的計算、記憶體和存儲成本，因為它涉及在每次進行預測時處理所有的訓練示例。

##### ICL的優點
ICL方法允許模型馬上執行許多任務，並且無須微調。ICL通常適用於受限標記資料的任務類型(又稱 few-shot learning)。ICL具有data-efficient。

##### ICL 的缺點

首先，處理所有的提示輸入會使模型產生高昂的計算成本。其次，通常情況下，使用ICL只能提供比微調性能稍次的結果。最後，輸入格式或提供的範例的不同可能極大地影響模型的性能，使得一些模型行為變得難以預測。

![image](./3.png)

> 在IA3的文獻中提到，PEFT方法(表中 T-Few )比ICL需要的計算力更低。
> 即便算上訓練算力，在ICL使用超過20個 few-shot sample 後優勢便不存在。

### 各種類型的 PEFT 
![image](./4.png)

#### Additive methods
Additive methods 的主要思想是通過添加額外的參數或層來擴充現有的預訓練模型，僅對新添加的參數進行訓練。在這方面有兩個主要類別，即 Adapter 和 soft prompt。

Adapter 涉及在Transformer架構中引入小的全連接可訓練層，而 soft prompt 旨在通過保持其結構固定和凍結來修改輸入 prpmpt，從而控制LLM的行為。

#### Selective Methods
選擇性方法對模型的現有參數進行微調，這可以是基於層深度的選擇、基於層類型的選擇，甚至是個別參數的選擇。其中一個例子是注意力調整。研究人員發現這些基於選擇性的方法的性能有好有壞，並且在參數效率和計算效率之間存在明顯的折衷。

#### Reparametrization-based methods
基於重新參數化的 PEFT 方法利用 low-rank approximation 性質來最小化可訓練參數的數量。low-rank matrix 旨在捕捉高維數據的潛在 low-rank 結構。該方法的直覺是凍結原始LLM參數，通過建立新的 low-rank 轉換並引入少量可訓練參數。

### 代表性 PEFT 方法介紹

#### BitFit 
BitFit 僅微調網絡的 Bias。BitFit僅更新模型約0.05％的參數量。

```python
params = (p for n, pin model.named_parameters() if "bias" in n)
optimizer = Optimizer(params)
```

![image](./5.png)

BitFit 是一個非常簡單的方法，但是性能表現較 full fine-tuning 差。

#### Prefix Tuning

![image](./6.png)

Prefix Tuning 凍結了Transformer的參數，僅對 prefix（即紅色區塊）進行優化。因此，我們只需為每個任務儲存 prefix，使得 prefix tuning 更具模塊化和節省空間的特點。

#### Prompt Tuning
![image](./7.png)

prompt tuning，這是一種簡單而有效的機制，用於學習 "soft prompt" 以使凍結的語言模型能夠執行特定的下游任務。與GPT-3使用的離散文本提示不同，軟提示是通過反向傳播學習的，可以調整以納入來自任意數量的 token 示例的訊號。

prompt tuning使得單一模型能夠透過將不同的提示嵌入簡單地連接到批次中的每個範例來執行許多任務。

![image](./8.png)

作者的學習方法在性能上大大優於 GPT-3 的 ICL (Prompt Design)。

#### SPoT
![image](./9.png)
SPoT 改進了 Prompt Tuning，對 Prompt 加入預訓練動作(在 source task 上預訓練，然後遷移到 target task)，這項改動使得 Soft Prompts 方法能夠媲美 Fine Tuning。

#### Adapter

![image](./10.png)

Adapter 是將一個小型可訓練的前饋網路(feed-forward networks)插入到 transformer-layer 之間。

Adapter 有效地向模型添加額外的（小型）層，導致計算成本和記憶體略微增加，但是這增加是不可忽視的。

![image](./11.png)
基於 Adapter 的微調在所訓練的參數數量上達到了與 full fine-tunning 相似的性能，而所需參數數量少了兩個數量級。

#### LoRA

![image](./12.gif)

對於預訓練權重$W_{0} \in \mathbb{R}^{d \times d}$，將計算隱藏層數值的公式

$h=W_{0}x$

修改成

$h=W_{0}x+\delta Wx$

$\delta Wx=BAx$

$B \in \mathbb{R}^{d \times r}$, $A \in \mathbb{R}^{r \times d}$

我們使用低秩矩陣分解($BA$)來限制更新，並且rank $r << min(d,k)$。

注意，$W_{0}$ 和 $\delta W = BA$ 都與相同的輸入相乘。在訓練過程中，$W_{0}$被凍結並且不接收梯度更新。

![image](./13.png)

LoRA的表現優於比較對象，包括 full fine-tuning。


#### IA3
![image](./14.png)

具體來說作者修改了attention，對其加入$l_{k}$和$l_{v}$

$softmax(\frac{Q(l_{k}\cdot K^{T})}{\sqrt{d_{k}}})(l_{v}\cdot V)$

然後在 position-wise feed-forward networks 加入 $l_{ff}$

$(l_{ff}\cdot \gamma(W_{1}x))W_{2}$

$\gamma$ 是網路中的非線性層。

作者對每一個 Transformer layer 都做了一樣的改動。

##### IA3 Pseudocode
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

![image](./15.png)

在 few-shot 資料集上面，IA3用少量參數贏過競爭對手，並且表現比 full fine-tuning更好。

#### Ladder Side-Tuning
![image](./16.png)
除了直接微調全部參數外，還有像Adapter、P-Tuning等許多參數高效的微調技巧，它們能夠透過只微調很少的參數來達到接近全量參數微調的效果。 然而，這些技巧通常只是“參數高效”而並非“訓練高效”。

LST它是在原有大模型的基礎上搭建了一個「旁支」（梯子），將大模型的部分層輸出作為旁枝模型的輸入，所有的訓練參數盡在旁枝模型中，由於大模型僅提供輸入，因此反向傳播的複雜度取決於旁枝模型的規模，並不需要直接在原始大模型上執行反向傳播，因此是可以明顯提升訓練效率的。
> 段落文字引用自: [Ladder Side-Tuning：预训练模型的“过墙梯”](https://spaces.ac.cn/archives/9138)

![image](./17.png)

LST 套在 T5-base 上的性能表現。y軸表示8個GLUE任務的平均準確度，而x軸表示訓練期間的GPU內存使用情況。

### 比較

#### 存儲效率、內存效率、計算效率、準確性和推理開銷
![image](./18.png)

- Storage: 是否有額外的儲存開銷
- Memory: 是否有額外的記憶體開銷
- Backprop: 能否**減少**反向傳播成本
- Inference overhead: 額外的推論開銷

#### PEFT 方法的架構、修改位置

![image](./19.png)

#### 用統一視圖比較架構差異
![image](./20.png)
>圖中 PLM 表示一個凍結的 sublayer (e.g. attention or FFN)。

#### 序列或是平行結構?

![image](./21.png)
上圖展示了 Transformer 的結構，包含 serial adapter (SA) 和 parallel adapter (PA)。相較於 serial 設計，parallel adapter 設計在 Transformer 層之前，而非在層之後。

![image](./22.png)

所有的測試項目表現，PA都勝過SA。

#### 在 Attention 還是 FFN 加入 adapter?

![image](./23.png)

在 FFN 中加入 adapter 會比在 Attn 中更優。同時，值得注意的是，當進一步增加容量時，prefix tuning 並未持續顯示改善的趨勢，這一現象在 Li 和 Liang（2021）的研究中也有所觀察。這些研究結果暗示，與 Attn 相比，FFN 的修改似乎能更有效地利用新增的參數，無論功能形式或組合函數為何。作者假設這可能是因為FFN學習了任務特定的文本內容 (task-specific textual patterns)，而注意力則學習了與應該關注什麼樣的重點，並不需要大容量來適應新的任務。


### 回報與比較議題
我們發現了一些值得討論的挑戰和不一致之處。這些挑戰使得難以直接比較方法並評估它們的真實性能。

#### 參數統計不一致
一般來說參數統計可以分為三種類別

- 可訓練參數的數量
- 被改變的參數(原始模型和微調模型)
- 原始模型和微調模型的差異等級(rank)

這些區別可能具有重要的影響。例如，IntrinsicSAID 學習模型參數的低秩轉換。然而，它改變了模型的所有參數。DiffPruning 學習了0.5%參數的更新，但實際上它訓練了200%的參數：微調模型並學習二進制遮罩。對於基於重新參數化的方法(Reparametrization-based methods)，內存需求可能會根據實現設計選擇而變。

總的來說，因為各方法在概念、架構與實現方式等差異巨大，所以難以直接比較。

#### 模型大小
當比較PEFT方法時，模型大小需要被考慮進去，不僅只是可訓練參數的比例，最好也包含可訓練參數量的實際數值。

#### 缺乏標準的測試基準和指標

缺乏標準基準和指標進一步使比較變得複雜。新方法通常在不同的模型/數據集組合上進行評估，這使得很難得出有意義的結論。

#### 缺少更全面或客觀的比較
![image](./24.png)

在四個任務上的結果進行總覽。儘管現有方法在微調少於1%的參數時可以在MNLI和SST2上達到與 full fine-tuning 競爭性表現，但如果在XSum和en-ro中增加5%的參數，仍然存在較大的差距。

即使將相對參數大小增加到>10%，差距仍然顯著；而且在高資源的機器翻譯任務上觀察到更大的差距。

這表明許多聲稱在GLUE基準上使用 encoder-only 的模型或在相對簡單的生成基準上聲稱與 full fine-tuning 相媲美的方法，可能無法很好地推廣到其他標準基準。

#### 各類方法開源實作問題
許多作者的程式碼品質欠佳，並且缺少文件或是範例，導致難以複用。

好在仍然有[開源專案-HF PEFT](https://github.com/huggingface/peft)在這方面進行努力，它整合各種SOTA方法與支援各類型LM。

### References
- [Scaling Down to Scale Up: A Guide to Parameter-Efficient Fine-Tuning
](https://arxiv.org/abs/2303.15647.pdf)
- [Rethinking the Role of Demonstrations: What Makes In-Context Learning Work?](https://arxiv.org/abs/2202.12837.pdf)
- [LoRA: Low-Rank Adaptation of Large Language Models
](https://arxiv.org/abs/2106.09685.pdf)
- [Parameter-Efficient Transfer Learning for NLP
](https://arxiv.org/abs/1902.00751.pdf)
- [The Power of Scale for Parameter-Efficient Prompt Tuning
](https://arxiv.org/abs/2104.08691.pdf)
- [SPoT: Better Frozen Model Adaptation through Soft Prompt Transfer
](https://arxiv.org/abs/2110.07904)
- [Few-Shot Parameter-Efficient Fine-Tuning is Better and Cheaper than In-Context Learning
](https://arxiv.org/abs/2205.05638.pdf)
- [BitFit: Simple Parameter-efficient Fine-tuning for Transformer-based Masked Language-models](https://arxiv.org/abs/2106.10199)
- [Prefix-Tuning: Optimizing Continuous Prompts for Generation](https://arxiv.org/abs/2101.00190)
- [LST: Ladder Side-Tuning for Parameter and Memory Efficient Transfer Learning](https://arxiv.org/abs/2206.06522)
- [Towards a Unified View of Parameter-Efficient Transfer Learning
](https://arxiv.org/abs/2110.04366.pdf)
- [Counter-Interference Adapter for Multilingual Machine Translation
](https://arxiv.org/abs/2104.08154.pdf)
- [Get Insight from your Business Data - Build LLM application with PEFT (with LoRA) using 🤗 Hugging Face](https://www.linkedin.com/pulse/get-insight-from-your-business-data-build-llm-application-jain-2f)
- [Ladder Side-Tuning：预训练模型的“过墙梯”](https://spaces.ac.cn/archives/9138)