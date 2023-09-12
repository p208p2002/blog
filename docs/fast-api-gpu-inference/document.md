# Fast API GPU 推論性能優化

<document-info>
- tags: #gpu#fast-api#inference#optimize
- date: 2022/09/12
</document-info>

GPU 推論是計算密集型任務，一個推論往往是秒鐘起跳，而 Fast API 對多個請求的處理主要是基於異步(async)，其本質是線程(threading)，也就是說在 Fast API 中直接執行推論任務會卡住其他請求。

這時可以使用多進程處理(multi-processing)將推論任務丟到子進程中，這邊會有兩點需要注意:

1. 由於pytorch的限制，建立子進程的方法無法使用預設的`fork`需要使用`spawn`。
2. 為了避免 GPU OOM (out of memory) 需要使用一個全域的進程池，用來限制同時推論任務的最大處理數量。

## 實踐

以下是一段使用 Fast API+GPT2 做推論的最小化例子。

```python
# main.py
import asyncio
import concurrent.futures
from fastapi import FastAPI
from transformers import GPT2Tokenizer,GPT2LMHeadModel
import multiprocessing

# 指定子進程建立方法
try:
    multiprocessing.set_start_method("spawn")
except:
    pass

# 建立全域 ProcessPoolExecutor
max_workers = 8
global_pool = concurrent.futures.ProcessPoolExecutor(max_workers=max_workers)

app = FastAPI()

# model
hf_model_path = 'IDEA-CCNL/Wenzhong-GPT2-110M'
tokenizer = GPT2Tokenizer.from_pretrained(hf_model_path)
model = GPT2LMHeadModel.from_pretrained(hf_model_path)
model.to("cuda")

def gen_text_from_gpt2():
    question = "太空梭是歷史上第一種可操作且可重複使用的"
    inputs = tokenizer(question,return_tensors='pt')
    inputs.to("cuda")
    generation_output = model.generate(
        **inputs,
        return_dict_in_generate=True,
        max_new_tokens=50,
        do_sample=True,
        top_p = 0.6,
        eos_token_id=50256,
        pad_token_id=0,
    )
    return tokenizer.batch_decode(generation_output.sequences)[0]


@app.get("/w_gp")
async def use_global_porcess_pool():
    loop = asyncio.get_event_loop()
    # 在路由中使用全域進程池
    # 等待運算時，服務能夠響應其他請求
    result = await loop.run_in_executor(
        global_pool, 
        gen_text_from_gpt2
    ) 
    return result

@app.get("/wo_gp")
async def without_global_porcess_pool():
    # 推論時，不能夠響應其他請求
    return gen_text_from_gpt2()
```

- `/w_gp`: 會建立一個子進程進行推論，這段期間不會阻塞主程式，而當進程池滿了，其他推論請求則必須等待。

- `/wo_gp`: 直接在主程序中推論，因此會阻塞整隻服務，在推論過程中服務不會響應其他請求。

## 負載測試

|Type    |Name         |# reqs |     # fails |    Avg|    Min|    Max|   Med |   req/s| failures/s|
|--------|-------------|-------|-------------|-------|-------|-------|-------|--------|-----------|
|GET     |/wo_gp       |     47|     0(0.00%)|   9962|   748 |  18135|  12000|    1.60|       0.00|
|GET     |/w_gp        |    192|     0(0.00%)|   2937|   1253|   3704|   2700|    6.57|       0.00|

使用RTX3080，並且設置`max_workers=8`，最長與平均響應時間顯著改善，且硬體使用率提升，僅有最小響應時間小幅度退步。

- 每秒鐘處理請求數提升4倍
- 最長響應時間改進80%
- 平均等待時間改進70%