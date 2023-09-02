import React from 'react'
import './index.css'
import { useState,useEffect } from 'react'
import { HOME_PAGE } from '../../configs/general'

function Search({setPosts,fullIndex=[]}) {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    let { q = undefined } = params

    let [keyword, setKeyword] = useState('')

    let searchPost = (keyword)=>{
        fullIndex = fullIndex.filter((postIndex)=>{
            let { title = '',tags=[], hidden_tags=[]} = postIndex

            let keep_flag = false

            // search title 
            if(title.toLowerCase().match(keyword.toLowerCase())){
                keep_flag = true
            }

            // search tag
            tags.forEach((tag)=>{
                if (tag.toLowerCase().match(keyword.toLowerCase())){
                    keep_flag = true
                }
            })

            // search hidden tag
            hidden_tags.forEach((tag)=>{
                if (tag.toLowerCase().match(keyword.toLowerCase())){
                    keep_flag = true
                }
            })

            return keep_flag

        })
        setPosts(fullIndex)
        setKeyword('')
    }

    useEffect(()=>{
        
        if(q !== undefined){
            searchPost(q)
        }
    // eslint-disable-next-line 
    },[fullIndex])

    return (
        <div id="Search-Bar">
            <form id="Searrch-Form">
                <input
                    className='text-sm'
                    placeholder="Search post, tag, etc."
                    type="text"
                    value={keyword}
                    onChange={(e) => {
                        setKeyword(e.target.value)
                    }}
                />
                <button
                    type="submit"
                    onClick={(e) => {
                        e.preventDefault();
                        const urlSearchParams = new URLSearchParams(window.location.search)
                        if(keyword !==""){
                            urlSearchParams.set('q', keyword)
                            window.location.search = urlSearchParams;
                        }
                        else{
                            window.location = HOME_PAGE
                        }                      
                    }}
                >
                    <i className="fa fa-search p-1"></i>
                </button>
            </form>
            {q!==undefined &&<div className='mt-7 text-center text-gray-700'>
                <p>搜尋結果: <b>{q}</b></p>
                <small 
                    className='cursor-pointer text-gray-500 underline'
                    onClick={()=>{
                        window.location = HOME_PAGE
                    }}
                >
                    清除搜尋
                </small>
            </div>}
        </div>
    )
}

export default Search