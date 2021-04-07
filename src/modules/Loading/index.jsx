import { useContext } from 'react'
import { RootContext } from '../../index'

function Loading(){
    let { isLoading } = useContext(RootContext)
    if(isLoading){
        return(
            <p>Loading...</p>
        )
    }
    return null
}

export default Loading