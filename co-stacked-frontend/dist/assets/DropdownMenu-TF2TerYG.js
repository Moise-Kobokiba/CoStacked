import{c as n,u as i,j as e,m as r,L as t,U as d,a as m,M as l,P as h}from"./index-CD8b_UdK.js";/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]],u=n("layout-dashboard",p);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m4.93 4.93 4.24 4.24",key:"1ymg45"}],["path",{d:"m14.83 9.17 4.24-4.24",key:"1cb5xl"}],["path",{d:"m14.83 14.83 4.24 4.24",key:"q42g0n"}],["path",{d:"m9.17 14.83-4.24 4.24",key:"bqpfvv"}],["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}]],y=n("life-buoy",x);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=[["path",{d:"m16 17 5-5-5-5",key:"1bji2h"}],["path",{d:"M21 12H9",key:"dn1m92"}],["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}]],g=n("log-out",j);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _=[["path",{d:"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401",key:"kfwtm"}]],k=n("moon",_);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=[["path",{d:"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",key:"1i5ecw"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],v=n("settings",N);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]],M=n("sun",b),w="_toggleButton_b9nv8_5",f="_icon_b9nv8_43",I="_text_b9nv8_55",o={toggleButton:w,icon:f,text:I},L=()=>{const{theme:a,toggleTheme:c}=i();return e.jsxs("button",{className:o.toggleButton,onClick:c,"aria-label":`Switch to ${a==="light"?"dark":"light"} mode`,children:[a==="light"?e.jsx(M,{className:o.icon}):e.jsx(k,{className:o.icon}),e.jsx("span",{className:o.text,children:a==="light"?"Light Mode":"Dark Mode"})]})},$="_dropdown_mh2e8_5",G="_menuGroup_mh2e8_31",S="_menuItem_mh2e8_43",T="_icon_mh2e8_89",q="_separator_mh2e8_101",s={dropdown:$,menuGroup:G,menuItem:S,icon:T,separator:q},B={hidden:{opacity:0,scale:.95,y:-5,transition:{duration:.1}},visible:{opacity:1,scale:1,y:0,transition:{duration:.15}}},D=({onLogout:a})=>e.jsxs(r.div,{className:s.dropdown,variants:B,initial:"hidden",animate:"visible",exit:"hidden",children:[e.jsxs("div",{className:s.menuGroup,children:[e.jsxs(t,{to:"/dashboard",className:s.menuItem,children:[e.jsx(u,{className:s.icon}),e.jsx("span",{children:"Dashboard"})]}),e.jsxs(t,{to:"/profile",className:s.menuItem,children:[e.jsx(d,{className:s.icon}),e.jsx("span",{children:"Profile"})]}),e.jsxs(t,{to:"/my-network",className:s.menuItem,children:[e.jsx(m,{className:s.icon}),e.jsx("span",{children:"My Network"})]}),e.jsxs(t,{to:"/messages",className:s.menuItem,children:[e.jsx(l,{className:s.icon}),e.jsx("span",{children:"Messages"})]})]}),e.jsx("div",{className:s.separator}),e.jsxs("div",{className:s.menuGroup,children:[e.jsxs(t,{to:"/settings",className:s.menuItem,children:[e.jsx(v,{className:s.icon}),e.jsx("span",{children:"Settings"})]}),e.jsxs(t,{to:"/support",className:s.menuItem,children:[e.jsx(y,{className:s.icon}),e.jsx("span",{children:"Support"})]})]}),e.jsx("div",{className:s.separator}),e.jsx("div",{className:s.menuGroup,children:e.jsx(L,{})}),e.jsx("div",{className:s.separator}),e.jsx("div",{className:s.menuGroup,children:e.jsxs("button",{onClick:a,className:s.menuItem,children:[e.jsx(g,{className:s.icon}),e.jsx("span",{children:"Logout"})]})})]});D.propTypes={onLogout:h.func.isRequired};export{D as default};
//# sourceMappingURL=DropdownMenu-TF2TerYG.js.map
