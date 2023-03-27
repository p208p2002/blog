import React from 'react'
import { useContext } from 'react'
import { AppStateContext } from '../../index'
import './index.css'
import { observer } from 'mobx-react'

const Loading = observer(() => {
    let appState = useContext(AppStateContext)
    let { isLoading } = appState
    if (isLoading) {
        return (
            <div id="Loading">
                Loading...
            </div>
        )
    }
    return null
})

export default Loading