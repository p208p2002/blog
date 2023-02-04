# 好用資料標記工具 Label Studio

<document-info>
- tags: #label-studo#資料標記
- date: 2023/02/04
</document-info>

前陣子逛GitHub的時候偶然發現一個非常強大的資料標記工具 - Label Studio，號稱支援標記各式的資料類型

![](./annotation_examples.gif)

讓我想到之前實習的時候也曾經為了標注 Question Answer (QA) 資料特別開發了一款標註工具

由於QA資料需要儲存答案在文本中的位置，需要在標註工具上下點花點功夫才能讓標註者使用；畢竟讓人來計算答案位置實在太殘忍😆

而當時還有一個想法是想要作成通用的文字標記工具，但最後因為技術與時間上的限制而作罷，只為了特定任務而設計：

![](https://raw.githubusercontent.com/p208p2002/itri-law-tagger/master/demo.gif)
> 自製的法律判決書標記工具

要維護或是開發這樣的一個標註工具實在是不簡單。現在有 Label Studio 實在是超級方便

## 安裝
安裝上也非常簡單，可以透過 Docker 或是 pip，我自己測試兩種安裝方式都非常順利。
### Dokcer
```bash
docker pull heartexlabs/label-studio:latest
docker run -it -p 8080:8080 -v $(pwd)/mydata:/label-studio/data heartexlabs/label-studio:latest
```
> `-v $(pwd)/mydata:/label-studio/` 這個參數可能無法用在windows
### Pip
```bash
# Requires Python >=3.7 <=3.9
pip install label-studio

# Start the server at http://localhost:8080
label-studio
```
或是看一下官方文檔的[安裝說明](https://github.com/heartexlabs/label-studio/#try-out-label-studio)會更好

## 任務設定
官方支援的類型非常豐富

![](./templates-categories.jpg)

這次我需要進行一個要簡單的文本分類標註任務

### 資料上傳
![](./upload.png)

上傳的資料格式大致如下，我已經先分配每一筆資料由誰來標記

![](./file_csv.png)

### 任務選擇
選擇並且建立新的文本分類任務

![](./new_task.png)


### 界面設定
這是 Label Studio 另外一個強大的地方，連標註工具都可以高度客製化

![](./create_ui.png)

在 "Configure data" 中的 "Use Text from"，設定成 "\<set manually\>" 然後填入 "$sent" (對應csv 欄位，這只是一個 Placeholder) 

設定好之後才會標註的時候正確帶出句子

### 高度客製化界面(選項)
切換到 "Code" 也可以透過XML客製化界面

可用元件與用法還請參閱[官方文件](https://labelstud.io/guide/setup.html)

我個人感覺這語法非常像 React JSX，若是接觸過的人應該會更容易設定
```html
<View>
  <Text name="text" value="$sent"/>
  <View style="box-shadow: 2px 2px 5px #999;                padding: 20px; margin-top: 2em;                border-radius: 5px;">
    <Header value="Choose text sentiment"/>
    <Choices name="sentiment" toName="text" choice="single" showInLine="true">
    <Choice value="正確"/><Choice value="錯誤"/><Choice value="無法判斷"/></Choices>
  </View>
</View><!-- {
  "data": {"text": "This is a great 3D movie that delivers everything almost right in your face."}
} -->
```

## 資料標註
由於我使用的是社群版本 (Community Edition) 所以無法直接將資料分配給特定使用者標註，大家看到的會是一個共同的 Pool

![](./use.png)

這時候拿出前面設定的assign欄位來輔助我們分配資料給使用者

點選最上面的"+"建立兩個新的Tab；第一個設定"user1"，第二個設定"user"

![](./filter_user.png)

讓user標註的時候進入自己的 Tab，就會看到被分配的內容

接著點選 Label Task As Displayed 就可以開始標記了 !

![](./start_label.png)

> 可能是Bug, v1.7.1 一次性句選所有 ID 後 再按下藍色"Label n Task"會標註Pool裡面所有任務，不符合預期動作。

這邊的操作稍微不人性化一點，不知道是不是為了付費版的考量，如果沒有依循前述操作就不會進入標註隊列，也就不會自動在送出後取得下一題。

## 檢驗標註資料
如果要直接檢視標註資料我們一樣先建立Tab，然後建立Filter

例如說我要檢驗那些被標記成"無法判斷"的資料

由於 Label Studio 處理資料的方式我們需要先將 "無法判斷" 轉換成 Unicode
```
\u7121\u6cd5\u5224\u65b7
```

增加一個 Filter: Annotation results > contains, 然後貼上`\u7121\u6cd5\u5224\u65b7`

就會是我們期望的結果了🤗

![](./ann_review.png)
