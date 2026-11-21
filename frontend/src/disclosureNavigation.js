import { createContext, useContext } from "react";

export const Navigation = createContext(null);

export function urlFor(route) {
  const params = new URLSearchParams();
  if (route.topic) params.set("topic", route.topic);
  else if (route.q) params.set("q", route.q);
  if (route.sector) params.set("sector", route.sector);
  if (route.publisher) params.set("publisher", route.publisher);
  if (route.publisher && route.page) params.set("page", String(route.page));
  if (!params.toString() && route.explore) params.set("view", "explore");
  const query = params.toString();
  return window.location.pathname + (query ? "?" + query : "");
}

export function readRoute(catalog) {
  const p = new URLSearchParams(window.location.search);
  const report = catalog.reports.find(r => r.publisher === p.get("publisher"));
  const sector = catalog.reports.some(r => r.sector === p.get("sector")) ? p.get("sector") : "";
  const topic = catalog.topics.find(t => t.name === p.get("topic"))?.name || "";
  const q = topic ? "" : (p.get("q") || "").trim();
  const page = Number(p.get("page"));
  return {
    explore: !!(topic || q || sector || report || p.has("q") || ["explore","search"].includes(p.get("view"))),
    topic, q, sector,
    publisher: report && (!sector || report.sector === sector) ? report.publisher : "",
    page: Number.isInteger(page) && page > 0 ? page : null
  };
}

export function RouteLink({to, children, ...props}) {
  const go = useContext(Navigation);
  return <a href={urlFor(to)} {...props} onClick={event=>{
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    go(to);
  }}>{children}</a>;
}
