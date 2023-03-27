import React from 'react'
import './index.css'
import { useState } from 'react'

function Search({setPosts,fullIndex=[]}) {
    let [keyword, setKeyword] = useState('')
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
                    }}
                >
                    <i className="fa fa-search p-1"></i>
                </button>
            </form>
        </div>
    )
}

export default Search