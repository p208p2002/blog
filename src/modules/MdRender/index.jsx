import React, { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow as codeSyntaxStyle } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { BLOG_NAME,IMG_FILE_PREFIX } from '../../configs/general'
import { Helmet } from 'react-helmet'
const axios = require('axios');


function fixImgLink(content,doc_id){
    // replace local path written on MD to url (on the media.githubusercontent.com)
    // ![](./ -> ![](https://media.githubusercontent.com/...
    content = content.replace(/!\[.*\]\(\.\//g,`![](${IMG_FILE_PREFIX}/${doc_id}/`)
    return content
}

export default function MdRender({ doc_id }) {
    const [content, setContent] = useState("")
    const [pageTitle,setPageTitle] = useState(BLOG_NAME)
    const [pageDescription , setPageDescription] = useState("")

    useEffect(() => {
        axios.get(`/docs/${doc_id}/document.md`)
            .then((res) => {
                const gistTitle = res.data.split("\n")[2].replace("# ","")
                const gistContent = fixImgLink(res.data,doc_id)
                setContent(gistContent)
                setPageTitle(`${gistTitle} - ${BLOG_NAME}`)
                setPageDescription(gistContent.replaceAll("#"," ").slice(0,500))
            })
    }, [])
    return (
        <>
            <Helmet>
                <meta charSet="utf-8" />
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription}/>
            </Helmet>
            <ReactMarkdown
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
        </>
    )
}