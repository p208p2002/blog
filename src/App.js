import React from 'react'
import { useState, useEffect, useContext } from 'react'
import './App.css';
import { BLOG_NAME,POST_PRE_PAGE } from './configs/general'
import PostBlock from './modules/PostBlock'
import Search from './modules/Search'
import { RootContext } from './index'
import MDPreviewer from './modules/MdRender/preview'


const axios = require('axios');

function App() {

  let [posts, setPosts] = useState([])
  let { setLoading,params } = useContext(RootContext)
  let { offset = 0 ,limit = POST_PRE_PAGE} = params

  offset = parseInt(offset)
  limit = parseInt(limit)

  let fetchPost = () => {
    setLoading(true)
    axios.get("/index.json")
      .then((res) => {
        posts = res.data
        posts = posts.slice(offset,limit)
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
    fetchPost()
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
      {/* pagination */}
      <div style={{textAlign:'center'}}>
      <a href="/">{`<<Fisrt Page`}</a>
      <span style={{marginLeft:5,marginRight:5}}> - </span>
      <a href={`/?offset=${offset+POST_PRE_PAGE}&limit=${offset+POST_PRE_PAGE*2}`}>{'Older Post >>'}</a>
      </div>
    </div>
  );
}

export default App;
