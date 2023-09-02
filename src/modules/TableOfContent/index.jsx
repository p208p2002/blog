import React from 'react'
import { useState, useEffect } from 'react'
import './index.css'

function Index() {
    let docTitles = Array.from(document.querySelectorAll("h2, h3"))
    let [activateIdx, setActivateIdx] = useState(-1)

    let handleScroll = () => {
        let docTitles = Array.from(document.querySelectorAll("h2, h3"))
        docTitles.forEach((docTitle, docTitleIdx) => {
            if (docTitleIdx === 0 && docTitle.getBoundingClientRect().top > 0) {
                setActivateIdx(-1)
            }
            if (docTitle.getBoundingClientRect().top <=20) {
                setActivateIdx(docTitleIdx)
            }
        })
    }

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);

    }, [])

    return (
        <div className='fixed hidden 2xl:block top-0 left-0' id="TOC">
            <ul className='pl-4 pt-4 lg:pl-10 lg:pt-8 text-md'>
                {
                    docTitles.map((docTitle, docTitleIdx) => {
                        // console.log(docTitle.getBoundingClientRect())
                        let eleStyle = docTitle.tagName === "H2" ? "cursor-pointer text-zinc-500" : "pl-3 cursor-pointer text-zinc-500"
                        if (docTitleIdx === activateIdx) {
                            if (docTitle.tagName === "H2") {
                                eleStyle += " underline activate-h2 decoration-2 underline-offset-2"
                            }
                            else {
                                eleStyle += " underline activate-h3 decoration-2 underline-offset-2"
                            }

                        }
                        return <li
                            onClick={(e) => {
                                e.preventDefault()
                                docTitle.scrollIntoView({ behavior: "smooth" })
                            }}
                            className={eleStyle}
                        >
                            {docTitle.innerText}
                        </li>
                    })
                }
            </ul>
        </div>
    )
}

export default Index