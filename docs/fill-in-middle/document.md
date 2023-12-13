# Efficient Training of Language Models to Fill in the Middle

<document-info>
- tags: #論文筆記#FIM#LM#預訓練
- date: 2023/12/13
</document-info>

論文連結: https://arxiv.org/abs/2207.14255.pdf

Autoregressive (AR) 語言模型可以通過簡單的方式學習填充文字；作者簡單的將文章中間的段落移動到結尾來讓模型學習文字填充。

作者提供了大量的證據，表明以這種方式轉換了大部分數據的模型不會損害原始的從左到右生成能力，這主要是通過衡量困惑度和抽樣評估確認的。

Fill-in-the-middle（FIM）訓練模型的實用性、簡單性和效率，作者建議未來的 AR 語言模型應搭配FIM進行訓練。

### LM架構差異
依照模型架構不同，模型在生成任務能捕捉的資訊會不一樣，這點可能會讓模型在執行任務時有不同的性能表現：

- Encoder-decoder model 可以同時捕捉 prefix 和 suffix 來進行任務。

- Left-to right models 只能使用 prefix 資訊進行任務。

### 重點貢獻

- **FIM-for-free property**
作者進行了一項廣泛的規模研究，通過訓練一套8個模型，包括有FIM和無FIM的情況，並顯示在預訓練中學習FIM不會影響左到右的能力。

- **Best practices for FIM in pretraining**
作者通過全面的切割實驗澄清了與訓練FIM模型相關的許多超參數的效果。

- **Finetuning inefficiency**
與從頭訓練FIM模型相比，一種替代方法是通過微調現有語言模型來學習這種能力。作者顯示，使用FIM進行微調在計算上是低效的。在微調期間學習FIM需要額外大量的計算資源，才能達到與預訓練相似的性能水平。

- **New infilling benchmarks**
為了研究作者模型的生成能力，作者需要評估自由生成樣本的正確性。

- **Need for sampling evaluations**
作者發現改變FIM訓練中的各種超參數通常會導致FIM測試損失的差異微不足道，但在基於抽樣的基準上卻會產生很大的差異。

###  Fill in the Middle (FIM)

#### FIM Training
作者隨機均勻地將文檔切割成大小大致相同的三個區塊: prefix, middle, 和 suffix。

接著分別對三個區塊進行編碼，然後為每一個區塊前面添加一個特殊 token，這三個特殊 token 分別是 `<PRE>`, `<MID>`, 和 `<SUF>`
    
最後作者將這些區塊組拼接在一起：

```
<PRE> ◦ Enc(prefix) ◦ <SUF> ◦ Enc(suffix) ◦ <MID> ◦ Enc(middle)
```
> ◦ 表示拼接

> Enc 表示 encode 

不同文檔的最後面跟隨`<EOT>` (end-of-token)，並且讓模型在訓練時也要學習。

作者在三個區塊上 (prefix, middle, and suffix) 都計算 loss， 如此一來，模型的接收的學習訊號量與 AR LM 無異。

#### FIM Inference
推論時模型需要產生出 middle 的內容區塊：
```
<PRE> ◦ Enc(prefix) ◦ <SUF> ◦ Enc(suffix) ◦ <MID>
```

作者要求模型生成 token 直到 `<EOT>` (end-of-token)。

如果模型不能在 token budget (一般來說是 context windows 大小內) 產生出`<EOT>`
。這通常是模型在連接 prefix 和 suffix 方面遇到困難的一個信號，結果生成的樣本通常質量較差。

### 實驗結果
#### 預訓練時加入FIM

![image](./1.png)
![image](./2.png)
黃色線段(0.5)表示有50%的語料使用 FIM方法 (FIM rate)，紫色線段表示常規的預訓練。

僅僅考慮測試損失通常是不足夠的。為了加強上述結果，作者在一套標準下游基準測試中評估了作者的模型，其結果呈現在上圖。作者再次發現，Joint FIM pre-training 不會導致在標準AR基準測試中出現性能降級，因為性能在自然語言和 code 方面都在誤差範圍內匹配。

#### 微調時加入FIM
![image](./3.png)

虛線表示預訓練了100B token 的 baseline model，並且 FIM rate = 50%，沒有額外的微調。

只有最激進的組合，即90%的 FIM rate 和學習率倍增器為1.0，並使用50B token 進行微調，才能趕上 baseline model 的性能。(Finetuning inefficiency)

#### 合適的 FIM rate

![image](./4.png)

從上圖可以看出，50%的 FIM rate 對左到右能力沒有性能損失。

![image](./5.png)

使用更高的 FIM rate 對 HumanEval 性能沒有明顯影響。較高的 FIM rate 在輕微的隨機跨度填充基準測試中展現出更強的填充能力。

### 結論
在這項工作中，作者展示了基於 causal decoder LM 可以在 joint training 過程中學會在文檔的中間進行填充，該過程包括傳統的從左到右和FIM轉換數據的混合。FIM模型可以引用模組、編寫程式說明文檔、編寫函數，相對於傳統的從左到右語言模型提供了顯著的額外能力。