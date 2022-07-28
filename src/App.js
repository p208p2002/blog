import React from 'react'
import { useState, useEffect, useContext } from 'react'
import './App.css';
import { TITLE_FILTER_RULE, DESC_FILTER_RULE, BLOG_NAME } from './configs/general'
import PostBlock from './modules/PostBlock'
import Search from './modules/Search'
import { RootContext } from './index'
import MDPreviewer from './modules/MdRender/preview'


const axios = require('axios');

function App() {

  let [posts, setPosts] = useState([])
  let { setLoading } = useContext(RootContext)

  let fetchPost = (titleRule, descRule) => {
    setLoading(true)
    axios.get("/index.json")
      .then((res) => {
        console.log(res.data)
        posts = res.data
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
  }, [])

  return (
    <div id="App">
      <div className="text-center">
        <h1>{BLOG_NAME}</h1>
        <Search />
      </div>
      
      <div className="context">
        {posts.map((post, i) => (
          <PostBlock key={i} doc={post} >
            <MDPreviewer file_link={post.file_link}  maxLine={15}/>
          </PostBlock>
        ))}
      </div>
    </div>
  );
}

export default App;
