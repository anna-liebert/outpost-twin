export const f1 = (n, d = 1) => (Number.isFinite(n) ? n.toFixed(d) : "—");

export function barHTML(label, val, max, unit, warnLow, critLow) {
  const p = Math.max(0, Math.min(100, (val / max) * 100));
  const cl = val < critLow ? "c" : val < warnLow ? "w" : "";
  return `<div class="row"><span>${label}</span><span class="m">${f1(val, 0)} ${unit}</span></div>` +
         `<div class="bar"><i class="${cl}" style="width:${p}%"></i></div>`;
}
export const bqTxt = (b) => (b.wait > 0 ? "in transit " + f1(b.wait, 0) + " d" : f1(Math.max(0, b.left), 0) + " d");
export function doseHTML(name, dose, limit) {
  const p = Math.max(0, Math.min(100, (dose / limit) * 100)), cl = dose >= limit ? "c" : dose >= limit * 0.7 ? "w" : "";
  return `<div class="row"><span>${name}</span><span class="m">${f1(dose, 0)} mSv</span></div><div class="bar"><i class="${cl}" style="width:${p}%"></i></div>`;
}
