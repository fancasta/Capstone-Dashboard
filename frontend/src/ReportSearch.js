import { useContext, useState } from "react";
import { Navigation, RouteLink } from "./disclosureNavigation";

const pillars=["Environmental","Social","Governance"];
export function ReportSearch({report,catalog,route}) {
  const go=useContext(Navigation);
  const [input,setInput]=useState(route.q||"");
  const base={...route,publisher:report.publisher,page:null,q:"",topic:""};
  function submit(e){
    e.preventDefault();
    const q=input.trim();
    const topic=catalog.topics.find(t=>t.name.toLowerCase()===q.toLowerCase());
    go(topic?{...base,topic:topic.name}:{...base,q});
  }
  return <section className="report-search search-tools" aria-label={"Search within "+report.publisher}>
    <form onSubmit={submit}><label htmlFor="report-query">Search within this report</label>
      <div className="search-line"><div className="search-input"><span className="lens" aria-hidden="true"/>
        <input id="report-query" type="search" value={input} placeholder="e.g. water consumption" onChange={e=>setInput(e.target.value)}/></div>
        <button type="submit" className="primary">Search</button></div></form>
    <div className="search-options"><label><span>Guided topic</span><select aria-label="Guided topic in this report" value={route.topic||""} onChange={e=>go({...base,topic:e.target.value})}>
      <option value="">All topics</option>{pillars.map(p=><optgroup label={p} key={p}>{catalog.topics.filter(t=>t.pillar===p).map(t=><option key={t.name}>{t.name}</option>)}</optgroup>)}</select></label>
      {(route.q||route.topic)&&<RouteLink className="reset-report" to={base}>Clear report search</RouteLink>}
    </div></section>;
}

export function ReportOverview({report,catalog,hits,route}) {
  const counts=catalog.topics.map((t,id)=>({...t,count:hits.filter(h=>h.labels.includes(id)).length})).filter(t=>t.count);
  const choices=pillars.map(p=>counts.filter(t=>t.pillar===p).sort((a,b)=>b.count-a.count)[0]).filter(Boolean);
  return <section className="report-overview"><h2>Explore this report</h2>
    {choices.length>0&&<><p>Choose a topic to read matching pages from {report.publisher}.</p><div className="report-questions">
      {choices.map(t=><RouteLink key={t.name} to={{...route,explore:true,topic:t.name,q:"",page:null}}>
        <small>{t.pillar}</small><strong>{t.name}</strong><span>{t.count} matching {t.count===1?"page":"pages"} →</span>
      </RouteLink>)}</div></>}
    {hits.length>0&&<RouteLink className="secondary" to={{...route,page:hits[0].page}}>Browse all {hits.length} indexed pages →</RouteLink>}
  </section>;
}
