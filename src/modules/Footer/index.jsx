import { OWNER } from '../../configs/general'
import './index.css'

function Footer() {
    return (
        <footer id="Footer">
            <br/>
            {new Date().getFullYear()} © {OWNER}
            <br/>
            <small>Powered by Scooter</small>
        </footer>
    )
}

export default Footer
