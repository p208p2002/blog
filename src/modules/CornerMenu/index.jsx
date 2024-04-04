import React from 'react'
import './index.css'
// eslint-disable-next-line
import { FaGithub, FaHome } from "react-icons/fa";
import { MdOutlineLightMode, MdOutlineDarkMode } from 'react-icons/md'
// eslint-disable-next-line
import { HOME_PAGE, GITHUB } from '../../configs/general'
import Darkmode from 'drkmd-js'
import { useEffect, useState } from 'react'



function Index() {
    let dm = new Darkmode()

    // eslint-disable-next-line
    const [theme, setTheme] = useState(dm.currentTheme())

    useEffect(() => {
        dm.attach()
        // eslint-disable-next-line
    }, [])

    useEffect(() => {
        var head = document.head;
        var link = document.createElement("link");

        link.type = "text/css";
        link.rel = "stylesheet";

        if(theme === "dark"){
            link.href = '/theme-dark.css';    
        }
        else{
            link.href = '/theme.css';
        }

        head.appendChild(link);
        return () => { head.removeChild(link); }

    }, [theme])

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

            <div className="link">
                <a href={HOME_PAGE}>
                    <FaHome className="animate__animated animate__backInUp" style={{ height: '100%', width: '100%' }} />
                </a>
            </div>
        </div>
    )
}

export default Index