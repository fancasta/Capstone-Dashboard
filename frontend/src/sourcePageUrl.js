export function sourcePageUrl(report, page) {
  if (new URL(report.url).hostname !== "raw.githubusercontent.com") {
    return report.url.split("#")[0] + "#page=" + page;
  }
  const params = new URLSearchParams({report: report.publisher, page: String(page)});
  const selection = new URLSearchParams(window.location.search);
  for (const key of ["topic", "q", "sector"]) {
    if (selection.get(key)) params.set(key, selection.get(key));
  }
  return (process.env.PUBLIC_URL || "") + "/source.html?" + params.toString();
}
