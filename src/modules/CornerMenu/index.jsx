import React from 'react'
import './index.css'
import { FaGithub,FaHome } from "react-icons/fa";
import { HOME_PAGE,GITHUB } from '../../configs/general'

function index() {
    return (
        <div id="Corner-Menu">
            <div className="link">
                <a href={GITHUB} target="_blank" rel="noopener noreferrer">
                    <FaGithub className="animate__animated animate__backInUp" style={{ height: '100%', width: '100%' }} />
                </a>
            </div>
            <div className="link">
                <a href={HOME_PAGE}>
                    <FaHome className="animate__animated animate__backInUp" style={{ height: '100%', width: '100%' }} />
                </a>
            </div>
        </div>
    )
}

export default index