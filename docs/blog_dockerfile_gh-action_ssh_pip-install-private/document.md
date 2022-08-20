# 在Dockerfile與GitHub Action中安裝私有Python套件

<document-info>
- tags: #dockerfile#gh-action#ssh#pip-install-private
- date: 2021/10/6
</document-info>


對Python有進階認識的可能會知道可以直接從github repo安裝套件，對public repo可以這樣做
```sh
pip install git+https://github.com/USERNAME/REPO.git
```

那如果是一個private repo呢？這時候我們就必須使用ssh來進行身份認證
```sh
pip install git@github.com/username/private_repo.git
```

## 本機環境操作
直接使用上面的指令會發生permission denied；我們需要先產生一組`ssh-key`，並且添加到GitHub帳號中
> https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account

完成後再試一次`$ pip install git@github.com/username/private_repo.git`，這次應該成功安裝了

## Dockerfile設定
首先在`Dockerfile`的首行加入
```dockerfile
# syntax = docker/dockerfile:experimental
```
將`github.com`加入`known_hosts`，然後在需要使用到的地方使用`RUN --mount=type=ssh`
```dockerfile
RUN mkdir -p -m 0600 ~/.ssh && ssh-keyscan github.com >> ~/.ssh/known_hosts
RUN --mount=type=ssh pip install git+ssh://git@github.com/username/private_repo.git
```

最後執行建置指令
```sh=
export DOCKER_BUILDKIT=1
eval `ssh-agent`
ssh-add ~/.ssh/id_rsa # 添加你的私鑰
docker build --ssh default .
```
> `--ssh` 指令會將你本機的ssh設定帶入docker中供建置使用
> https://medium.com/@tonistiigi/build-secrets-and-ssh-forwarding-in-docker-18-09-ae8161d066

## GitHub Action設定
GitHub Action提供免費的運算資源，有時候我會用它來幫我建置docker image，而剛好我最近的案子需要存取並安裝在GitHub上的私有python package

這邊的重點是使用`webfactory/ssh-agent@v0.5.3`幫助我們存取`ssh-agent`
> 由於GitHub Action的架構設計，會導致無法直接存取到`ssh-agent`，進而導致`--ssh`的失效

下面提供一個範本，這個範本會固定在每天00:00(UTC+8)自動執行；首先通過`actions/checkout@v2`遷入專案，接著使用`webfactory/ssh-agent@v0.5.3`設定ssh，最後建置並且推送到Docker Hub

```yaml=
name: Auto-Build
on:
  push:
    branches:
      - master
  schedule:
    - cron: '0 16 * * *'

jobs:
  build:
    runs-on: ubuntu-latest

    # Steps represent a sequence of tasks that will be executed as part of the job
    steps:
      # Checks-out your repository under $GITHUB_WORKSPACE, so your job can access it
      - uses: actions/checkout@v2
      - name: Docker login
        uses: azure/docker-login@v1
        with:
          username: DOCKER_HUB_USER
          password: ${{ secrets.DOCKER_HUB_PWD }}
      - uses: webfactory/ssh-agent@v0.5.3
        with:
          ssh-private-key: ${{ secrets.SSH_KEY }}
      - name: Build
        run: export DOCKER_BUILDKIT=1 && docker build --ssh default=$SSH_AUTH_SOCK -t=DOCKER_HUB_USER/REPO_NAME:nightly .
      - name: Push Nightly
        run: docker push DOCKER_HUB_USER/REPO_NAME:nightly
      - name: Get current date
        id: date
        run: echo "::set-output name=date::$(date +'%Y%m%d')"
      - name: Push Build
        run: |
          docker tag DOCKER_HUB_USER/REPO_NAME:nightly DOCKER_HUB_USER/REPO_NAME:${{ steps.date.outputs.date }}
          docker push DOCKER_HUB_USER/REPO_NAME:${{ steps.date.outputs.date }}
```