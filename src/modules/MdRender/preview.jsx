import React, { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow as codeSyntaxStyle } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './preview.css'
const axios = require('axios');

export default function MdRender({ file_link, maxLine=20 }) {
    const [content, setContent] = useState("")
    useEffect(() => {
        axios.get(file_link)
            .then((res) => {
                const gistContent = res.data.split("\n").slice(2,maxLine).join("\n")

                setContent(gistContent)
            })
    }, [])
    return (
        <div className="md-preview">
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
        </div>
    )
}