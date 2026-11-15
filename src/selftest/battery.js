import { newState } from "../sim/mission.js";
import { step } from "../sim/step.js";
import { policy, TIERS } from "./policies.js";

export const LENS = [90, 180, 365];
export const SEEDS = 20;
export const WORLDS = [["moon", "standard"], ["mars", "standard"]];

export function makeMission(body, diff, tier, seed, len, start = null, spe = 0, label = "") {
  const s = newState(body, seed, diff, len, start), ctr = { i: 0, spe };
  const m = { body, diff, tier, len, seed, season: label, spe, firstFail: null, minBat: 100, bad: "" };
  return {
    tick(n) {
      for (let i = 0; i < n; i++) {
        if (!s.alive) break;
        policy(s, tier, ctr);
        step(s, 1);
        observe(s, m);
      }
      if (s.alive) return false;
      m.alive = s.crew.filter((c) => c.health > 0).length;
      m.day = Math.floor(s.t / 24);
      m.survived = m.alive === s.crew.length;
      m.cause = s.cause || "";
      m.maxDose = Math.max(...s.crew.map((c) => c.dose));
      m.sick = s.sickN;
      m.evaLost = s.evaLost; m.grounded = s.grounded; m.sci = s.science; m.h2o = s.h2o;
      m.storms = s.spes.length; m.sheltered = s.spes.filter((x) => x.sheltered).length;
      m.over = s.crew.some((c) => c.over);
      return m;
    },
  };
}

function observe(s, m) {
  m.minBat = Math.min(m.minBat, (s.batKWh / s.batMax) * 100);
  if (!m.firstFail) {
    const d = s.t / 24;
    if (s.o2 <= 0) m.firstFail = ["Oxygen", d];
    else if (s.h2o <= 0) m.firstFail = ["Water", d];
    else if (s.T < 278) m.firstFail = ["Cabin cold", d];
    else if (s.T > 306) m.firstFail = ["Cabin hot", d];
    else if (s.food <= 0) m.firstFail = ["Food", d];
  }
  if (m.bad) return;
  for (const k of ["o2", "h2o", "food", "T", "batKWh", "science", "budget"]) {
    if (!isFinite(s[k])) { m.bad = "non-finite " + k + " at h" + s.t; return; }
  }
  if (s.crew.some((c) => !isFinite(c.dose) || c.dose < 0)) { m.bad = "bad dose at h" + s.t; return; }
  for (const k of ["o2", "h2o", "food", "batKWh"]) {
    if (s[k] < -1e-9) { m.bad = "negative " + k + " at h" + s.t; return; }
  }
  if (s.batKWh > s.batMax + 1e-6) m.bad = "battery above capacity at h" + s.t;
}

export const SEASONS = [["quiet", "2018-06-01"], ["busy", "2024-01-01"]];
export const SEEDS_B = 10;
const PLAYERS_B = [["idle", 0, "idle"], ["normal", 0, "always shelter"], ["normal", 1, "always continue"], ["normal", 2, "smart"]];

export function jobs() {
  const list = [];
  for (const [body, diff] of WORLDS)
    for (const len of LENS)
      for (const tier of TIERS)
        for (let k = 0; k < SEEDS; k++) list.push([body, diff, tier, 100 + k, len]);
  for (const [body, diff] of WORLDS)
    for (const [label, start] of SEASONS)
      for (const len of [180, 365])
        for (const [tier, spe, pl] of PLAYERS_B)
          for (let k = 0; k < SEEDS_B; k++) list.push([body, diff, tier, 100 + k, len, start, spe, label + "|" + pl]);
  return list;
}

const med = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : null);

export function report(results) {
  const out = ["PART A: every world x difficulty x length x player, " + SEEDS + " seeds each. 'survived' = all four crew alive at the end."];
  out.push("world       diff   len  player  survived   median 1st failure       main cause");
  for (const [body, diff] of WORLDS)
    for (const len of LENS)
      for (const tier of TIERS) {
        const r = results.filter((x) => !x.season && x.body === body && x.diff === diff && x.len === len && x.tier === tier);
        if (!r.length) continue;
        const ok = r.filter((x) => x.survived).length;
        const ff = r.filter((x) => x.firstFail);
        const kinds = {}; ff.forEach((x) => { kinds[x.firstFail[0]] = (kinds[x.firstFail[0]] || 0) + 1; });
        const top = Object.entries(kinds).sort((a, b) => b[1] - a[1])[0];
        const md = med(ff.map((x) => x.firstFail[1]));
        out.push(`${body.padEnd(11)} ${diff.padEnd(6)} ${String(len).padStart(3)}  ${tier.padEnd(7)} ${String(ok).padStart(2)}/${r.length}      ` +
          `${(md === null ? "none" : "day " + md.toFixed(0)).padEnd(24)} ${top ? top[0] + " (" + top[1] + ")" : "-"}`);
      }
  out.push("", "PART B: real storm seasons, " + SEEDS_B + " seeds each. dose = highest crew dose at the end (mSv). ill = missions where someone took 250 mSv or more in one storm.");
  out.push("EVA lost = outdoor crew-days given up to sheltering (median). sci = science points at the end (median). over 600 = someone passed the career limit.");
  out.push("world       diff     season len  player            survived   median dose   ill     over 600   EVA lost   sci");
  for (const [body, diff] of WORLDS)
    for (const [label] of SEASONS)
      for (const len of [180, 365])
        for (const [, , pl] of PLAYERS_B) {
          const r = results.filter((x) => x.season === label + "|" + pl && x.body === body && x.diff === diff && x.len === len);
          if (!r.length) continue;
          const ok = r.filter((x) => x.survived).length, cnt = (f) => String(r.filter(f).length).padStart(2) + "/" + r.length;
          out.push(`${body.padEnd(11)} ${diff.padEnd(8)} ${label.padEnd(6)} ${String(len).padStart(3)}  ${pl.padEnd(16)}  ${String(ok).padStart(2)}/${r.length}      ` +
            `${String(Math.round(med(r.map((x) => x.maxDose)))).padStart(5)}         ${cnt((x) => x.sick > 0)}    ${cnt((x) => x.over)}      ` +
            `${String(Math.round(med(r.map((x) => x.evaLost)))).padStart(5)}    ${String(Math.round(med(r.map((x) => x.sci)))).padStart(5)}`);
        }
  const bad = results.filter((x) => x.bad);
  out.push("", "INVARIANTS (finite numbers, no negative stores, battery within capacity): " +
    (bad.length ? "PROBLEM in " + bad.length + " missions, first: " + bad[0].body + " " + bad[0].diff + " " + bad[0].tier + " seed " + bad[0].seed + ": " + bad[0].bad : "all missions clean"));
  return out;
}