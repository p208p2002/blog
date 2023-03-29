import React, { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow as codeSyntaxStyle } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './preview.css'
import rehypeRaw from 'rehype-raw'

const axios = require('axios');

export default function MdRender({ file_link, maxLine = 20 }) {
    const [content, setContent] = useState("")
    const [loading, setLoading] = useState(false)
    useEffect(() => {
        setLoading(true)
        axios.get(file_link)
            .then((res) => {
                const gistContent = res.data.split("\n").slice(1, maxLine).join("\n") // remove title
                setContent(gistContent)
            })
            .finally(() => {
                setLoading(false)
            })
    }, [])
    return (
        <div id="MD-Preview" className="md-preview">
            {loading === true ? (
                <div className="w-100 text-center">
                <div className="loading">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    
                </div>
                <p className="pt-6">Loading...</p>
                </div>
            ) : (
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
            )}
        </div>
    )
}