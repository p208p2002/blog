import './index.css'
import { DESC_FILTER_RULE } from '../../configs/general'
import moment from 'moment'

function PostBlock(props) {
    let { post } = props
    let title = Object.keys(post.files)[0] // only use first file
    let { created_at, updated_at, html_url, description } = post
    return (
        <div key={title} id="Post-Block">
            <div>
                <a href={html_url} target="_blank" rel="noreferrer">{title}</a>
            </div>
            <div>
                <small>
                    {description.replace(DESC_FILTER_RULE,"")}
                    <br/>
                    <span><b>create at: </b>{moment(created_at).format("LLL")}</span>
                    <br/>
                    <span><b>update at: </b>{moment(updated_at).format("LLL")}</span>
                </small>
            </div>
        </div>
    )
}

export default PostBlock