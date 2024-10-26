# Transformer 模型的記憶體使用量估算

<document-info>
- tags: #transformer#vram#training#inference
- date: 2024/10/26
</document-info>

Transformers 模型因其卓越的性能被廣泛應用於各種自然語言處理任務。然而，隨著模型參數的增加，記憶體需求也隨之增長，導致資源的消耗成為開發者面臨的重要挑戰。我們將介紹如何估算 Transformers 模型的記憶體用量，以便提供開發者在應用時的參考。

## 常見數據類型

數據類型直接影響模型的記憶體用量和計算效率。常見的數據類型包括浮點數（如 FP32、FP16、BF16）和整數（如 int8、int4）。

![image](./1.png)

| Data Type | Size (Bytes) |
|-----------|--------------|
| FP32      | 4            |
| FP16      | 2            |
| BF16      | 2            |
| int8      | 1            |
| int4      | 0.5          |

## 容量單位計算定義
容量單位有些許不同的定義，我們將主要以 GiB 作為本文的計算單位和討論。

$$
1\ \text{GB} = 10^9\ \text{Bytes}
$$

$$
1\ \text{GiB} = 2^{30}\ \text{Bytes}
$$

## 推論和訓練的記憶開銷比較

|                    | Train         | Inference     |
|--------------------|---------------|---------------|
| CUDA Kernels       | ✅            | ✅            |
| Parameters         | ✅            | ✅            |
| Activations        | ✅            | ✅            |
| Gradients          | ✅            | ❌            |
| Optimizer States   | ✅            | ❌            |
| Outputs            | ✅            | ✅            |


## 推論記憶體開銷

假設我們使用一個具有 14B  參數的模型，這個模型在不同數據類型下需要的記憶體空間：

1. **FP32**:
   $$
   \frac{14 \times 10^9 \times 4}{2^{30}} \approx 56 \text{GiB}
   $$

2. **FP16**:
   $$
   \frac{14 \times 10^9 \times 2}{2^{30}} \approx 28 \text{GiB}
   $$

3. **int8**:
   $$
   \frac{14 \times 10^9 \times 1}{2^{30}} \approx 14 \text{GiB}
   $$

4. **int4**:
   $$
   \frac{14 \times 10^9 \times 0.5}{2^{30}} \approx 7 \text{GiB}
   $$
 
> 由於 CUDA Kernels, Activations 和 Outputs 的佔用空間不大，因此估算推論需要的記憶體時可以省略。

## 訓練記憶體開銷

我們以常見的混合精度訓練方案，推估需要的記憶體用量。

### 混合精度訓練

為了避免梯度消失，FP16的訓練通常採用混合精度的解決方案，該方案需要保留一份FP32的模型用作權重更新，但是仍然可以減少記憶體開銷。
> 儘管保留了 FP32 的模型權重，但因為大量的計算和中間激活值使用了 FP16，整體上仍然可以顯著減少記憶體開銷。

![image](./2.png)

1. 計算 FP16 模型的輸出，然後計算損失。
2. 在半精度下進行梯度的反向傳播。
3. 以 FP32 精度複製梯度。
4. 在主模型（FP32 精度）上進行更新。
5. 將主模型複製到 FP16 模型中。

### Model Parameters

混合精度訓練下，模型需要額外的FP32副本來幫助更新：
$$
M_{\text{FP32}} = \text{Model Params}\times 4\ \text{Bytes}
$$

而損失，會在 FP16 模型上被計算，因此我們同樣需要計算FP16占用的空間：
$$
M_{\text{FP16}} = \text{Model Params}\times 2\ \text{Bytes}
$$

現在我們可以知道混合精度的模型參數占用為：
$$
\text{Model Memory} = M_{\text{FP32}} + M_{\text{FP16}} \tag{1}
$$

### Activation
使用 gradient checkpoint 可以大幅度減少記憶體開銷，在假設應用此技巧的情況下所占用的記憶體：

$$
\text{Activation Memory} = 2thL \ \text{Bytes} \tag{2}
$$

其中$t$是 batch 中 token 的總數，$h$ 表示隱藏層維度，$L$則表示 Transformer layers。


### Gradient

梯度以全精度儲存，每個參數佔用 4 Bytes：

$$
\text{Gradient Memory} = \text{Model Params} \times 4\ \text{Bytes} \tag{3}
$$


### Optimizer
| Optimizer              | First Moments | Second Moments | Bytes per Param |
|------------------------|---------------|----------------|-----------------|
| SGD                  | ❌             | ❌              | 4               |
| SGD w momentum       | ✅             | ❌              | 8               |
| ADAM                 | ✅             | ✅              | 12              |

我們以常用的 Adam optimizer 計算記憶體占用：

$$
\text{Optimizer Memory} = \text{Model Params} \times 12\ \text{Bytes} \tag{4}
$$

### 模型訓練記憶體總開銷

$$
\text{Total Training Memory} = (1) + (2) + (3) + (4)
$$


## 驗證記憶體開銷

### LoRA
我們以 Qwen1.5-7B (7.7B凍結參數量) + LoRA (2%額外可學習參數) + 2k training context 進行計算：

**Model Parameters Memory**: $(7.7\times10^9\times 1.02)\times6\ \text{Bytes} = 43.88\ \text{GiB}$

**Acitvation Memory**: $2 \times 2048 \times 4096 \times 32 \ \text{Bytes}=0.5\ \text{GiB}$

**Gradient Memory**: $7.7\times 10^9\times 0.02\ \times 4\ \text{Bytes}=0.57\ \text{GiB}$

**Optimizer Memory**: $7.7\times 10^9\times 0.02\ \times 12\ \text{Bytes}=1.72\ \text{GiB}$

**Total Training Memory**: $(43.88 + 0.5 + 0.57 + 1.72)\ \text{GiB} = 46.67\ \text{GiB}$

實際結果：

![image](./3.png)



### Full Fine Tuning
以 Qwen1.5-7B (7.7B總參數量) + 2k training context + DeepSpeed Stage 3 進行計算：


**Model Parameters Memory**: $(7.7\times10^9)\times6\ \text{Bytes} = 43.02\ \text{GiB}$

**Acitvation Memory**: $2 \times 2048 \times 4096 \times 32 \ \text{Bytes}=0.5\ \text{GiB}$

**Gradient Memory**: $7.7\times 10^9\ \times 4\ \text{Bytes}=28.68\ \text{GiB}$

**Optimizer Memory**: $7.7\times 10^9\ \times 12\ \text{Bytes}=86.05\ \text{GiB}$

**Total Training Memory**: $(43.02+0.5+28.68+86.05)\ \text{GiB} = 158.25\ \text{GiB}$

![image](./4.png)

實際運行的狀態還包含其他系統模組的佔用和快取，會比計算值再高出一截，也就只能加減參考了。



## 參考資源
- [Mixed precision training](https://docs.fast.ai/callback.fp16.html)
- [Breaking down GPU VRAM consumption](https://asmirnov.xyz/vram)
- [Reducing Activation Recomputation in Large Transformer Models](https://arxiv.org/pdf/2205.05198)
- [Transformer Math 101](https://blog.eleuther.ai/transformer-math)