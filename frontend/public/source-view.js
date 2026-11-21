import {getDocument, GlobalWorkerOptions} from "./pdf-reader/pdf.min.mjs";

const el = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const canvas = document.querySelector("canvas");
const details = document.querySelector("details");
GlobalWorkerOptions.workerSrc = new URL("./pdf-reader/pdf.worker.min.mjs", location.href).href;
let pdf, report, renderTask, pageNumber, version = 0;

function setPage(number, writeHistory) {
  const value = Number(number);
  pageNumber = Number.isInteger(value) && value >= 1 && value <= pdf.numPages ? value : 1;
  if (writeHistory) {
    const url = new URL(location.href);
    url.searchParams.set("page", pageNumber);
    history.pushState(null, "", url);
  }
  el("page-label").textContent = "Page " + pageNumber + " of " + pdf.numPages;
  el("previous").disabled = pageNumber === 1;
  el("next").disabled = pageNumber === pdf.numPages;
  document.title = report.publisher + " · Page " + pageNumber + " · ESG Disclosure Explorer";
  return render(pageNumber);
}

async function render(number) {
  const generation = ++version;
  if (renderTask) renderTask.cancel();
  canvas.hidden = true;
  details.hidden = true;
  details.open = false;
  el("transcript").textContent = "";
  el("status").textContent = "Opening page " + number + "…";
  try {
    const page = await pdf.getPage(number);
    if (generation !== version) return;
    const natural = page.getViewport({scale:1});
    const width = document.querySelector("main").clientWidth;
    const viewport = page.getViewport({scale:Math.min(3,width * Math.min(devicePixelRatio || 1,2) / natural.width)});
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    canvas.style.width = width + "px";
    canvas.setAttribute("aria-label", report.publisher + ", original PDF page " + number);
    renderTask = page.render({canvas, viewport});
    await renderTask.promise;
    if (generation !== version) return;
    canvas.hidden = false;
    el("status").textContent = "";
    const content = await page.getTextContent();
    if (generation !== version) return;
    const text = content.items.map(item => (item.str || "") + (item.hasEOL ? "\n" : " ")).join("").trim();
    el("transcript").textContent = text || "This page has no selectable text.";
    details.hidden = false;
  } catch (error) {
    if (generation === version && error.name !== "RenderingCancelledException")
      el("status").textContent = "The page preview could not be loaded. The original PDF is available above.";
  }
}

async function open() {
  const response = await fetch("./corpus/catalog.json");
  if (!response.ok) throw new Error("Catalog unavailable");
  report = (await response.json()).reports.find(r=>r.publisher === params.get("report"));
  if (!report) { el("status").textContent = "This report could not be found. Return to the explorer to choose a company."; return; }
  const back = new URLSearchParams({publisher:report.publisher, page:params.get("page") || "1"});
  for (const key of ["topic", "q", "sector"]) {
    if (params.get(key)) back.set(key, params.get(key));
  }
  el("return").href = "./?" + back.toString();
  el("return").textContent = "← Return to " + report.publisher + " in the explorer";
  el("company").textContent = report.publisher;
  el("title").textContent = report.title + " · " + report.edition;
  el("download").href = report.url;
  el("download").hidden = false;
  pdf = await getDocument({url:report.url, isEvalSupported:false, useSystemFonts:true, disableAutoFetch:true, disableStream:true,
    cMapUrl:"./pdf-reader/cmaps/",cMapPacked:true,standardFontDataUrl:"./pdf-reader/standard_fonts/",wasmUrl:"./pdf-reader/wasm/"}).promise;
  el("previous").onclick = () => setPage(pageNumber-1,true);
  el("next").onclick = () => setPage(pageNumber+1,true);
  window.addEventListener("popstate",()=>setPage(new URLSearchParams(location.search).get("page"),false));
  await setPage(params.get("page"),false);
}
open().catch(()=>{ el("status").textContent = "The report could not be loaded. Use the original PDF link if available, or return to the explorer."; });
