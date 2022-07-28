import React, { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow as codeSyntaxStyle } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { BLOG_NAME } from '../../configs/general'
import { Helmet } from 'react-helmet'
const axios = require('axios');

export default function MdRender({ doc_id }) {
    const [content, setContent] = useState("")
    const [pageTitle,setPageTitle] = useState(BLOG_NAME)
    const [pageDescription , setPageDescription] = useState("")

    useEffect(() => {
        axios.get(`/docs/${doc_id}/document.md`)
            .then((res) => {
                console.log(res.data)
                const gistTitle = res.data.split("\n")[2].replace("# ","")
                const gistContent = res.data
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