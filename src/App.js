import { useState, useEffect, useContext } from 'react'
import './App.css';
import { GIST_API_URL,TITLE_FILTER_RULE } from './configs/general'
import PostBlock from './modules/PostBlock'
import Search from './modules/Search'
import { RootContext } from './index'
import Footer from './modules/Footer'

const axios = require('axios');

function App() {

  let [posts, setPosts] = useState([])
  let { setLoading } = useContext(RootContext)

  let fetchPost = (filterRule) => {
    setLoading(true)
    axios.get(GIST_API_URL)
      .then((res) => {
        console.log(res.data)
        posts = res.data
        posts = posts.filter((post)=>{
          let title = Object.keys(post.files)[0] // only use first file
          if (title.match(filterRule)){
            return true
          }
          return false
        })
        setPosts(posts)
      })
      .catch((err) => {
        console.log(err)
      })
      .then(()=>{
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchPost(TITLE_FILTER_RULE)
    // eslint-disable-next-line
  }, [])

  return (
    <div className="container">
      <Search/>
      <div>
        {posts.map((post,i) => <PostBlock key={i} post={post}/>)}
      </div>
      <br/>
      <Footer/>
    </div>
  );
}

export default App;
