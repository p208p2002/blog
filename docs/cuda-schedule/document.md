# CUDA GPU 排程策略

<document-info>
- tags: #cuda#job-schedule
- date: 2025/07/23
</document-info>

## CUDA 程式設計的基本概念

**CUDA kernel**: 一段跑在 GPU 上的程式碼。

![image](https://hackmd.io/_uploads/BkqAtsnIge.png)

*Thread block(block):* GPU 的 threads 集合；這些線程會跑同樣的指令，但是操作不同的資料。CUDA kernels 將會被劃分為多個 blocks。


**Streaming Multiprocessor (SM):**  SM（Streaming Multiprocessor）是一個包含多個 CUDA cores 的運算單元，一個 SM 有可分配的 threads 上限，以 TX1 舉例是 2048。SM 處理的最小單位是一個 block，當資源足夠時多個 block 可以併行計算。


![image](https://hackmd.io/_uploads/rkZzU03Lxx.png)


**CUDA Stream (stream):** 一個 FIFO 佇列，用來存放等待被執行的指令。Stream 是 CUDA 提供的抽象層，開發者可以建立任意數量的 stream，同一個 stream 裡面的指令不會被併發執行；如果需要併發，可以放入到不同的stream。 block 裡面的 threads **不會**同時地在不同 SM 上執行。

![image](https://hackmd.io/_uploads/SJsWO03Ilx.png)

**CUDA 程式關係圖**
![image](https://hackmd.io/_uploads/HJ4pcChLxe.png)

GPU 是 co-processor，所以在 CUDA 程式中會包含 CPU code 和 GPU code。


## 排程行為分析

本節中的範例圖片橫軸表示時間，垂直高度表示 threads 數量 (每個 SM 有 2048 個 threads)。

**重要概念：** 同 stream 順序執行；當 threads 足夠，不同 stream 可併發執行。

### 共同排程行為

![image](https://hackmd.io/_uploads/ryb7w6pIeg.png)

K1,K2,K3,K4 都是從不同 stream 遞送。

K1, K2 在 t=0 的時候釋放，K3, K4 在 t=0.25 的時候釋放。

### 貪婪行為

![image](https://hackmd.io/_uploads/r1CTYpa8xg.png)

K1,K2,K3 都是從不同 stream 遞送。

遞送順序為：K1 -> K2 -> K3，其中 K2 表示一個大量計算的工作。

即使 K3 是一個比較小的任務，但由於 K2 佔滿了所有的 threads，所以 K3 必須要等到 K2 結束才會被執行；在 K2 執行期間不會發生 context switch，或讓 K3 插隊執行。

### 先來先做 (inner stream)

![image](https://hackmd.io/_uploads/Sk0v3TT8gl.png)

K1, K2 分別從不同 stream 遞送。

K1 較 K2 早遞送，並且佔用了大部分的 threads，由於剩餘的 threads 不夠 K2:0 使用，因此必須等待。

K2, K3 使用了同一個 stream 遞送，因此必須順序執行。
> 一些任務有相依關係，因此不可以任意調動執行順序或併發。
> 使用者可依需求將 kernal 送到指定的 stream。 

### 先來先做 (stream wise)

![image](https://hackmd.io/_uploads/S1021RpLxx.png)

K1,K2 在 t=0 遞送到 stream1， K3 在 t=0.25 (K1 執行期間) 遞送到 stream2。

K1 執行完畢後，被選擇執行的是 K3，這是由於 K3 相比 K2 較早到達自己的 stream head，因此被挑選出來作為下一件任務。

## 參考資料
- https://zhuanlan.zhihu.com/p/699754357
- https://developer.nvidia.com/blog/cuda-refresher-cuda-programming-model/
- https://www.cs.unc.edu/~anderson/papers/ospert17.pdf