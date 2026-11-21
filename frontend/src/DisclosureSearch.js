import { useContext, useMemo, useState } from "react";
import { Navigation, RouteLink } from "./disclosureNavigation";
import { search } from "./corpusSearch";
import { sourcePageUrl } from "./sourcePageUrl";
import { ReportSearch, ReportOverview } from "./ReportSearch";
import Passages from "./Passages";

const format=n=>n.toLocaleString("en");
const counted=(n,one,many=one+"s")=>format(n)+" "+(n===1?one:many);
const pillars=["Environmental","Social","Governance"];
const library={explore:true};

function SearchForm({catalog,route}) {
  const go=useContext(Navigation);
  const [input,setInput]=useState(route.q||"");
  const [more,setMore]=useState(false);
  function submit(e){
    e.preventDefault();
    const q=input.trim();
    const prefix=q.toLowerCase();
    const exact=catalog.reports.find(r=>r.publisher.toLowerCase()===prefix);
    const starts=prefix.length>=3 ? catalog.reports.filter(r=>r.publisher.toLowerCase().startsWith(prefix)) : [];
    const match=exact || (starts.length===1 ? starts[0] : null);
    const topic=catalog.topics.find(t=>t.name.toLowerCase()===q.toLowerCase());
    if(match)go({...library,publisher:match.publisher});
    else if(topic)go({...library,topic:topic.name,sector:route.sector});
    else go({...library,q,sector:route.sector});
  }
  return <div className="search-tools"><form onSubmit={submit}>
    <label htmlFor="esg-query">Keywords or company name</label>
    <div className="search-line"><div className="search-input"><span aria-hidden="true" className="lens"/>
      <input type="search" id="esg-query" autoComplete="off" placeholder="e.g. methane leakage or Shell" value={input} onChange={e=>setInput(e.target.value)}/></div>
      <button type="submit" className="primary">Search <span aria-hidden="true">→</span></button></div></form>
    <div className="search-options"><label><span>Guided topic</span><select aria-label="Guided topic" value={route.topic||""} onChange={e=>go({...library,topic:e.target.value,sector:route.sector})}>
      <option value="">All topics</option>{pillars.map(p=><optgroup label={p} key={p}>{catalog.topics.filter(t=>t.pillar===p).map(t=><option key={t.name}>{t.name}</option>)}</optgroup>)}</select></label>
      <button className="filter-toggle" aria-expanded={more || !!route.sector} onClick={()=>setMore(!more)} disabled={!!route.sector} hidden={!!route.sector}>Sector filter {more?"−":"+"}</button>
      {(more || route.sector)&&<label><span>Sector</span><select aria-label="Sector" value={route.sector||""} onChange={e=>go({...route,sector:e.target.value,publisher:"",page:null})}><option value="">All sectors</option>{[...new Set(catalog.reports.map(r=>r.sector))].sort().map(s=><option key={s}>{s}</option>)}</select></label>}
    </div></div>;
}

function ActiveScope({route}) {
  const active=[["topic",route.topic],["q",route.q],["sector",route.sector]].filter(([,v])=>v);
  if(!active.length)return null;
  return <div className="scope" aria-label="Active search conditions">{active.map(([key,v])=><RouteLink key={key} to={{...route,[key]:"",publisher:"",page:null}} aria-label={"Remove "+v}>{v} <span aria-hidden="true">×</span></RouteLink>)}
    {active.length>1&&<RouteLink className="clear-link" to={library}>Clear all</RouteLink>}</div>;
}

function CompanyList({groups,route,hasQuery}) {
  const [limit,setLimit]=useState(10);
  return <><div className="company-table"><div className="table-label"><span>Company &amp; report</span><span>{hasQuery?"Matching pages":"Indexed pages"}</span></div>
    {groups.slice(0,limit).map(({report,hits})=>{
      const heading=report.sector+" · "+report.edition;
      return <RouteLink to={{...route,publisher:report.publisher,page:null}} key={report.publisher} className="company-row">
        <span className="company-title"><strong>{report.publisher}</strong><span>{heading} · {report.title}</span></span>
        <span className="hit-count">{format(hits.length)} <span className="arrow" aria-hidden="true">→</span></span>
      </RouteLink>;
    })}</div>{limit<groups.length&&<button className="secondary load-more" onClick={()=>setLimit(n=>n+10)}>Show {Math.min(10,groups.length-limit)} more companies</button>}</>;
}

