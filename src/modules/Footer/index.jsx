import { OWNER,HOME_PAGE } from '../../configs/general'
import './index.css'

function Footer() {
    return (
        <footer id="Footer">
            {new Date().getFullYear()} © {OWNER}
            <br/>
            <small>Website design and develop by <b><a href={HOME_PAGE} target="_blank" rel="noreferrer">Philip Huang</a></b></small>
        </footer>
    )
}

export default Footer
