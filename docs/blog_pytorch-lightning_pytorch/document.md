# 用 PyTorch Lighting 拯救你的一天

<document-info>
- tags: #blog#pytorch-lightning#pytorch
- date: 2021/06/20
</document-info>

最近做DL實驗發現除了主要研究的核心，最花心力的就是維護的你training pipline
從資料處理、訓練、預測與算分到加入中斷點恢復，各種超參數與模型版本管理。
如果要一直驗證與處理這些問題，實在是很力不從心，好在大家都有同樣的困擾，於是PL出現了，根據官方說法

*PyTorch Lightning is just organized PyTorch*
*You do the research. Lightning will do everything else.*

就是這麼簡單!不過要體會第二點，我自己覺得是還有段距離，除了對框架本身要熟悉，目前PL也沒有到非常穩定(1.2.x)，存在一些小BUG

基本上只要理解PL三大模組，就可以很快上手了，接下來看看我如何在我最近的研究案-QG(Question Generation)中使用PL

## DataModule 從資料開始
對於使用pytorch我們通常都會先建立Dataset這個類別
```python
class SquadNQGDataset(Dataset,DatasetUtilsMixin):
    def __init__(self,tokenizer,split_set:str='train',is_test=False):
        # some setting
    def __getitem__(self,index):
        # how to process single data
    def __len__(self):
        # total number of data
```
> 這邊使用的NQG是基於SQuAD的資料集，在QG中是非常受歡迎的設定
> 為了避免失焦，我不會在這邊說明我如何處理資料

然後接著丟入`Dataloader`去處理batch。


在PL中，將`DataSet`與`DataLoader`整合在`DataModule`中，要求你定義好在不同階段要用到的資料。還是熟悉的`DataSet`與`DataLoader`並沒有差異。
```python
class DataModule(pl.LightningDataModule):
    def __init__(self,tokenizer):
        super().__init__()
        self.batch_size = 1
        self.train_dataset = SquadNQGDataset(tokenizer,split_set='train')
        self.dev_dataset = SquadNQGDataset(tokenizer,split_set='dev')
        self.test_dataset = SquadNQGDataset(tokenizer,split_set='test',is_test=True)
        
    def train_dataloader(self):
        return DataLoader(self.train_dataset, batch_size=self.batch_size, shuffle=True)

    def val_dataloader(self):
        return DataLoader(self.dev_dataset, batch_size=self.batch_size, shuffle=True)

    def test_dataloader(self):
        return DataLoader(self.test_dataset, batch_size=1, shuffle=False)
```

## LightningModule 搭建模型
繼承`pl.LightningModule`並且定義三個最重要的生命週期方法
- training_step
- validation_step
- test_step
> pl.LightningModule可以視為torch.nn.Module的再包裝

還有其他更細的生命週期方法，可以到官方文件中[自行探索](https://pytorch-lightning.readthedocs.io/en/latest/common/lightning_module.html#hooks)

```python
class Model(pl.LightningModule):
    def __init__(self,args=args):
        super().__init__()
        self.save_hyperparameters(args)# 產生hparams.yaml，紀錄模型超參數
        self.model = # torch.nn.module
    
    def forward(self, inputs):
        logits = self.model(inputs)
        return logits
        
    # 定義每一個step的loss如何計算
    # 拿到的資料來自`train_dataloader`
    def training_step(self, batch, batch_idx):
        logits = self(...) # 呼叫 `forward`
        loss = # 計算你的loss
        
        return loss # 回傳loss給PL，他會幫你處理backword、optim.step等動作
        
    # 定義你的測試step
    # 不僅僅是用loss當指標，可以自己實現需要的方法
    # 拿到的資料來自`val_dataloader`
    def validation_step(self, batch, batch_idx):
        loss = self.training_step(batch, batch_idx) # 重用training_step來獲得loss
        self.log('dev_loss',loss,prog_bar=True) # 紀錄dev_loss，可以在early stop或check point等模組上使用
    
    # 拿到的資料來自`test_dataloader`
    def test_step(self, batch, batch_idx):
    # 這邊我通常會一併計算分數與寫預測log
        
    def configure_optimizers(self):
        self.opt = torch.optim.AdamW(self.parameters(), lr=args.lr)
        return self.opt
```

## Trainer 你的救世主
Trainer抽象了整個training loop，並且有許多開箱即用的`callbacks`，免去重複造輪子的惡夢，我自己常用的有`EarlyStopping`、`ModelCheckpoint`，基本上將這些組織起來就是一個非常完整的training 

在`train.fit()`會在不同階段搭配`DataModule`去調用`training_step`與`validation_step`
```python
from pytorch_lightning.callbacks.early_stopping import EarlyStopping
from pytorch_lightning.callbacks import ModelCheckpoint
from copy import deepcopy
import torch
import gc

model = Model(tokenizer)
# trainer config
trainer = pl.Trainer(
    gpus=-1, # 指定全部可用GPU
    accelerator='dp', # 資料平行處理方式，for多GPU
    precision=32,
    default_root_dir='.log_causal_lm',
    max_epochs=10,
    callbacks=[
        EarlyStopping(monitor='dev_loss',patience=2), # 監測dev_loss的變化，超過兩次沒有改進就停止
        ModelCheckpoint(monitor='dev_loss',filename='{epoch}-{dev_loss:.2f}',save_last=True),
    ]
)

# DataModule
dm = DataModule(tokenizer)

# train
# 使用tuner自動尋找最佳batch_size
# 目前已知在1.2.7會有點小問題
# 使用deepcopy來避免trainer參數跑掉
tuner = pl.tuner.tuning.Tuner(deepcopy(trainer))
new_batch_size = tuner.scale_batch_size(model, datamodule=dm, init_val=torch.cuda.device_count())
del tuner
gc.collect()
# 將找到的batch_size指定過去
model.hparams.batch_size = new_batch_size
trainer.fit(model,datamodule=dm)
```

想要執行`test_step`必須呼叫`trainer.test()`

由於我們有使用`EarlyStopping`因此可以從trainer拿到`last`與`best`，可以自己決定要用哪一個
```python
# decide which checkpoint to use
last_model_path = trainer.checkpoint_callback.last_model_path
best_model_path = trainer.checkpoint_callback.best_model_path
_use_model_path = last_model_path if best_model_path == "" else best_model_path
print('use checkpoint:',_use_model_path)

# run_test
trainer.test(
    model=model if _use_model_path == "" else None,
    datamodule=dm,
    ckpt_path=_use_model_path
)
```
這篇只有簡單的概覽PL架構，所以到這邊就結束了，個人認為整體架構可以說是非常清晰

完整的實戰code可以參考[Transformer-QG-on-SQuAD](https://github.com/p208p2002/Transformer-QG-on-SQuAD)
