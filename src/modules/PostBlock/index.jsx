import React from 'react'
import './index.css'

function PostBlock({doc,children}) {
   
    let title = doc.title
    let created_at = doc.date
    let tags = doc.tags

    // let isIpynb = title.match(/.*\.ipynb/) === null ? false : true
    // let ownerName = post.owner.login
    return (
        <div key={title} id="Post-Block">
            
            <div className="text-center">
                <div>
                <a className='post-title' href={doc.page_link}>{title}</a>
                </div>

                <div>
                    <small>
                        {tags.join("#")}
                        <br />
                        <span>{created_at}</span>
                        <br />
                    </small>
                </div>
            </div>

            <hr />
            {children}
        </div>
    )
}

export default PostBlock