# Scooter
Scooter is my own blog system, it's a pure, lightweight and serverless blog system based on Gist.

It designed for focusing on writing the blog post, that's all.

Scooter是我為這個部落格系統取的名字，它輕量化、無後台並且依賴Gist。

它被設計用來專注在寫作，僅此而已。

## Features
- Focusing on writing post
- Support Markdown (.md) and Notebook (.ipynb)
- Clean style and simple usage


## How it wroks?
We use gist api to fetch user's public gist, than filter with some rule that help you ignore what you don't want to display.

## Documentation
### Configure your own Scooter
1. Fork this repo
2. Edit configs to yours:
    - `src/configs/general.js`
    - `homepage` in `package.json` to yours `gh-pages` url
3. Add `ACCESS_TOKEN` in repo `secrets` *
4. Push to GitHub

> \* [Creating a personal access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token)

> \* [Encrypted secrets](https://docs.github.com/en/actions/reference/encrypted-secrets)

> Via github workflows every times you push, the site will rebuld and deploy.

### Write a Post
1. Create a `Public Gist`
2. Ensure Filename with supported extention name
    > Defaults to: `.md`,`.ipynb`  
3. Add some hash tag to `Gist description`
    > At least include `#blog`