function ReportReader({catalog,route,group,chosen}) {
  const {report,hits}=group;
  const go=useContext(Navigation);
  const selected=hits.find(h=>h.page===route.page) || hits[0];
  const idx=hits.indexOf(selected);
  const previous={...route,publisher:"",page:null};
  const terms=chosen?chosen.phrases.join(" "):route.q || "";
  const isQuery=!!(chosen || route.q);
  const labels=(selected?.labels||[]).map(i=>catalog.topics[i].name);
  function turn(i){go({...route,page:hits[i].page},{scroll:false});}
  return <main className="frame reader main-surface" id="main" tabIndex="-1">
    <RouteLink to={previous} className="back-link">← {isQuery||route.sector?"Back to company results":"All companies"}</RouteLink>
    <header className="reader-header"><div><p className="eyebrow">{report.sector} <i/> {report.edition}</p>
      <h1>{report.publisher}</h1><p>{report.title} · {report.kind}</p></div>
      <div className="reader-count"><strong>{format(hits.length)}</strong><span>{isQuery?(hits.length===1?"matching page":"matching pages"):"indexed pages"}</span></div></header>
    <ReportSearch key={[report.publisher,route.q,route.topic].join("|")} report={report} catalog={catalog} route={route}/>
    {!hits.length?<section className="empty-state report-empty"><h2>No matching pages in {report.publisher}</h2><p>Try fewer words, choose another topic, or search the collection for the same terms.</p><RouteLink className="secondary" to={previous}>Search all companies →</RouteLink></section>:
      !isQuery && !route.page ? <ReportOverview catalog={catalog} route={route} report={report} hits={hits}/>:
    <section className="reader-columns"><div className="reader-controls"><h2>{isQuery?"Matching pages":"Report pages"}</h2>
      {isQuery&&<p className="query-term">{chosen?.name||route.q}</p>}
      <p>{isQuery?"Pages are ordered by relevance.":"Pages are ordered by PDF page number."}</p>
      <label htmlFor="page-choice">Choose a PDF page</label><select id="page-choice" value={selected.page} onChange={e=>go({...route,page:Number(e.target.value)},{scroll:false})}>
        {hits.map((h,i)=><option key={h.id} value={h.page}>{isQuery?"Match "+(i+1)+" · ":""}Page {h.page}</option>)}</select>
      <div className="page-nav"><button aria-label="Previous page in results" disabled={!idx} onClick={()=>turn(idx-1)}>← Previous</button><button aria-label="Next page in results" disabled={idx===hits.length-1} onClick={()=>turn(idx+1)}>Next →</button></div>
    </div><article className="source-paper" aria-live="polite"><div className="sheet-header"><span className="sheet-mark" aria-hidden="true"/><span>Report evidence</span><span className="folio">{idx+1} / {hits.length}</span></div>
      <h2 id="evidence-heading" tabIndex="-1">PDF page {selected.page}</h2>
      <Passages key={report.publisher+"|"+selected.page+"|"+terms} report={report} page={selected.page} query={terms}/>
      <div className="citation"><div><strong>{report.publisher}</strong><span>{report.edition} · PDF p. {selected.page}</span></div>
        <a className="primary" href={sourcePageUrl(report,selected.page)} target="_blank" rel="noreferrer">Open source page <span aria-hidden="true">↗</span></a></div>
      {labels.length>0&&<p className="page-labels">Topics on this page · {labels.join(", ")}</p>}
    </article></section>}
  </main>;
}

export default function DisclosureSearch({catalog,terms,route}) {
  const chosen=catalog.topics.find(t=>t.name===route.topic);
  const hasQuery=!!(chosen||route.q);
  const groups=useMemo(()=>{
    const hits=search(catalog,terms,route.q||"",chosen?catalog.topics.indexOf(chosen):-1,"",route.sector||"");
    const companies=new Map();
    for(const hit of hits){
      const report=catalog.reports[hit.reportId];
      if(!companies.has(report.publisher))companies.set(report.publisher,{report,hits:[]});
      companies.get(report.publisher).hits.push(hit);
    }
    const list=[...companies.values()];
    return hasQuery?list:list.sort((a,b)=>a.report.publisher.localeCompare(b.report.publisher));
  },[catalog,terms,route.q,route.sector,chosen,hasQuery]);
  const selected=groups.find(g=>g.report.publisher===route.publisher);
  const company=route.publisher && catalog.reports.find(r=>r.publisher===route.publisher);
  if(company)return <ReportReader catalog={catalog} route={route} group={selected || {report:company,hits:[]}} chosen={chosen}/>;
  const visible=route.publisher?[]:groups;
  const pageCount=visible.reduce((n,g)=>n+g.hits.length,0);
  const context=chosen?.name || route.q;
  const companyMatches=route.q && !selected ? catalog.reports.filter(r=>r.publisher.toLowerCase().includes(route.q.toLowerCase())&&(!route.sector||r.sector===route.sector)): [];
  return <main className="frame directory main-surface" id="main" tabIndex="-1">
    <header className="directory-intro"><p className="eyebrow">Report library</p><h1>Explore reports</h1><p>Search a topic or company, then select a report to read the evidence.</p></header>
    <SearchForm key={[route.q,route.topic].join("|")} catalog={catalog} route={route}/>
    <ActiveScope route={route}/>
    {companyMatches.length>0&&<div className="company-name-matches">Company name matches {companyMatches.map(r=><RouteLink key={r.publisher} to={{...library,publisher:r.publisher}}>{r.publisher} →</RouteLink>)}</div>}
    <section className="company-section" aria-labelledby="companies-heading"><div className="results-header"><div>
      <h2 id="companies-heading">{hasQuery?"Company results":"Company directory"}</h2>
      <p aria-live="polite">{counted(visible.length,"company","companies")} · {counted(pageCount,hasQuery?"matching page":"indexed page")}{context?" for “"+context+"”":""}{route.sector?" in "+route.sector:""}.</p></div>
      {visible.length>1&&<small>{hasQuery?"Best page match first":"Alphabetical order"}</small>}</div>
      {visible.length?<CompanyList key={[route.q,route.topic,route.sector].join("|")} groups={visible} route={route} catalog={catalog} hasQuery={hasQuery}/>:
        <div className="empty-state"><h3>No matching pages</h3><p>Try fewer words or remove a filter to widen your search.</p><RouteLink className="secondary" to={library}>Browse all companies →</RouteLink></div>}
    </section>
    <details className="search-method"><summary>How are matches counted?</summary><p>Each result counts a physical PDF page once per report. A guided topic matches at least one of its listed phrases{chosen?" (“"+chosen.phrases.join("”, “")+"”)":""}. Keyword searches require all significant words on the same page. Pages are ranked by BM25 text relevance. These counts measure disclosure coverage.</p></details>
  </main>;
}
