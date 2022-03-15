import React, { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow as codeSyntaxStyle } from 'react-syntax-highlighter/dist/esm/styles/prism'
const axios = require('axios');

export default function MdRender({ md_url }) {

    const [context, setContext] = useState("")
    useEffect(() => {
        axios.get(md_url)
            .then((res) => {
                // console.log(res.data)
                setContext(res.data)
            })
    }, [])
    return (
        <ReactMarkdown
            children={context}
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