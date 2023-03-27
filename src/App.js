import React from 'react'
import { useState, useEffect, useContext } from 'react'
import './App.css';
import { AppStateContext } from './index'
import { BLOG_NAME } from './configs/general'
import PostBlock from './modules/PostBlock'
import Search from './modules/Search'
import MDPreviewer from './modules/MdRender/preview'
import { POST_PRE_PAGE } from './configs/general'

const axios = require('axios');

function App() {

  let [fullIndex, setFullIndex] = useState([])
  let [posts, setPosts] = useState([])
  let appState = useContext(AppStateContext)
  let {offset,limit} = appState
  
  let fetchPost = () => {
    appState.setLoading(true)
    axios.get("/index.json")
      .then((res) => {
        posts = res.data
        posts = posts.slice(offset,limit)
        setPosts(posts)
        setFullIndex(res.data)
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
  }, [])

  return (
    <div id="App">
      <div style={{marginTop:40}} className="text-center">
        <h1><a href="/" className="home-page-title">{BLOG_NAME}</a></h1>
        <Search setPosts={setPosts} fullIndex={fullIndex}/>
      </div>
      
      <div className="context">
        {posts.map((post, i) => (
          <PostBlock key={i} doc={post} >
            <MDPreviewer file_link={post.file_link}  maxLine={12}/>
          </PostBlock>
        ))}
      </div>
      
      <div style={{textAlign:'center',marginBottom:40}}>
      <a href="/">{`<<Fisrt Page`}</a>
      <span style={{marginLeft:5,marginRight:5}}> - </span>
      <a href={`/?offset=${offset+POST_PRE_PAGE}&limit=${offset+POST_PRE_PAGE*2}`}>{'Older Post >>'}</a>
      </div>
    </div>
  );
}

export default App;
