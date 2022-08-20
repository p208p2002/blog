# Docker多階段建構

<document-info>
- tags: #docker#ssh#docker-multi-stage-build
- date: 2022/03/14
</document-info>

最近剛好有一個專案在建構的時候需要存取多個私有庫，然而直接把 ssh key 帶入映像檔中會有安全性疑慮，同時也要避免 ssh key 出現在 image layer 中，這時候可以借助 multi-stage build 來達到要求。

### Dockerfile撰寫
用語法`From foo as bar`來幫映像檔取小名
> `FROM python:3.8 as build-system`

並且可以在一同個 Dockerfile 內建置暫存映像檔，我們可以在這個階段進行ssh操作，最終這個image會被銷毀
> `FROM build-system as intermediate`

最後回到一開始的image，並且把暫存映像檔中的檔案複製回主要的image
> `FROM build-system as runtime`
> `COPY --from=intermediate /server /server`

完整的範例如下：
```dockerfile
FROM python:3.8 as build-system
COPY . /server
WORKDIR /server
RUN apt-get update && apt-get install -y wget
RUN pip install poetry && poetry config virtualenvs.in-project true

### create temporary image used to download and vendor packages using private key ###
FROM build-system as intermediate

# add credentials on build
ARG SSH_PRIVATE_KEY
RUN mkdir /root/.ssh/
RUN echo "${SSH_PRIVATE_KEY}" > /root/.ssh/id_rsa
RUN chmod 600 /root/.ssh/*
RUN ssh-keyscan github.com >> /root/.ssh/known_hosts
RUN ssh-keyscan gitlab.itriicle.tw >> /root/.ssh/known_hosts

# install pkg
RUN poetry install

### create the runtime image ###
FROM build-system as runtime
COPY --from=intermediate /server /server
WORKDIR /server
CMD sh start_server.sh || bash
```
### 建置映像檔
```sh
export SSH_PRIVATE_KEY=`cat ~/.ssh/id_rsa`
docker build --build-arg SSH_PRIVATE_KEY="${SSH_PRIVATE_KEY}"
```

### 參考
1. https://docs.docker.com/develop/develop-images/multistage-build/
2. https://gist.github.com/innovia/550afe53c0f1098f2b363e522ea72507