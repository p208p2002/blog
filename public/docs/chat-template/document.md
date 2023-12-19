# 設定聊天模板讓 chat model 更好用

<document-info>
- tags: #chat-template#transformers#LLM#chat-model
- date: 2023/12/19
</document-info>

新版本的 transformers 已經增加 `tokenizer.chat_template` 屬性，有了這個 `chat_template` ，能確保我們在使用或訓練時遵循模型的需要的模板。

許多第三方的部屬框架 (如: vllm, openllm) 也已經開始支援這個屬性，但如果沒有設置 `.chat_template` 則會使用 `.default_chat_template` ，需要特別注意。

> 這些框架號稱支援多種不同模型與 `chat_template` ，但以 [chatglm3](https://huggingface.co/THUDM/chatglm3-6b) 和 [vllm](https://github.com/vllm-project/vllm/blob/main/vllm/entrypoints/openai/api_server.py) 舉例來說，就會發現因為 chatglm3 的 `chat_template` 缺失，導致套用到非正確的聊天模板。

### chatglm3 聊天模板
chatglm3是能力不錯的中文 chat model，不過目前尚未提供 `.chat_template` ，使用起來不太方便:

```python
# pip install protobuf cpm_kernels sentencepiece
from transformers import AutoTokenizer, AutoModel
tokenizer = AutoTokenizer.from_pretrained("THUDM/chatglm3-6b", trust_remote_code=True)
```

#### 缺少 chat_template
```python
print(tokenizer.chat_template)
# None
```
```python
None
```

由於沒有聊天模板，此時 tokenizer 會退回去使用 `.default_chat_template` ，這時便會套用到 ChatML 的格式:
```python
print(tokenizer.default_chat_template)
# {% for message in messages %}{{'<|im_start|>' + message['role'] + '
# ' + message['content'] + '<|im_end|>' + '
# '}}{% endfor %}{% if add_generation_prompt %}{{ '<|im_start|>assistant
# ' }}{% endif %}
```

若直接使用這個格式，會**損害**模型的能力，因為模型不理解這種對話格式:

```python
out = tokenizer.decode(tokenizer.apply_chat_template(
    conversation=[  
        {"role": "system", "content": "A system prompt"},
        {"role": "user", "content": "Hi there!"},
        {"role": "assistant", "content": "Nice to meet you!"},
        {"role": "user", "content": "Can I ask a question?"}
    ]
))
print(out)
```

```
<|im_start|>system
A system prompt<|im_end|>
<|im_start|>user
Hi there!<|im_end|>
<|im_start|>assistant
Nice to meet you!<|im_end|>
<|im_start|>user
Can I ask a question?<|im_end|>
```
> 轉出來是 ChatML 格式，不符合我們的預期。

#### build_chat_input (Chatglm 作者實現)
chatglm 作者在tokenizer提供了 `.build_chat_input` 增加易用性，然而這方法僅能用在 chatglm 模型，並不是通用方法:
```python
encodes = tokenizer.build_chat_input(
    query="hello",
    history=[  
        {"role": "system", "content": "A system prompt"},
        {"role": "user", "content": "Hi there!"},
        {"role": "assistant", "content": "Nice to meet you!"},
        {"role": "user", "content": "Can I ask a question?"}
    ]
)

input_ids = encodes["input_ids"][0]
out = tokenizer.decode(input_ids)
print(out)
```
```
[gMASK]sop<|system|> 
 A system prompt<|user|> 
 Hi there!<|assistant|> 
 Nice to meet you!<|user|> 
 Can I ask a question?<|user|> 
 hello<|assistant|>
```

### 撰寫 jinja 模板

[Jinja](https://jinja.palletsprojects.com/)是一個強大的模板引擎。我們能夠以近似Python的程式碼風格進行編寫並透過向模板傳遞資料，最終將文字呈現。

```python
from jinja2.nativetypes import NativeEnvironment

messages = [  
    {"role": "system", "content": "A system prompt"},
    {"role": "user", "content": "Hi there!"},
    {"role": "assistant", "content": "Nice to meet you!"},
    {"role": "user", "content": "Can I ask a question?"}
]
env = NativeEnvironment()

chat_template = """
{% for message in messages %}\
{% if loop.first %}\
[gMASK]sop<|{{ message['role'] }}|> 
 {{ message['content'] }}\
{% else %}\
<|{{ message['role'] }}|> 
 {{ message['content'] }}\
{% endif %}\
{% endfor %}\
{% if add_generation_prompt %}<|assistant|>{% endif %}
""".strip()

t = env.from_string(chat_template)
print(jinja_template_result:= t.render(messages=messages,add_generation_prompt=True))
print("-"*20)
print(official_result:=tokenizer.decode(tokenizer.build_chat_input(query=messages[-1]['content'],history=messages[:-1])['input_ids'][0]))
```
```
[gMASK]sop<|system|> 
 A system prompt<|user|> 
 Hi there!<|assistant|> 
 Nice to meet you!<|user|> 
 Can I ask a question?<|assistant|>
--------------------
[gMASK]sop<|system|> 
 A system prompt<|user|> 
 Hi there!<|assistant|> 
 Nice to meet you!<|user|> 
 Can I ask a question?<|assistant|>
```

現在是 `jinja_template` 與 `.build_chat_input` 對齊了:)

##### 模板除錯
用肉眼一個一個比對太累了，直接使用difflib比較兩組字串差異。
```python
from difflib import ndiff
# 如果樣板結果與官方版本不同，比較差異
if not jinja_template_result == official_result:
    str1 = jinja_template_result
    str2 = official_result
    diff = ndiff(str1.splitlines(), str2.splitlines())
    for line in diff:
        print(line)
```

### 使用 `tokenizer.chat_template` 搭配 `model.generate`

幫每個模型撰寫聊天模板並且搭配 `model.gemerate` ，如此使得每個聊天的模型的操作都可以一致:

```python
from transformers import AutoTokenizer,AutoModelForCausalLM

model_id_or_path = "THUDM/chatglm3-6b"
tokenizer = AutoTokenizer.from_pretrained(model_id_or_path,trust_remote_code=True)
tokenizer.chat_template = "{% for message in messages %}{% if loop.first %}[gMASK]sop<|{{ message['role'] }}|> \n {{ message['content'] }}{% else %}<|{{ message['role'] }}|> \n {{ message['content'] }}{% endif %}{% endfor %}{% if add_generation_prompt %}<|assistant|>{% endif %}"
model = AutoModelForCausalLM.from_pretrained(model_id_or_path,device_map="auto",trust_remote_code=True)
# model.half()
inputs = tokenizer.apply_chat_template([
    {"role":"system","content":"你是一位樂於助人、尊重他人且誠實的助理。請始終以最有幫助的方式回答問題。如果你對某個問題不知道答案，請不要提供虛假信息。"},
    {"role":"user","content":"如何減緩地球暖化？"}
],add_generation_prompt=True,tokenize=True,return_tensors="pt")

out = model.generate(inputs,max_new_tokens=256)
print(tokenizer.decode(out[0]))
```
```
[gMASK]sop<|system|> 
 你是一位樂於助人、尊重他人且誠實的助理。請始終以最有幫助的方式回答問題。如果你對某個問題不知道答案，請不要提供虛假信息。<|user|> 
 如何減緩地球暖化？<|assistant|> 
 減緩地球暖化有許多方法，以下是一些主要的措施：

1. 減少二氧化碳排放：這包括減少工業和交通碳排放，以及提高能源效率。
2. 採用可再生能源：如太陽能、風能和水能等。
3. 保護森林：森林可以吸收二氧化碳，如果森林被砍伐或被燒毀，會增加二氧化碳的排放。
4. 減少溫室氣體排放：這包括減少農業和工業溫室氣體排放，以及提高能源效率。
5. 改變飲食習慣：減少肉類和乳製品 consumption，因為它們產生的大氣碳排}>
```

### 其他參考連結
- https://huggingface.co/docs/transformers/chat_templating
- https://huggingface.co/blog/chat-templates
- https://huggingface.co/blog/zh/chat-templates