import React from 'react'
import { OWNER } from '../../configs/general'
import './index.css'

function Footer() {
    return (
        <footer id="Footer">
            <div>
                {new Date().getFullYear()} © {OWNER}
            </div>
            <small>
                <a href="https://github.com/p208p2002/blog" target="_blank" rel="noopener noreferrer">GitHub</a>
                &nbsp;·&nbsp;
                <a href="https://huggingface.co/p208p2002" target="_blank" rel="noopener noreferrer">Hugging Face</a>
            </small>
        </footer>
    )
}

export default Footer
