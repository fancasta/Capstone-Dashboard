import { useEffect, useState } from "react";
import oracleNotes from "./oraclePageNotes.json";
import { words } from "./corpusSearch";

let pdfModule;
const publicPath = process.env.PUBLIC_URL || "";
function getPdfJs() {
  if (!pdfModule) {
    pdfModule = import(/* webpackIgnore: true */ (publicPath + "/pdf-reader/pdf.min.mjs")).then(pdf => {
      pdf.GlobalWorkerOptions.workerSrc = publicPath + "/pdf-reader/pdf.worker.min.mjs";
      return pdf;
    }).catch(error => {pdfModule = null; throw error;});
  }
  return pdfModule;
}

function snippets(text, query) {
  const wanted = new Set(query.flatMap(words));
  const blocks = text.match(/[^.!?]+(?:[.!?]+(?:\s|$)|$)/g) || [text];
  const windows = blocks.flatMap(block => {
    const tokens = block.trim().split(/\s+/);
    const chunks = [];
    for (let start = 0; start < tokens.length; start += 35) chunks.push(tokens.slice(start,start + 35).join(" "));
    return chunks;
  }).filter(s => s.length > 22);
  return windows.map((value, order) => ({value, order, score: new Set(words(value).filter(w => wanted.has(w))).size}))
    .sort((a,b) => b.score - a.score || a.order - b.order).slice(0,3);
}

export default function Passages({report, page, query}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({state:"loading"});
  const queryKey = query.join(" ");
  const publisherViewer = report.publisher === "Oracle";
  const pageNote = publisherViewer ? oracleNotes[page] : null;
  useEffect(() => {
    if (!open || publisherViewer) return;
    let alive = true, task;
    setView({state:"loading"});
    async function load() {
      const pdf = await getPdfJs();
      if (!alive) return;
      task = pdf.getDocument({url:report.url, isEvalSupported:false, disableFontFace:true, disableAutoFetch:true, disableStream:true});
      const doc = await task.promise;
      const content = await (await doc.getPage(page)).getTextContent();
      const text = content.items.map(item => item.str || "").join(" ").replace(/\s+/g," ").trim();
      if (alive) setView({state:"ready", passages:snippets(text, queryKey.split(" "))});
    }
    load().catch(() => {if (alive) setView({state:"source"});});
    return () => {alive = false; if (task) task.destroy().catch(()=>{});};
  },[open, report.url, page, queryKey, publisherViewer]);
  if (publisherViewer && !pageNote) return null;
  const label = publisherViewer && !pageNote?.excerpt ? "Read page note" : "Read page excerpts";
  return <div className="passages"><button className="text-action" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Close reading" : label} {open ? "−" : "+"}</button>
    {open && <div className="passage-panel" role="status">
      {pageNote ? <>
        {pageNote.excerpt && <blockquote>“{pageNote.excerpt}”</blockquote>}
        <p><strong>Reading note.</strong> {pageNote.note}</p>
        <a href={report.url+"#page="+page} target="_blank" rel="noreferrer">Read this page in Oracle’s viewer ↗</a>
      </> : view.state === "loading" ? "Opening the source PDF…" : view.state === "source" ? <p>The publisher requires its own PDF viewer. <a href={report.url+"#page="+page} target="_blank" rel="noreferrer">Open page {page} ↗</a></p> :
        view.passages.length ? view.passages.map(p => <blockquote key={p.order}>{p.value}</blockquote>) : "This page has no extractable passage."}
    </div>}</div>;
}
