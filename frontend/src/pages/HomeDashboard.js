import { useEffect, useState } from "react";
import axios from "axios";
import DataSummary from "../components/DataSummary";
import FileUpload from "../components/FileUpload";
import Report from "../components/Report";
import PublishedExamples from "../components/PublishedExamples";
import "./explorer.css";

const api = "http://localhost:6868";
const views = ["Overview", "Company reports", "Published examples"];

export default function HomeDashboard({ initialView = "Overview" }) {
  const [view, setView] = useState(initialView);
  const [companies, setCompanies] = useState([]);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("Loading local reports…");
  const [company, setCompany] = useState("");
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState("");
  const [companyStatus, setCompanyStatus] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([axios.get(api + "/company"), axios.get(api + "/report")])
      .then(([directory, reports]) => {
        if (!active) return;
        setCompanies(directory.data);
        setRows(reports.data);
        setStatus("");
      })
      .catch(() => { if (active) setStatus("Local reports are unavailable. Start the API or open Published examples."); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!company) return;
    let active = true;
    axios.get(api + "/report/companyName/" + encodeURIComponent(company))
      .then(({ data }) => {
        if (!active) return;
        const ordered = [...data].sort((a, b) => Number(b.year) - Number(a.year));
        setRecords(ordered);
        setSelected(ordered.length ? "0" : "");
        setCompanyStatus(ordered.length ? "" : "No filings found for this company.");
      })
      .catch(() => { if (active) setCompanyStatus("Could not load this company's reports."); });
    return () => { active = false; };
  }, [company]);

  function selectCompany(value) {
    setSelected(""); setRecords([]); setCompany(value);
    setCompanyStatus(value ? "Loading filings…" : "");
  }

  return <main className="climate-shell">
    <header className="climate-head"><h1>Climate disclosure explorer</h1>
      <nav aria-label="Dashboard views">{views.map(item =>
        <button key={item} aria-pressed={view === item} onClick={() => setView(item)}>{item}</button>)}</nav>
    </header>
    {view === "Published examples" ? <PublishedExamples /> : <>
      {status && <p role="status" className="climate-card">{status}</p>}
      {view === "Overview" ? <>
        <div className="climate-totals">{[
          [rows.length, "Report records"], [new Set(rows.map(r => r.industry)).size, "Industries"],
          [new Set(rows.map(r => r.year)).size, "Reporting years"]
        ].map(([value, label]) => <div key={label}><b>{status ? "—" : value}</b><span>{label}</span></div>)}</div>
        {!status && <div className="climate-card"><DataSummary Reports={rows} /></div>}
        <details className="climate-card"><summary>Import a report CSV</summary><FileUpload /></details>
      </> : <section className="climate-card"><h2>Company filings</h2>
        <div className="climate-controls"><label>Company<select aria-label="Company" value={company} onChange={e => selectCompany(e.target.value)}>
          <option value="">Select a company</option>{[...new Set(companies.map(c => c.companyName))].sort().map(c => <option key={c}>{c}</option>)}
        </select></label>
        {records.length > 0 && <label>Filing<select aria-label="Filing" value={selected} onChange={e => setSelected(e.target.value)}>{records.map((r,i) =>
          <option key={r.id ?? i} value={i}>{r.year} · {r.industry}</option>)}</select></label>}</div>
        {companyStatus && <p role="status">{companyStatus}</p>}
        {records[selected] && <Report Report={records[selected]} />}
      </section>}
    </>}
  </main>;
}
