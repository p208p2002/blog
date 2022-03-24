import React from 'react'
import './index.css'
import { DESC_FILTER_RULE } from '../../configs/general'
import moment from 'moment'

function PostBlock(props) {
    let { post } = props
    let title = Object.keys(post.files)[0] // only use first file
    let { created_at, html_url, description } = post
    let { id: gistId } = post


    let isIpynb = title.match(/.*\.ipynb/) === null ? false : true
    let ownerName = post.owner.login
    return (
        <div key={title} id="Post-Block">
            <div className="text-center">
                <div>
                    {isIpynb ? <a className='post-title' href={html_url} target="_blank" rel="noopener noreferrer">{title}</a> : <a className='post-title' href={`/?render=${gistId}`}>{title}</a>}


                    {/*  */}
                    {/* if the file type is ipynb, show a badge with "open in colab" */}
                    {isIpynb ?
                        <a
                            className='post-title'
                            rel="noopener noreferrer"
                            target="_blank"
                            href={`http://colab.research.google.com/gist/${ownerName}/` + html_url.replace("https://gist.github.com/", "")}>
                            <img className="title-badge" src="https://colab.research.google.com/assets/colab-badge.svg" alt="open in colab" srcSet="" />
                        </a>
                        :
                        null
                    }
                </div>

                <div>
                    <small>
                        {description.replace(DESC_FILTER_RULE, "")}
                        <br />
                        <span>{moment(created_at).format("LL")}</span>
                        <br />
                    </small>
                </div>
            </div>

            <hr />
            {props.children}
        </div>
    )
}

export default PostBlock