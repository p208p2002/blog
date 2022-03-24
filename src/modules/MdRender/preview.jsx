import React, { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow as codeSyntaxStyle } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './preview.css'
const axios = require('axios');

export default function MdRender({ gistId, maxLine=20 }) {
    const [content, setContent] = useState("")
    useEffect(() => {
        axios.get(`https://api.github.com/gists/${gistId}`)
            .then((res) => {
                console.log(res.data)
                const gistData = res.data
                const gistTitle = Object.keys(gistData.files)[0]
                const gistContent = gistData.files[gistTitle].content.split("\n").slice(0,maxLine).join("\n")

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