import React, { useEffect, useState } from 'react'
import { BLOG_NAME, OWNER } from '../../configs/general'
import './index.css'

function Footer() {
    const [show, setShow] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY || window.pageYOffset
            const windowHeight = window.innerHeight
            const docHeight = document.documentElement.scrollHeight
            // 若已經到底部（容忍 2px 誤差）
            if (scrollY + windowHeight >= docHeight - 2) {
                setShow(true)
            } else {
                setShow(false)
            }
        }
        window.addEventListener('scroll', handleScroll)
        handleScroll() // 初始檢查
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <footer id="Footer" className={show ? 'footer-visible' : 'footer-hidden'}>
            <div className="footer-main">
                <span className="footer-blog-name">{BLOG_NAME}</span>
                <span className="footer-dot">·</span>
                <span className="footer-owner">{new Date().getFullYear()} © {OWNER}</span>
                <span className="footer-icons">
                    <a href="https://github.com/p208p2002" target="_blank" rel="noopener noreferrer" title="GitHub">
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" style={{verticalAlign:'middle'}}><path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.304-5.466-1.334-5.466-5.931 0-1.31.468-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23.957-.266 1.984-.399 3.003-.404 1.018.005 2.046.138 3.006.404 2.289-1.552 3.295-1.23 3.295-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.804 5.625-5.475 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.796 24 17.299 24 12c0-6.627-5.373-12-12-12z"/></svg>
                    </a>
                    <a href="https://huggingface.co/p208p2002" target="_blank" rel="noopener noreferrer" title="Hugging Face">
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 32 32" style={{verticalAlign:'middle'}}><circle cx="16" cy="16" r="16" fill="#FFD21F"/><ellipse cx="10.5" cy="13.5" rx="2.5" ry="3.5" fill="#fff"/><ellipse cx="21.5" cy="13.5" rx="2.5" ry="3.5" fill="#fff"/><ellipse cx="10.5" cy="13.5" rx="1.5" ry="2" fill="#000"/><ellipse cx="21.5" cy="13.5" rx="1.5" ry="2" fill="#000"/><path d="M8 20c2 3 12 3 14 0" stroke="#000" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
                    </a>
                </span>
            </div>
        </footer>
    )
}

export default Footer
