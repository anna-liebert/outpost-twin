import { jobs, makeMission, report } from "./battery.js";
import { simChecks } from "./checks.js";
import { $, setSeg } from "../ui/dom.js";
import { render } from "../ui/panels.js";
import { has3D } from "../ui/scene3d.js";
import { S, setSpeed, speed } from "../ui/state.js";

const IDS = ["clock", "spd", "bodySel", "lenSel", "reset", "tutBtn", "lnBtn", "lvl", "left", "stats", "policy",
  "view", "cv", "hud", "end", "endT", "endB", "again", "right", "chart", "legend", "log", "tut", "tutHl", "tutCard", "tutN",
  "tutT", "tutB", "tutTry", "tutSkip", "tutBack", "tutNext", "lnOv", "lnBody", "lnClose", "stOv", "stOut", "stSt", "stCopy", "stClose", "crewBox", "seaSel", "seaTag"];

let stopped = false, savedSpeed = 0;

function uiChecks() {
  const o = [], de = document.documentElement;
  o.push("viewport " + innerWidth + "x" + innerHeight + ", pixel ratio " + (window.devicePixelRatio || 1));
  o.push("page size " + de.scrollWidth + "x" + de.scrollHeight + (de.scrollWidth > innerWidth + 1 ? "  PROBLEM: sideways overflow" : ""));
  try { render(S); o.push("render ok"); } catch (e) { o.push("PROBLEM: render failed: " + e.message); }
  const missing = IDS.filter((id) => !document.getElementById(id));
  o.push("element ids the code needs but the page lacks: " + (missing.join(", ") || "none"));
  o.push("WebGL scene: " + (has3D() ? "present" : "MISSING (the simulation still works)"));
  return o;
}

function start() {
  const out = $("stOut"), st = $("stSt");
  $("stOv").style.display = "flex";
  out.value = "";
  savedSpeed = speed; setSpeed(0); setSeg("spd", "s", "0");
  stopped = false;
  const list = jobs(), results = [], t0 = performance.now();
  let ji = 0, cur = null;
  const head = () => ["OUTPOST TWIN SELF-TEST  " + new Date().toISOString().slice(0, 16) + "  " + Math.round((performance.now() - t0) / 1000) + " s", ""];

  function work() {
    if (stopped) return;
    const t1 = performance.now();
    while (performance.now() - t1 < 40) {
      if (!cur) {
        if (ji >= list.length) {
          out.value = [...head(), "SIMULATION CHECKS", ...simChecks(), "", "PAGE CHECKS", ...uiChecks(), "", ...report(results)].join("\n");
          st.textContent = "Done. Copy the report and send it to Claude.";
          return;
        }
        cur = makeMission(...list[ji++]);
      }
      const r = cur.tick(240);
      if (r) { results.push(r); cur = null; }
    }
    st.textContent = "Mission " + ji + " of " + list.length + ", " + Math.round((performance.now() - t0) / 1000) + " s. Keep the screen on.";
    setTimeout(work, 0);
  }
  work();
}

export function wireSelfTest() {
  if (location.search.includes("tools")) $("stBtn").hidden = false;
  $("stBtn").onclick = start;
  $("stClose").onclick = () => {
    stopped = true;
    $("stOv").style.display = "none";
    setSpeed(savedSpeed); setSeg("spd", "s", String(savedSpeed));
  };
  $("stCopy").onclick = () => {
    const o = $("stOut");
    o.select();
    try { navigator.clipboard.writeText(o.value).catch(() => document.execCommand("copy")); } catch (e) { document.execCommand("copy"); }
  };
}