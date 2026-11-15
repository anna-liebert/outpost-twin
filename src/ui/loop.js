import { step } from "../sim/step.js";
import { render } from "./panels.js";
import { setSeg } from "./dom.js";
import { S, autoCrew, setAutoPaused, setResumeSpeed, setSpeed, speed } from "./state.js";
import { applyPlan } from "../sim/plan.js";
import { LEVEL } from "./state.js";
import { frame } from "./scene3d.js";
let last = performance.now();
let acc = 0;

export function tick(now) {
  const dt = Math.min(200, now - last);
  last = now;

  if (speed > 0 && S.alive) {
    acc += dt * speed;
    let n = 0;
    const before = S.pending.length;
    while (acc >= 250 && n < 48) {
      acc -= 250; step(S, 1); n++;
      if (autoCrew && LEVEL === "assisted" && S.t % 24 === 0) applyPlan(S);
      if (S.pending.length > before) break;
    }
    if (S.pending.length > before) {
      setResumeSpeed(speed); setAutoPaused(true); setSpeed(0); acc = 0; setSeg("spd", "s", "0");
    }
    if (n > 0) render(S);
  }
    frame();
  requestAnimationFrame(tick);
}