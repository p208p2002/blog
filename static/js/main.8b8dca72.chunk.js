(this.webpackJsonpscooter=this.webpackJsonpscooter||[]).push([[0],{19:function(e,t,n){},20:function(e,t,n){},21:function(e,t,n){},24:function(e,t,n){},44:function(e,t,n){},45:function(e,t,n){"use strict";n.r(t),n.d(t,"RootContext",(function(){return v}));var c=n(3),r=n(2),i=n.n(r),s=n(14),a=n.n(s),o=(n(19),n(20),/md$|ipynb$/),j=/#blog/,b=(n(21),n(5)),l=n.n(b),d=n(0);var u=function(e){var t=e.post,n=Object.keys(t.files)[0],c=t.created_at,r=t.updated_at,i=t.html_url,s=t.description;return Object(d.jsxs)("div",{id:"Post-Block",children:[Object(d.jsx)("div",{children:Object(d.jsx)("a",{href:i,target:"_blank",rel:"noreferrer",children:n})}),Object(d.jsx)("div",{children:Object(d.jsxs)("small",{children:[s.replace(j,""),Object(d.jsx)("br",{}),Object(d.jsxs)("span",{children:[Object(d.jsx)("b",{children:"create at: "}),l()(c).format("LLL")]}),Object(d.jsx)("br",{}),Object(d.jsxs)("span",{children:[Object(d.jsx)("b",{children:"update at: "}),l()(r).format("LLL")]})]})})]},n)};n(24);var h=function(){var e=Object(r.useState)(""),t=Object(c.a)(e,2),n=t[0],i=t[1];return Object(d.jsx)("div",{id:"Search-Bar",children:Object(d.jsxs)("form",{id:"Searrch-Form",children:[Object(d.jsx)("input",{placeholder:"Seacrh on Gist",type:"text",value:n,onChange:function(e){i(e.target.value)}}),Object(d.jsx)("button",{type:"submit",onClick:function(e){e.preventDefault(),window.open("https://gist.github.com/search?q="+encodeURI("user:".concat("p208p2002"," ").concat(n))),i("")},children:Object(d.jsx)("i",{className:"fa fa-search"})})]})})},O=n(25);var f=function(){var e=Object(r.useState)([]),t=Object(c.a)(e,2),n=t[0],i=t[1],s=Object(r.useContext)(v).setLoading;return Object(r.useEffect)((function(){var e,t;e=o,t=j,s(!0),O.get("https://api.github.com/users/p208p2002/gists").then((function(c){console.log(c.data),n=(n=c.data).filter((function(n){var c=Object.keys(n.files)[0],r=n.description;return!(!c.match(e)||!r.match(t))})),i(n)})).catch((function(e){console.log(e)})).then((function(){s(!1)}))}),[]),Object(d.jsxs)("div",{id:"App",children:[Object(d.jsx)(h,{}),Object(d.jsx)("div",{children:n.map((function(e,t){return Object(d.jsx)(u,{post:e},t)}))})]})},x=function(e){e&&e instanceof Function&&n.e(3).then(n.bind(null,46)).then((function(t){var n=t.getCLS,c=t.getFID,r=t.getFCP,i=t.getLCP,s=t.getTTFB;n(e),c(e),r(e),i(e),s(e)}))};var p=function(){return Object(r.useContext)(v).isLoading?Object(d.jsx)("p",{children:"Loading..."}):null};n(44);var g=function(){return Object(d.jsxs)("footer",{id:"Footer",children:[Object(d.jsx)("br",{}),(new Date).getFullYear()," \xa9 ","Philip Huang",Object(d.jsx)("br",{}),Object(d.jsxs)("small",{children:["Website design and develop by ",Object(d.jsx)("b",{children:Object(d.jsx)("a",{href:"https://github.com/p208p2002",target:"_blank",rel:"noreferrer",children:"Philip Huang"})})]})]})},v=i.a.createContext({});function m(){var e=Object(r.useState)(!1),t=Object(c.a)(e,2),n=t[0],i=t[1];return Object(d.jsx)(v.Provider,{value:{isLoading:n,setLoading:i},children:Object(d.jsx)("div",{className:"container",children:Object(d.jsxs)("div",{className:"inner-container",children:[Object(d.jsx)(f,{}),Object(d.jsx)(p,{}),Object(d.jsx)(g,{})]})})})}a.a.render(Object(d.jsx)(d.Fragment,{children:Object(d.jsx)(m,{})}),document.getElementById("root")),x()}},[[45,1,2]]]);
//# sourceMappingURL=main.8b8dca72.chunk.js.map