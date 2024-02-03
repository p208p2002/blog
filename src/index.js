import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './tailwindcss.css'
import App from './App';
import reportWebVitals from './reportWebVitals';
import LoadingView from './modules/Loading'
import CornerMenu from './modules/CornerMenu'
import Footer from './modules/Footer'
import { BLOG_NAME } from './configs/general'
import MdRender from './modules/MdRender';
import { Helmet } from 'react-helmet'
import { AppState } from './AppState'

export const AppStateContext = React.createContext();

const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());
let { page = undefined } = params

function Index() {
  let appState = new AppState()

  return (
    <AppStateContext.Provider value={appState}>
        <LoadingView />
        <div>
          {page === undefined ? (
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
          ) : (
            <div className="render-container">
              <MdRender doc_id={page} />
              <CornerMenu />
              <Footer />
            </div>
          )}

        </div>
    </AppStateContext.Provider>
  )
}

const rootElement = document.getElementById("root");
ReactDOM.render(<Index />, rootElement);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
