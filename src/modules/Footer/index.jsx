import React from 'react'
// eslint-disable-next-line
import { BLOG_NAME, OWNER } from '../../configs/general'
import './index.css'

function Footer() {
    return (
        <footer id="Footer">
            <div>
                {/* {new Date().getFullYear()} © {OWNER} */}
                <span>{BLOG_NAME}</span>
            </div>
            {/* <small>
                <a href="https://github.com/p208p2002" target="_blank" rel="noopener noreferrer">GitHub</a>
                &nbsp;·&nbsp;
                <a href="https://huggingface.co/p208p2002" target="_blank" rel="noopener noreferrer">Hugging Face</a>
            </small> */}
        </footer>
    )
}

export default Footer
