import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const inFile = fileURLToPath(new URL("../src/data/sep-archive.json", import.meta.url));
const outFile = fileURLToPath(new URL("../src/data/sep-episodes.json", import.meta.url));
const GAP_H = 72;

let rows = JSON.parse(readFileSync(inFile, "utf8").replace(/^\uFEFF/, ""));
if (!Array.isArray(rows)) rows = [rows];
rows = rows.map((r) => ({ ms: Date.parse(r.t), hard: />100 MeV/.test(r.inst) })).filter((r) => !isNaN(r.ms)).sort((a, b) => a.ms - b.ms);

const eps = [];
for (const r of rows) {
  const cur = eps[eps.length - 1];
  if (cur && (r.ms - cur.last) / 36e5 <= GAP_H) { cur.last = r.ms; cur.n++; cur.hard = cur.hard || r.hard; }
  else eps.push({ first: r.ms, last: r.ms, n: 1, hard: r.hard });
}
const out = eps.map((e) => ({ t: new Date(e.first).toISOString().slice(0, 16) + "Z", hours: Math.round((e.last - e.first) / 36e5), n: e.n, hard: e.hard }));
writeFileSync(outFile, JSON.stringify(out));

console.log("records: " + rows.length + "  episodes: " + out.length + "  with a >100 MeV record: " + out.filter((e) => e.hard).length);
const byYear = {};
for (const e of out) byYear[e.t.slice(0, 4)] = (byYear[e.t.slice(0, 4)] || 0) + 1;
console.log("episodes per year: " + Object.entries(byYear).map(([y, n]) => y + ":" + n).join("  "));
console.log("largest by record count:");
[...out].sort((a, b) => b.n - a.n).slice(0, 5).forEach((e) => console.log("  " + e.t + "  " + e.n + " records over " + e.hours + " h" + (e.hard ? "  (>100 MeV)" : "")));