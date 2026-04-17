import React from 'react'
import { useState, useEffect } from 'react'
import './index.css'

let getTitleNodes = () => {
    let nodes = []
    let targetNodeNames = ["h1", "h2", "h3"]
    targetNodeNames.forEach((nodeName) => {
        let targetNodes = Array.from(document.querySelectorAll(nodeName))
        targetNodes.forEach((node) => {
            nodes.push(node)
        })
    })

    // 依照元素位置排序
    nodes.sort((a, b) => {
        return a.getBoundingClientRect().top - b.getBoundingClientRect().top
    })

    return nodes
}

function Index() {
    // let docTitles = Array.from(document.querySelectorAll("h1","h2", "h3"))
    let docTitles = getTitleNodes()

    let [activateIdx, setActivateIdx] = useState(0)

    let handleScroll = () => {
        let docTitles = getTitleNodes()
        docTitles.forEach((docTitle, docTitleIdx) => {
            if (docTitle.getBoundingClientRect().top <= 20) {
                setActivateIdx(docTitleIdx)
            }
        })
    }

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);

    }, [])

    return (
        <div id="TOC">
            <ul className='toc-list'>
                {
                    docTitles.map((docTitle, docTitleIdx) => {
                        // console.log(docTitle.getBoundingClientRect())
                        let eleStyle = docTitle.tagName === "H1" || docTitle.tagName === "H2" ? "toc-link" : "toc-link toc-link-nested"
                        if (docTitleIdx === activateIdx) {
                            if (docTitle.tagName === "H1" || docTitle.tagName === "H2") {
                                eleStyle += " toc-link-active activate-h2"
                            }
                            else {
                                eleStyle += " toc-link-active activate-h3"
                            }

                        }
                        return <li
                            key={docTitleIdx}
                            onClick={(e) => {
                                e.preventDefault()
                                docTitle.scrollIntoView({ behavior: "smooth" })
                            }}
                            className={eleStyle}
                        >
                            <div className="box">
                                <div className="ellipsis">
                                    {docTitle.innerText}
                                </div>
                            </div>
                        </li>
                    })
                }
            </ul>
        </div>
    )
}

export default Index
