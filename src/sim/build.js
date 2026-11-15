import { log } from "./log.js";

export const BUILD = {
  solar: { n: "Solar array +100 m²",      cost: 28, days: 6,  apply: (s) => { s.arrayM2 += 100; } },
  bat:   { n: "Battery bank +200 kWh",    cost: 34, days: 5,  apply: (s) => { s.batMax += 200; s.batKWh += 60; } },
  isru:  { n: "ISRU plant +1",            cost: 55, days: 10, apply: (s) => { s.isruN += 1; } },
  gh:    { n: "Greenhouse module",        cost: 62, days: 14, apply: (s) => { s.ghN += 1; } },
  cargo: { n: "Cargo delivery from Earth", cost: 70, days: 14, apply: (s) => {
    s.h2o = Math.min(s.h2oMax, s.h2o + 100);
    s.o2 = Math.min(s.o2Max, s.o2 + 40);
    s.food = Math.min(s.foodMax, s.food + 60);
    log(s, "g", "Cargo delivery arrived: +100 kg water, +40 kg oxygen, +60 kg food.");
  } },
};

export const LEAD = { solar: 45, bat: 45, isru: 60, gh: 60, cargo: 30 };
export const LOCAL = { gh: 1 };
export const MARS_WAIT = 180;

export const buildOK = (s, k) => s.body === "moon" || !!LOCAL[k] || s.t / 24 + MARS_WAIT + BUILD[k].days <= s.len;
export const bq = (s, k) => ({ k, left: BUILD[k].days, wait: s.body === "moon" ? LEAD[k] : LOCAL[k] ? 0 : MARS_WAIT });

export function tryBuild(s, k) {
  if (!buildOK(s, k) || s.budget < BUILD[k].cost) return false;
  s.budget -= BUILD[k].cost;
  s.buildQ.push(bq(s, k));
  return true;
}