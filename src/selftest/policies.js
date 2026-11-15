import { buildOK, tryBuild } from "../sim/build.js";
import { decide } from "../sim/events.js";
import { applyPlan } from "../sim/plan.js";
import { LIMIT } from "../sim/constants.js";

export const TIERS = ["idle", "normal"];
export const STORM_CHOICE = { v: 2 };
const solarChoice = (s, e, spe) => (spe === 2 ? (e.ep.hard || Math.max(...s.crew.map((c) => c.dose)) >= 0.6 * LIMIT ? 0 : 1) : spe);
const ORDER = { moon: ["gh", "cargo", "isru"], mars: ["gh"] };
export function policy(s, tier, ctr) {
  if (tier === "idle") return;
  for (const e of [...s.pending]) decide(s, e.id, e.k === "spe" ? solarChoice(s, e, ctr.spe) : STORM_CHOICE.v);
  if (s.t % 24 !== 0) return;
  applyPlan(s);
  const order = ORDER[s.body];
  while (s.buildQ.length < 2 && ctr.i < order.length) {
    const k = order[ctr.i];
    if (!buildOK(s, k)) { ctr.i++; continue; }
    if (!tryBuild(s, k)) break;
    ctr.i++;
  }
}
