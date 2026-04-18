# PyTorch實作NLP中的Self-Attention

<document-info>
- tags: #nlp#pytorch#self-attention
- date: 2021/03/24
</document-info>

### 輸入準備
我們準備了兩個句子來進行這次實驗
```python
sentences = ['helo attention','have a nice day']
```
一開始先建立詞表與對應的單詞one-hot encoding
```python
vocabs = ' '.join(sentences).split()
vocabs = list(set(vocabs))
one_hots = []
vocab_dict = {}
for i,vocab in enumerate(vocabs):
    one_hots.append([0]*len(vocabs))
    one_hots[i][i]=1
for i,(vocab,one_hot) in enumerate(zip(vocabs,one_hots)):
    vocab_dict[vocab] = one_hot
print(vocab_dict)
```
```
{'nice': [1, 0, 0, 0, 0, 0], 'a': [0, 1, 0, 0, 0, 0], 'attention': [0, 0, 1, 0, 0, 0], 'helo': [0, 0, 0, 1, 0, 0], 'day': [0, 0, 0, 0, 1, 0], 'have': [0, 0, 0, 0, 0, 1]}
```
接著將兩個句子都轉換成one-hot encodeing，並且組成batch
```python
# batch
batch_features = []
for sentence in sentences:
    sentence_features = []
    sentence_words = sentence.split()
    for word in sentence_words:
        word_embedding = vocab_dict[word]
        sentence_features.append(word_embedding)
    batch_features.append(sentence_features)
print(batch_features) # [['helo', 'attention'], ['have', 'a', 'nice', 'day']]
```
```
[[[0, 0, 0, 1, 0, 0], [0, 0, 1, 0, 0, 0]], [[0, 0, 0, 0, 0, 1], [0, 1, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0]]]
```
batch需要對齊長度，將兩句輸入補齊到指定長度，並且轉換成tensor
```python
# batch_pad
pad_to_length = 5
pad_embedding = [0]*len(vocabs) # [0,0,0,0,0,0]用作pad
for i,batch_feature in enumerate(batch_features):
    while len(batch_feature) < pad_to_length:
        batch_feature.append(pad_embedding)
inputs = torch.LongTensor(batch_features)
inputs.shape
```
```
torch.Size([2, 5, 6]) # batch,len,vocab_size
```
> pytorch 內建的 nn.embeddings 是一個更快速的方法，可省略 one-hot encoding 步驟
> https://pytorch.org/docs/stable/generated/torch.nn.Embedding.html

輸入包含補齊部分，等等運算的時候要忽略掉,
我們使用attention mask來做這件事情
```python
"""
1 = 計算, 0 = 忽略
"""
attention_mask = []
for i,batch_feature in enumerate(batch_features):
    _attention_mask = []
    for one_hot in batch_feature:
        if 1 in one_hot: # not pad feature
            _attention_mask.append(1)
        else: # pad feature
            _attention_mask.append(0)
    attention_mask.append(_attention_mask)
attention_mask = torch.LongTensor(attention_mask)
print(attention_mask)
attention_mask.shape
```
```
tensor([[1, 1, 0, 0, 0],
        [1, 1, 1, 1, 0]])
torch.Size([2, 5])
```
### 網路搭建
複習一下Attention公式

