#flask#pyorch#cuda-out-of-memory
2022/03/18
# Flask與Pytorch模型部署
pytorch模型部署時若遇到多執行緒(或是多個併發請求)會自動請求新的vram，使用完畢後也不會自動釋放，因此當API用一段時間後常常會出現 cuda out of memor 導致server崩潰。除此之外多執行緒爭奪資源也有機會讓程式變得不穩定。

有幾條思路可以解決
1. 關閉Flask的多執行緒
2. 所有線程使用模型時先等待其它執行緒使用完畢


### 沒有關閉多執行緒的狀況下
```python
from flask import Flask, request
from transformers import AutoTokenizer, AutoModel
import json
import time

tokenizer = AutoTokenizer.from_pretrained("albert-base-v2")
model = AutoModel.from_pretrained("albert-base-v2")
model.to('cuda')

app = Flask(__name__)


@app.route("/cls-embeddings")
def albert_example():
    words = request.args.get('words')
    model_input = tokenizer(words, return_tensors='pt')
    out = model(input_ids=model_input.input_ids.to('cuda'))
    cls_embeddings = out.last_hidden_state.squeeze(
        0)[0].cpu().detach().numpy().tolist()
    return json.dumps(cls_embeddings)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8888)

```

用Locust壓力測試，RPS約25~26，但是有失敗的請求，主要就來自於多執行緒任務造成模型推論失敗

![image](https://user-images.githubusercontent.com/16718598/158928871-c08eeb1e-03de-4cf0-8a9c-5d9ad25b10ba.png)

vram佔用緩步上升到4G，估計時間久server就掛了

![image](https://user-images.githubusercontent.com/16718598/158929046-09d1deec-2464-4f2e-bc9e-54b24948d5be.png)

### 關閉Flask的多執行緒
```python
from flask import Flask, request
from transformers import AutoTokenizer, AutoModel
import json
import time

tokenizer = AutoTokenizer.from_pretrained("albert-base-v2")
model = AutoModel.from_pretrained("albert-base-v2")
model.to('cuda')

app = Flask(__name__)


@app.route("/cls-embeddings")
def albert_example():
    words = request.args.get('words')
    model_input = tokenizer(words, return_tensors='pt')
    out = model(input_ids=model_input.input_ids.to('cuda'))
    cls_embeddings = out.last_hidden_state.squeeze(
        0)[0].cpu().detach().numpy().tolist()
    return json.dumps(cls_embeddings)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8888, threaded=False)
    
```
> threaded (bool) – should the process handle each request in a separate thread?



RPS達到86，並且沒有錯誤

![image](https://user-images.githubusercontent.com/16718598/158929688-876089b9-3698-40d5-987d-0cd3c204835a.png)

vram佔用也穩定維持在1G，沒有上升

![image](https://user-images.githubusercontent.com/16718598/158929906-219874e1-d028-4143-970d-e7fc100d5793.png)

這個方法若遇到某個請求運算很久，其他使用者都必須等待，server平應時間會拉長


### 等待其它執行緒使用完畢
```python
from flask import Flask, request
from transformers import AutoTokenizer, AutoModel
import json
import time

app = Flask(__name__)


def singleton(class_):
    instances = {}

    def getinstance(*args, **kwargs):
        if class_ not in instances:
            instances[class_] = class_(*args, **kwargs)

        return instances[class_]
    return getinstance


@singleton
class MyModel():
    def __init__(self):
        print("init")
        self._tokenizer = AutoTokenizer.from_pretrained("albert-base-v2")
        self.model = AutoModel.from_pretrained("albert-base-v2")
        self.model.to('cuda')
        self.lock = False

    def is_lock(self):
        # print(f"check lock {time.time()}")
        return self.lock

    def __call__(self, text_input):
        while self.is_lock():
            time.sleep(0.1)

        self.lock = True
        model_input = self._tokenizer(text_input, return_tensors='pt')
        out = self.model(input_ids=model_input.input_ids.to('cuda'))
        self.lock = False

        return out


MyModel()


@app.route("/cls-embeddings")
def albert_example():
    words = request.args.get('words')
    model = MyModel()
    out = model(words)
    cls_embeddings = out.last_hidden_state.squeeze(
        0)[0].cpu().detach().numpy().tolist()
    return json.dumps(cls_embeddings)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8888)

```

建立一個單一實例化類別，然後讓其他執行緒要存取的時候先檢查是否被使用。這個寫法不用關閉flask的多執行緒。

RPS約40上下，這與python多執行緒的特性有關

![image](https://user-images.githubusercontent.com/16718598/158930739-226414dd-a050-494d-9da4-e9cbdd8eb3f5.png)

vram佔用正常

![image](https://user-images.githubusercontent.com/16718598/158930770-b9ffb92a-3d75-4abf-85ec-8b9859ae48dc.png)

雖然比關閉多執行緒慢，但起碼不會有大運算導致整個server塞車的情況。


