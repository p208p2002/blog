// eslint-disable-next-line
import React, { useEffect, useState, useRef, useCallback } from "react";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight as codeSyntaxStyleLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { BLOG_NAME, IMG_FILE_PREFIX } from '../../configs/general';
import { Helmet } from 'react-helmet';
import rehypeRaw from 'rehype-raw';
import './index.css';
import PyREPL from "../PyREPL";
import ReactDOM from 'react-dom';
import remarkMath from 'remark-math';
import katex from 'katex';
import TOC from '../TableOfContent';
import 'gitalk/dist/gitalk.css';
import Gitalk from 'gitalk';
import ExifReader from 'exifreader';
import { siNikon, siLens, siApple } from 'simple-icons';
import { mdTableToHTML } from './md-table-to-html';
const axios = require('axios');

// 工具函式
function fixImgLink(content, doc_id) {
    return content.replace(/!\[.*\]\(\.\//g, `![](${IMG_FILE_PREFIX}/${doc_id}/`);
}
function parseDocumentInfo(documentInfoText) {
    let documentInfo = {};
    let lines = documentInfoText.split("\n").slice(1, -1);
    lines.forEach((line) => {
        let kv = line.split(":");
        let k = kv[0].replace("-", "").trim();
        let v = kv[1].trim();
        if (k === "tags") {
            v = v.split("#");
            v.shift();
        }
        documentInfo[k] = v;
    });
    return documentInfo;
}


// 子元件：評論區
function CommentSection({ doc_id, postTitle }) {
    useEffect(() => {
        if (postTitle) {
            const gitalk = new Gitalk({
                clientID: '1026ba5908c2c038e457',
                clientSecret: 'e89b2d013165eed176f47ba9afa49cf27cd2b63f',
                repo: 'blog',
                owner: 'p208p2002',
                admin: ['p208p2002'],
                id: doc_id,
                distractionFreeMode: false
            });
            gitalk.render("comments");
        }
    }, [doc_id, postTitle]);
    return <div id="comments"></div>;
}

// 子元件：EXIF 圖片
function ExifImage({ src, ...props }) {
    const [exif, setExif] = useState(null);
    useEffect(() => {
        let isMounted = true;
        ExifReader.load(src, { async: true })
            .then(tags => {
                if (!isMounted) return;
                let Make = tags['Make']?.description;
                let Model = tags['Model']?.description;
                let FocalLength = tags['FocalLength']?.description;
                let FNumber = tags['FNumber']?.description;
                let ExposureTime = tags['ExposureTime']?.description;
                let SVGPath = siLens.path;
                if (Make === "NIKON CORPORATION") SVGPath = siNikon.path;
                else if (Make === "Apple") SVGPath = siApple.path;
                setExif({ SVGPath, Model, FocalLength, FNumber, ExposureTime });
            })
            .catch(() => setExif(null));
        return () => { isMounted = false; };
    }, [src]);
    return (
        <span className="flex flex-col justify-center items-center">
            <img src={src} {...props} alt="" />
            {exif && (
                <span className="exif-text flex flex-row items-center relative w-full justify-start pr-2">
                    <span className="absolute right-3 flex flex-row items-center">
                        <svg role="img" viewBox="0 0 24 24" style={{ height: exif.SVGPath === siNikon.path ? '32px' : '12px' }}>
                            <path d={exif.SVGPath} />
                        </svg>
                        <span style={{ fontSize: 'normal' }}>&nbsp;|&nbsp;<span style={{ fontSize: 'italic' }}>{exif.Model}</span></span>
                    </span>
                    <span className="exif-item">{exif.FocalLength}</span>
                    <span className="exif-item">{exif.FNumber}</span>
                    <span className="exif-item">{exif.ExposureTime}</span>
                </span>
            )}
        </span>
    );
}

// 子元件：Markdown 渲染
function MarkdownRenderer({ content, codeSyntaxStyle }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeRaw]}
            components={{
                h2({ node, children, ...props }) {
                    const eleId = node.children[0]?.value;
                    return <h2 id={eleId} className="cursor-pointer" onClick={() => { window.location.hash = eleId; }}>{children}</h2>;
                },
                h3({ node, children, ...props }) {
                    const eleId = node.children[0]?.value;
                    return <h3 id={eleId} className="cursor-pointer" onClick={() => { window.location.hash = eleId; }}>{children}</h3>;
                },
                code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
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
                        <code className={className} {...props}>{children}</code>
                    );
                },
                div({ className, children, ...props }) {
                    if (className === "math math-display") {
                        let math_tex = children[0] || "";
                        let math_html = katex.renderToString(math_tex, { throwOnError: false, displayMode: true });
                        return <div className={className} {...props} dangerouslySetInnerHTML={{ __html: math_html }} />;
                    }
                    return <div className={className} {...props}>{children}</div>;
                },
                p({ className, children, ...props }) {
                    if (Array.isArray(children)) {
                        children = children.map((child, childIdx) => {
                            if (typeof (child) === "string" && child.length > 1 && child[0] === "|") {
                                return <div className="md-table-container" key={childIdx} dangerouslySetInnerHTML={{ __html: mdTableToHTML(child).html }} />;
                            }
                            return child;
                        });
                    }
                    return <p className={className} {...props}>{children}</p>;
                },
                span({ className, children, ...props }) {
                    if (className === "math math-inline") {
                        let math_tex = children[0] || "";
                        let math_html = katex.renderToString(math_tex, { throwOnError: false, displayMode: math_tex.match(/\\tag/) ? true : false });
                        return <span className={className} {...props} dangerouslySetInnerHTML={{ __html: math_html }} />;
                    }
                    return <span className={className} {...props}>{children}</span>;
                },
                img({ src, ...props }) {
                    return <ExifImage src={src} {...props} />;
                }
            }}
        >
            {content}
        </ReactMarkdown>
    );
}

