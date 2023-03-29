import React from 'react'
import './index.css'

function PostBlock({ doc, children }) {

    let title = doc.title
    let created_at = doc.date
    let tags = doc.tags

    // let isIpynb = title.match(/.*\.ipynb/) === null ? false : true
    // let ownerName = post.owner.login
    return (
        <div key={title} id="Post-Block">
            <div className="post-header">
                <div className="text-center">
                    <div style={{marginBottom:0}}>
                        <a className='post-title text-blog_blue' href={doc.page_link}>{title}</a>
                    </div>

                    <div style={{marginBottom:8}}>
                        <small>
                            #{tags.join(" #")} · <span className='post-date'>{created_at}</span>
                            <br />
                        </small>
                    </div>
                </div>
                <hr />
            </div>
            {children}
        </div>
    )
}

export default PostBlock