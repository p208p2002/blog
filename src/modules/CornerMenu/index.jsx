import React from 'react'
import './index.css'
// eslint-disable-next-line
import { FaGithub, FaHome } from "react-icons/fa";
import { MdOutlineLightMode, MdOutlineDarkMode } from 'react-icons/md'
// eslint-disable-next-line
import { HOME_PAGE, GITHUB } from '../../configs/general'
import Darkmode from 'drkmd-js'
import { useEffect,useState } from 'react'



function index() {
    let dm = new Darkmode()
    
    useEffect(() => {
        dm.attach()
    }, [])

    // eslint-disable-next-line
    const [theme,setTheme] = useState(dm.currentTheme())

    return (
        <div id="Corner-Menu">
            {
                dm.isDark() ? (
                    <div className="link">
                        <MdOutlineLightMode
                            className="animate__animated animate__backInUp"
                            style={{ height: '100%', width: '100%' }}
                            onClick={() => {
                                dm.toggle()
                                setTheme(dm.currentTheme())
                            }}
                        />
                    </div>
                ) : (
                    <div className="link">
                        <MdOutlineDarkMode
                            className="animate__animated animate__backInUp"
                            style={{ height: '100%', width: '100%' }}
                            onClick={() => {
                                dm.toggle()
                                setTheme(dm.currentTheme())
                            }}
                        />
                    </div>
                )
            }


            {/* <div className="link">
                <a href={GITHUB} target="_blank" rel="noopener noreferrer">
                    <FaGithub className="animate__animated animate__backInUp" style={{ height: '100%', width: '100%' }} />
                </a>
            </div>  */}
            <div className="link">
                <a href={HOME_PAGE}>
                    <FaHome className="animate__animated animate__backInUp" style={{ height: '100%', width: '100%' }} />
                </a>
            </div>
        </div>
    )
}

export default index