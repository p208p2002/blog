# Neural Machine Translation of Rare Words with Subword Units

<document-info>
- tags: #論文筆記#gpt2#bpe#tokenizer#tokenization
- date: 2023/09/06
</document-info>

論文連結: https://arxiv.org/abs/1508.07909


神經機器翻譯（NMT）模型通常使用固定的詞彙表，但翻譯是一個開放詞彙的問題。

先前的研究解決了 out-of-vocabulary（OOV）的單詞的翻譯問題，通常通過 back-off dictionary 來解決。在本文中，我們介紹了一種更簡單且更有效的方法，使NMT模型能夠通過將罕見和未知單詞編碼為 subwords 來進行開放詞彙的翻譯。這是基於一種直覺，即各種詞類可以通過比詞彙更小的單位進行翻譯。

我們討論了不同的詞彙分割技術的適用性，包括簡單的字符n-gram模型和基於字節對編碼壓縮算法的分割，並根據實驗結果顯示，subword model 在 WMT 15 的翻譯任務中相對於 baseline 分別提高了1.1和1.3個BLEU分數。

## 論文核心問題
Can we improve the translation of rare and unseen words in neural machine translation by representing them via subword units?

Which segmentation into subword units performs best in terms of vocabulary size, text size, and translation quality?

我們能否透過以子詞單位表示罕見且不常見的詞語來改善神經機器翻譯的翻譯？

在詞彙大小、文本大小和翻譯品質方面，哪種子詞單位的分割效果最佳？

## 論文貢獻
Subword models achieve better accuracy for the translation of rare words than large-vocabulary models and back-off dictionaries, and are able to productively generate new words that were not seen at training time.

Open-vocabulary neural machine translation is possible by encoding (rare) words via subword units.

We find our architecture simpler and more effective than using large vocabularies and back-off dictionaries.

Adapt byte pair encoding (BPE) (Gage, 1994), a compression algorithm, to the task of word segmentation.

Subword 模型在翻譯罕見詞語方面比大詞彙模型和 back-off dictionaries 表現更為精確，並且能夠有效生成在訓練時未見過的新詞語。

透過以 Subword 為單位編碼（罕見）詞語，實現了開放詞彙的神經機器翻譯。

我們發現我們的架構比使用大型詞表和 back-off dictionaries 更簡單且更有效。

將BPE（一種壓縮演算法）用於詞語分割的任務。

## BPE演算法介紹
```python
import re, collections

def get_stats(vocab):
    pairs = collections.defaultdict(int)
    for word, freq in vocab.items():
        symbols = word.split()
        for i in range(len(symbols)-1):
            pairs[symbols[i],symbols[i+1]] += freq
    return pairs

def merge_vocab(pair, v_in):
    v_out = {}
    bigram = re.escape(' '.join(pair))
    p = re.compile(r'(?<!\S)' + bigram + r'(?!\S)')
    for word in v_in:
        w_out = p.sub(''.join(pair), word)
        v_out[w_out] = v_in[word]
   
    return v_out

# vocab = {'l o w </w>' : 5, 'l o w e r </w>' : 2,'n e w e s t </w>':6, 'w i d e s t </w>':3}
vocab = {'你 好 嗎 </w>' : 5, '你 好 帥 </w>' : 2,'你 是 誰 </w>':6, '我 是 誰 </w>':3}

print("vocab:",vocab)

num_merges = 9

for i in range(num_merges):
    pairs = get_stats(vocab)
    
    best = max(pairs, key=pairs.get)
    
    vocab = merge_vocab(best, vocab)
    print(f"step_{i+1}", vocab)
```
```
vocab: {'你 好 嗎 </w>': 5, '你 好 帥 </w>': 2, '你 是 誰 </w>': 6, '我 是 誰 </w>': 3}
step_1 {'你 好 嗎 </w>': 5, '你 好 帥 </w>': 2, '你 是誰 </w>': 6, '我 是誰 </w>': 3}
step_2 {'你 好 嗎 </w>': 5, '你 好 帥 </w>': 2, '你 是誰</w>': 6, '我 是誰</w>': 3}
step_3 {'你好 嗎 </w>': 5, '你好 帥 </w>': 2, '你 是誰</w>': 6, '我 是誰</w>': 3}
step_4 {'你好 嗎 </w>': 5, '你好 帥 </w>': 2, '你是誰</w>': 6, '我 是誰</w>': 3}
step_5 {'你好嗎 </w>': 5, '你好 帥 </w>': 2, '你是誰</w>': 6, '我 是誰</w>': 3}
step_6 {'你好嗎</w>': 5, '你好 帥 </w>': 2, '你是誰</w>': 6, '我 是誰</w>': 3}
step_7 {'你好嗎</w>': 5, '你好 帥 </w>': 2, '你是誰</w>': 6, '我是誰</w>': 3}
step_8 {'你好嗎</w>': 5, '你好帥 </w>': 2, '你是誰</w>': 6, '我是誰</w>': 3}
step_9 {'你好嗎</w>': 5, '你好帥</w>': 2, '你是誰</w>': 6, '我是誰</w>': 3}
```

由以上步驟我們可以發現BPE是一個從 char level 合併到 word level的過程 ，而我們要的結果在中間的步驟，例如 `step_3` 就會是一個不錯的 `vocab`，而最後一步 `step_9 ` 已經完全合併回去了。

BPE的中止條件可以由`步數`、`詞表大小`或`語料覆蓋度`來決定。

## 實驗

![](./exp.png)

Unigram F1 scores indicate that learning the BPE symbols on the vocabulary union (BPEJ90k) is more effective than learning them separately (BPE-60k), and more effective than using character bigrams with a shortlist of 50 000 unsegmented words (C2-50k), but all reported subword segmentations are viable choices and outperform the back-off dictionary baseline.

單字F1分數表明，在詞彙聯合(BPEJ90k)上學習BPE符號比單獨學習它們(BPE-60k)更有效，也比使用具有50000個未分段單詞的字符雙字(C2-50k)更有效，但所有報告的次詞分割都是可行的選擇並且優於回退字典基準。

#### 解釋
- WUnk: a word-level model with a back-off dictionary

- WDict: a word-level model without a back-off dictionary

- learning the BPE symbols on the vocabulary union (BPEJ90k): 用翻譯的source 和 target 語料一起建立 BPE 詞表，總計大小為 90K

- learning them separately (BPE-60k): 翻譯的source 和 target 語料分別建立 BPE 詞表，各別大小為 60K

- character bigrams with a shortlist of 50,000 unsegmented words (C2-50k): 用 bigram 詞頻前 50,000 的詞彙建立詞表，其餘映射為 UNK

- rare: 100 rare tokens not among the 50 000 most frequent types

    
## 總結
本文的主要貢獻在於展示了神經機器翻譯系統能夠通過將罕見和未知單詞表示為一系列子詞單位來進行開放詞彙的翻譯。

這比使用 back-off dictionary 模型更加簡單且有效。我們引入了一種變體的 BPE 編碼用於詞彙分割，它能夠使用可變長度的子詞單位的緊湊符號詞彙來編碼開放詞彙。