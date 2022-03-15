import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import LoadingView from './modules/Loading'
import CornerMenu from './modules/CornerMenu'
import Footer from './modules/Footer'
import { BLOG_NAME } from './configs/general'
import MdRender from './modules/MdRender';
export const RootContext = React.createContext({});

const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());
let { render = undefined } = params
console.log(params)

function Index() {
  let [isLoading, setLoading] = useState(false)

  useEffect(() => {
    document.title = BLOG_NAME
  }, []);

  return (
    <RootContext.Provider value={{ isLoading, setLoading }}>
      <LoadingView />
      <div className="container">
        {render === undefined ? (
          <div className="app-container">
            <App />
            <CornerMenu />
            <Footer />
          </div>
        ) : (
          <div className="render-container">
            <MdRender md_url={render} />
            <CornerMenu />
            <Footer />

          </div>
        )}

      </div>
    </RootContext.Provider >
  )
}

ReactDOM.render(
  <>
    <Index />
  </>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
