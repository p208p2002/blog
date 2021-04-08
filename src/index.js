import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import LoadingView from './modules/Loading'
import CornerMenu from './modules/CornerMenu'
import Footer from './modules/Footer'
import { BLOG_NAME } from './configs/general'
export const RootContext = React.createContext({});

function Index() {
  let [isLoading, setLoading] = useState(false)
  
  useEffect(() => {
    document.title = BLOG_NAME
  }, []);

  return (
    <RootContext.Provider value={{ isLoading, setLoading }}>
      <div className="container">
        <div className="inner-container">
          <App />
          <LoadingView />
          <CornerMenu />
          <Footer />
        </div>
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
