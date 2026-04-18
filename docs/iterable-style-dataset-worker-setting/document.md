# Distributed Training with multi data worker for iterable-style dataset

<document-info>
- tags: #distributed-training#iterable-dataset#worker-setting
- date: 2024/03/02
</document-info>

iterable-style dataset 可以處理巨量訓練資料迭代，但是當使用多個 worker 時，每個 worker 都會有一份相同的資料集副本，PyTorch 需要開發者自己去實現邏輯避免 worker 拿到重複資料。
> 資料通常是一個 generator 物件，所以就算多個 worker 手上都有一份副本也不會佔用許多記憶體。

根據 PyTorch 官方建議，我們可以使用 `torch.utils.data.get_worker_info()` 進行 worker 配置達到目的。

> For iterable-style datasets, since each worker process gets a replica of the dataset object, naive multi-process loading will often result in duplicated data. Using torch.utils.data.get_worker_info() and/or worker_init_fn, users may configure each replica independently. [PyTorch](https://pytorch.org/docs/stable/data.html#multi-process-data-loading)

### 全域 Worker ID 設定

我們能夠藉由環境變數 `RANK` 得知目前的 process id ，以及透過 `torch` 取得 local worker 資訊，最後要手動算一下才能知道對應的 global worker id: 

![](./1.png)

- `WORLD_SIZE:` The total number of processes. Should be equal to the total number of devices (GPU) used for distributed training.
- `RANK`: The (global) rank of the current process. The possible values are 0 to (world size - 1).
#### 取得 worker 資訊
```python
local_worker_id = torch.utils.data.get_worker_info().id
worker_per_process = torch.utils.data.get_worker_info().num_workers
```

#### 全域 worker id
$w^{global}_{id} = w^{local}_{id} + w^{local}_{total} \times rank$

### 多個 Worker 不重複抽取策略
給定一個資料集 D，其中總筆數可以是未知

$D=\{d_1,d_2,...,d_{n}\}$

和 j 個負責取資料的 worker

$W=\{w_1,w_2,...,w_j\}$

每一個 step workers 都會以並行的方式被執行一次，因此這些 worker需要取出的資料編號可以如下表示

$d_{(w_i,step)}=w_{i}+(step-1) \times w_{j}$

這樣一來我們便確保了 worker 之間不會拿到重複資料。

### 確保每個 Worker 執行步數相同
在 PyTorch Lightning 可能會因為 worker 執行步數不同導致訓練凍結，通常發生在最後一個 step (batch collactor 在等待 worker 資料)。

透過讓每個 worker 步數一致可解決問題:

- 每個 worker 保留一個 worker 0 迭代器副本:
- 當 worker 0 有資料則必須返回資料，若已經沒有資料則返回 -100 (不參與計算)。
- 當 worker 0 沒有有資料，則丟出 `StopIteration`。

### 實驗
![](./2.png)
> 修復前(紅) worker 抽取重複資料，步數較多。修復後(紫)步數減少，loss也更低。

### 程式實現
```python
class ChatIterableDataset(IterableDataset):
    def __init__(self,tokenizer:PreTrainedTokenizerFast,split="train") -> None:
        
        # self.data = ...
        # self.tokenizer = ...
        
    def __iter__(self) -> Iterator:
        #
        self.worker_id = None
        self.worker_total_num = None
        self.worker_iterator = None
        return self
    
    def __next__(self):
        # prepare data iterator and know worker info
        if self.worker_iterator == None:
            try:
                # The total number of processes. Should be equal to the total number of devices (GPU) used for distributed training
                world_size = int(os.environ.get("WORLD_SIZE",1)) 

                # The (global) rank of the current process. The possible values are 0 to (world size - 1)
                rank =  int(os.environ.get("RANK", 0))

                local_worker_id = torch.utils.data.get_worker_info().id
                worker_per_process = torch.utils.data.get_worker_info().num_workers
                global_worker_id = local_worker_id + worker_per_process * rank
                total_global_worker = world_size*worker_per_process
                
                #
                worker_id = global_worker_id
                worker_total_num = total_global_worker
            except:
                worker_total_num = 1
                worker_id = 0
            
            #
            self.worker_id = worker_id
            self.worker_total_num = worker_total_num
            logger.debug(f"{worker_id=} {worker_total_num=}")

            # create iterator object for __next__
            self.data_copy1, self.data_copy2 = itertools.tee(self.data)
            self.worker_iterator = itertools.islice(self.data_copy1, self.worker_id, None, self.worker_total_num)
            self.first_worker_iterator = itertools.islice(self.data_copy2, 0, None, self.worker_total_num)

        # flag or var for hold data
        first_worker_has_data = True
        next_data = None

        # check first worker has data
        try:
            next(self.first_worker_iterator)
        except StopIteration:
            first_worker_has_data = False

        # try get next_data
        # if next_data is none (raise StopIteration)
        # set next_data to -100
        try:
            next_data = next(self.worker_iterator)
            chat_list:list = next_data["data"][:]
            tokenized_chat = self.tokenizer.apply_chat_template(
                chat_list,
                add_generation_prompt=False,
                max_length=MAX_LENGTH,
                truncation=True
            )
            next_data = {
                "input_ids":torch.tensor(tokenized_chat),
                "labels":torch.tensor(tokenized_chat)
            }
        except StopIteration:
            pass
        
        # retrun -100 for pad the worker step
        if next_data is None:
            next_data = {
                "input_ids":torch.tensor([0]),
                "labels":torch.tensor([-100])
            }
        
        if first_worker_has_data is False:
            raise StopIteration
        else:
            return next_data
```
