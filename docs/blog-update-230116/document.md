# 透過瀏覽器執行 Python 程式碼

<document-info>
- tags: #webassembley#pyodide#blog-update
- date: 2023/01/16
</document-info>

能夠直接在範例程式下方直接測試是一件很酷的事情

但是要達項功能，通常需要有一個後端來支持，除了安全性需要考慮外，對於像我這種`Serverless`類型的部落格或網頁可能就遺憾了。

不過現在可以藉由`WebAssembly`技術來達到在瀏覽器中運行`Javasctipt`以外的語言，例如下面是一段 `Python` script

> WebAssembly或稱wasm是一個低階程式語言。WebAssembly是可攜式的抽象語法樹，被設計來提供比JavaScript更快速的編譯及執行。WebAssembly將讓開發者能運用自己熟悉的程式語言編譯，再藉虛擬機器引擎在瀏覽器內執行 - [wikipedia.org](https://zh.wikipedia.org/zh-tw/WebAssembly)

```python
import sys
sys.version
```
> 點選程式碼區塊右上角的`Run`來試試看，這段程式碼會直接在你的瀏覽器執行

實際上這項功能是我透過了 `Pyodide` 這項專案達成的
> Pyodide is a port of CPython to WebAssembly/Emscripten. [pyodide.org](https://pyodide.org/en/stable/)

`Pyodide`能支援`numpy, pandas`等套件，應該足夠覆蓋我大部分的使用情境

```python
import numpy as np
import pandas as pd
s = pd.Series([1, 3, np.nan, 7]).to_numpy()
s
```
> 可以直接在輸入框中接續範例繼續使用，很實用:D

就連 [Matplotlib 也能夠使用](https://blog.pyodide.org/posts/canvas-renderer-matplotlib-in-pyodide/)！
