#bart#bert#transformer-model#pytorch#nlp#huggingface#custom-transformer-model
2022/08/10
# 修改 Transformer Language Model, 教你如何加入新的 Embedding Layer
預訓練語言模型 Transformer Language Model (TLM) 非常強大，卻因為架構複雜而難以修改<sup>*1</sup>，今天示範如何在 BART Model 增加新的 Embedding Layer。

> BART 是一個 Transformer Encoder-Decoder 架構模型。

> <sup>*1</sup> 要適應下游任務僅須抽換最後一層 Linear Layer，這件事情非常容易達成，本次討論是如何增加新的輸入特徵


## BERT Embedding 的實現
首先間借用一下經典的 BERT 輸入表示圖
> BERT 是一個 Transformer Encoder 架構模型，與BART有所區別請注意不要混淆。

![](./bert-input.png)

我們可以看到 BERT 的輸入與由三個 Embedding 相加


先來喵一下 BERT 是如何實現這些 Embeddings

```python
class BertEmbeddings(nn.Module):
    """Construct the embeddings from word, position and token_type embeddings."""

    def __init__(self, config):
        super().__init__()
        self.word_embeddings = nn.Embedding(config.vocab_size, config.hidden_size, padding_idx=config.pad_token_id)
        self.position_embeddings = nn.Embedding(config.max_position_embeddings, config.hidden_size)
        self.token_type_embeddings = nn.Embedding(config.type_vocab_size, config.hidden_size)

    def forward(
        self,
        input_ids: Optional[torch.LongTensor] = None,
        token_type_ids: Optional[torch.LongTensor] = None,
        position_ids: Optional[torch.LongTensor] = None,
        inputs_embeds: Optional[torch.FloatTensor] = None,
        past_key_values_length: int = 0,
    ) -> torch.Tensor:
        
        ...

        # 這邊我刪除和調整了部份程式，方便閱讀
        inputs_embeds = self.word_embeddings(input_ids)
        token_type_embeddings = self.token_type_embeddings(token_type_ids)
        position_embeddings = self.position_embeddings(position_ids)
        embeddings = inputs_embeds + token_type_embeddings + position_embeddings

        ...
        
        return embeddings
...

```

```python
class BertModel(BertPreTrainedModel):
    def __init__(self, config, add_pooling_layer=True):
        super().__init__(config)
        self.config = config

        self.embeddings = BertEmbeddings(config) # 實例了Embedding Class，後續會在 `forward` 使用
        self.encoder = BertEncoder(config)

        self.pooler = BertPooler(config) if add_pooling_layer else None

        # Initialize weights and apply final processing
        self.post_init()
...
```

