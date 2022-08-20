import React, { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow as codeSyntaxStyle } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { BLOG_NAME, IMG_FILE_PREFIX, CODE_LAB_PREFIX, GITHUB } from '../../configs/general'
import { Helmet } from 'react-helmet'
import rehypeRaw from 'rehype-raw'

import './index.css'
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
            </Helmet>
            <br />
            <h1>{postTitle}</h1>

            <a href={`${GITHUB}/blog/tree/main/public/docs/${doc_id}`} target="_blank" rel="noopener noreferrer">
                <img className="badge" src="https://img.shields.io/badge/github-000?style=for-the-badge&logo=github&logoColor=%23181717&color=gray" alt="" srcSet="" />
            </a>

            <a href={`/docs/${doc_id}/document.md`}>
                <img className="badge" src="https://img.shields.io/badge/document-000?style=for-the-badge&logo=markdown&color=gray" alt="" srcSet="" />
            </a>

            {hasNotebook ?
                <a href={`${CODE_LAB_PREFIX}/${doc_id}/document.ipynb`} target="_blank" rel="noopener noreferrer">
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