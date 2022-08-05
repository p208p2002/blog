# Trailer [![Build and Deploy](https://github.com/p208p2002/blog/actions/workflows/main.yml/badge.svg)](https://github.com/p208p2002/blog/actions/workflows/main.yml)
Trailer是我為這個部落格系統取的名字，它輕量化且無後端，依賴 Github Pages 運作。
> Trailer (拖車) 本身並沒有任何動力，通常附掛於汽車之後用以裝載一些物品

它被設計用來專注在寫作，僅此而已。

Trailer is the name of my blog system, which is lightweight and serverless.
> Trailer: a wheeled vehicle that can be pulled by a car or truck.

This blog system is designed for focusing on writing

## Features
- Focusing on writing post
- Support Markdown (.md) and Notebook (.ipynb)
- Clean style and easy to use

## Documentation
### Configuration
1. Clone from Repo
2. Edit configs:
    - `src/configs/general.js`
    - `homepage` in `package.json` to yours `gh-pages` url
3. Add `ACCESS_TOKEN` in repo `secrets` *
4. Push to GitHub

> \* [Creating a personal access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token)

> \* [Encrypted secrets](https://docs.github.com/en/actions/reference/encrypted-secrets)

> Via github workflows every times you push, the site will rebuld and deploy.

### Script Tools
- build_index.py
- convert_ipynb_to_md.py
