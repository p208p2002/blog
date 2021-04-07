import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import LoadingView from './modules/Loading'
import Footer from './modules/Footer'
export const RootContext = React.createContext({});

function Index() {
  let [isLoading, setLoading] = useState(false)
  return (
    <RootContext.Provider value={{ isLoading, setLoading }}>
      <div className="container">
        <App />
        <LoadingView />
        <Footer/>
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
