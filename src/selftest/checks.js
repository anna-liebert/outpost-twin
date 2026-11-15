import { newState } from "../sim/mission.js";
import { step } from "../sim/step.js";
import { forecast } from "../sim/forecast.js";
import { decide } from "../sim/events.js";

const sig = (s) => [s.t, s.o2, s.h2o, s.food, s.T, s.batKWh, s.science].map((x) => x.toFixed(6)).join("|");

export function simChecks() {
  const out = [];
  const a = newState("mars", 7), b = newState("mars", 7);
  for (let h = 0; h < 24 * 40; h++) { step(a); step(b); }
  out.push("determinism (same seed, 40 days, twice): " + (sig(a) === sig(b) ? "identical" : "PROBLEM: the two runs differ"));
  const s = newState("mars", 7);
  for (let h = 0; h < 100; h++) step(s);
  const before = JSON.stringify(s);
  forecast(s, 30);
  out.push("forecast leaves the live mission untouched: " + (JSON.stringify(s) === before ? "yes" : "PROBLEM: it changed"));
  const f1 = forecast(s, 30).fail, f2 = forecast(s, 30).fail;
  out.push("forecast repeatable: " + (JSON.stringify(f1) === JSON.stringify(f2) ? "yes" : "PROBLEM: answers differ"));
  const p = newState("mars", 7); p.batKWh = 0; step(p);
  const q = newState("mars", 7); q.batKWh = 0; q.prio = ["science", "isru", "thermal", "lifeSupport"]; step(q);
  out.push("priority order changes the outcome when power is short: " + (p.T !== q.T || p.o2 !== q.o2 ? "yes" : "PROBLEM: no effect"));
  const firstCard = (seed) => { const m = newState("moon", seed, "standard", 30, "2024-01-01"); for (let h = 0; h < 24 * 30 && !m.pending.length; h++) step(m); return m.pending.length ? m.t : -1; };
  const a1 = firstCard(1), a2 = firstCard(2);
  out.push("same start date, different seeds: first storm card at the same hour: " + (a1 === a2 ? "yes (hour " + a1 + ")" : "PROBLEM: " + a1 + " vs " + a2));
  const nq = newState("moon", 3, "standard", 90); let solar = 0;
  for (let h = 0; h < 24 * 90; h++) { step(nq); solar += nq.pending.filter((e) => e.k === "spe").length; }
  out.push("no season: solar cards in 90 days: " + solar + (solar === 0 ? "" : "  PROBLEM"));
  const lim = newState("moon", 5, "standard", 30); lim.crew[0].task = "evaIce"; lim.crew[0].dose = 601; lim.crew[1].task = "evaIce";
  const h0 = lim.crew[0].health; for (let h = 0; h < 24 * 5; h++) step(lim);
  out.push("over the limit: EVA days lost " + lim.grounded + " (expect 5), health fell: " + (lim.crew[0].health < h0 ? "yes" : "PROBLEM: no") + (lim.grounded === 5 ? "" : "  PROBLEM"));
  const storm = (choice) => { const m = newState("moon", 7, "standard", 20, "2024-05-08"); m.crew.forEach((c) => (c.task = "evaIce"));
    while (!m.pending.length) step(m); const hard = m.pending[0].ep.hard; decide(m, m.pending[0].id, choice);
    for (let h = 0; h < 24 * 6; h++) step(m); return { hard, sick: m.sickN, evaLost: m.evaLost, dose: Math.max(...m.crew.map((c) => c.dose)) }; };
  const sh = storm(0), co = storm(1);
  out.push("strong storm, shelter vs continue: shelter loses EVA days (" + sh.evaLost + " vs " + co.evaLost + "), continue gets people ill (" + co.sick + " vs " + sh.sick + "), dose " + Math.round(co.dose) + " vs " + Math.round(sh.dose) +
    (sh.hard && sh.evaLost > co.evaLost && co.sick > sh.sick && co.dose > sh.dose ? "" : "  PROBLEM"));
  return out;
}