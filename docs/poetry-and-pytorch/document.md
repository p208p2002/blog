# Poetry 與 PyTorch 依賴解決方案

<document-info>
- tags: #peotry#pytorch
- date: 2022/09/26
</document-info>

Poetry 是一個強大的 Python 套件管理工具，不過目前對於一些特殊需求的安裝，如 PyTorch 就顯得比較棘手，目前嘗試過`group`或是`source`等選項都沒辦法滿足我需要在多個不同硬體或作業系統 (x86,arm,cuda,linux,macos) 上建立環境的需求。

由於諸多限制與原因，PyTorch 團隊有自己的 Pacakge Repository，上面包含了許多發行版本，開發者需要自行根據硬體環境選擇適合的發行版。 

[<i> pmeier/light-the-torch </i>](https://github.com/pmeier/light-the-torch) 這個專案能幫助我們解決硬體與作業系統選擇問題並且安裝 PyTorch。

最後再透過額外的 Poetry Task Runner [<i>nat-n/poethepoet</i>](https://github.com/nat-n/poethepoet) 整合在poetry中

```text
[tool.poetry.dependencies]
torch = "*"
poethepoet = "*"

[tool.poe.tasks]
install-ltt = "python3 -m pip install light-the-torch"
run-ltt = "python3 -m light_the_torch install --upgrade torch torchaudio torchvision"
autoinstall-torch-cuda = ["install-ltt", "run-ltt"]
```

安裝環境

```bash
$ poetry install
$ poetry run poe autoinstall-torch-cuda
```

這是截止至目前找到最滿意的方案
> 搬運至: https://github.com/python-poetry/poetry/issues/4231#issuecomment-1182766775
