(this.webpackJsonpscooter=this.webpackJsonpscooter||[]).push([[0],{20:function(e,t,n){},21:function(e,t,n){},22:function(e,t,n){},25:function(e,t,n){},45:function(e,t,n){},46:function(e,t,n){},47:function(e,t,n){"use strict";n.r(t),n.d(t,"RootContext",(function(){return k}));var c=n(3),r=n(1),i=n.n(r),s=n(15),a=n.n(s),j=(n(20),n(21),"Philip's blog"),o=/md$|ipynb$/,b=/#blog/,l=(n(22),n(5)),d=n.n(l),u=n(0);var h=function(e){var t=e.post,n=Object.keys(t.files)[0],c=t.created_at,r=t.updated_at,i=t.html_url,s=t.description;return Object(u.jsxs)("div",{id:"Post-Block",children:[Object(u.jsx)("div",{children:Object(u.jsx)("a",{href:i,target:"_blank",rel:"noreferrer",children:n})}),Object(u.jsx)("div",{children:Object(u.jsxs)("small",{children:[s.replace(b,""),Object(u.jsx)("br",{}),Object(u.jsxs)("span",{children:[Object(u.jsx)("b",{children:"create at: "}),d()(c).format("LLL")]}),Object(u.jsx)("br",{}),Object(u.jsxs)("span",{children:[Object(u.jsx)("b",{children:"update at: "}),d()(r).format("LLL")]})]})})]},n)};n(25);var O=function(){var e=Object(r.useState)(""),t=Object(c.a)(e,2),n=t[0],i=t[1];return Object(u.jsx)("div",{id:"Search-Bar",children:Object(u.jsxs)("form",{id:"Searrch-Form",children:[Object(u.jsx)("input",{placeholder:"Seacrh on Gist",type:"text",value:n,onChange:function(e){i(e.target.value)}}),Object(u.jsx)("button",{type:"submit",onClick:function(e){e.preventDefault(),window.open("https://gist.github.com/search?q="+encodeURI("user:".concat("p208p2002"," ").concat(n))),i("")},children:Object(u.jsx)("i",{className:"fa fa-search"})})]})})},f=n(26);var x=function(){var e=Object(r.useState)([]),t=Object(c.a)(e,2),n=t[0],i=t[1],s=Object(r.useContext)(k).setLoading;return Object(r.useEffect)((function(){var e,t;e=o,t=b,s(!0),f.get("https://api.github.com/users/p208p2002/gists").then((function(c){console.log(c.data),n=(n=c.data).filter((function(n){var c=Object.keys(n.files)[0],r=n.description;return!(!c.match(e)||!r.match(t))})),i(n)})).catch((function(e){console.log(e)})).then((function(){s(!1)}))}),[]),Object(u.jsxs)("div",{id:"App",children:[Object(u.jsx)("h2",{children:j}),Object(u.jsx)(O,{}),Object(u.jsx)("div",{children:n.map((function(e,t){return Object(u.jsx)(h,{post:e},t)}))})]})},p=function(e){e&&e instanceof Function&&n.e(3).then(n.bind(null,48)).then((function(t){var n=t.getCLS,c=t.getFID,r=t.getFCP,i=t.getLCP,s=t.getTTFB;n(e),c(e),r(e),i(e),s(e)}))};var g=function(){return Object(r.useContext)(k).isLoading?Object(u.jsx)("p",{children:"Loading..."}):null},m=(n(45),n(6));var v=function(){return Object(u.jsxs)("div",{id:"Corner-Menu",children:[Object(u.jsx)("div",{className:"link",children:Object(u.jsx)("a",{href:"https://github.com/p208p2002",target:"_blank",rel:"noreferrer",children:Object(u.jsx)(m.a,{className:"animate__animated animate__backInUp",style:{height:"100%",width:"100%"}})})}),Object(u.jsx)("div",{className:"link",children:Object(u.jsx)("a",{href:"https://p208p2002.github.io/",target:"_blank",rel:"noreferrer",children:Object(u.jsx)(m.b,{className:"animate__animated animate__backInUp",style:{height:"100%",width:"100%"}})})})]})};n(46);var _=function(){return Object(u.jsxs)("footer",{id:"Footer",children:[Object(u.jsx)("br",{}),(new Date).getFullYear()," \xa9 ","Philip Huang",Object(u.jsx)("br",{})]})},k=i.a.createContext({});function L(){var e=Object(r.useState)(!1),t=Object(c.a)(e,2),n=t[0],i=t[1];return Object(r.useEffect)((function(){document.title=j}),[]),Object(u.jsx)(k.Provider,{value:{isLoading:n,setLoading:i},children:Object(u.jsx)("div",{className:"container",children:Object(u.jsxs)("div",{className:"inner-container",children:[Object(u.jsx)(x,{}),Object(u.jsx)(g,{}),Object(u.jsx)(v,{}),Object(u.jsx)(_,{})]})})})}a.a.render(Object(u.jsx)(u.Fragment,{children:Object(u.jsx)(L,{})}),document.getElementById("root")),p()}},[[47,1,2]]]);
//# sourceMappingURL=main.b31ab9ba.chunk.js.map