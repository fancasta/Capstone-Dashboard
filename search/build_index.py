"""Build the browser search index from the pinned editions in sources.json.

Usage: python build_index.py RESEARCH_CHECKOUT EXTRA_PDF_DIRECTORY
Install PyMuPDF with pip before running. No report text or PDFs are copied to the web build.
"""
import argparse
import base64
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import re
import unicodedata
import pymupdf

HERE = Path(__file__).resolve().parent
DEFAULT_OUT = HERE.parent / "frontend/public/corpus"
STOP = set("a an and are as at be been but by do does for from has have how in into is it its of on or our that the their there these they this to was were what which who will with".split())


def normalize(text):
    text = re.sub(r"(?<=\w)-\s*\n\s*(?=[a-z])", "", text)
    folded = unicodedata.normalize("NFKD", text.casefold()).encode("ascii", "ignore").decode()
    return re.findall(r"[a-z0-9]+", folded)


def varint(value, target):
    while value >= 128:
        target.append((value & 127) | 128)
        value >>= 7
    target.append(value)


def encode(entries):
    packed = bytearray()
    previous = 0
    for page, count in entries:
        varint(page - previous, packed)
        varint(count, packed)
        previous = page
    return base64.b64encode(packed).decode("ascii")


def write(path, value):
    path.write_text(json.dumps(value, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")


def build(checkout, extra, output):
    sources = json.loads((HERE / "sources.json").read_text(encoding="utf-8"))
    topics = json.loads((HERE / "topics.json").read_text(encoding="utf-8"))
    expressions = [re.compile(r"\b(?:" + "|".join(re.escape(p) for p in t["phrases"]) + r")\b") for t in topics]
    postings = defaultdict(list)
    pages = []
    reports = []
    for source in sources:
        path = (checkout if "/" in source["path"] else extra) / source["path"]
        if hashlib.sha256(path.read_bytes()).hexdigest() != source["sha256"]:
            raise ValueError(f"Unexpected PDF edition: {path}")
        report = {key: val for key, val in source.items() if key not in {"path", "sha256"}}
        report_id = len(reports)
        with pymupdf.open(path) as doc:
            report.update(pages=len(doc), indexed=0)
            for page_no, page in enumerate(doc, 1):
                tokens = normalize(page.get_text())
                terms = Counter(term for term in tokens if term not in STOP)
                if not terms:
                    continue
                page_id = len(pages)
                text = " ".join(tokens)
                labels = [i for i, pattern in enumerate(expressions) if pattern.search(text)]
                pages.append([report_id, page_no, sum(terms.values()), labels])
                for term, freq in terms.items():
                    postings[term].append((page_id, freq))
                report["indexed"] += 1
        reports.append(report)
    output.mkdir(parents=True, exist_ok=True)
    write(output / "catalog.json", dict(reports=reports, topics=topics, pages=pages, stop=sorted(STOP)))
    write(output / "terms.json", {term: encode(entries) for term, entries in sorted(postings.items())})
    print(f"{len(reports)} reports, {len(pages)} indexed pages, {len(postings)} terms")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("checkout", type=Path)
    parser.add_argument("extra", type=Path)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()
    build(args.checkout, args.extra, args.output)