以上程式碼都可以在 [HF modeling_bart.py](https://github.com/huggingface/transformers/blob/v4.21.1/src/transformers/models/bert/modeling_bert.py) 中找到


## 優雅的修改 BART Model
稍微看過後已經可以找到我們要聚焦在要修改的地方了。Transformer-based 的模型結構大致，剛剛我們借用了經典的 BERT，現在轉換回我們想修改的目標 BART Model。


接下來將我們將在BART加入一層新的 Embedding Layer，並且提供新的輸入特徵到模型。

由於程式碼藏在 library<sup>*2</sup> 中，不那麼方便進行更動，見過許多不同的作法: Fork, 複製整份 library 到專案內， 直接修改 modeling_xx.py ... ，這些作法都不太讓人滿意，最後經過許多嘗試與思考，我最推薦使用`繼承`與`覆寫` (真是經典:D)。
> <sup>*2</sup> 使用了[huggingface/transformers](https://github.com/huggingface/transformers) 套件

這次修改的目標類別是 `BartForConditionalGeneration` (對應條件文本生成類)，為了加入新的 Embedding Layer 將需要一路往上追多個類別 `BartForConditionalGeneration` -> `BartModel` -> `BartEncoder` (在這裡做新增)；現在可以從`BartEncoder`往下講回去了~

```python
# custom_modeling_bart.py
from transformers.models.bart.modeling_bart import * # 直接將整個目標全部引入
```

```python
# custom_modeling_bart.py
# 複寫 __init__(), forward()
class CustomBartEncoder(BartEncoder):
    ...
    def __init__(self, config: BartConfig, embed_tokens: Optional[nn.Embedding] = None):
        super().__init__(config)

        ...
        
        # 在這裡新增，需要確保out size = hidden size
        self.embed_error_points = nn.Embedding(2,embed_dim,0) 

        ...
        
    def forward(
        self,
        input_ids: torch.LongTensor = None,
        attention_mask: Optional[torch.Tensor] = None,
        head_mask: Optional[torch.Tensor] = None,
        inputs_embeds: Optional[torch.FloatTensor] = None,
        output_attentions: Optional[bool] = None,
        output_hidden_states: Optional[bool] = None,
        return_dict: Optional[bool] = None,
        error_points: torch.LongTensor = None, # 新的輸入特徵
    ) -> Union[Tuple, BaseModelOutput]:
        
        inputs_embeds = self.embed_tokens(input_ids) * self.embed_scale
        embed_pos = self.embed_positions(input_shape)
        embed_error = self.embed_error_points(error_points)

        hidden_states = inputs_embeds + embed_pos + embed_error # 全部加在一起
```
```python
# custom_modeling_bart.py
# 複寫 __init__(), forward()
class CustomBartModel(BartModel):
    def __init__(self, config: BartConfig):
        ...
        
        self.encoder = CustomBartEncoder(config, self.shared) # 替換成我們修改的類別

        ...
        
    def forward(
        self,
        input_ids: torch.LongTensor = None,
        attention_mask: Optional[torch.Tensor] = None,
        decoder_input_ids: Optional[torch.LongTensor] = None,
        decoder_attention_mask: Optional[torch.LongTensor] = None,
        head_mask: Optional[torch.Tensor] = None,
        decoder_head_mask: Optional[torch.Tensor] = None,
        cross_attn_head_mask: Optional[torch.Tensor] = None,
        encoder_outputs: Optional[List[torch.FloatTensor]] = None,
        past_key_values: Optional[List[torch.FloatTensor]] = None,
        inputs_embeds: Optional[torch.FloatTensor] = None,
        decoder_inputs_embeds: Optional[torch.FloatTensor] = None,
        use_cache: Optional[bool] = None,
        output_attentions: Optional[bool] = None,
        output_hidden_states: Optional[bool] = None,
        return_dict: Optional[bool] = None,
        error_points: torch.LongTensor = None # 新的輸入特徵
    ) -> Union[Tuple, Seq2SeqModelOutput]:

        ...

        if encoder_outputs is None:
            encoder_outputs = self.encoder(
                input_ids=input_ids,
                attention_mask=attention_mask,
                head_mask=head_mask,
                inputs_embeds=inputs_embeds,
                output_attentions=output_attentions,
                output_hidden_states=output_hidden_states,
                return_dict=return_dict,
                error_points=error_points # 傳給 Encoder
            )
        
        ...
```
```python
# custom_modeling_bart.py
# 複寫 __init__(), forward(), prepare_inputs_for_generation()
class CustomBartForConditionalGeneration(BartForConditionalGeneration):
    base_model_prefix = "model"
    _keys_to_ignore_on_load_missing = [r"final_logits_bias", r"lm_head.weight"]

    def __init__(self, config: BartConfig):
        ...

        self.model = CustomBartModel(config) # 替換成修改過後的類別

        ...
    
    # 修改 prepare_inputs_for_generation，提供新的特徵輸入
    # prepare_inputs_for_generation 定義了 Model.generate 如何提供資料
    def prepare_inputs_for_generation(
        self,
        decoder_input_ids,
        past=None,
        attention_mask=None,
        head_mask=None,
        decoder_head_mask=None,
        cross_attn_head_mask=None,
        use_cache=None,
        encoder_outputs=None,
        error_points=None,  # 提供輸入特徵給模型
        **kwargs
    ):
        # cut decoder_input_ids if past is used
        if past is not None:
            decoder_input_ids = decoder_input_ids[:, -1:]

        return {
            "input_ids": None,  # encoder_outputs is defined. input_ids not needed
            "encoder_outputs": encoder_outputs,
            "past_key_values": past,
            "decoder_input_ids": decoder_input_ids,
            "attention_mask": attention_mask,
            "head_mask": head_mask,
            "decoder_head_mask": decoder_head_mask,
            "cross_attn_head_mask": cross_attn_head_mask,
            "use_cache": use_cache,  # change this to avoid caching (presumably for debugging)
            "error_points": error_points
        }
        
    def forward(
        self,
        input_ids: torch.LongTensor = None,
        attention_mask: Optional[torch.Tensor] = None,
        decoder_input_ids: Optional[torch.LongTensor] = None,
        decoder_attention_mask: Optional[torch.LongTensor] = None,
        head_mask: Optional[torch.Tensor] = None,
        decoder_head_mask: Optional[torch.Tensor] = None,
        cross_attn_head_mask: Optional[torch.Tensor] = None,
        encoder_outputs: Optional[List[torch.FloatTensor]] = None,
        past_key_values: Optional[List[torch.FloatTensor]] = None,
        inputs_embeds: Optional[torch.FloatTensor] = None,
        decoder_inputs_embeds: Optional[torch.FloatTensor] = None,
        labels: Optional[torch.LongTensor] = None,
        use_cache: Optional[bool] = None,
        output_attentions: Optional[bool] = None,
        output_hidden_states: Optional[bool] = None,
        return_dict: Optional[bool] = None,
        error_points: torch.LongTensor = None # 提供輸入特徵給模型
    ) -> Union[Tuple, Seq2SeqLMOutput]:
        
        ...

        outputs = self.model(
            input_ids,
            attention_mask=attention_mask,
            decoder_input_ids=decoder_input_ids,
            encoder_outputs=encoder_outputs,
            decoder_attention_mask=decoder_attention_mask,
            head_mask=head_mask,
            decoder_head_mask=decoder_head_mask,
            cross_attn_head_mask=cross_attn_head_mask,
            past_key_values=past_key_values,
            inputs_embeds=inputs_embeds,
            decoder_inputs_embeds=decoder_inputs_embeds,
            use_cache=use_cache,
            output_attentions=output_attentions,
            output_hidden_states=output_hidden_states,
            return_dict=return_dict,
            error_points=error_points # 提供輸入特徵給模型
        )

        ...
```

至此，我們修改了三個類別的 `__init__()` 與 `forward()` :

1. 在 `CustomBartEncoder` 建立新的 Embedding Layer，並且加總後產生新的 Hidden State>。
2. 在 `CustomBartModel` 使用修改後的 Encoder，修改 `forward()` 使得傳遞與連結正確。
3. 在 `CustomBartForConditionalGeneration` 使用修改後的 Model ，修改 `forward()` 使得傳遞與連結正確， 以及覆寫 `prepare_inputs_for_generation` 讓 Model.generate能夠正常運作。


現在可以使用修改後的模型了，由於使用繼承並且遵循hf的架構，並沒有破壞任何library提供的功能:D。

```python
model = CustomBartForConditionalGeneration.from_pretrained('MODEL_NAME') # 加載預訓練權重
'''
Some weights of CustomBartForConditionalGeneration were not initialized from the model checkpoint at fnlp/bart-base-chinese and are newly initialized: ['encoder.embed_error_points.weight']
You should probably TRAIN this model on a down-stream task to be able to use it for predictions and inference.
'''
```
> 出現警告是正常的，只要重新fine-tune後即可

error_points 是我們新提供的特徵。

```python
out = model(input_ids=batch[0], error_points=batch[1], labels=batch[-1])
loss = out.loss
```

文本生成工具能夠識別新輸入，並且正常運作。

```python
pred_input_ids = model.generate(batch[0], error_points=batch[1], do_sample=False, num_beams=3)
```
