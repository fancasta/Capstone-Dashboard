const fs = require("node:fs");
const path = require("node:path");
const base = path.dirname(require.resolve("pdfjs-dist/package.json"));
const out = path.resolve(__dirname, "../public/pdf-reader");
fs.mkdirSync(out, { recursive: true });
for (const file of ["pdf.min.mjs", "pdf.worker.min.mjs"]) {
  fs.copyFileSync(path.join(base, "build", file), path.join(out, file));
}
fs.copyFileSync(path.join(base, "LICENSE"), path.join(out, "LICENSE.txt"));
