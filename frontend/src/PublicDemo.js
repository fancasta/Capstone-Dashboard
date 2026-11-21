import { useEffect, useMemo, useState } from "react";
import { search } from "./corpusSearch";
import Passages from "./Passages";
import notes from "./fieldNotes.json";
import PublishedExamples from "./components/PublishedExamples";
import "./pages/explorer.css";
import "./public-demo.css";

const pillars = ["Environmental", "Social", "Governance"];
const formats = new Intl.NumberFormat("en");
const format = v => formats.format(v);
const casesUrl = "https://github.com/fancasta/climate-disclosure-explorer/blob/main/CASE_STUDIES.md";
const sourceUrl = "https://github.com/fancasta/esg-disclosure-dashboard";
const base = process.env.PUBLIC_URL || "";
const start = new URLSearchParams(window.location.search);

function Spectrum({items, selected, onChoose, max}) {
  return <div className="bars">{items.map(([name,value]) =>
    <button key={name} className={"bar-row" + (selected===name?" active":"")} onClick={()=>onChoose(name)} aria-label={name+", "+format(value)+" matching pages"}>
      <span>{name}</span><span className="track"><i style={{width:(max?100*value/max:0)+"%"}} /></span><b>{format(value)}</b>
    </button>)}</div>;
}

function PillarCoverage({catalog}) {
  const rows = useMemo(()=>{
    const grouped = new Map();
    for (const [reportId,,,labels] of catalog.pages) {
      const sector = catalog.reports[reportId].sector;
      if (!grouped.has(sector)) grouped.set(sector,{total:0,counts:[0,0,0]});
      const row = grouped.get(sector);
      row.total++;
      const groups = new Set(labels.map(i=>catalog.topics[i].pillar));
      pillars.forEach((p,i)=>{if(groups.has(p)) row.counts[i]++;});
    }
    return [...grouped].sort((a,b)=>a[0].localeCompare(b[0]));
  },[catalog]);
  return <section className="chart-panel"><h2>Pillar coverage by sector</h2>
    <p>Share of all indexed pages in each sector that mention a guided topic. Darker cells indicate a higher share.</p>
    <table className="heat"><thead><tr><th scope="col">Sector</th>{pillars.map(p=><th scope="col" key={p}><abbr title={p}>{p[0]}</abbr></th>)}</tr></thead>
      <tbody>{rows.map(([sector,row])=><tr key={sector}><th scope="row">{sector}</th>{row.counts.map((n,i)=>{
        const fraction=n/row.total;
        return <td key={i} style={{backgroundColor:"rgba(45,119,79,"+(.06+.70*fraction)+")"}} title={n+" of "+row.total+" pages · "+pillars[i]}>{Math.round(fraction*100)}%</td>;
      })}</tr>)}</tbody></table><p>E · Environmental　 S · Social　 G · Governance</p></section>;
}

