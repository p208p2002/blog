import './index.css'
function PostBlock(props) {
    let { post } = props
    let title = Object.keys(post.files)[0] // only use first file
    let { created_at, updated_at, html_url } = post
    return (
        <div key={title} id="Post-Block">
            <div>
                <a href={html_url} target="_blank" rel="noreferrer">{title}</a>
            </div>
            <div>
                <small>
                    <span><b>create at:</b>{created_at}</span>
                    <br/>
                    <span><b>update at:</b>{updated_at}</span>
                </small>
            </div>
        </div>
    )
}

export default PostBlock