// 自訂 hook：同步滾動
function useSyncScroll(editorRef, renderRef) {
    useEffect(() => {
        if (!editorRef.current || !renderRef.current) return;
        const editor = editorRef.current;
        const render = renderRef.current;
        const onScroll = (e) => {
            console.log("editor scroll", e.target.scrollTop, editor.scrollHeight);

            console.log(render.scrollTop + render.clientHeight, render.scrollHeight);
            let progressRatio1 = editor.scrollTop / editor.scrollHeight;
            let progressRatio2 = (editor.scrollTop + editor.clientHeight) / editor.scrollHeight
            let progressRatio = 0

            if (progressRatio1 < 0.6) {
                progressRatio = Math.min(progressRatio1, progressRatio2);
            }
            else {
                progressRatio = Math.max(progressRatio1, progressRatio2);
            }

            render.scrollTop = parseInt(progressRatio * render.scrollHeight);
        };
        editor.addEventListener("scroll", onScroll);
        return () => editor.removeEventListener("scroll", onScroll);
    }, [editorRef, renderRef]);
}

// 新增 PostContent 元件，統一渲染標題、日期、標籤、Markdown
function PostContent({ postTitle, date, tags, content, codeSyntaxStyle, renderContainerRef }) {
    return (
        <div id="Render" ref={renderContainerRef} className="overflow-y-auto h-full max-h-full">
            <h1 className="post-title text-4xl font-extrabold mb-4 text-zinc-800 tracking-tight leading-tight border-b border-zinc-200 pb-2">
                {postTitle}
            </h1>
            <div className="document-info flex flex-row items-center gap-6 mb-6 text-sm">
                <div className="post-date text-zinc-500 flex items-center gap-1">
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    日期:&nbsp;{date}
                </div>
                <div className="post-tags text-zinc-500 flex items-center gap-1">
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 11h10M7 15h10" /></svg>
                    標籤:&nbsp;
                    {tags.map((tag, i) => (
                        <span
                            className="post-tag bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mx-1 text-xs font-semibold shadow"
                            key={i}
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>
            <div id="MD" className="prose prose-zinc max-w-none">
                <MarkdownRenderer content={content} codeSyntaxStyle={codeSyntaxStyle} />
            </div>
        </div>
    );
}

// 主元件
export default function MdRender({ doc_id, mode = "edit" }) {
    const [content, setContent] = useState("");
    const [documentInfo, setDocumentInfo] = useState({});
    const [pageTitle, setPageTitle] = useState(BLOG_NAME);
    const [postTitle, setPostTitle] = useState("");
    const [pageDescription, setPageDescription] = useState("");
    const [codeSyntaxStyle] = useState(codeSyntaxStyleLight);
    const editorTextAreaRef = useRef();
    const renderContainerRef = useRef();

    useSyncScroll(editorTextAreaRef, renderContainerRef);

    // 取得文章內容
    useEffect(() => {
        axios.get(`/docs/${doc_id}/document.md`)
            .then((res) => {
                const gistTitle = res.data.split("\n")[0].replace("# ", "");
                let gistContent = fixImgLink(res.data, doc_id).replace(`# ${gistTitle}`, "");
                const documentInfoText = gistContent.match(/<document-info>((.|\n)*)<\/document-info>/)[0];
                gistContent = gistContent.replace(/<document-info>((.|\n)*)<\/document-info>/, "");
                setDocumentInfo(parseDocumentInfo(documentInfoText));
                setContent(gistContent);
                setPostTitle(gistTitle);
                setPageTitle(`${gistTitle} - ${BLOG_NAME}`);
                setPageDescription(gistContent.replaceAll("#", " ").slice(0, 500));
            })
            .catch(() => {
                window.location.href = "/?page=code-404";
            });
    }, [doc_id]);

    // hash 滾動
    useEffect(() => {
        let pageHash = decodeURI(window.location.hash);
        let targetId = pageHash.replace("#", "");
        setTimeout(() => {
            let targetEle = document.getElementById(targetId);
            if (targetEle !== null) targetEle.scrollIntoView();
        }, 1000);
    }, []);

    // 代碼區塊 Run 按鈕
    useEffect(() => {
        let supportLangs = ['python'];
        let appendNoteBook = (e) => {
            let codeLang = 'shell';
            try {
                codeLang = e.target.parentNode.getElementsByTagName('code')[0].className.split('-')[1];
            } catch (e) { }
            let newNode = document.createElement("pre");
            let codeScript = e.target.parentNode.getElementsByTagName('code')[0].innerText;
            if (document.getElementById(codeScript)) {
                document.getElementById(codeScript).remove();
            }
            if (supportLangs.includes(codeLang)) {
                newNode.id = codeScript;
                e.target.parentNode.insertBefore(newNode, e.target.nextSibling.nextSibling);
                ReactDOM.render(<PyREPL script={codeScript} />, newNode);
            }
        };
        let codeBlocks = document.getElementsByTagName('pre');
        for (let i = 0; i < codeBlocks.length; i++) {
            let codeBlock = codeBlocks[i];
            let code = codeBlock.getElementsByTagName('code')[0];
            let langStyleClasses = supportLangs.map((lang) => `language-${lang}`);
            let isSupportLang = false;
            langStyleClasses.forEach((styleClass) => {
                if (code !== undefined && code.classList.contains(styleClass)) {
                    isSupportLang = true;
                }
            });
            if (isSupportLang) {
                let runBtn = document.createElement('p');
                runBtn.innerText = 'Run';
                runBtn.classList.add('run-btn', 'text-sm', 'mt-2');
                runBtn.addEventListener('click', appendNoteBook);
                codeBlock.appendChild(runBtn);
            }
        }
        return () => {
            for (let i = 0; i < codeBlocks.length; i++) {
                let codeBlock = codeBlocks[i];
                codeBlock.removeEventListener('click', appendNoteBook);
            }
        };
    }, [content]);

    let { date = "", tags = [] } = documentInfo;

    return (
        <div className="bg-gradient-to-br from-zinc-100 via-white to-zinc-200 min-h-screen">
            <Helmet>
                <meta charSet="utf-8" />
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription} />
                <meta property="og:url" content={window.location.href} />
                <meta property="og:type" content="article" />
                <meta property="og:title" content={postTitle} />
                <meta property="og:description" content={postTitle} />
            </Helmet>

            {mode === "edit" ? (
                <div className="flex h-screen overflow-hidden justify-center">
                    <div className="w-full flex h-full">
                        <div className="flex-1 h-full max-h-full mx-4 my-6 bg-white rounded-xl shadow-lg p-6 overflow-hidden border border-zinc-200 transition-all duration-300">
                            <h3 className="text-xl font-bold mb-3 text-blue-700 flex items-center gap-2">
                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0H3" /></svg>
                                編輯模式
                            </h3>
                            <p className="text-sm text-zinc-500 mb-4">您可以在左側編輯 Markdown 內容，右側即時預覽。</p>
                            <button
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition-all duration-200 mb-4"
                                onClick={() => {
                                    const contentBlob = new Blob([content], { type: 'text/markdown' });
                                    const url = URL.createObjectURL(contentBlob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${postTitle}.md`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }}
                            >
                                下載 Markdown
                            </button>
                            <div id="Editor" className="h-[calc(100vh-180px)] mt-2 overflow-y-auto">
                                <textarea
                                    id="EditorTextArea"
                                    ref={editorTextAreaRef}
                                    className="w-full h-full bg-zinc-100 p-4 rounded-lg border border-zinc-300 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-base shadow-inner transition-all duration-200"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    spellCheck={false}
                                />
                            </div>
                        </div>
                        <div className="flex-1 h-full max-h-full mx-4 my-6 bg-white rounded-xl shadow-lg p-8 overflow-hidden border border-zinc-200 transition-all duration-300">
                            <PostContent
                                postTitle={postTitle}
                                date={date}
                                tags={tags}
                                content={content}
                                codeSyntaxStyle={codeSyntaxStyle}
                                renderContainerRef={renderContainerRef}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-full min-h-screen flex justify-center items-start bg-gradient-to-br from-zinc-100 via-white to-zinc-200">
                    <div className="w-full max-w-4xl mx-auto my-12 bg-white rounded-xl shadow-lg p-8 overflow-hidden border border-zinc-200 transition-all duration-300">
                        <PostContent
                            postTitle={postTitle}
                            date={date}
                            tags={tags}
                            content={content}
                            codeSyntaxStyle={codeSyntaxStyle}
                            renderContainerRef={renderContainerRef}
                        />
                        <CommentSection doc_id={doc_id} postTitle={postTitle} />
                    </div>
                </div>
            )}
            {mode !== "edit" && <TOC />}
        </div>
    );
}