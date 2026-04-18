# 淺談 DP，MP 和 TP

<document-info>
- tags: #data-parallel#model-parallel#tensor-parallel
- date: 2025/02/20
</document-info>

![image](https://hackmd.io/_uploads/r1f-AzVcyx.png)

## Data Parallel (DP)

每個 GPU 會收到一份 mini-batch (即每個裝置收到不同批資料) ，這些資料會在對應的裝置上完成 loss 的計算，最後將所有 loss 聚合再重新分發到每個 GPU 上完成模型的更新。

## Model Parallel (MP)

深度學習模型由多層 Layer 組成，因此我們可以將模型依照層來切割到不同 GPU 上。例如我們將一個具有 8 層的模型分割到 2 個 GPU 上，其中 0-1 層與 4-7 層是連續的，而從3-4層則會有額外的通訊開銷。
```
===================  ===================
|  0 | 1 | 2 | 3  |  |  4 | 5 | 6 | 7  |
===================  ===================
        gpu0                 gpu1
```

MP 的硬體效率並不高，始終只有一個裝置在運行，而其餘將會閒置，這個問題會隨著 GPU 愈多而愈明顯。

## Pipeline Parallel (PP)

![image](https://hackmd.io/_uploads/HkEuW7N5yx.png)

PP 是對 MP 的資料流進行改進，其主要特點是引入了 micro-batch 與管道概念。

micro-batch 是將 mini-batch 切割的更小而得到。將 mini-batch 的其中一批資料餵入模型，當前面的資料跑到下一層時，接續把後面的資料餵入模型，此時你的每個 layer 就會一直有資料可以運算(形成管道)，從而提高效率。

不過此方法仍然會有無法消除的 bubble，並且實務上我們會在模型之間傳遞額外的訊息，這使得在實踐上可能需要重新設計模型。


## Tensor Parallel (TP)

對於權重矩陣，我們可以將它沿著維度進行切割，這些被切割的矩陣可以分別地與輸出相乘，最終將輸出合併，其結果會與未切割的兩矩陣點積相同。

![image](https://hackmd.io/_uploads/B1x3M7m9kl.png)

我們可以將這觀念帶到 MLP 和 Attention 模組：

![image](https://hackmd.io/_uploads/Hk-m3ZEqJg.png)

在前饋階段 $f$ 表示 identity operator， $g$ 表示 *All Reduce* 操作；而在反向傳播階段 $f$ 表示 *All Reduce*，$g$ 表示 identity operator。


## 參考
- https://huggingface.co/transformers/v4.10.1/parallelism.html
- https://uvadlc-notebooks.readthedocs.io/en/latest/tutorial_notebooks/scaling/JAX/data_parallel_fsdp.html
- [GPipe: Efficient Training of Giant Neural Networks using Pipeline Parallelism
](https://arxiv.org/pdf/1811.06965)
- https://huggingface.co/docs/text-generation-inference/conceptual/tensor_parallelism
- [Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism](https://arxiv.org/abs/1909.08053)