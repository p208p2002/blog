import React from 'react'
import './index.css'
import { useState } from 'react'

function Search() {
    let [keyword, setKeyword] = useState('')
    return (
        <div id="Search-Bar">
            <form id="Searrch-Form">
                <input
                    placeholder="Seacrh Post"
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
                        window.open("/index.json");
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