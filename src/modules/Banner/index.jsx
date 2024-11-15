import { React } from 'react'
import { BLOG_NAME } from '../../configs/general'
import './index.css'

function Banner(props) {
    return (
        <div id="Banner" style={{ marginTop: 20 }} className="text-center">
            <h1>
                <a href="/" className="home-page-title font-medium">
                    <img src="/icon.svg" alt="" srcSet="" />
                    {BLOG_NAME}
                </a>
            </h1>
            <small>程式技術、自然語言處理和論文筆記</small>
            <br />
            {props.children}
            <small className='spec-page'><a href="/?page=archive">Archive</a></small>        
        </div>
    )
}

export default Banner