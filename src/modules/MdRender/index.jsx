import React, { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow as codeSyntaxStyle } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { BLOG_NAME } from '../../configs/general'
const axios = require('axios');

export default function MdRender({ gistId }) {
    const [content, setContent] = useState("")
    useEffect(() => {
        axios.get(`https://api.github.com/gists/${gistId}`)
            .then((res) => {
                console.log(res.data)
                const gistData = res.data
                const gistTitle = Object.keys(gistData.files)[0]
                const gistContent = gistData.files[gistTitle].content
                setContent(gistContent)
                document.title = `${BLOG_NAME} - ${gistTitle}`
            })
    }, [])
    return (
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
    )
}