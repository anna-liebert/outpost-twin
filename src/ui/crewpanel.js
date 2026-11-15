import { $ } from "./dom.js";
import { LEVEL, S, autoCrew, setAutoCrew } from "./state.js";
import { applyPlan } from "../sim/plan.js";
import { TASKS } from "../sim/constants.js";

export function buildCrew() {
  const opts = Object.entries(TASKS).map(([k, t]) => `<option value="${k}">${t.n}</option>`).join("");
  const easy = LEVEL === "assisted";
  $("crewBox").innerHTML = `<h2>Crew tasking</h2>
    <div class="tag">Stress above 60 slows work; above 85 it drains health. Rest lowers it, EVA raises it fastest. Someone who is ill or over the radiation limit cannot go outside.</div>` +
    (easy ? `<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><button id="planBtn" class="pri">Suggested plan</button>
      <label class="tag"><input type="checkbox" id="autoCrew" ${autoCrew ? "checked" : ""}> autopilot (re-plan every day)</label></div>` : "") +
    S.crew.map((c, i) => `<div class="crew"><b>${c.name}</b> <span class="tag">${c.role}</span> <span class="tag" id="ct${i}"></span>
      <select data-c="${i}" aria-label="Task for ${c.name}">${opts}</select><div class="tag" id="cd${i}"></div></div>`).join("");
  $("crewBox").querySelectorAll("select[data-c]").forEach((sel) => {
    const i = +sel.dataset.c;
    sel.value = S.crew[i].task;
    sel.onchange = () => { S.crew[i].task = sel.value; updateCrew(S); sel.blur(); };
  });
  if (easy) {
    $("planBtn").onclick = () => { applyPlan(S); updateCrew(S); };
    $("autoCrew").onchange = (e) => setAutoCrew(e.target.checked);
  }
  updateCrew(S);
}

export function updateCrew(s) {
  s.crew.forEach((c, i) => {
    const sel = $("crewBox").querySelector(`select[data-c="${i}"]`);
    if (!sel) return;
    sel.disabled = c.health <= 0;
    sel.value = c.task;
    $("ct" + i).textContent = c.health <= 0 ? "deceased" : `stress ${c.stress.toFixed(0)} · health ${c.health.toFixed(0)} · ${c.dose.toFixed(0)} mSv` + (c.sick > 0 ? ` · ill ${c.sick} d` : c.dose >= 600 ? " · grounded" : "");
    $("cd" + i).textContent = c.health <= 0 ? "" : TASKS[c.task].desc;
  });
}