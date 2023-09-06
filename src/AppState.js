import { makeAutoObservable } from "mobx"
import { POST_PRE_PAGE } from './configs/general'

const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());
let {page,offset=0,limit=POST_PRE_PAGE} = params

if(typeof(offset) === 'string'){
    offset = parseInt(offset)
}

if(typeof(limit) === 'string'){
    limit = parseInt(limit)
}

export class AppState{
    isLoading = false
    params = params
    page = page
    offset = offset
    limit = limit
    
    constructor(){
        makeAutoObservable(this)
    }

    setLoading(newState){
        this.isLoading = newState
    }

}