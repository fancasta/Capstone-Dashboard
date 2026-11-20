import { useState } from "react";
import study from "../caseStudies.json";

export default function PublishedExamples() {
  const [publisher, setPublisher] = useState(Object.keys(study.sources)[0]);
  const [topic, setTopic] = useState(0);
  const source = study.sources[publisher];
  const cases = study.results.filter(row => row.publisher === publisher);
  const result = cases[topic];
  const rank = result.hits.findIndex(hit => hit.page === result.review_page);
  return <section className="source-layout" aria-label="Published examples">
    <aside className="source-menu"><h2>Source library</h2>{Object.entries(study.sources).map(([name, doc]) =>
      <button key={name} aria-pressed={name === publisher} onClick={() => {setPublisher(name); setTopic(0);}}>
        <strong>{name}</strong><small>{doc.type}</small></button>)}</aside>
    <article className="climate-card source-detail"><p className="doc-type">{source.type} · {result.pages} PDF pages</p>
      <h2>{source.title}</h2><label>Search example<select value={topic} onChange={e => setTopic(Number(e.target.value))}>
        {cases.map((row,i) => <option key={row.label} value={i}>{row.label}</option>)}</select></label>
      <div className="source-reading"><strong>{result.kind}</strong><p>{result.interpretation}</p>
        <a href={source.url + "#page=" + result.review_page}>Read source page {result.review_page} ↗</a></div>
      <h3>Page matches</h3><p className="source-query">{result.query}</p>
      <ol className="source-hits">{result.hits.map(hit => <li key={hit.page}>
        <a href={source.url + "#page=" + hit.page}>Page {hit.page}</a>
        <meter aria-label={"Cosine similarity for page " + hit.page} min="0" max="1" value={hit.cosine} />
        <span>{hit.cosine.toFixed(4)}</span></li>)}</ol>
      <p className="score-note">Cosine similarity measures word overlap. {rank < 0 ?
        "The selected review page fell outside the top three." : "The selected review page ranked " + (rank + 1) + " of the returned pages."}</p>
    </article></section>;
}
