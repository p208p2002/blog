#bart-model#nlp
2020/01/01
# BART Model Fine-Tuning
## Import


```python
! pip install transformers==4.5.1
```


```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
```


```python
tokenizer = AutoTokenizer.from_pretrained('facebook/bart-base')
model = AutoModelForSeq2SeqLM.from_pretrained('facebook/bart-base')
```

## Prepare data


```python
context = 'Harry Potter is a series of'
label = 'seven fantasy novels' + tokenizer.eos_token
```


```python
def convert_to_features(context,label):
    input_encodings = tokenizer(context, pad_to_max_length=True, max_length=50, truncation=True)
    label_encodings = tokenizer(label, pad_to_max_length=True, max_length=50, truncation=True, add_special_tokens=False)
    
    pad_token_id = tokenizer.pad_token_id
    labels = []
    for label_encoding_id in label_encodings['input_ids']:
        if label_encoding_id != pad_token_id:
            labels.append(label_encoding_id)
        else:
            labels.append(-100)
        
    return {
        'input_ids':torch.LongTensor(input_encodings['input_ids']).unsqueeze(0),
        'attention_mask':torch.LongTensor(input_encodings['attention_mask']).unsqueeze(0),
        'labels': torch.LongTensor(labels).unsqueeze(0)
    }
```


```python
model_input = convert_to_features(context,label)
model_input
```

    /usr/local/lib/python3.7/dist-packages/transformers/tokenization_utils_base.py:2079: FutureWarning: The `pad_to_max_length` argument is deprecated and will be removed in a future version, use `padding=True` or `padding='longest'` to pad to the longest sequence in the batch, or use `padding='max_length'` to pad to a max length. In this case, you can give a specific length with `max_length` (e.g. `max_length=45`) or leave max_length to None to pad to the maximal input size of the model (e.g. 512 for Bert).
      FutureWarning,





    {'attention_mask': tensor([[1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0]]),
     'input_ids': tensor([[    0, 29345, 10997,    16,    10,   651,     9,     2,     1,     1,
                  1,     1,     1,     1,     1,     1,     1,     1,     1,     1,
                  1,     1,     1,     1,     1,     1,     1,     1,     1,     1,
                  1,     1,     1,     1,     1,     1,     1,     1,     1,     1,
                  1,     1,     1,     1,     1,     1,     1,     1,     1,     1]]),
     'labels': tensor([[17723,  8235, 19405,     2,  -100,  -100,  -100,  -100,  -100,  -100,
               -100,  -100,  -100,  -100,  -100,  -100,  -100,  -100,  -100,  -100,
               -100,  -100,  -100,  -100,  -100,  -100,  -100,  -100,  -100,  -100,
               -100,  -100,  -100,  -100,  -100,  -100,  -100,  -100,  -100,  -100,
               -100,  -100,  -100,  -100,  -100,  -100,  -100,  -100,  -100,  -100]])}



## Fine-tuning


```python
from transformers import AdamW
device = torch.device('cuda') if torch.cuda.is_available() else torch.device('cpu')
model.to(device)
model.train()
optim = AdamW(model.parameters(), lr=5e-5)
```


```python
for key in model_input.keys():
    model_input[key] = model_input[key].to(device)
```


```python
epoch = 0
while True:
    optim.zero_grad()
    outputs = model(**model_input,return_dict=True)
    loss = outputs['loss']
    loss.backward()
    optim.step()
    #
    epoch += 1
    print('epoch:%d'%epoch,'loss:%3.5f'%loss,end='\r')
    if loss.item() < 1e-3: break
```

    

## Overfitting test


```python
context = 'Harry Potter is a series of'
input_ids = tokenizer(context,return_tensors='pt')['input_ids'].to(device)
```


```python
model.eval()
# introduction of  `model.generate`
# https://huggingface.co/blog/how-to-generate
sample_outputs = model.generate(
    input_ids,
    do_sample=False, 
    max_length=10, 
    top_k=1, 
    num_return_sequences=1,
    early_stopping = True
)

print("Output:\n" + 100 * '-')
for i, sample_output in enumerate(sample_outputs):
  print("{}: {}".format(i, tokenizer.decode(sample_output, skip_special_tokens=True)))
```

    Output:
    ----------------------------------------------------------------------------------------------------
    0: seven fantasy novels