function Coverage({catalog, hits, sector, chooseSector, chooseTopic}) {
  const counts = new Map();
  for (const r of catalog.reports) counts.set(r.sector,0);
  const topicCounts = catalog.topics.map(()=>0);
  for (const hit of hits) {
    const group = catalog.reports[hit.reportId].sector;
    counts.set(group,counts.get(group)+1);
    hit.labels.forEach(i=>topicCounts[i]++);
  }
  const ranked = [...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  return <aside className="analysis" id="search-charts">
    <section className="chart-panel"><h2>Results by sector</h2><p>Matching PDF pages. Select a sector to filter.</p>
      <Spectrum items={ranked} max={ranked[0]?.[1]||0} selected={sector} onChoose={chooseSector}/></section>
    <PillarCoverage catalog={catalog}/>
    <section className="chart-panel"><h2>Topics on these pages</h2><p>Pages can match several topics. Select a row to run that search.</p>
      {pillars.map((group,k)=>{
        const ids=catalog.topics.map((t,i)=>i).filter(i=>catalog.topics[i].pillar===group && topicCounts[i]);
        ids.sort((a,b)=>topicCounts[b]-topicCounts[a]||a-b);
        return <div className={"topic-strip pillar-"+k} key={group}><h3>{group}</h3>{ids.length?ids.slice(0,3).map(i=><button key={i} onClick={()=>chooseTopic(i)}><span>{catalog.topics[i].name}</span><b>{format(topicCounts[i])}</b></button>):<small>No topic phrases matched.</small>}</div>;
      })}</section></aside>;
}

function Notebook({reports, onSearch}) {
  return <div className="notebook"><header className="section-title"><h2>Evidence notebook</h2>
    <p>Ten passages with a reading note and a page reference. Open the source to check the scope of each claim.</p></header>
    <div className="note-grid">{notes.map(n=>{
      const r=reports.find(x=>x.publisher===n.publisher);
      return <article className="note" key={n.title}><p className={"pillar-text p"+pillars.indexOf(n.pillar)}>{n.pillar}</p>
        <h3>{n.title}</h3><div className="note-source">{n.publisher} · {r.edition} · p. {n.page}</div>
        <blockquote>“{n.excerpt}”</blockquote><p>{n.note}</p>
        <div className="note-links"><a href={r.url+"#page="+n.page} target="_blank" rel="noreferrer">Open PDF ↗</a>
          <button className="text-action" onClick={()=>onSearch(n.publisher)}>Search this report →</button></div></article>;
    })}</div><details className="original-cases"><summary>Six original ranked searches for Oracle, Anthropic and OpenAI</summary><PublishedExamples/></details></div>;
}

function Explorer({catalog,terms}) {
  const {reports,topics} = catalog;
  const initialTopic = start.has("q") || start.has("publisher") || start.has("sector") ? -1 : topics.findIndex(t=>t.name===(start.get("topic")||"Human rights"));
  const [topic,setTopic]=useState(start.has("topic")?topics.findIndex(t=>t.name===start.get("topic")):initialTopic);
  const [query,setQuery]=useState(start.get("q")||"");
  const [input,setInput]=useState(start.get("q")||"");
  const [publisher,setPublisher]=useState(reports.some(r=>r.publisher===start.get("publisher"))?start.get("publisher"):"");
  const [sector,setSector]=useState(reports.some(r=>r.sector===start.get("sector"))?start.get("sector"):"");
  const [tab,setTab]=useState(start.get("view")==="notes"?"notes":"search");
  const [pageNo,setPageNo]=useState(0);
  const [group,setGroup]=useState(start.has("topic") && topics.some(t=>t.name===start.get("topic")) ? topics.find(t=>t.name===start.get("topic")).pillar : "Social");
  const [showTopics,setShowTopics]=useState(false);
  const size=8;
  const hits=useMemo(()=>search(catalog,terms,query,topic,publisher,sector),[catalog,terms,query,topic,publisher,sector]);
  const resultReports=new Set(hits.map(r=>r.reportId)).size;
  const sectors=[...new Set(reports.map(r=>r.sector))].sort();
  const pages=Math.ceil(hits.length/size);
  const chosen=topic>=0?topics[topic]:null;
  const current=chosen?chosen.name:query||"All indexed pages";
  function pick(i){setTopic(i);setInput("");setQuery("");setPageNo(0);setGroup(topics[i].pillar);}
  function setSectorFilter(value){setSector(value);setPublisher("");setPageNo(0);}
  function clear(){setTopic(-1);setQuery("");setInput("");setPublisher("");setSector("");setPageNo(0);}
  function submit(e){e.preventDefault();setTopic(-1);setQuery(input.trim());setPageNo(0);}
  function notebookSearch(name){clear();setPublisher(name);setTab("search");}
  useEffect(()=>{
    const p=new URLSearchParams();
    if(chosen)p.set("topic",chosen.name);
    else if(query||(!publisher&&!sector))p.set("q",query);
    if(publisher)p.set("publisher",publisher);
    if(sector)p.set("sector",sector);
    if(tab==="notes")p.set("view","notes");
    window.history.replaceState(null,"",window.location.pathname+(p.toString()?"?"+p:""));
  },[chosen,query,publisher,sector,tab]);
  return <>
    <header className="mast"><div className="frame"><div className="project-line"><i/> NUS Business Analytics <span>/</span> NatWest Markets capstone</div>
      <h1>ESG Disclosure Explorer</h1>
      <p>Find how companies describe climate risk, working conditions and corporate oversight. Follow each result to its page in the source report.</p>
      <div className="stats">{[[reports.length,"reports"],[catalog.pages.length,"searchable pages"],[topics.length,"ESG topics"]].map(([v,l])=><div key={l}><b>{format(v)}</b><span>{l}</span></div>)}</div></div></header>
    <div className="view-nav"><nav className="frame" aria-label="Dashboard views">{[["search","Search reports"],["notes","Evidence notebook"]].map(([k,l])=><button key={k} onClick={()=>setTab(k)} aria-pressed={tab===k}>{l}</button>)}</nav></div>
    <main className="frame content">{tab==="notes"?<Notebook reports={reports} onSearch={notebookSearch}/>:<>
      <section className="query-panel"><form onSubmit={submit}><label htmlFor="page-query">Search the reports</label>
        <div className="input-row"><input id="page-query" type="search" placeholder="Try collective bargaining, methane or board independence" value={input} onChange={e=>setInput(e.target.value)}/><button type="submit" className="primary">Search</button></div></form>
        <div className="filters"><label>Sector<select aria-label="Sector" value={sector} onChange={e=>setSectorFilter(e.target.value)}><option value="">All sectors</option>{sectors.map(s=><option key={s}>{s}</option>)}</select></label>
          <label>Publisher<select aria-label="Publisher" value={publisher} onChange={e=>{setPublisher(e.target.value);setPageNo(0)}}><option value="">All publishers</option>{reports.filter(r=>!sector||r.sector===sector).map(r=>r.publisher).sort().map(s=><option key={s}>{s}</option>)}</select></label>
          <button className="outline" aria-expanded={showTopics} onClick={()=>setShowTopics(!showTopics)}>{showTopics?"Close topic guide":"Browse 30 topics"} {showTopics?"−":"+"}</button>
          <button className="text-action" onClick={clear}>Reset</button></div>
        {showTopics&&<div className="topic-guide"><div className="pillar-choices">{pillars.map((p,i)=><button key={p} className={"p"+i} aria-pressed={group===p} onClick={()=>setGroup(p)}>{p}</button>)}</div>
          <div className="topic-chips">{topics.map((t,i)=>t.pillar===group&&<button key={i} aria-pressed={topic===i} onClick={()=>pick(i)}>{t.name}</button>)}</div></div>}
      </section>
      <div className="results-grid"><section className="results"><header className="result-heading"><p className="section-kicker">Page results</p><a className="mobile-charts" href="#search-charts">View charts ↓</a><h2>{current}</h2>
        <p aria-live="polite">{format(hits.length)} {hits.length===1?"page":"pages"} across {format(resultReports)} {resultReports===1?"report":"reports"}{chosen?" matching a topic phrase.":query?" containing all search terms.":" in the selected collection."}</p>
        {chosen&&<p className="phrase-list">Matched phrases · {chosen.phrases.join(" / ")}</p>}</header>
        {!hits.length&&<div className="empty"><h3>No matching pages</h3><p>Try a shorter query, another spelling or a broader publisher filter.</p><button className="outline" onClick={clear}>Browse all reports</button></div>}
        {hits.slice(pageNo*size,(pageNo+1)*size).map(h=>{
          const r=reports[h.reportId],n=notes.find(item=>item.publisher===r.publisher&&item.page===h.page);
          return <article key={h.id} className="hit"><div className="hit-meta"><span>{r.sector}</span><span>{r.edition}</span><span>PDF p. {h.page}</span></div>
            <h3>{r.publisher}</h3><p className="report-title">{r.title} · {r.kind}</p>
            {n&&<blockquote>“{n.excerpt}”</blockquote>}
            {h.labels.length>0&&<div className="match-tags">{(chosen?[topic,...h.labels.filter(i=>i!==topic)]:h.labels).slice(0,4).map(i=><button key={i} onClick={()=>pick(i)}>{topics[i].name}</button>)}</div>}
            <div className="hit-links"><a href={r.url+"#page="+h.page} target="_blank" rel="noreferrer">{r.publisher==="Oracle"?"Open Oracle PDF ↗":"Source PDF ↗"}</a><Passages report={r} page={h.page} query={chosen?chosen.phrases:[query]}/></div></article>;
        })}
        {pages>1&&<div className="pager"><button className="outline" disabled={!pageNo} onClick={()=>setPageNo(n=>n-1)}>Previous</button><span>Page {format(pageNo+1)} of {format(pages)}</span><button className="outline" disabled={pageNo+1>=pages} onClick={()=>setPageNo(n=>n+1)}>Next</button></div>}
      </section><Coverage catalog={catalog} hits={hits} sector={sector} chooseSector={v=>setSectorFilter(v===sector?"":v)} chooseTopic={pick}/></div>
    </>}
    <details className="method"><summary>About the capstone and search method</summary>
      <p>From August to December 2022, an NUS Business Analytics team worked with NatWest Markets on using machine learning to explore corporate decarbonisation strategies. The public explorer adds cross-report environmental, social and governance search to that project.</p>
      <p>The collection covers {format(reports.reduce((a,r)=>a+r.pages,0))} physical PDF pages. Search includes {format(catalog.pages.length)} pages with extractable terms. Free-text queries require all significant words and rank matching pages using BM25. Topic searches match a listed phrase and rank those pages using the phrase vocabulary. Charts count pages and overlap across topics. Reporting a topic does not establish performance.</p>
      <p>The browser reads excerpts from the source PDF on demand. Oracle opens full pages in its own viewer. Selected Oracle pages also have verified excerpts or reading notes in the dashboard. Open the cited page to review tables, footnotes and the original layout. <a href={casesUrl}>Read the worked examples ↗</a></p></details></main>
    <footer className="frame esg-foot"><a href={sourceUrl}>Dashboard code ↗</a><a href={casesUrl}>Methods and case studies ↗</a></footer></>;
}

export default function PublicDemo(){
  const [data,setData]=useState(null),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
  useEffect(()=>{const ctl=new AbortController();setError(false);
    Promise.all(["catalog","terms"].map(async name=>{const response=await fetch(base+"/corpus/"+name+".json",{signal:ctl.signal});if(!response.ok)throw new Error(name);return response.json();}))
      .then(setData).catch(()=>{if(!ctl.signal.aborted)setError(true);});return ()=>ctl.abort();},[attempt]);
  return <div className="esg">{data?<Explorer catalog={data[0]} terms={data[1]}/>:<main className="frame loading"><h1>ESG Disclosure Explorer</h1><p role="status">{error?"The report index could not be loaded.":"Loading the report index…"}</p>{error&&<button onClick={()=>setAttempt(i=>i+1)}>Retry</button>}</main>}</div>;
}
