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
        <div className='fixed top-0 left-0' id="TOC">
            <ul className='pl-4 pt-4 lg:pl-10 lg:pt-8 text-sm break-words hidden xl:block xl:w-72 2xl:w-96'>
                {
                    docTitles.map((docTitle, docTitleIdx) => {
                        // console.log(docTitle.getBoundingClientRect())
                        let eleStyle = docTitle.tagName === "H1" || docTitle.tagName === "H2" ? "cursor-pointer text-zinc-500" : "ml-5 cursor-pointer text-zinc-500 list-disc"
                        if (docTitleIdx === activateIdx) {
                            if (docTitle.tagName === "H1" || docTitle.tagName === "H2") {
                                eleStyle += " underline activate-h2 decoration-2 underline-offset-2"
                            }
                            else {
                                eleStyle += " underline activate-h3 decoration-2 underline-offset-2"
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