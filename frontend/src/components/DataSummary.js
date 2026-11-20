import { useMemo, useState } from "react";
import { summarizeReports } from "./disclosures";
import SummaryChart from "./SummaryChart";

export default function DataSummary({ Reports }) {
  const groups = useMemo(() => summarizeReports(Reports), [Reports]);
  const [preferredYear, setYear] = useState("");
  const [preferredIndustry, setIndustry] = useState("");
  const years = Array.from(groups.keys()).sort().reverse();
  if (years.length === 0) return <section><h2>Disclosure summary</h2><p>No reports available.</p></section>;

  const year = groups.has(preferredYear) ? preferredYear : years[0];
  const sectors = groups.get(year);
  const industries = Array.from(sectors.keys()).sort();
  const industry = sectors.has(preferredIndustry) ? preferredIndustry : industries[0];
  return (
    <section className="disclosure-panel" aria-label="Disclosure summary">
      <h2>Climate disclosure summary</h2>
      <div className="disclosure-filters">
        <label>Reporting year <select value={year} onChange={e => setYear(e.target.value)}>
          {years.map(y => <option key={y}>{y}</option>)}
        </select></label>
        <label>Industry <select value={industry} onChange={e => setIndustry(e.target.value)}>
          {industries.map(i => <option key={i}>{i}</option>)}
        </select></label>
      </div>
      <SummaryChart group={sectors.get(industry)} />
    </section>
  );
}
