#Elasticserach #中文搜尋優化
2022/07/28
# Elasticserach Search 中文搜尋優化 (簡繁)
## 中文與英文的不同
中文與英文的結構不同，英文會使用空白分隔單字，但是中文卻是全部黏在一起

比如說 *these is and apple* 在預設的`analyzer`會被分割成

```json
POST _analyze
{
    "analyzer": "standard",
    "text":"there is an apple"
}
```
![](./en_tokenize.png)

而中文 *那裡有一顆蘋果* 則會被依照每一個字切開
```json
POST _analyze
{
  "analyzer": "standard",
  "text":"那裡有一顆蘋果"
}
```
![](./ch_tokenize.png)

顯然這樣的結果並不能很好的表示中文文義

## 中文斷詞、分詞
IK是一款專門進行中文分詞的ES套件，使用它能夠使`tokenize`後有更好的結果(不再是將每一個中文字元拆開)
> https://github.com/medcl/elasticsearch-analysis-ik


```
POST _analyze
{
  "analyzer": "ik_smart",
  "text":"那裡有一顆蘋果"
}
```
![](./ch_tokenize_ik_1.png)

請注意`type`發生改變了，但是依然是依照每一個字元進行切分，這是因為這款套件內建的分詞字典是以**簡體中文**為主

那麼我們試試看簡體輸入 *那里有一颗苹果*

```json
POST _analyze
{
  "analyzer": "ik_smart",
  "text":"那里有一颗苹果"
}
```

![](./ch_tokenize_ik_2.png)

確實依照單詞去切分了！

### 擴充繁體詞庫
然而這樣簡體詞庫不符合我的期望，現在要對IK進行擴充

