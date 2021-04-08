import './index.css'
import { FaGithub,FaHome } from "react-icons/fa";
import { HOME_PAGE,GITHUB } from '../../configs/general'

function index() {
    return (
        <div id="Corner-Menu">
            <div className="link">
                <a href={GITHUB} target="_blank" rel="noreferrer">
                    <FaGithub className="animate__animated animate__backInUp" style={{ height: '100%', width: '100%' }} />
                </a>
            </div>
            <div className="link">
                <a href={HOME_PAGE} target="_blank" rel="noreferrer">
                    <FaHome className="animate__animated animate__backInUp" style={{ height: '100%', width: '100%' }} />
                </a>
            </div>
        </div>
    )
}

export default index