import React from 'react'
import { useState, useEffect, useContext } from 'react'
import './App.css';
import { AppStateContext } from './index'
import PostBlock from './modules/PostBlock'
import Search from './modules/Search'
import MDPreviewer from './modules/MdRender/preview'
import { HOME_PAGE, POST_PRE_PAGE, publicPath } from './configs/general'
import Banner from './modules/Banner';
import axios from 'axios';

function App() {

  let [fullIndex, setFullIndex] = useState([])
  let [posts, setPosts] = useState([])
  let appState = useContext(AppStateContext)
  let { offset, limit } = appState

  let fetchPost = () => {
    appState.setLoading(true)
    axios.get(publicPath("/index.json"))
      .then((res) => {
        posts = res.data
        posts = posts.slice(offset, limit)
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
    // eslint-disable-next-line
  }, [])

  return (
    <div id="App">

      <Banner>
      <Search setPosts={setPosts} fullIndex={fullIndex} />
      </Banner>

      <div className="context">
        {posts.map((post, i) => (
          <PostBlock key={i} doc={post} >
            <MDPreviewer file_link={post.file_link} maxLine={12} />
          </PostBlock>
        ))}
      </div>

      <div className="pagination-nav">
        <a href={HOME_PAGE}>{`<<Fisrt Page`}</a>
        <span className="separator"> - </span>
        <a href={`${HOME_PAGE}?offset=${offset + POST_PRE_PAGE}&limit=${offset + POST_PRE_PAGE * 2}`}>{'Older Post >>'}</a>
      </div>
      <br />
    </div>
  );
}

export default App;
