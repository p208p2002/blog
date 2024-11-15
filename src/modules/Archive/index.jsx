import React from 'react'
import Banner from '../Banner'
import { useState, useEffect, useContext } from 'react'
import { AppStateContext } from '../../index'
import './index.css'
const axios = require('axios')

function Archive() {
    let [posts, setPosts] = useState([])
    let appState = useContext(AppStateContext)
    let fetchPost = () => {
        appState.setLoading(true)
        axios.get("/index.json")
            .then((res) => {
                posts = res.data
                setPosts(posts)
            })
            .catch((err) => {
                console.log(err)
            })
            .then(() => {
                appState.setLoading(false)
            })
    }

    useEffect(() => {
        fetchPost()

        // eslint-disable-next-line
    }, [])

    return (
        <div id="Archive">
            <Banner />
            
            <div className="context">
                {
                    posts.map((post, index) => {
                        return <div key={index}>
                            <div className='row'>
                                <p><b>{post.date}</b> - <a href={post.page_link}>{post.title}</a></p>
                                {post.tags.map((tag)=><small>#{tag}</small>)}
                            </div>
                        </div>
                    })
                }
            </div>

        </div>
    )
}

export default Archive