import { React } from 'react'
import { BLOG_NAME, HOME_PAGE, publicPath } from '../../configs/general'
import './index.css'

function Banner(props) {
    return (
        <div id="Banner" className="text-center">
            <h1>
                <a href={HOME_PAGE} className="home-page-title font-medium">
                    <img src={publicPath("/icon.svg")} alt="" srcSet="" />
                    {BLOG_NAME}
                </a>
            </h1>
            <small>程式技術、自然語言處理和論文筆記</small>
            <br />
            
            <div className="sub-item-container">
                <small className='spec-page'><a href={`${HOME_PAGE}?page=archive`}>Archive</a></small>
                <span className='sep'></span>
                <small className='spec-page'><a href="https://github.com/p208p2002" target="_blank" rel="noopener noreferrer">GitHub</a></small>
                <span className='sep'></span>
                <small className='spec-page'><a href="https://huggingface.co/p208p2002" target="_blank" rel="noopener noreferrer">HuggingFace</a></small>
            </div>

            {props.children}
        </div>
    )
}

export default Banner
