import React from 'react'
import { useState, useEffect, useContext } from 'react'
import './App.css';
import { GIST_API_URL, TITLE_FILTER_RULE, DESC_FILTER_RULE, BLOG_NAME } from './configs/general'
import PostBlock from './modules/PostBlock'
import Search from './modules/Search'
import { RootContext } from './index'


const axios = require('axios');

function App() {

  let [posts, setPosts] = useState([])
  let { setLoading } = useContext(RootContext)

  let fetchPost = (titleRule, descRule) => {
    setLoading(true)
    axios.get(GIST_API_URL)
      .then((res) => {
        console.log(res.data)
        posts = res.data
        posts = posts.filter((post) => {
          let title = Object.keys(post.files)[0] // only use first file
          let { description } = post
          // console.log(description)
          if (title.match(titleRule) && description.match(descRule)) {
            return true
          }
          return false
        })
        setPosts(posts)
      })
      .catch((err) => {
        console.log(err)
      })
      .then(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchPost(TITLE_FILTER_RULE, DESC_FILTER_RULE)
    // eslint-disable-next-line
  }, [])

  return (
    <div id="App">
      <div className="text-center">
        <h1>{BLOG_NAME}</h1>
        <Search />
      </div>
      <div className="context">
        {posts.map((post, i) => <PostBlock key={i} post={post} />)}
      </div>
    </div>
  );
}

export default App;
