import './index.css'
import { DESC_FILTER_RULE } from '../../configs/general'
import moment from 'moment'

function PostBlock(props) {
    let { post } = props
    let title = Object.keys(post.files)[0] // only use first file
    let { created_at, updated_at, html_url, description } = post
    let isIpynb = title.match(/.*\.ipynb/) === null ? false : true
    let ownerName = post.owner.login
    return (
        <div key={title} id="Post-Block">
            <div>
                <a href={html_url} target="_blank" rel="noreferrer">{title}</a>
                {/* if the file type is ipynb, show a badge with "open in colab" */}
                {isIpynb ?
                    <a
                        rel="noreferrer"
                        target="_blank"
                        href={`http://colab.research.google.com/gist/${ownerName}/` + html_url.replace("https://gist.github.com/", "")}>
                        <img className="title-badge" src="https://colab.research.google.com/assets/colab-badge.svg" alt="open in colab" srcset="" />
                    </a>
                    :
                    null
                }
            </div>

            <div>
                <small>
                    {description.replace(DESC_FILTER_RULE, "")}
                    <br />
                    <span><b>create at: </b>{moment(created_at).format("LLL")}</span>
                    <br />
                    <span><b>update at: </b>{moment(updated_at).format("LLL")}</span>
                </small>
            </div>
        </div>
    )
}

export default PostBlock