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

                    {/* {isIpynb ? <a className='post-title' href={html_url} target="_blank" rel="noopener noreferrer">{title}</a> : <a className='post-title' href={`/?render=${gistId}`}>{title}</a>} */}

                    {/* {isIpynb ?
                        <a
                            className='post-title'
                            rel="noopener noreferrer"
                            target="_blank"
                            href={`http://colab.research.google.com/gist/${ownerName}/` + html_url.replace("https://gist.github.com/", "")}>
                            <img className="title-badge" src="https://colab.research.google.com/assets/colab-badge.svg" alt="open in colab" srcSet="" />
                        </a>
                        :
                        null
                    } */}
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