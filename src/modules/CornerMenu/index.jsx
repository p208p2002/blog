import React from 'react'
import './index.css'
// eslint-disable-next-line
import { FaGithub, FaHome } from "react-icons/fa";
// eslint-disable-next-line
import { HOME_PAGE, GITHUB } from '../../configs/general'

function Index() {
    return (
        <div id="Corner-Menu">
            <div className="link">
                <a href={HOME_PAGE}>
                    <FaHome className="animate__animated animate__backInUp" style={{ height: '100%', width: '100%' }} />
                </a>
            </div>
        </div>
    )
}

export default Index