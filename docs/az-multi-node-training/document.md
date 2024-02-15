# Azuer ML Studio GPU Cluster 使用體驗

<document-info>
- tags: #gpu-cluster#multi-node-training#LLM#model-training
- date: 2024/02/15
</document-info>

LLM訓練非常吃資源，單節點多卡的配置還是會常常遇到算力或記憶體不足的問題。

GPU Cluster 使用上會涉及到許多額外的設定，並且通常會搭配排程系統、容器技術一起使用。

本篇簡單紀錄使用 Azure 平台進行多節點訓練的設定與流程。

**重點環境:**
- ubuntu: 20.04
- cuda: 12.2.2
- python: 3.8
- torch: 2.1.0
- lightning: 2.1.4
- deepspeed: 0.13.2

## 前置準備
### 建立 GPU Cluster
###### 位置：ML Studio>管理>計算>計算叢集

可以設置最大節點與最小閒置節點(最小可以=0)，閒置時不收費。

GPU叢集會根據任務需要自動拓展。

![image](./1.png)


### 建置環境映像檔
###### 位置：ML Studio>資產>環境

可使用Azure提供或是自建置的docker-image。

其中 Azure 上的 PyTorch 與 Ubuntu 較舊，並且訓練時常常需要額外套件，建議還是自建環境較佳。

#### 列出帳戶底下所有映像檔
```python
from azure.ai.ml import MLClient

ml_client = MLClient(credential, subscription_id, resource_group, workspace)
envs = ml_client.environments.list()

for env in envs:
    print(env.name)
```

#### Azure 提供預設環境
```
AzureML-ACPT-pytorch-1.13-py38-cuda11.7-gpu
AzureML-ACPT-pytorch-1.12-py38-cuda11.6-gpu
AzureML-ACPT-pytorch-1.12-py39-cuda11.6-gpu
AzureML-ACPT-pytorch-1.11-py38-cuda11.5-gpu
AzureML-ACPT-pytorch-1.11-py38-cuda11.3-gpu
AzureML-PyTorch-1.3-CPU
```

#### 自訂映像檔
ML Studio 可以使用網頁界面建立 docker image，非常方便。

基於 [DeepSpeed 官方 dockerfile](https://github.com/microsoft/DeepSpeed/blob/master/docker/Dockerfile) 加入需要的額外套件，是一個簡便的GPU環境建立方式：

```dockerfile
# ... 略
COPY requirements.txt .
RUN pip install -r requirements.txt
```

### 建立資料存放區
###### 位置：ML Studio>資料>資料存放區

訓練完成的模型可以存放在datastore中，使用方式是透過掛載額外的儲存空間來使用。

1. 依照步驟填寫資料，並且自訂儲存區名稱
2. 開啟認證 > 帳戶金鑰認證

![image](./2.png)

> 這邊的帳戶金鑰指的是儲存體帳戶金鑰，可以參考官方文件[查詢儲存體帳戶金鑰](https://learn.microsoft.com/zh-tw/azure/storage/common/storage-account-keys-manage?tabs=azure-portal#view-account-access-keys)。


#### Azure ML Python SDK

遞交任務時設定掛載空間與目錄。
> 詳細可參閱: [Azure Datastore](https://learn.microsoft.com/en-us/azure/machine-learning/concept-data?view=azureml-api-2#datastore)

```python
from azure.ai.ml import Input,Output
from azure.ai.ml.constants import AssetTypes,InputOutputModes

outputs = {
    "log_dir": Output(
        type=AssetTypes.URI_FOLDER,
        path=f"azureml://subscriptions/{subscription_id}/resourcegroups/{resource_group}/workspaces/{workspace}/datastores/{資料存放區名稱}/paths/{自訂路徑}/",
        mode=InputOutputModes.RW_MOUNT,
    )
}

job = command(
    code="./",  # local path where the code is stored
    # 使用佔位樣板將儲存路徑以參數傳遞給程式
    command="python pretrain_trainer.py --num_nodes 2 --gpus_per_node 2 --log_dir ${{outputs.log_dir}}",
    outputs=outputs,
    environment="自訂映像檔",
    compute="叢集名稱",
)
```


## 遞交任務

#### 透過 ML Studio CPU VM (非必要)
透過 ML Studio 提供的機器可以使用預先安裝好的python sdk環境。

先使用指令列出所有可用環境：
```bash
$ conda env list
# conda environments:
#
base                     /anaconda
azureml_py310_sdkv2      /anaconda/envs/azureml_py310_sdkv2
azureml_py38          *  /anaconda/envs/azureml_py38
azureml_py38_PT_TF       /anaconda/envs/azureml_py38_PT_TF
jupyter_env              /anaconda/envs/jupyter_env
```

使用 python sdk v2 環境：
```bash
$ conda activate azureml_py310_sdkv2
```

### Multi-node training (PyTorch Lightning)
Azure ML 在每個 node 上設置了 `MASTER_ADDR`、`MASTER_PORT`、`WORLD_SIZE` 和 `NODE_RANK` 環境變數，並設置了 process-level 的 `RANK` 和 `LOCAL_RANK` 環境變數。

Lightning 框架本身有支援上述的環境變數設置和多節點訓練，簡單設定參數後即可進行多節點訓練:
```python
# pretrain_trainer.py
trainer = pl.Trainer(
    num_nodes=args.num_nodes,
    devices=args.gpus_per_node,
    accelerator="gpu",
    strategy="deepspeed_stage_2_offload",
    ...
)
```

### Azure ML Python SDK
透過任何電腦登入 Azure-CLI 或 Azure Python SDK 可提交任務。
```python
from azure.ai.ml import command, MLClient

ml_client = MLClient(credential, subscription_id, resource_group, workspace)

job = command(
    code="./",  # local path where the code is stored
    command="python pretrain_trainer.py --num_nodes 2 --gpus_per_node 2 --log_dir ${{outputs.log_dir}}",
    outputs=outputs,
    environment="自訂映像檔",
    compute="叢集名稱",
    # 向GPU叢集要求兩台機器，每個機器使用2卡
    instance_count=2,
    distribution={
        "type": "PyTorch",
        "process_count_per_instance": 2,
    },
)

# submit the command
returned_job = ml_client.jobs.create_or_update(job)
```

## 查看任務
###### 位置：ML Studio>資產>工作
#### 資源監控
![image](./3.png)
#### Node std log
此次任務設置2個節點共4張卡，總計會有4個process:
![image](./4.png)

以下列出第1與第4個process初始化狀態:

##### Process 1 (node:1, card:1):
![image](./5.png)
##### Process 4 (node:2, card:4):
![image](./6.png)

#### 取回資料
###### 位置：ML Studio>資產>資料>資料存放區
如果有掛載**資料存放區**可以直接瀏覽或下載儲存區上的資料：
![image](./7.png)

至此我們已經成功使用 AZ GPU Cluster 進行訓練。
