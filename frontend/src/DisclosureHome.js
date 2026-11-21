import { RouteLink } from "./disclosureNavigation";
import notes from "./fieldNotes.json";

const questions = [
  ["Water stewardship","How do companies manage water use?"],
  ["Collective bargaining","Which reports discuss workers’ bargaining rights?"],
  ["Board independence","Where do companies describe board independence?"]
];

function EvidencePreview({catalog}) {
  const note = notes.find(n => n.publisher === "NRG Energy" && n.page === 42);
  const report = catalog.reports.find(r=>r.publisher===note.publisher);
  return <aside className="evidence-preview" aria-label="Example disclosure">
    <div className="plate-grid" aria-hidden="true"/>
    <div className="evidence-sheet">
      <div className="sheet-header"><span className="sheet-mark" aria-hidden="true"/><span>Report excerpt</span><span className="folio">p. {note.page}</span></div>
      <h2>{report.publisher}</h2><p className="sheet-caption">{report.title} · {report.edition}</p>
      <blockquote>“cooling towers that <mark>reduce water consumption</mark> and environmental impact”</blockquote>
      <RouteLink to={{explore:true, topic:"Water stewardship",publisher:report.publisher,page:note.page}}>Trace this passage <span aria-hidden="true">→</span></RouteLink>
    </div>
  </aside>;
}

export default function DisclosureHome({catalog}) {
  const sectors = new Set(catalog.reports.map(r=>r.sector));
  return <div className="home-body"><section className="home-intro frame">
    <div className="hero-copy"><p className="eyebrow"><i/> NUS capstone · NatWest Markets</p>
      <h1>Find the evidence in <em>ESG reports.</em></h1>
      <p className="intro-deck">Search environmental, social and governance disclosures across companies. See which reports mention a topic, then read the passage behind each match.</p>
      <RouteLink to={{explore:true}} className="primary">Explore reports <span aria-hidden="true">→</span></RouteLink>
    </div><EvidencePreview catalog={catalog}/>
  </section>
  <div className="collection-band"><div className="frame stat-row">
    {[[catalog.reports.length,"public reports"],[catalog.pages.length,"searchable pages"],[sectors.size,"sectors"],[catalog.topics.length,"guided topics"]].map(([n,label])=><div key={label}><strong>{n.toLocaleString("en")}</strong><span>{label}</span></div>)}
  </div></div>
  <section className="frame questions" aria-labelledby="question-title"><div className="question-intro"><p className="eyebrow">Across the collection</p>
    <h2 id="question-title">Start with a question</h2><p>Each count shows how many of the {catalog.reports.length} reports contain a phrase for that topic. Select a question to compare companies.</p></div>
    <div className="question-list">{questions.map(([topic,text],idx)=>{
      const id = catalog.topics.findIndex(t=>t.name===topic);
      const count = new Set(catalog.pages.filter(p=>p[3].includes(id)).map(p=>p[0])).size;
      return <RouteLink key={topic} to={{explore:true,topic}} className={"question q"+idx}>
        <div><small>{catalog.topics[id].pillar}</small><h3>{text}</h3></div>
        <div className="coverage"><span>{count} of {catalog.reports.length} reports</span><i><b style={{width:(100*count/catalog.reports.length)+"%"}}/></i></div>
        <span className="question-arrow" aria-hidden="true">↗</span></RouteLink>;
    })}</div></section>
  <section className="home-guide"><div className="frame"><h2>How to use the explorer</h2>
    <ol><li><strong>Choose a question</strong><span>Search your own words, pick a topic, or enter a company name.</span></li>
      <li><strong>Compare companies</strong><span>See how many pages match in each report. Narrow to a sector if needed.</span></li>
      <li><strong>Check the source</strong><span>Open a company, read a passage and follow its page reference into the PDF.</span></li></ol>
  </div></section>
  <section className="frame origin"><h2>About the project</h2><p>The NUS Business Analytics capstone for NatWest Markets (August–December 2022) compared nine climate-disclosure indicators across companies. Its long-term net-zero classifier used a <a href="https://github.com/CWei88/Group17-Capstone/blob/4ea9478a551bafa79449aa4105246ee9c9aebf75/pipeline/Notebooks/training_datasets/Attribute%2012/A12.csv">training set of 1,003 labelled sentences</a>. The later public explorer lets you search 27 reports across all three ESG areas.</p></section></div>;
}
