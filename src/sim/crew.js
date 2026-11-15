import { TASKS, RAD, LIMIT, SPE } from "./constants.js";
import { log } from "./log.js";

export const skill = (c, kind) => (kind === "eng" && c.role === "Engineer") || (kind === "sci" && c.role === "Geologist") ? 1.4 : 1;

export const eff = (c) => 1 - Math.max(0, c.stress - 60) / 100;

export function addDose(s, c, mSv) {
  c.dose += mSv;
  if (c.dose >= LIMIT && !c.over) { c.over = true; log(s, "c", c.name + " passed the 600 mSv career limit."); }
}

export const isOutside = (s, c) => TASKS[c.task].eva > 0 && s.stormLeft === 0 && s.sheltLeft <= 0 && c.sick <= 0 && c.dose < LIMIT;

export function crewDay(s, c) {
  const ill = c.sick > 0;
  if (ill) c.sick--;
  const t = ill ? "rest" : c.task, wantsEva = TASKS[c.task].eva > 0 && !ill;
  const outside = wantsEva && s.stormLeft === 0 && s.sheltLeft <= 0 && c.dose < LIMIT;
  if (wantsEva && s.sheltLeft > 0) s.evaLost++;
  if (wantsEva && c.dose >= LIMIT) s.grounded++;
  if (outside && t === "evaClean") s.dust = Math.max(0, s.dust - 0.22 * skill(c, "eng") * eff(c));
  if (t === "sci") s.science += 3 * skill(c, "sci") * eff(c);
  if (outside && t === "evaShield" && s.shield < 3) {
    s.shieldWork += skill(c, "eng") * eff(c);
    if (s.shieldWork >= 8) { s.shieldWork -= 8; s.shield++; log(s, "g", "Shielding layer " + s.shield + " finished."); }
  }
  const indoor = 0.6 * (1 - 0.08 * s.shield);
  addDose(s, c, RAD[s.body] * (outside ? 0.25 + 0.75 * indoor : indoor));
  let d = outside ? 4 : t === "rest" ? -6 : t === "sci" ? 1 : 0;
  if (s.sheltLeft > 0) d += SPE.confine;
  c.stress = Math.max(0, Math.min(100, c.stress + d));
  if (t === "rest") c.health = Math.min(100, c.health + 1.4);
  if (c.stress > 85) c.health = Math.max(0, c.health - 2);
  if (c.dose >= LIMIT) c.health = Math.max(0, c.health - SPE.limitHealth);
}
