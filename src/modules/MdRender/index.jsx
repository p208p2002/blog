import React, { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow as codeSyntaxStyle } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { BLOG_NAME, IMG_FILE_PREFIX, CODE_LAB_PREFIX, GITHUB, GITHUB_USER_CONTENT_PREFIX } from '../../configs/general'
import { Helmet } from 'react-helmet'
import rehypeRaw from 'rehype-raw'
import './index.css'
import LiveCode from "../LiveCode";
import ReactDOM from 'react-dom';
const axios = require('axios');

// https://colab.research.google.com/github/p208p2002/blog/blob/main/public/docs/blog_gpt_gpt2_nlp/document.ipynb
function fixImgLink(content, doc_id) {
    // replace local path written on MD to url (on the media.githubusercontent.com)
    // ![](./ -> ![](https://media.githubusercontent.com/...
    content = content.replace(/!\[.*\]\(\.\//g, `![](${IMG_FILE_PREFIX}/${doc_id}/`)
    return content
}

export default function MdRender({ doc_id }) {
    const [content, setContent] = useState("")
    const [pageTitle, setPageTitle] = useState(BLOG_NAME)
    const [postTitle, setPostTitle] = useState("")
    const [pageDescription, setPageDescription] = useState("")
    const [hasNotebook, setHasNotebook] = useState(false)

    useEffect(() => {
        let supportLangs = ['python']

        let appendNoteBook = (e) => {
            const { anchorNode, anchorNodeOffset, focusNode, focusNodeOffset } = document.getSelection()
            if (anchorNode !== focusNode || anchorNodeOffset !== focusNodeOffset) {
                // do nothing while user selecting text
                return
            }
            let codeLang = 'shell'
            try {
                // detect the lang via markdown syntax (```lang ...)
                codeLang = e.target.parentNode.getElementsByTagName('code')[0].className.split('-')[1]
            }
            catch (e) {
                //pass
            }

            let newNode = document.createElement("pre")
            let codeScript = e.target.parentNode.getElementsByTagName('code')[0].innerText

            if (document.getElementById(codeScript)) {
                // if the block exist alreay, remove first (for reload block)
                document.getElementById(codeScript).remove()
            }

            // while the code lang is support
            if (supportLangs.includes(codeLang)) {
                newNode.id = codeScript
                e.target.parentNode.insertBefore(newNode, e.target.nextSibling.nextSibling)
                ReactDOM.render(<LiveCode script={codeScript} />, newNode)
            }
        }

        let codeBlocks = document.getElementsByTagName('pre')
        for (let i = 0; i < codeBlocks.length; i++) {
            // check a code block is a supported lang
            // if true, shwo the run btn
            let codeBlock = codeBlocks[i]
            let code = codeBlock.getElementsByTagName('code')[0]
            let langStyleClasses = supportLangs.map((lang) => `language-${lang}`)
            let isSupportLang = false
            langStyleClasses.forEach((styleClass) => {
                if (code.classList.contains(styleClass)) {
                    isSupportLang = true
                }
            })
            if (isSupportLang) {
                let runBtn = document.createElement('p')
                runBtn.innerText = 'Run'
                runBtn.classList.add('run-btn')
                runBtn.addEventListener('click', appendNoteBook)
                codeBlock.appendChild(runBtn)
            }

        }
        return () => {
            for (let i = 0; i < codeBlocks.length; i++) {
                let codeBlock = codeBlocks[i]
                codeBlock.removeEventListener('click', appendNoteBook)
            }
        }
    }, [content])

    useEffect(() => {
        axios.get(`/docs/${doc_id}/document.md`)
            .then((res) => {
                const gistTitle = res.data.split("\n")[0].replace("# ", "")
                const gistContent = fixImgLink(res.data, doc_id).replace(`# ${gistTitle}`, "")
                setContent(gistContent)
                setPostTitle(gistTitle)
                setPageTitle(`${gistTitle} - ${BLOG_NAME}`)
                setPageDescription(gistContent.replaceAll("#", " ").slice(0, 500))
            })

        // test notebook exist
        axios.get(`/docs/${doc_id}/document.ipynb`)
            .then(() => {
                setHasNotebook(true)
            })
    }, [])
    return (
        <>
            <Helmet>
                <meta charSet="utf-8" />
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription} />

                {/* Open Graph Metadata */}
                <meta property="og:url" content={window.location.href} />
                <meta property="og:type" content="article" />
                <meta property="og:title" content={postTitle} />
                <meta property="og:description" content={postTitle} />
                {/* Set on public/index.html */}
                {/* <meta property="og:image" content="/og.png" /> */}

            </Helmet>
            <br />
            <h1>{postTitle}</h1>

            <a href={`${GITHUB}/blog/tree/main/public/docs/${doc_id}`} target="_blank" rel="noopener noreferrer">
                <img className="badge" src="https://img.shields.io/badge/github-000?style=for-the-badge&logo=github&logoColor=%23181717&color=gray" alt="" srcSet="" />
            </a>

            <a href={`${GITHUB_USER_CONTENT_PREFIX}/docs/${doc_id}/document.md`}>
                <img className="badge" src="https://img.shields.io/badge/document-000?style=for-the-badge&logo=markdown&color=gray" alt="" srcSet="" />
            </a>

            {hasNotebook ?
                <a href={`${CODE_LAB_PREFIX}/docs/${doc_id}/document.ipynb`} target="_blank" rel="noopener noreferrer">
                    <img className="badge" src="https://img.shields.io/badge/colaboratory-000?style=for-the-badge&logo=googlecolab&logoColor=%23F9AB00&color=gray" alt="" srcSet="" />
                </a>
                :
                <></>
            }

            <div id="MD">
                <ReactMarkdown
                    rehypePlugins={[rehypeRaw]}
                    children={content}
                    components={{
                        code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                                <SyntaxHighlighter
                                    children={String(children).replace(/\n$/, '')}
                                    style={codeSyntaxStyle}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                />
                            ) : (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            )
                        }
                    }}
                />
                <div className="footer w-100 text-center">
                    <small>歡迎打開<a target={'_blank'} href={`${GITHUB}/blog/issues`}> Issues </a>討論問題 \ (•◡•) /</small>
                </div>
            </div>
        </>
    )
}