![](https://i.imgur.com/YUMr3IA.png)

在 Self Attention 中，`Q = K = V = sentence inputs`,
d = Q 或 K 的維度，在這邊的作用是 scaling factor 避免 softmax 出來的值太過極端

```python
class Atten(nn.Module):
    def __init__(self):
        super(Atten, self).__init__()
        self.word_embeddings = nn.Linear(len(vocabs),4) # word embedding size for 4
        self.d = 3 # embedding size 3 for q,k,v
        self.q_w = nn.Linear(4,self.d)
        self.k_w = nn.Linear(4,self.d)
        self.v_w = nn.Linear(4,self.d)
        
    def forward(self,x,attention_mask):
        x = x.to(torch.float)
        x = self.word_embeddings(x)
        
        Q = self.q_w(x)
        K = self.k_w(x) 
        V = self.v_w(x)
                        
        score = torch.matmul(Q,torch.transpose(K,1,2)) # batch_dot Q*K^trnas
        score = score/math.sqrt(self.d)
        print('Q*K before apply attention_mask\n',score)

        attention_mask = attention_mask
        attention_mask = attention_mask.unsqueeze(1).repeat(1,score.shape[1],1)
        score = score*attention_mask # apply mask to score
        print('Q*K after apply attention_mask\n',score)
        
        score = score - torch.where(attention_mask > 0, torch.zeros_like(score), torch.ones_like(score) * float('inf')) # apply mask to softmax for thoese value is `0`
        
        print('Q*K prepare for mask_softmax\n',score)
        softmax = torch.nn.Softmax(dim=-1)
        atten_prob = softmax(score)
        print('Atten prob\n',atten_prob)
        atten_score = torch.matmul(atten_prob,V)
        print('Atten score\n',atten_score)
        
        return {'atten_prob':atten_prob,'atten_score':atten_score}
        

model = Atten()
model(inputs,attention_mask)
print()
```
```
Q*K before apply attention_mask
 tensor([[[0.1090, 0.0262, 0.0775, 0.0775, 0.0775],
         [0.0262, 0.0134, 0.0157, 0.0157, 0.0157],
         [0.0775, 0.0157, 0.0803, 0.0803, 0.0803],
         [0.0775, 0.0157, 0.0803, 0.0803, 0.0803],
         [0.0775, 0.0157, 0.0803, 0.0803, 0.0803]],

        [[0.2416, 0.2227, 0.0997, 0.1460, 0.1368],
         [0.2227, 0.2057, 0.0888, 0.1347, 0.1253],
         [0.0997, 0.0888, 0.0755, 0.0704, 0.0661],
         [0.1460, 0.1347, 0.0704, 0.0953, 0.0861],
         [0.1368, 0.1253, 0.0661, 0.0861, 0.0803]]], grad_fn=<DivBackward0>)
Q*K after apply attention_mask
 tensor([[[0.1090, 0.0262, 0.0000, 0.0000, 0.0000],
         [0.0262, 0.0134, 0.0000, 0.0000, 0.0000],
         [0.0775, 0.0157, 0.0000, 0.0000, 0.0000],
         [0.0775, 0.0157, 0.0000, 0.0000, 0.0000],
         [0.0775, 0.0157, 0.0000, 0.0000, 0.0000]],

        [[0.2416, 0.2227, 0.0997, 0.1460, 0.0000],
         [0.2227, 0.2057, 0.0888, 0.1347, 0.0000],
         [0.0997, 0.0888, 0.0755, 0.0704, 0.0000],
         [0.1460, 0.1347, 0.0704, 0.0953, 0.0000],
         [0.1368, 0.1253, 0.0661, 0.0861, 0.0000]]], grad_fn=<MulBackward0>)
Q*K prepare for mask_softmax
 tensor([[[0.1090, 0.0262,   -inf,   -inf,   -inf],
         [0.0262, 0.0134,   -inf,   -inf,   -inf],
         [0.0775, 0.0157,   -inf,   -inf,   -inf],
         [0.0775, 0.0157,   -inf,   -inf,   -inf],
         [0.0775, 0.0157,   -inf,   -inf,   -inf]],

        [[0.2416, 0.2227, 0.0997, 0.1460,   -inf],
         [0.2227, 0.2057, 0.0888, 0.1347,   -inf],
         [0.0997, 0.0888, 0.0755, 0.0704,   -inf],
         [0.1460, 0.1347, 0.0704, 0.0953,   -inf],
         [0.1368, 0.1253, 0.0661, 0.0861,   -inf]]], grad_fn=<SubBackward0>)
Atten prob
 tensor([[[0.5207, 0.4793, 0.0000, 0.0000, 0.0000],
         [0.5032, 0.4968, 0.0000, 0.0000, 0.0000],
         [0.5155, 0.4845, 0.0000, 0.0000, 0.0000],
         [0.5155, 0.4845, 0.0000, 0.0000, 0.0000],
         [0.5155, 0.4845, 0.0000, 0.0000, 0.0000]],

        [[0.2661, 0.2611, 0.2309, 0.2419, 0.0000],
         [0.2650, 0.2605, 0.2318, 0.2427, 0.0000],
         [0.2540, 0.2513, 0.2480, 0.2467, 0.0000],
         [0.2586, 0.2557, 0.2398, 0.2458, 0.0000],
         [0.2583, 0.2554, 0.2407, 0.2456, 0.0000]]], grad_fn=<SoftmaxBackward>)
Atten score
 tensor([[[ 0.1579,  0.1980, -0.3929],
         [ 0.1545,  0.1949, -0.3978],
         [ 0.1569,  0.1970, -0.3944],
         [ 0.1569,  0.1970, -0.3944],
         [ 0.1569,  0.1970, -0.3944]],

        [[ 0.2930,  0.1643, -0.3598],
         [ 0.2927,  0.1644, -0.3600],
         [ 0.2885,  0.1652, -0.3633],
         [ 0.2905,  0.1648, -0.3617],
         [ 0.2903,  0.1649, -0.3619]]], grad_fn=<UnsafeViewBackward>)
```
上面向量的`row`與`col`都是同一句，可以這樣理解他們的數值關係
```
      have    a       nice    day     [PAD]
have  0.2661, 0.2611, 0.2309, 0.2419, 0.0000
a     0.2650, 0.2605, 0.2318, 0.2427, 0.0000
nice  0.2540, 0.2513, 0.2480, 0.2467, 0.0000
day   0.2586, 0.2557, 0.2398, 0.2458, 0.0000
[PAD] 0.2583, 0.2554, 0.2407, 0.2456, 0.0000
```
`row`部分可以看到我們使用 attention mask 遮蔽掉 [PAD] 部分，不參與 softmax 計算,
但是`col`的[PAD]還是會因為平行計算的關係與其他 token 進行運算

### Code
用colab玩一下吧
https://colab.research.google.com/drive/1g9G23KZGkZFpRGTLIaTkVHaMORN60-bq?usp=sharing


### Refs
- [Attention Is All You Need](https://arxiv.org/pdf/1706.03762.pdf)
- [illustrated-self-attention](https://towardsdatascience.com/illustrated-self-attention-2d627e33b20a)