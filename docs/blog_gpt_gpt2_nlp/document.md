#gpt#gpt2
2020/01/01
# GPT & GPT2 Fine-Tuning
## Import


```python
! pip install transformers==4.5.1
```


```python
from transformers import AutoModelWithLMHead,AutoTokenizer
import torch
```

## Init


```python
model = AutoModelWithLMHead.from_pretrained('gpt2')
tokenizer = AutoTokenizer.from_pretrained('gpt2')
tokenizer.add_special_tokens({'pad_token': '[PAD]'})
```

    /user_data/.local/lib/python3.6/site-packages/transformers/models/auto/modeling_auto.py:970: FutureWarning: The class `AutoModelWithLMHead` is deprecated and will be removed in a future version. Please use `AutoModelForCausalLM` for causal language models, `AutoModelForMaskedLM` for masked language models and `AutoModelForSeq2SeqLM` for encoder-decoder models.
      FutureWarning,





    1



## Prepare data


```python
context = 'Harry Potter is a series of'
label = 'seven fantasy novels'
context_input = tokenizer(context)
label_input = tokenizer(label)
context_input,label_input
```




    ({'input_ids': [18308, 14179, 318, 257, 2168, 286], 'attention_mask': [1, 1, 1, 1, 1, 1]},
     {'input_ids': [26548, 8842, 16122], 'attention_mask': [1, 1, 1]})




```python
model_input = {}
model_input['input_ids'] = context_input['input_ids'] + label_input['input_ids']
model_input['labels'] = model_input['input_ids'][:]
for i,_ in enumerate(context_input['input_ids']):
    model_input['labels'][i] = -100
model_input
```




    {'input_ids': [18308, 14179, 318, 257, 2168, 286, 26548, 8842, 16122],
     'labels': [-100, -100, -100, -100, -100, -100, 26548, 8842, 16122]}




```python
for key in model_input.keys():
    model_input[key] = torch.LongTensor(model_input[key])
model_input
```




    {'input_ids': tensor([18308, 14179,   318,   257,  2168,   286, 26548,  8842, 16122]),
     'labels': tensor([ -100,  -100,  -100,  -100,  -100,  -100, 26548,  8842, 16122])}




```python
outputs = model(**model_input,return_dict=True)
outputs.keys()
```




    odict_keys(['loss', 'logits', 'past_key_values'])



## Fine-tuning


```python
from transformers import AdamW
device = torch.device('cuda') if torch.cuda.is_available() else torch.device('cpu')
model.to(device)
model.train()
optim = AdamW(model.parameters(), lr=5e-4)
```


```python
for key in model_input.keys():
    model_input[key] = model_input[key].to(device)
```


```python
for epoch in range(20):
    optim.zero_grad()
    outputs = model(**model_input,return_dict=True)
    loss = outputs['loss']
    print(loss)
    loss.backward()
    optim.step()
```

    tensor(6.7423, device='cuda:0', grad_fn=<NllLossBackward>)
    tensor(2.4880, device='cuda:0', grad_fn=<NllLossBackward>)
    tensor(0.7196, device='cuda:0', grad_fn=<NllLossBackward>)
    tensor(0.0015, device='cuda:0', grad_fn=<NllLossBackward>)
    tensor(0.7011, device='cuda:0', grad_fn=<NllLossBackward>)
    tensor(1.0631, device='cuda:0', grad_fn=<NllLossBackward>)
    tensor(0.0006, device='cuda:0', grad_fn=<NllLossBackward>)
    tensor(0.0294, device='cuda:0', grad_fn=<NllLossBackward>)
    tensor(0.0072, device='cuda:0', grad_fn=<NllLossBackward>)
    tensor(0.0402, device='cuda:0', grad_fn=<NllLossBackward>)
    tensor(0.2235, device='cuda:0', grad_fn=<NllLossBackward>)
    tensor(0.0036, device='cuda:0', grad_fn=<NllLossBackward>)
    tensor(0.0008, device='cuda:0', grad_fn=<NllLossBackward>)
    tensor(0.0004, device='cuda:0', grad_fn=<NllLossBackward>)
    tensor(7.8670e-05, device='cuda:0', grad_fn=<NllLossBackward>)
    tensor(0.0002, device='cuda:0', grad_fn=<NllLossBackward>)
    tensor(0.0003, device='cuda:0', grad_fn=<NllLossBackward>)
    tensor(4.1959e-05, device='cuda:0', grad_fn=<NllLossBackward>)
    tensor(7.0049e-05, device='cuda:0', grad_fn=<NllLossBackward>)
    tensor(9.9924e-05, device='cuda:0', grad_fn=<NllLossBackward>)


## Overfitting test


```python
context = 'Harry Potter is a series of'
input_ids = tokenizer(context,return_tensors='pt')['input_ids'].to(device)
```


```python
model.eval()
sample_outputs = model.generate(
    input_ids,
    do_sample=True, 
    max_length=10, 
    top_k=10, 
    top_p=0.75, 
    num_return_sequences=3
)

print("Output:\n" + 100 * '-')
for i, sample_output in enumerate(sample_outputs):
  print("{}: {}".format(i, tokenizer.decode(sample_output, skip_special_tokens=True)))
```

    Setting `pad_token_id` to `eos_token_id`:50256 for open-end generation.


    Output:
    ----------------------------------------------------------------------------------------------------
    0: Harry Potter is a series ofseven fantasy novels novels
    1: Harry Potter is a series ofseven fantasy novels novels
    2: Harry Potter is a series ofseven fantasy novels novels


## Refs

- http://jalammar.github.io/illustrated-gpt2
- https://huggingface.co/blog/how-to-generate
- https://discuss.huggingface.co/t/gpt2-for-qa-pair-generation/759/9
