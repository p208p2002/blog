import { makeAutoObservable } from "mobx"
import { POST_PRE_PAGE } from './configs/general'

const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());
const {page,offset=0,limit=POST_PRE_PAGE} = params

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