import React from 'react';
import ReactDOM from 'react-dom';
import './tailwindcss.css'
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import LoadingView from './modules/Loading'
import CornerMenu from './modules/CornerMenu'
import Footer from './modules/Footer'
import Archive from './modules/Archive'
import { BLOG_NAME, HOME_PAGE } from './configs/general'
import MdRender from './modules/MdRender';
import { Helmet } from 'react-helmet'
import { AppState } from './AppState'

export const AppStateContext = React.createContext();

const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());
let { page = undefined, mode="view" } = params
console.log("params", params);

function Index() {
  let appState = new AppState()
  let pageContext

  if (page === undefined) {
    pageContext = (
      <div>
        <Helmet>
          <meta charSet="utf-8" />
          <title>{BLOG_NAME}</title>
          <meta name="description" content="💻 程式技術、自然語言處理和論文筆記 🛠️" />
        </Helmet>
        <App />
        <CornerMenu />
        <Footer />
      </div>
    )
  }
  else if (page === "archive") {
    pageContext = (
      <div>
        <Archive />
        <CornerMenu />
        <Footer />
      </div>
    )
  }
  else if (page === "code-404") {
    pageContext = (
      <div className='article-page'>
        <p>很抱歉，您要求的文章不存在。</p>
        <p><a href={HOME_PAGE}>回首頁</a></p>
      </div>
    )
  }
  else if (mode === "edit") {
    pageContext = (
      <>
        <Helmet>
          <meta charSet="utf-8" />
          <title>{BLOG_NAME} - 編輯 {page}</title>
        </Helmet>
        <MdRender doc_id={page} mode={mode}/>
        <CornerMenu />
        <Footer />
      </>
    )
  }
  else {
    pageContext = (
      <>
        <MdRender doc_id={page} mode={mode}/>
        <CornerMenu />
        <Footer />
      </>
    )
  }

  return (
    <AppStateContext.Provider value={appState}>
      <LoadingView />
      <div>
        {pageContext}
      </div>
    </AppStateContext.Provider >
  )
}

const rootElement = document.getElementById("root");
ReactDOM.render(<Index />, rootElement);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
