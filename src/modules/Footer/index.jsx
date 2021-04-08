import { OWNER } from '../../configs/general'
import './index.css'

function Footer() {
    return (
        <footer id="Footer">
            <br/>
            {new Date().getFullYear()} © {OWNER}
            <br/>
            <small>Powered by <a href="https://github.com/p208p2002/blog" target="_blank" rel="noreferrer">Scooter</a></small>
        </footer>
    )
}

export default Footer
