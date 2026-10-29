/* Nobody Is Buying: browser Meta Pixel events.
   PIXEL ID 1643741683962753
   Purchase is NOT sent here; use verified Stripe webhooks.
   Load once only. Respects a visitor's optional tracking choice. */
(() => {
"use strict";
const ID="1643741683962753";
const K="nib_meta_tracking_consent_v1";
const P={
 "https://buy.stripe.com/5kQ5kFfFEamugJocJC6Na00": {id:"nib_ebook",name:"Nobody Is Buying eBook",value:29},
 "https://buy.stripe.com/aFafZjgJIcuC3WC9xq6Na02": {id:"nib_diagnosis",name:"Full Diagnosis + Report",value:49},
 "https://buy.stripe.com/14AbJ32SS3Y6dxcbFy6Na01": {id:"nib_rebuild",name:"Offer Rebuild",value:199}
};
let on=false;
function get(){try{return localStorage.getItem(K)}catch(e){return null}}
function put(v){try{localStorage.setItem(K,v)}catch(e){}}
function start(){
 if(on)return;
 on=true;
 !function(f,b,e,v,n,t,s){
 if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
 if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];
 t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);
 }(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");
 if(typeof fbq==="function"){
 fbq("init",ID);
 fbq("track","PageView");
 if(location.pathname==="/"||location.pathname.endsWith("/index.html"))
 fbq("track","ViewContent",{content_ids:["nib_ebook"],content_type:"product",value:29,currency:"USD"});
 }
}
function choice(){
 document.getElementById("nib-consent")?.remove();
 const box=document.createElement("div");
 box.id="nib-consent";
 box.setAttribute("role","dialog");
 box.setAttribute("aria-label","Optional advertising tracking");
 Object.assign(box.style,{position:"fixed",zIndex:99999,left:"12px",right:"12px",bottom:"12px",maxWidth:"640px",margin:"auto",border:"1px solid #7cff1f",borderRadius:"12px",padding:"17px",background:"#101310",color:"white",boxShadow:"0 10px 50px #0009",font:"14px/1.5 system-ui,sans-serif"});
 const p=document.createElement("p");
 p.textContent="May we use optional Meta advertising tracking to measure page visits and checkout clicks? You can decline and still use the website.";
 p.style.margin="0 0 12px";
 box.appendChild(p);
 for(const [label,result] of [["No thanks","denied"],["Allow tracking","granted"]]){
 const b=document.createElement("button");b.type="button";b.textContent=label;
 Object.assign(b.style,{cursor:"pointer",border:"1px solid #7cff1f",borderRadius:"8px",padding:"9px 14px",marginRight:"10px",marginBottom:"4px",fontWeight:"700",background:result==="granted"?"#7cff1f":"transparent",color:result==="granted"?"#071007":"white"});
 b.addEventListener("click",()=>{
 put(result);box.remove();
 if(result==="granted")start();
 else if(on)location.reload();
 });
 box.appendChild(b);
 }
 document.body.appendChild(box);
}
function init(){
 const footer=document.querySelector("footer");
 if(footer){
 const b=document.createElement("button");b.textContent="Tracking preferences";b.type="button";
 Object.assign(b.style,{background:"transparent",color:"inherit",border:"none",textDecoration:"underline",cursor:"pointer",margin:"8px",font:"inherit"});
 b.addEventListener("click",choice);footer.appendChild(b);
 }
 document.addEventListener("click",e=>{
 if(!on||typeof fbq!=="function")return;
 const a=e.target.closest?.("a[href]");if(!a)return;
 let key;try{const u=new URL(a.href);key=u.origin+u.pathname}catch(_){return}
 const product=P[key];if(!product)return;
 fbq("track","InitiateCheckout",{content_type:"product",content_ids:[product.id],content_name:product.name,value:product.value,currency:"USD",num_items:1});
 },true);
 if(get()==="granted")start();
 else if(get()===null)choice();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
else init();
})();
