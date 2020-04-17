---
title: 為Hexo設置GitHub Actions
date: 2020-04-17 14:03:28
tags:
    - hexo
    - github-action
---
### 為什麼我們需要幫Hexo配置GitHub Action?
設置好Github Action後我們就不在需要使用`$ hexo generate`命令來在本機產生靜態檔案，而是交由GitHub Action來做這件事。

你甚至不需要在本機安裝任何環境(包括nodejs)，並且可以更專注的在寫文章這件事；通過設置，在有新的push進來後，GitHub Action會自動執行，接下來自動進行build hexo與部屬git page等動作。

## 來動手設置吧
### _config.yml
首先確保你的url部分已經在`_config.yml`正確的設定了，詳細的做法可以參考[官方文檔](https://hexo.io/zh-tw/docs/configuration)

而我的部落格是這樣設定的
```yaml
# URL
## If your site is put in a subdirectory, set url as 'http://yoursite.com/child' and root as '/child/'
url: https://p208p2002.github.io/blog/
root: /blog/
permalink: :year/:month/:day/:title/
permalink_defaults:
pretty_urls:
  trailing_index: true # Set to false to remove trailing 'index.html' from permalinks
  trailing_html: true # Set to false to remove trailing '.html' from permalinks
```

### package.json
`$ hexo generate`預設產出的資料是`public`但是這樣做會在自動部屬的時候遇到一些問題，因此修改一下腳本，使得產出資料夾重新命名為`build`
```json
"scripts": {
    "build": "hexo generate&&mv public build",
```
修改後我們也將使用`$ npm run build`取代`$ hexo generate`

### 設定ACCESS_TOKEN
接下來的操作需要一些Repo的存取權限，因此需要做ACCESS_TOKEN設定

前往 **Setting > Developer settings > generate new token** 然後將repo選項全勾選
![](https://i.imgur.com/Hun6Vtm.png)

前往你的 **blog repo > settings > secrets**
將剛剛的token貼入，並取名`ACCESS_TOKEN`

### 配置GitHub Actions
在你的專案資料夾新增資料夾與檔案，結構如下:
```
.github/
    - main.yml
```
然後編輯`main.yml`
```yaml
name: Build and Deploy
on:
  push:
    branches:
      - master
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Build 🔧
        uses: actions/checkout@v2 # If you're using actions/checkout@v2 you must set persist-credentials to false in most cases for the deployment to work correctly.
      - uses: actions/setup-node@v1
        with:
          node-version: '10.x'
      - run: |
          npm install -g hexo-cli
          npm install
          npm run build

      - name: Deploy 🚀
        uses: JamesIves/github-pages-deploy-action@releases/v3
        with:
          ACCESS_TOKEN: ${{ secrets.ACCESS_TOKEN }}
          BRANCH: gh-pages # The branch the action should deploy to.
          FOLDER: build # The folder the action should deploy.
```

### Push
```
$ git push
```
到這邊就完成所有設定並且觸發GitHub Action了😉
你可以在你的Repo中的Action標籤看見目前Build與部屬的狀況
等到部屬完畢就可以在[https://USERNAME.github.io/REPO/](https://USERNAME.github.io/REPO/)看到你的部落格