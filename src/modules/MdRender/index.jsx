import React, { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight as codeSyntaxStyleLight, tomorrow as codeSyntaxStyleDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { BLOG_NAME, IMG_FILE_PREFIX } from '../../configs/general'
import { Helmet } from 'react-helmet'
import rehypeRaw from 'rehype-raw'
import './index.css'
import PyREPL from "../PyREPL";
import ReactDOM from 'react-dom';
import remarkMath from 'remark-math'
import katex from 'katex';
import TOC from '../TableOfContent'
import 'gitalk/dist/gitalk.css'
import Gitalk from 'gitalk'
import Darkmode from 'drkmd-js'
import ExifReader from 'exifreader';
import { siNikon, siLens, siApple } from 'simple-icons'
import { mdTableToHTML } from './md-table-to-html'

const axios = require('axios');

// https://colab.research.google.com/github/p208p2002/blog/blob/main/public/docs/blog_gpt_gpt2_nlp/document.ipynb
function fixImgLink(content, doc_id) {
    // replace local path written on MD to url (on the media.githubusercontent.com)
    // ![](./ -> ![](https://media.githubusercontent.com/...
    content = content.replace(/!\[.*\]\(\.\//g, `![](${IMG_FILE_PREFIX}/${doc_id}/`)
    return content
}

function parseDocumentInfo(documentInfoText) {
    let documentInfo = {}
    let lines = documentInfoText.split("\n")
    lines = lines.slice(1, lines.length - 1)
    lines.forEach((line) => {
        let kv = line.split(":")
        let k = kv[0].replace("-", "").trim()
        let v = kv[1].trim()
        if (k === "tags") {
            v = v.split("#")
            v.shift()
        }
        documentInfo[k] = v
    })
    return documentInfo
}

export default function MdRender({ doc_id }) {
    let dm = new Darkmode()
    const [content, setContent] = useState("")
    const [documentInfo, setDocumentInfo] = useState("")
    const [pageTitle, setPageTitle] = useState(BLOG_NAME)
    const [postTitle, setPostTitle] = useState("")
    const [pageDescription, setPageDescription] = useState("")
    const [codeSyntaxStyle, setCodeSyntaxStyle] = useState(dm.isDark() ? codeSyntaxStyleDark : codeSyntaxStyleLight)

    useEffect(() => {
        // if dom (body) on change, update the state of code syntax style

        // Select the node that will be observed for mutations
        const targetNode = document.getElementsByTagName('body')[0];

        // Options for the observer (which mutations to observe)
        const config = { attributes: true, childList: true, subtree: true };

        // Create an observer instance linked to the callback function
        const observer = new MutationObserver(() => {
            const targetNode = document.getElementsByTagName('body')[0];
            let { className = "theme-light" } = targetNode
            if (className === "theme-dark" && JSON.stringify(codeSyntaxStyleDark) !== JSON.stringify(codeSyntaxStyle)) {
                setCodeSyntaxStyle(codeSyntaxStyleDark)
            }
            if (className === "theme-light" && JSON.stringify(codeSyntaxStyleLight) !== JSON.stringify(codeSyntaxStyle)) {
                setCodeSyntaxStyle(codeSyntaxStyleLight)
            }

        });

        // Start observing the target node for configured mutations
        observer.observe(targetNode, config)

        // eslint-disable-next-line
    }, [codeSyntaxStyle])

    useEffect(() => {
        // scroll into a html-id with hash link
        let pageHash = decodeURI(window.location.hash)
        let targetId = pageHash.replace("#", "")
        setTimeout(() => {
            let targetEle = document.getElementById(targetId)
            if (targetEle !== null) {
                targetEle.scrollIntoView()
            }
        }, 1000);
    }, [])

    useEffect(() => {
        let supportLangs = ['python']

        let appendNoteBook = (e) => {
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
                ReactDOM.render(<PyREPL script={codeScript} />, newNode)
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
                if (code !== undefined && code.classList.contains(styleClass)) {
                    isSupportLang = true
                }
            })
            if (isSupportLang) {
                let runBtn = document.createElement('p')
                runBtn.innerText = 'Run'
                runBtn.classList.add('run-btn')
                runBtn.classList.add('text-sm')
                runBtn.classList.add('mt-2')
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
                let gistContent = fixImgLink(res.data, doc_id).replace(`# ${gistTitle}`, "")
                const documentInfoText = gistContent.match(/<document-info>((.|\n)*)<\/document-info>/)[0]
                gistContent = gistContent.replace(/<document-info>((.|\n)*)<\/document-info>/, "")

                setDocumentInfo(parseDocumentInfo(documentInfoText))
                setContent(gistContent)
                setPostTitle(gistTitle)
                setPageTitle(`${gistTitle} - ${BLOG_NAME}`)
                setPageDescription(gistContent.replaceAll("#", " ").slice(0, 500))
            })
            .catch(() => {
                window.location.href = "/?page=code-404"
            })
        // eslint-disable-next-line
    }, [])

    useEffect(() => {
        if (postTitle !== "") {
            const gitalk = new Gitalk({
                clientID: '1026ba5908c2c038e457',
                clientSecret: 'e89b2d013165eed176f47ba9afa49cf27cd2b63f',
                repo: 'blog',      // The repository of store comments,
                owner: 'p208p2002',
                admin: ['p208p2002'],
                id: doc_id,      // Ensure uniqueness and length less than 50
                distractionFreeMode: false  // Facebook-like distraction free mode
            })
            gitalk.render("comments")
        }
    }, [doc_id, postTitle])

    let { date = "", tags = [] } = documentInfo

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
            <h1 className="post-title text-3xl font-bold mb-3">{postTitle}</h1>
            <div className="document-info">
                <div className="post-date text-zinc-500">
                    日期:&nbsp;{date}
                </div>
                <div className="post-tags text-zinc-500">
                    標籤:&nbsp;
                    {tags.map((tag, i) => {
                        return <span className="post-tag" key={i}>{tag}</span>
                    })}
                </div>

            </div>

            <div id="MD">
                <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeRaw]}
                    // remarkRehypeOptions={{displayMode:true}}
                    children={content}
                    components={{
                        h2({ node, inline, className, children, ...props }) {
                            const eleId = node.children[0].value
                            return <h2
                                id={eleId}
                                className="cursor-pointer"
                                onClick={() => {
                                    window.location.hash = eleId
                                }}
                            >
                                {children}
                            </h2>
                        },
                        h3({ node, inline, className, children, ...props }) {
                            const eleId = node.children[0].value
                            return <h3
                                id={eleId}
                                className="cursor-pointer"
                                onClick={() => {
                                    window.location.hash = eleId
                                }}
                            >
                                {children}
                            </h3>
                        },

                        code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                                <SyntaxHighlighter
                                    key={JSON.stringify(codeSyntaxStyle)}
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
                        },
                        div({ node, inline, className, children, ...props }) {
                            if (className === "math math-display") {
                                let math_tex = children[0] || "";
                                let math_html = katex.renderToString(math_tex, {
                                    throwOnError: false,
                                    // Auto enable display mode while use \tag
                                    displayMode: true
                                });
                                return <div className={className} {...props} dangerouslySetInnerHTML={{ __html: math_html }} />
                            }
                            else {
                                return <div className={className} {...props}>{children}</div>
                            }
                        },
                        p({ node, inline, className, children, ...props }) {
                            if (Array.isArray(children)) {
                                children = children.map((child, childIdx) => {
                                    if (typeof (child) === "string" && child.length > 1 && child[0] === "|") {
                                        return <div className="md-table-container" key={childIdx}
                                            dangerouslySetInnerHTML={{ __html: mdTableToHTML(child).html }}
                                        />
                                    }
                                    return child
                                })
                            }
                            return <p className={className} {...props} >{children}</p>
                        },
                        span({ node, inline, className, children, ...props }) {

                            if (className === "math math-inline") {
                                let math_tex = children[0] || "";
                                let math_html = katex.renderToString(math_tex, {
                                    throwOnError: false,
                                    // Auto enable display mode while use \tag
                                    displayMode: math_tex.match(/\\tag/) ? true : false
                                });
                                return <span className={className} {...props} dangerouslySetInnerHTML={{ __html: math_html }} />
                            }

                            else {
                                return <span className={className} {...props}>{children}</span>
                            }
                        },

                        img({ node, inline, className, children, ...props }) {
                            let img_url = props.src || ""

                            console.log("IMG",img_url)
                            let getExif = async () => {
                                let src = { props }
                                if (src !== undefined) {
                                    const tags = await ExifReader.load(img_url, { async: true });
                                    let Make = tags['Make'].description || undefined
                                    let SVGPath = siLens.path
                                    document.getElementById(img_url + "SVG").style.height = "12px";
                                    if (Make === "NIKON CORPORATION") {
                                        SVGPath = siNikon.path;
                                        document.getElementById(img_url + "SVG").style.height = "32px";
                                    }
                                    else if (Make === "Canon") {
                                        // 
                                    }
                                    else if (Make === "Apple") {
                                        SVGPath = siApple.path;
                                    }
                                    let Model = tags['Model'].description
                                    let FocalLength = tags['FocalLength'].description
                                    let FNumber = tags['FNumber'].description
                                    let ExposureTime = tags['ExposureTime'].description
                                    // set text
                                    document.getElementById(img_url + "SVGPath").setAttribute("d", SVGPath);
                                    document.getElementById(img_url + "Model").innerText = Model
                                    document.getElementById(img_url + "FocalLength").innerText = FocalLength
                                    document.getElementById(img_url + "FNumber").innerText = FNumber
                                    document.getElementById(img_url + "ExposureTime").innerText = ExposureTime
                                }

                            }


                            getExif()
                                .then(() => {
                                    document.getElementById(img_url + "IMG").className += " exif"
                                })
                                .catch(() => {
                                    // image without exif info
                                    let exifText = document.getElementById(img_url + "EXIF-Text")
                                    try {
                                        exifText.parentNode.removeChild(exifText)
                                    } catch (error) {
                                        // pass
                                    }
                                })

                            return <span id={img_url + "IMG"} className="flex flex-col justify-center items-center">
                                <img {...props} alt="">{children}</img>
                                <span id={img_url + "EXIF-Text"} className="exif-text flex flex-row items-center relative w-full justify-start pr-2">
                                    <span className="absolute right-3 flex flex-row items-center">
                                        <svg id={img_url + "SVG"} role="img" viewBox="0 0 24 24">
                                            <path id={img_url + "SVGPath"} d={siLens.path} />
                                        </svg>
                                        <span style={{ fontSize: 'normal' }}>&nbsp;|&nbsp;<span style={{ fontSize: 'italic' }} id={img_url + "Model"} /></span>
                                    </span>
                                    <span className="exif-item" id={img_url + "FocalLength"} />
                                    <span className="exif-item" id={img_url + "FNumber"} />
                                    <span className="exif-item" id={img_url + "ExposureTime"} />
                                </span>
                            </span>
                        }

                    }}
                />

                <div>

                    {/* for comment render */}
                    <br />
                    <div id="comments"></div>

                </div>
            </div>
            <TOC />
        </>
    )
}