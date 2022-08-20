# Documentation
## Configuration
1. Clone from Repo
2. Edit configs:
    - `src/configs/general.js`
    - `homepage` in `package.json` to yours `gh-pages` url
3. Add `ACCESS_TOKEN` in repo `secrets` *
4. Push to GitHub

> \* [Creating a personal access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token)

> \* [Encrypted secrets](https://docs.github.com/en/actions/reference/encrypted-secrets)

> Via github workflows every times you push, the site will rebuld and deploy.

## Script Tools
- build_index.py
- convert_ipynb_to_md.py