這邊使用了我從網路整理的簡繁詞庫 [p208p2002/zh-nlp-dict](https://github.com/p208p2002/zh-nlp-dict)

具體操作方法如下:

1. 編輯/usr/share/elasticsearch/config/analysis-ik/IKAnalyzer.cfg.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
	<comment>IK Analyzer 扩展配置</comment>
	<!--用户可以在这里配置自己的扩展字典 -->
	<entry key="ext_dict">zh_words.txt</entry>
	 <!--用户可以在这里配置自己的扩展停止词字典-->
	<entry key="ext_stopwords"></entry>
	<!--用户可以在这里配置远程扩展字典 -->
	<!-- <entry key="remote_ext_dict">words_location</entry> -->
	<!--用户可以在这里配置远程扩展停止词字典-->
	<!-- <entry key="remote_ext_stopwords">words_location</entry> -->
</properties>

```
2. 將詞庫放置到 `/usr/share/elasticsearch/config/analysis-ik/`
3. 重新啟動 Elasticsearch


我們再重新試一下 *那裡有一顆蘋果*
```
POST _analyze
{
  "analyzer": "ik_smart",
  "text":"那裡有一顆蘋果"
}
```
![](./ch_tokenize_ik_3.png)

成功搞定繁體中文分詞

## 同義詞
中文有許多同義詞或是地區用語差異，好比說 *記憶體/內存* 是同義詞;我們希望搜尋的時候能夠一起被搜索到,這時候我們可以配置一個`filter`。

在`/usr/share/elasticsearch/config`下建立一個`zh_synonym.txt`，然後回到Elasticsearch設定filter。為了方便測試我們會先建立一個新的`index`而非像前面使用全局的方式呼叫。


1. 建立新的index
```
PUT custom
```

2. 暫時關閉index準備更新設定
```
POST custom/_close
```

3. 宣告新的同義詞filter
```json
PUT custom/_settings
{
  "index":{
    "analysis":{
      "filter": {
				"synonym": {
					"type": "synonym",
					"synonyms_path": "zh_synonym.txt"
				}
			}
    }
  }
}
```

4. 重新打開index
```
POST custom/_open
```

5. 測試同義詞
```
POST custom/_analyze
{
  "tokenizer": "ik_smart",
  "filter": ["synonym"],
  "text":"記憶體廠牌如何選"
}
```

![](./synonym.png)

這樣配置搜索的時候就會將同義詞一併檢索

## 中文簡繁轉換

最後還有常見的簡繁轉換議題，讓搜尋結果能夠包含簡繁, 這裡使用 [medcl/elasticsearch-analysis-stconvert](https://github.com/medcl/elasticsearch-analysis-stconvert) 這個套件

將pre-build package放到路徑下後重新啟動 Elasticsearch 即可完成安裝
- /usr/share/elasticsearch/plugins/stconvert/elasticsearch-analysis-stconvert-x.x.x.jar
- /usr/share/elasticsearch/plugins/stconvert/plugin-descriptor.properties

測試一下簡轉繁
```
POST _analyze
{
  "tokenizer": "stconvert",
  "text":"那里有一颗苹果"
}

```
![](./s2t.png)

## 客製化 Analyzer - IK分詞 + 同義詞 + 簡繁轉換

前面說了分詞、同義詞還有簡繁轉換，這些組件可以透過自訂Analyzer來一起使用


1. 一樣先暫時關閉index
```
POST custom/_close
```

2. 更新設定增加'tsconvert'

- ik_smart_plus: 基於`ik_smart`並增加簡繁與同義詞
- ik_max_word_plus: 基於`ik_max_word`並增加簡繁與同義詞

```json
PUT custom/_settings
{
  "index":{
    "analysis":{
      "analyzer": {
        "ik_smart_plus": {
          "type": "custom",
          "tokenizer": "ik_smart",
          "filter": [
            "tsconvert",
            "synonym"
          ]
        },
        "ik_max_word_plus": {
          "type": "custom",
          "tokenizer": "ik_max_word",
          "filter": [
            "tsconvert",
            "synonym"
          ]
        }
			},
      "filter": {
        "synonym": {
			    "type": "synonym",
          "synonyms_path": "zh_synonym.txt"
        },
        "tsconvert" : {
          "type" : "stconvert",
          "convert_type" : "t2s"
        }
      }
    }
  }
}
```

3. 設定完畢，開啟 index
```
POST custom/_open
```
4. 測試客製化 analyzer
```json
POST custom/_analyze
{
  "analyzer": "ik_smart_plus",
  "text":"程式系統開與設計"
}
```
![](./custom_analyzer.png)

分詞、同義詞與簡繁轉換的功能正常運作!

這邊雖然進行了繁體轉簡體，但是實際上搜尋簡繁兩種結果都會hit到。

## 搜尋模擬
### 建立ES Mapping & Setting
建立新index設定，並且套用上客制的Analyzer (針對中文搜強化)

#### Mappings
- 針對資料欄位**title**，使用 `analyzer` (ik_max_word_plus) 建立索引，搜尋時使用 `search_analyzer` (ik_smart_plus) 解析輸入

#### Settings
見前述章節
- ik_max_word_plus
- ik_smart_plus

#### 建立新index 
```json
PUT foo
{
	"mappings": {
		"bar": {
			"properties": {
			  "title":{
			    "type":"text",
			    "analyzer":"ik_max_word_plus",
			    "search_analyzer":"ik_smart_plus"
			  }
			}
		}
	},
	"settings": {
		"index": {
			"analysis": {
				"analyzer": {
					"ik_smart_plus": {
						"type": "custom",
						"tokenizer": "ik_smart",
						"filter": [
							"tsconvert",
							"synonym"
						]
					},
					"ik_max_word_plus": {
						"type": "custom",
						"tokenizer": "ik_max_word",
						"filter": [
							"tsconvert",
							"synonym"
						]
					}
				},
				"filter": {
					"synonym": {
						"type": "synonym",
						"synonyms_path": "zh_synonym.txt"
					},
					"tsconvert": {
						"type": "stconvert",
						"keep_both": false,
						"convert_type": "t2s"
					}
				}
			}
		}
	}
}
```
> `analyzer`: 新資料進入的時候用來進行索引建立與分析，所以使用`ik_max_word`進行比較細的切割

> `search_analyzer`: 搜尋時針對關鍵字進行解析，使用`ik_smart_word`進行粗粒度切割

#### 放一些測試資料
```json
POST foo/bar/1
{
  "title":"電腦內存廠牌如何選購?"
}

POST foo/bar/2
{
  "title":"英雄聯盟記憶體要多大才夠用?"
}

POST foo/bar/3
{
  "title":"三星的记忆体好用?"
}

POST foo/bar/4
{
  "title":"記憶是如何影響人類"
}


POST foo/bar/5
{
  "title":"資訊安全與道德素養"
}

POST foo/bar/6
{
  "title":"中文搜尋優化"
}

```

下Query搜尋
```json
POST foo/_search
{
  "highlight": {
    "pre_tags": ["<b>"], 
    "post_tags": ["</b>"], 
      "fields": {
        "title":{}
    }
  },
  "query": {
    "match": {
      "title": "記憶體"
    }
  }
}
```

搜尋結果
```json
{
  "took" : 21,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 3,
    "max_score" : 0.89138484,
    "hits" : [
      {
        "_index" : "foo",
        "_type" : "bar",
        "_id" : "2",
        "_score" : 0.89138484,
        "_source" : {
          "title" : "英雄聯盟記憶體要多大才夠用?"
        },
        "highlight" : {
          "title" : [
            "英雄聯盟<b>記憶體</b>要多大才夠用?"
          ]
        }
      },
      {
        "_index" : "foo",
        "_type" : "bar",
        "_id" : "1",
        "_score" : 0.4346845,
        "_source" : {
          "title" : "電腦內存廠牌如何選購?"
        },
        "highlight" : {
          "title" : [
            "電腦<b>內存</b>廠牌如何選購?"
          ]
        }
      },
      {
        "_index" : "foo",
        "_type" : "bar",
        "_id" : "3",
        "_score" : 0.41913947,
        "_source" : {
          "title" : "三星的记忆体好用?"
        },
        "highlight" : {
          "title" : [
            "三星的<b>记忆体</b>好用?"
          ]
        }
      }
    ]
  }
}

```

## 後記＆總結
這篇內容來自於最近碰到的某個案子的整理該案使用的ES版本較低(6.8.9)，可能某些語法規則已經棄用了但是思路是相同的，ES的中文搜尋優化其實有非常多的細節與眉角，後續還有Boost (欄位權重, Query Design, Query Operator (and, or) 等參數可以調試，但是基本上只要有正確的設定，檢索結果都能符合預期。