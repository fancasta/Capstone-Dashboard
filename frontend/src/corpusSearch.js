// Pages are [report id, physical PDF page, indexed token count, matched topic ids].
export function words(text) {
  return text.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").match(/[a-z0-9]+/g) || [];
}

function unpack(encoded) {
  if (!encoded) return new Map();
  const bytes = atob(encoded);
  let pos = 0, page = 0;
  function integer() {
    let value = 0, shift = 0;
    while (pos < bytes.length) {
      const byte = bytes.charCodeAt(pos++);
      value += (byte & 127) * 2 ** shift;
      if (byte < 128) break;
      shift += 7;
    }
    return value;
  }
  const entries = new Map();
  while (pos < bytes.length) {
    page += integer();
    entries.set(page, integer());
  }
  return entries;
}

export function search(catalog, terms, query, topic, publisher, sector) {
  const { pages, reports, stop } = catalog;
  const tokens = [...new Set(words(query).filter(t => !stop.includes(t)))];
  const termEntries = tokens.map(t => unpack(Object.prototype.hasOwnProperty.call(terms,t) ? terms[t] : ""));
  const total = pages.length, avg = pages.reduce((sum, p) => sum + p[2], 0) / total;
  const phraseTokens = topic < 0 ? [] : [...new Set(catalog.topics[topic].phrases.flatMap(words).filter(t => !stop.includes(t)))];
  const topicEntries = phraseTokens.map(t => unpack(terms[t]));
  const rankEntries = topic >= 0 ? topicEntries : termEntries;
  const weights = rankEntries.map(p => Math.log(1 + (total - p.size + .5) / (p.size + .5)));
  const hits = [];
  if (topic < 0 && query.trim() && !tokens.length) return hits;
  pages.forEach(([reportId, page, length, labels], id) => {
    const report = reports[reportId];
    if ((publisher && report.publisher !== publisher) || (sector && report.sector !== sector)) return;
    if (topic >= 0 ? !labels.includes(topic) : !termEntries.every(p => p.has(id))) return;
    let score = 0;
    rankEntries.forEach((postings, i) => {
      const tf = postings.get(id) || 0;
      if (tf) score += weights[i] * tf * 2.2 / (tf + 1.2 * (.25 + .75 * length / avg));
    });
    hits.push({ id, reportId, page, labels, score });
  });
  return hits.sort((a,b) => b.score - a.score || a.id - b.id);
}
