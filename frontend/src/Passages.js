import { useEffect, useState } from "react";
import { words } from "./corpusSearch";
import oracleNotes from "./oraclePageNotes.json";
import notes from "./fieldNotes.json";

let pdfModule;
function getPdfJs() {
  const path = (process.env.PUBLIC_URL || "") + "/pdf-reader/";
  if (!pdfModule) {
    pdfModule = import(/* webpackIgnore: true */ (path+"pdf.min.mjs")).then(pdf=>{
      pdf.GlobalWorkerOptions.workerSrc=path+"pdf.worker.min.mjs";
      return pdf;
    }).catch(error=>{pdfModule=null;throw error;});
  }
  return pdfModule;
}

// Keep source word order and choose short, non-overlapping windows near the query.
function passages(text, query) {
  const tokens = text.trim().split(/\s+/);
  if (!tokens.length || !text.trim()) return [];
  const wanted = new Set(words(query));
  const candidates = [];
  for (let start=0;start<tokens.length;start+=24) {
    const segment=tokens.slice(start,start+48).join(" ");
    const matches=words(segment).filter(w=>wanted.has(w));
    candidates.push({start,segment,score:4*new Set(matches).size+Math.min(matches.length,8)});
  }
  candidates.sort((a,b)=>b.score-a.score || a.start-b.start);
  const first=candidates[0];
  const second=candidates.find(c=>c.score>0 && Math.abs(c.start-first.start)>=48);
  return [first,second].filter(Boolean).sort((a,b)=>a.start-b.start).map(c=>
    (c.start?"… ":"")+c.segment+(c.start+48<tokens.length?" …":""));
}

export default function Passages({report,page,query}) {
  const note=notes.find(n=>n.publisher===report.publisher&&n.page===page) ||
    (report.publisher==="Oracle" && oracleNotes[page]);
  const [result,setResult]=useState(null);
  useEffect(()=>{
    if(note || report.publisher==="Oracle")return;
    let active=true,job;
    async function load(){
      const pdf=await getPdfJs();
      if(!active)return;
      job=pdf.getDocument({url:report.url,isEvalSupported:false,disableFontFace:true,disableAutoFetch:true,disableStream:true});
      const doc=await job.promise;
      const content=await (await doc.getPage(page)).getTextContent();
      const text=content.items.map(i=>i.str||"").join(" ");
      if(active)setResult(passages(text,query));
    }
    load().catch(()=>{if(active)setResult([]);});
    return ()=>{active=false;if(job)job.destroy().catch(()=>{});};
  },[report.url,report.publisher,page,query,note]);
  if(note)return <>{note.excerpt&&<blockquote>“{note.excerpt}”</blockquote>}<p className="reading-note">{note.note}</p></>;
  if(report.publisher==="Oracle")return <p className="reading-note">Oracle provides this page in its own PDF viewer. Follow the source link to read the original text.</p>;
  if(!result)return <p className="loading-passage" role="status">Reading the source page…</p>;
  if(!result.length)return <p className="reading-note">The text preview is unavailable. Open the cited PDF page to read the disclosure.</p>;
  return <div className="extracted-text">{result.map(t=><blockquote key={t}>{t}</blockquote>)}</div>;
}
