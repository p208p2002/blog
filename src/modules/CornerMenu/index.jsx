import React from 'react'
import './index.css'
import { FaHome, FaArrowUp } from "react-icons/fa";
import { HOME_PAGE } from '../../configs/general'

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

function CornerMenu() {
    return (
        <div id="Corner-Menu">
            <button className="corner-btn" title="回到首頁" onClick={() => window.location.href = HOME_PAGE}>
                <FaHome />
            </button>
            <button className="corner-btn" title="回到頂端" onClick={scrollToTop}>
                <FaArrowUp />
            </button>
        </div>
    )
}

export default CornerMenu