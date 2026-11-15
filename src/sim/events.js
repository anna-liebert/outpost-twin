import { log } from "./log.js";
import { TASKS, SPE } from "./constants.js";
import { addDose, isOutside } from "./crew.js";
export function fireEvent(s, k) {
  if (k === "storm") {
    s.stormLeft = 72 + s.rand() * 128;
    log(s, "w", "Orbiter relay: regional dust storm forming.");
    s.pending.push({ id: ++s.eid, k, left: 36, def: 1, title: "Dust storm approaching", txt: "Array output will fall to about 5% for several days.",
      opts: ["Go lean: switch science off until the storm passes", "Ride it out as planned", "Lower the cabin setpoint to 17 C until the storm passes"] });
  }
}
export function fireSpe(s, ep) {
  const days = Math.max(1, Math.ceil((ep.hours + 12) / 24));
  const kind = ep.hard ? "including protons above 100 MeV, the penetrating kind" : "all at lower energies";
  s.pending.push({ id: ++s.eid, k: "spe", left: 8, def: 0, ep, days, title: "Solar particle event",
    txt: "NASA's archive logged this storm on " + ep.t.slice(0, 10) + ": " + ep.n + " instrument records over " + ep.hours + " hours, " + kind + ". The dose it brings is a game estimate.",
    opts: ["Shelter in the core for " + days + " day" + (days > 1 ? "s" : "") + ": EVA stops, dose cut about 95%", "Continue operations: crew outside take the full dose"] });
}
function speDose(s, e, i) {
  const base = e.ep.hard ? SPE.hard : SPE.soft;
  let sick = 0;
  for (const c of s.crew) {
    if (c.health <= 0) continue;
    const f = i === 0 ? SPE.shelter : isOutside(s, c) ? 1 : SPE.inside * Math.pow(SPE.perLayer, s.shield);
    addDose(s, c, base * f);
    if (base * f >= SPE.sickAt) {
      s.sickN++; sick++; c.sick = SPE.sickDays;
      c.health = Math.max(0, c.health - SPE.sickHealth);
      log(s, "c", "Acute radiation sickness: " + c.name + " (" + (base * f).toFixed(0) + " mSv in one event). Out of action for " + SPE.sickDays + " days.");
    }
  }
  s.spes.push({ t: s.t, hard: !!e.ep.hard, sheltered: i === 0, sick });
}
export function resolveEvent(s, e, i, auto) {
  if (e.k === "storm") {
    if (i === 0) { s.sciOff = true; log(s, "g", "Science off until the storm passes."); }
    if (i === 2) { s.spSaved = s.setpoint; s.setpoint = 290; log(s, "g", "Setpoint lowered to 17 C."); }
  }
  if (e.k === "spe") {
    speDose(s, e, i);
    if (i === 0) { s.sheltLeft = e.days * 24; log(s, "g", "Crew sheltering for " + e.days + " day(s). EVA is closed."); }
  }
  log(s, auto ? "w" : "g", (auto ? "No decision made, default applied: " : "Decision: ") + e.opts[i]);
}
export function decide(s, id, i) { const e = s.pending.find((p) => p.id === id); if (!e) return; e.done = true; resolveEvent(s, e, i, false); s.pending = s.pending.filter((p) => !p.done); }