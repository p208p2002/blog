import { useContext } from 'react'
import { RootContext } from '../../index'
import './index.css'

function Loading(){
    let { isLoading } = useContext(RootContext)
    if(isLoading){
        return(
            <div id="Loading">
                Loading...
            </div>
        )
    }
    return null
}

export default Loading