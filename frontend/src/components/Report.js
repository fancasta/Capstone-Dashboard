import { indicators } from "./disclosures";

export default function Report({ Report: report }) {
  return <article className="filing-detail">
    <p className="doc-type">{report.industry} · {report.year}</p><h3>{report.companyName}</h3>
    <dl>{indicators.map(([field, label]) => {
      const passage = report[field + "Sentences"];
      return <div key={field}><dt>{label}</dt><dd>{passage && passage.length > 220 ?
        <details><summary>{passage.slice(0, 180)}…</summary><p>{passage}</p></details> :
        passage || "No passage recorded."}</dd></div>;
    })}</dl>
  </article>;
}
