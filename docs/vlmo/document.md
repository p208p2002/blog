# VLMo: Unified Vision-Language Pre-Training with Mixture-of-Modality-Experts
<document-info>
- tags: #vision#transformer
- date: 2024/10/26
</document-info>

[論文連結](https://arxiv.org/pdf/2111.02358)

統一視覺語言預訓練模型 (VLMo) 採用了共同學習雙編碼器與融合編碼器的方式，並運用階段性預訓練策略。實驗結果顯示，VLMo 在各種視覺-文字任務上達到了最先進的表現。

## MoME Transformer

![image](./1.png)

VLMo 使用了 MoME Transformer， 它可以編碼：影像、文字以及*影像-文字*對。

使用一組模態專家池來取代標準 Transformer 中的前饋神經網絡 (FFN)。

透過切換專家來捕捉模態特定的信息。

三種專家：
- 視覺專家
- 語言專家
- 視覺-語言專家

三種形式的輸入(影像、文字和有巷-文字)，分別由兩種編碼器：文字編碼器與影像編碼器，處理編碼過程；後續根據輸入類型的不同，送到MoME-FFN層的時候由三個不同的專家處理。


| 輸入類型   | 編碼器                             | MoME-FFN     |
| --------- | -------------------------------- | ---- |
| 影像      | 影像編碼器                       | 視覺專家 (V-FFN)    |
| 文字      | 文字編碼器                       | 語言專家 (L-FFN)     |
| 影像-文字  | 由影像編碼器與文字編碼器分別處理     | 視覺-語言專家 (VL-FFN) |


## Input Representations
**Image**

跟隨 Vision Transformers 的研究，一張平面影像可以用 $\mathcal{v} \in \mathbb{R}^{H \times W \times C}$ 表示 ($C$ 是通道數量)，影像可以被切割與重塑成多個 patches $N = HW/P^2$，每個 patch $\mathcal{v}^p \in \mathbb{R}^{N \times (P^2C)}$。

我們也為了序列準備了一個特殊的 token $\text{[I\_CLS]}$。

最終，影像的輸入表示由三組嵌入相加獲得：

$$
H^{\mathcal{v}}_0 = [\mathcal{v}_{\text{[I\_CLS]}},V\mathcal{v}^p_i,...,V\mathcal{v}^p_N]+V_{pos}+V_{type}
$$

其中 $H^{\mathcal{v}}_0 \in \mathbb{R}^{(N+1)\times D}$，和線性投影 $V\in\mathbb{R}^{(P^2C)\times D}$。


**Text**

輸入的文字序列會分別在頭尾添加 $\text{[T\_CLS]}$ 和 $\text{[T\_SEP]}$ 這兩個特殊 token。

文字輸入 $H^w_0 \in \mathbb{R}^{(M+2) \times D}$，$M$ 表示 tokens 的數量。最後加上位置編碼與類型編碼：

$$
H^w_{0} = [w_{\text{[T\_CLS]}}, wi, ..., w_M, w_{\text{[T\_SEP]}}] + T_{pos} + T_{type}
$$


**Image-Text**
將影像和文字輸入向量串連，形成*影像-文字*輸入表示。
$$
H^{vl}_0 = [H^{w}_0;H^{v}_0]
$$

## Pre-training Tasks

通過三種預訓練任務學習：

- 影像-文字配對
- 影像-文字對比學習
- Masked Language Modeling


**Image-Text Contrast**

給予一批 (a batch) 有 $N$ 個*影像-文字*對的資料，模型的學習目標是從 $N \times N$ 種可能預測出正確的配對。


在批次中，我們可以獲得影像向量 ${\{\hat{h}^v_i}\}^N_{i=1}$ 和文字向量 ${\{\hat{h}^w_i}\}^N_{i=1}$。

*影像對文字* ($i2t$) 和*文字對影像* ($ti2$) 的相似度：

$$
s^{i2t}_{i,j} = \hat{h}^v_i{^\intercal}\hat{h}^w_j\ ,\  s^{t2i}_{i,j} = \hat{h}^w_i{^\intercal}\hat{h}^v_j 
$$

和 softmax 正規化後的相似度：

$$
p^{i2t}_i  = \frac{\exp{(s^{i2t}_{i,i}/\sigma})}{\sum^N_{j=1}\exp{(s^{i2t}_{i,j}/\sigma})}\ ,\ p^{t2i}_i  = \frac{\exp{(s^{t2i}_{i,i}/\sigma})}{\sum^N_{j=1}\exp{(s^{t2i}_{i,j}/\sigma})}
$$

> $\sigma$ 是可學習的溫度參數。

> 我們會希望 $\exp(s_{i,i})$ 這項的數值要大，而當 $i \neq j$ 時 $\exp(s_{i,j})$ 要趨近零。表明跟自己一對的很相似，跟自己不是一對的要不相似。

**Masked Language Modeling**

與 BERT 的設置相；隨機將一些 token 替換為 $\text{[MASK]}$，要求模型預測出正確的 token。

**Image-Text Matching**

使用 ITC 的相似度在一批資料中採樣一個困難負樣本，並且透過 $\text{[T\_CLS]}$ 的最終隱藏層輸出進行二元分類任務 (判斷批配與否) 。

### Stagewise Pre-Training

![image](./2.png)

作者提出一個分階段的預訓練策略：

1. Vision pre-training
2. Language pre-training
3. Vision-language pretrainig

首先，預訓練視覺專家與 Self-Attention 模組
> 透過僅使用影像數據進行的 Transformer 訓練，應用 BEiT 提出的遮罩影像建模。

接著，透過僅使用文字數據進行 MLM 訓練來語言專家。

最終，該模型被用來初始化*影像-文字*的預訓練。

## Fine-Tuning VLMo

![image](./3.png)

**視覺-文字分類**

使用 $\text{[T\_CLS]}$ 的最終隱藏層輸出表示視覺-文字的資訊，並且餵入任務指定的分類層來預測標籤。

**視覺-文字檢索**

訓練時使用 ITC 優化目標模型。推論時使用點積分別獲得*影像對文字*和*文字對影像*的相似度分數。

## Experiments

### 影像-文字分類任務
![image](./4.png)

- Visual Question Answering (VQA)
- Natural Language for Visual Reasoning (NLVR2)

### 影像-文字檢索任務
![image](./5.png)


### 視覺任務
![image](./6.png)


## 總結

在這項工作中，我們提出了一個統一的*影像-文字*預訓練模型 VLMO，該模型使用共享的 MoME Transformer 架構，結合雙編碼器與融合編碼器進行聯合學習。MoME 引入了一個模態專家池來編碼模態特定的信息，並使用共享的自我注意模塊對齊不同模態。這種基於 MoME 的統一預訓練使該模型既能作為雙編碼器，用於高效的*影像-文字*檢索，也能作為融合編碼器來建模跨模態互動，以進行分類任務。我們還展示了階段性預訓練策略，利用大規模的僅圖片和僅文本語料庫，顯著提升了*影像-文字*預訓練的效果。實驗結果表明，VLMO 在多項*影像-文字*分類和檢索基準測試中均超越了先前的最先進模型。