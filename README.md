# Trailer [![Build and Deploy](https://github.com/p208p2002/blog/actions/workflows/main.yml/badge.svg)](https://github.com/p208p2002/blog/actions/workflows/main.yml)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54) ![Markdown](https://img.shields.io/badge/markdown-%23000000.svg?style=for-the-badge&logo=markdown&logoColor=white) ![Jupyter Notebook](https://img.shields.io/badge/jupyter-darkorange.svg?style=for-the-badge&logo=jupyter&logoColor=white)


輕量化、無後端的自建落格系統。盡可能地提供舒適的寫作與閱讀體驗。

## 特色
- 沒有繁瑣的設定與編輯器，專注文章寫作與分享
- 支援 MarkDown (.md) 與 Notebook (.ipynb)
- 連結 Google Colab，立即嘗試文章範例
- 簡潔與清晰的頁面設計

## 運作方式
這個部落格利用了GitHub Pages提供的靜態網頁空間，並且搭配GitHub Workflow功能在程式碼變動或文章更新時自動重新部署。

## 功能實現
|功能名稱|狀態|備註|
|---|:---:|---|
MarkDown (.md)|✔️|
NoteBook (.ipynb)|✔️|
GitHub Workflow|✔️|
搜尋、索引與分頁|✔️|
深色主題模式|✔️|
頁面預渲染|❌|
LaTeX 數學式|❌|
非侵入式廣告投放|❌|

## 文件
### 配置
- 部落格設定/變數
    - `src/configs/general.js`
    - `package.json`

### 輔助工具
- build_index.py: 建立網站索引、Sitemap等資訊
- convert_ipynb_to_md.py: 轉換 `.ipynb` -> `.md`
