# 回顧2022最佳開發工具

<document-info>
- tags: #tools#Tailwindcss#Mobx#Gradio#Poetry#Pytorch-Lightning
- date: 2022/12/08
</document-info>

1. [Tailwindcss](https://tailwindcss.com)
一個非常靈活的`css`框架，過往我都使用 Bootstrap 較多，不過 Bootstrap 的美術風格比較不討我喜歡，雖較好上手但在小地方感覺不夠靈活。相比 tailwindcss 大量對`css`常用的屬性與設定進行封裝，在設計元件的時候就無須來回切換`html`與`css`非常能夠保持高校專注。缺點大概就是元件的`class`可讀性變差，但由於我多數時候配合使用 React 使用所以這點影響不大。

2. [Mobx](https://mobx.js.org)
React 很強大也很好用，除了元件資料共享:<。之前使用都使用 redux 作為狀態管理，但每一次設定都痛苦一次，然後回想使用方法再痛苦第二次，編寫模板痛苦第三次，實在是受不了啦。Mobx 簡單、直覺和快速；甚至允許你略過`action`直接對`store`的變數賦值；例如：`store.count+=1`(雖然這不是推薦的用法)，完全解決跨元件傳值的瑣事。

3. [Gradio](https://gradio.app/) / [Hugging Face Space](https://huggingface.co/spaces)
可以用 Python 快速建立展示內容的框架，包含許多實用的組件。實務上偶爾需要對訓練好的模型進行一些 `demo` 展示。就算不會寫網頁要搭一個demo也不過就分分鐘的事情，非常輕鬆愜意，並且還可以推到 Hugging Face Space，跟大家分享；例如我碩論的[題組生成器]。(https://huggingface.co/spaces/p208p2002/Question-Group-Generator)。


4. [Poetry](https://python-poetry.org/)
js 有 npm, python呢？ 是應該要來試試看poetry，不要再手動維護`requirements.txt`了，整合`venv`搭配`pyenv`切換版本、管理專案環境非常方便。

5. [Pytorch Lightning](https://www.pytorchlightning.ai/)
只要有用PyTorch，我都會推坑一下；快速組織新的ML/DL專案，強大卻又不失彈性，還可以減少重複造輪；抽離Training Loop，專注在核心邏輯的實現與各種開箱即用的功能。直接讓重頭建立專案的時間少去一半以上，而且架構邏輯更清晰。