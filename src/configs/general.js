const { NODE_ENV="development" } = process.env
export const PUBLIC_URL_PREFIX = (process.env.PUBLIC_URL || '').replace(/\/$/, '')
export const publicPath = (path = '') => {
    if (path === '') {
        return PUBLIC_URL_PREFIX || '/'
    }
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${PUBLIC_URL_PREFIX}${normalizedPath}`
}
export const GITHUB_USER = 'p208p2002'
export const OWNER = 'Philip Huang'
export const BLOG_NAME = 'Philip\'s blog'
export const HOME_PAGE = publicPath('/')
export const GITHUB = `https://github.com/${GITHUB_USER}`
export const IMG_FILE_PREFIX = NODE_ENV === "production" ? `https://media.githubusercontent.com/media/${GITHUB_USER}/blog/main/public/docs` : "/docs"
export const POST_PRE_PAGE = 10
export const CODE_LAB_PREFIX = `https://colab.research.google.com/github/${GITHUB_USER}/blog/blob/main/public`
export const GITHUB_USER_CONTENT_PREFIX = `https://raw.githubusercontent.com/${GITHUB_USER}/blog/main/public`
