import React from 'react'
import './index.css'
import { GITHUB_USER } from '../../configs/general'
import { useState } from 'react'

function Search() {
    let [keyword, setKeyword] = useState('')
    return (
        <div id="Search-Bar">
            <form id="Searrch-Form">
                <input
                    placeholder="Seacrh on Gist"
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
                        window.open("https://gist.github.com/search?q=" + encodeURI(`user:${GITHUB_USER} ${keyword}`));
                        setKeyword('')
                    }}
                >
                    <i className="fa fa-search"></i>
                </button>
            </form>
        </div>
    )
}

export default Search