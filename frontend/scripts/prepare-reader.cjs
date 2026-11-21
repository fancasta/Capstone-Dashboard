const fs = require("node:fs");
const path = require("node:path");

const base = path.dirname(require.resolve("pdfjs-dist/package.json"));
const output = path.resolve(__dirname, "../public/pdf-reader");
fs.mkdirSync(output, { recursive: true });
for (const file of ["pdf.min.mjs", "pdf.worker.min.mjs"]) {
  fs.copyFileSync(path.join(base, "build", file), path.join(output, file));
}
for (const assets of ["cmaps", "standard_fonts", "wasm"]) {
  fs.cpSync(path.join(base, assets), path.join(output, assets), { recursive: true });
}
fs.copyFileSync(path.join(base, "LICENSE"), path.join(output, "LICENSE.txt"));
