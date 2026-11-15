import { $, setSeg } from "./dom.js";
import { boot } from "./game.js";
import {setSeason,LEVEL,speed} from "./state.js";
import {learnHTML,setLevel} from "./learn.js";
import { tut, setAutoPaused, setMlen, setSpeed, site } from "./state.js";
import { TUT, endTut, placeTut, showTut, startTut } from "./tutorial.js";
function pick(id, key, apply) {
  $(id).onclick = (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    setSeg(id, key, b.dataset[key]);
    apply(b.dataset[key]);
  };
}

export function wireControls() {
    let lnSpeed = 0;
  $("lnBtn").onclick = () => {
    lnSpeed = speed;
    setSpeed(0); setSeg("spd", "s", "0");
    $("lnBody").innerHTML = learnHTML();
    $("lnOv").style.display = "flex";
  };
    $("seaSel").onchange = (e) => { setSeason(e.target.value); boot(site); };
  $("lnClose").onclick = () => {
    $("lnOv").style.display = "none";
    setSpeed(lnSpeed); setSeg("spd", "s", String(lnSpeed));
  };
  $("lvl").onclick = (e) => { const b = e.target.closest("button"); if (b) setLevel(b.dataset.l); };
  setSeg("lvl", "l", LEVEL);
  pick("spd", "s", (v) => { setSpeed(+v); setAutoPaused(false); });
  pick("bodySel", "b", (v) => boot(v));
  pick("lenSel", "l", (v) => { setMlen(+v); boot(site); });
  $("reset").onclick = $("again").onclick = () => boot(site);
    $("tutBtn").onclick = startTut;
  $("tutSkip").onclick = () => endTut(false);
  $("tutBack").onclick = () => { if (tut.i > 0) { tut.i--; showTut(); } };
  $("tutNext").onclick = () => { if (tut.i >= TUT.length - 1) endTut(true); else { tut.i++; showTut(); } };
  addEventListener("resize", placeTut);
  addEventListener("keydown", (e) => { if (tut && e.key === "Escape") endTut(false); });
}