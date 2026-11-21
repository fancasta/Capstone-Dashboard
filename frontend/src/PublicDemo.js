import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import DisclosureHome from "./DisclosureHome";
import DisclosureSearch from "./DisclosureSearch";
import { Navigation, RouteLink, readRoute, urlFor } from "./disclosureNavigation";
import "./public-demo.css";

const base=process.env.PUBLIC_URL || "";
const project="https://github.com/fancasta/esg-disclosure-dashboard";
const research="https://github.com/fancasta/climate-disclosure-explorer";

function Brand(){
  return <RouteLink to={{}} className="brand" aria-label="ESG Disclosure Explorer home"><span className="brand-symbol" aria-hidden="true"><i/><i/><i/></span>ESG Disclosure Explorer</RouteLink>;
}

function Explorer({catalog}) {
  const [route,setRoute]=useState(()=>readRoute(catalog));
  const [terms,setTerms]=useState(null);
  const [error,setError]=useState(false);
  const [attempt,setAttempt]=useState(0);
  // Page citations can open below the report controls, particularly on a phone.
  const focusTarget=useRef(route.publisher && route.page ? "evidence-heading" : null);
  const position=useRef(null);
  const go=useCallback((next,{scroll=true}={})=>{
    const nextUrl=urlFor(next);
    if(window.location.pathname+window.location.search===nextUrl)return;
    const oldRoute=readRoute(catalog);
    window.history.replaceState({disclosureScroll:window.scrollY},"",window.location.href);
    window.history.pushState(null,"",nextUrl);
    focusTarget.current=null;
    if(scroll){
      if(next.publisher && next.page)focusTarget.current="evidence-heading";
      else if(oldRoute.explore!==!!next.explore || oldRoute.publisher!==(next.publisher||""))focusTarget.current="main";
    }
    position.current=scroll?0:null;
    setRoute(readRoute(catalog));
  },[catalog]);
  useEffect(()=>{
    // Normalize old notebook links while retaining the research question and filters.
    const canonical=urlFor(readRoute(catalog));
    if(window.location.pathname+window.location.search!==canonical)window.history.replaceState(window.history.state,"",canonical);
    function back(){
      position.current=window.history.state?.disclosureScroll ?? 0;
      focusTarget.current="main";
      setRoute(readRoute(catalog));
    }
    window.addEventListener("popstate",back);
    return ()=>window.removeEventListener("popstate",back);
  },[catalog]);
  useLayoutEffect(()=>{
    document.title=(route.publisher||route.topic||route.q||(route.explore?"Explore reports":"Home"))+" · ESG Disclosure Explorer";
    if(route.explore && !terms)return;
    // Move focus after React has finished replacing the previous view's controls.
    const frame=window.requestAnimationFrame(()=>{
      const target=focusTarget.current && document.getElementById(focusTarget.current);
      if(target)target.focus({preventScroll:true});
      if(target?.id==="evidence-heading")target.scrollIntoView({block:"start"});
      else if(position.current!==null)window.scrollTo(0,position.current);
      focusTarget.current=null;
      position.current=null;
    });
    return ()=>window.cancelAnimationFrame(frame);
  },[route,terms]);
  useEffect(()=>{
    if(!route.explore || terms)return;
    const ctl=new AbortController();
    setError(false);
    fetch(base+"/corpus/terms.json",{signal:ctl.signal}).then(res=>{
      if(!res.ok)throw Error("Index unavailable");
      return res.json();
    }).then(setTerms).catch(()=>{if(!ctl.signal.aborted)setError(true);});
    return ()=>ctl.abort();
  },[route.explore,terms,attempt]);
  return <Navigation.Provider value={go}><div className="disclosure">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="topbar"><div className="frame site-head"><Brand/><nav aria-label="Main navigation">
      <RouteLink to={{}} aria-current={route.explore?undefined:"page"}>Home</RouteLink>
      <RouteLink to={{explore:true}} aria-current={route.explore?"page":undefined}>Explore reports</RouteLink></nav></div></header>
    {!route.explore?<main id="main" tabIndex="-1"><DisclosureHome catalog={catalog}/></main>:terms?
      <DisclosureSearch catalog={catalog} terms={terms} route={route}/>:<main className="frame waiting" id="main" tabIndex="-1">
        <h1>Explore reports</h1><p role="status">{error?"The search index could not be loaded.":"Loading the search index…"}</p>
        {error&&<button className="secondary" onClick={()=>setAttempt(n=>n+1)}>Try again</button>}</main>}
    <footer className="site-foot"><div className="frame"><p>ESG Disclosure Explorer</p><div>{process.env.REACT_APP_PUBLIC_DEMO!=="true" && <a href="/workspace">Local reporting workspace →</a>}<a href={research}>Research &amp; methods ↗</a><a href={project}>Dashboard code ↗</a></div></div></footer>
  </div></Navigation.Provider>;
}

export default function PublicDemo(){
  const [catalog,setCatalog]=useState(null),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
  useEffect(()=>{
    const ctl=new AbortController();
    setError(false);
    fetch(base+"/corpus/catalog.json",{signal:ctl.signal}).then(res=>{
      if(!res.ok)throw Error("Collection unavailable");
      return res.json();
    }).then(setCatalog).catch(()=>{if(!ctl.signal.aborted)setError(true);});
    return ()=>ctl.abort();
  },[attempt]);
  return catalog?<Explorer catalog={catalog}/>:<div className="disclosure"><main className="frame waiting"><h1>ESG Disclosure Explorer</h1><p role="status">{error?"The collection could not be loaded.":"Opening the collection…"}</p>{error&&<button onClick={()=>setAttempt(n=>n+1)}>Try again</button>}</main></div>;
}
