import { BODIES, CREW } from "./constants.js";
import { sunFrac } from "./environment.js";
import { log } from "./log.js";
import { BUILD } from "./build.js";
import { crewDay, eff, isOutside } from "./crew.js";
import { fireSpe, fireEvent, resolveEvent } from "./events.js";
export function step(s, dt = 1) {
  if (!s.alive) return;

  const B = BODIES[s.body];
  const alive = s.crew.filter((c) => c.health > 0);
  const N = alive.length;
  const sun = sunFrac(s, s.t);

    const Tsink = sun > 0.05 ? B.sink.day : B.sink.night;
  const qLoss = s.UA * (s.T - Tsink);
  const qInt = N * CREW.metW;

  const wantE = s.o2 < s.o2Max * 0.8 ? 1.2 : 0;
  const elecKW = wantE * ((CREW.o2 * N) / 24) * 6.6;
  const lsKW = 3 + elecKW;
  const haulers = alive.reduce((a, c) => a + (c.task === "evaIce" && isOutside(s, c) ? eff(c) : 0), 0);
  const feed = Math.min(1, 0.45 + (0.35 * haulers) / (1 + s.isruN * 0.5));
  const digging = alive.some((c) => c.task === "evaShield" && isOutside(s, c) && s.shield < 3);
  const isruKW = s.isruN * 7.5 * feed * (s.body === "moon" ? 1.2 : 1) + s.ghN * 6 + (digging ? 3 : 0);

  const qElecEst = 0.6 * (lsKW + 1.2) * 1000;
  const heater = Math.min(15, Math.max(0, (qLoss - qInt - qElecEst) / 1000 + (s.setpoint - s.T) * 0.8));
  const want = { lifeSupport: lsKW, thermal: heater, isru: isruKW, science: s.sciOff ? 0 : 1.2 };
  const tauNow = s.tau + (s.stormLeft > 0 ? 2.5 : 0);

  const haze = Math.exp(-tauNow * 1.2);
    s.dust = Math.min(0.7, s.dust + (B.dust / 24) * dt * (s.stormLeft > 0 ? 5 : 1));
   const gen = (B.solar * sun * haze * s.arrayM2 * s.arrayEff * (1 - s.dust)) / 1000 + s.fission;
  const avail = gen + (s.batKWh > 0 ? Math.min(s.batKWh, 35) / dt : 0);
  let used = 0, shed = 0;
  const served = {};
  for (const g of s.prio) {
    const need = want[g];
    const give = Math.min(need, Math.max(0, avail - used));
    served[g] = need > 0 ? give / need : 1;
    used += give;
    shed += need - give;
  }
  const toBat = gen - used;
  if (toBat >= 0) {
    const room = (s.batMax - s.batKWh) / dt;
    s.batKWh += Math.min(toBat, room) * dt * s.batEff;
  } else {
    s.batKWh += toBat * dt;
  }
  s.batKWh = Math.max(0, Math.min(s.batMax, s.batKWh));

  const heatW = heater * 1000 * served.thermal;
  const qElec = 0.6 * (want.lifeSupport * served.lifeSupport + want.science * served.science) * 1000;
  s.T += ((heatW + qInt + qElec - qLoss) * 3600 * dt) / s.Cth;
  const recov = s.D.rc - (1 - served.lifeSupport) * s.D.rd;

  s.science += 0.1 * (s.sciOff ? 0 : served.science) * dt;
  s.last = { gen, load: used, sun, heater: heater * served.thermal, shed };
  const lsServed = served.lifeSupport;
  const o2Use = ((CREW.o2 * N) / 24) * dt;
  s.o2 -= o2Use;
  if (wantE) {
    const make = o2Use * wantE * lsServed;
    s.o2 += make;
    s.h2o -= make * 1.125 * 0.5;
  }
  const f = served.isru;
  if (s.body === "moon") {
    s.h2o += s.isruN * 0.25 * s.D.isru * feed * f * dt;
    s.o2  += s.isruN * 0.12 * s.D.isru * f * dt;
  } else {
    s.o2  += s.isruN * 0.08 * s.D.isru * f * dt;
    s.h2o += s.isruN * 0.2 * s.D.isru * feed * f * dt;
  }
  s.food += s.ghN * 0.09 * f * dt;

  s.h2o -= (((CREW.drink + CREW.hyg) * N) / 24) * dt * (1 - recov);
  s.food -= ((CREW.food * N) / 24) * dt;

  s.o2 = Math.max(0, Math.min(s.o2Max, s.o2));
  s.h2o = Math.max(0, Math.min(s.h2oMax, s.h2o));
  s.food = Math.max(0, Math.min(s.foodMax, s.food));

  for (const c of alive) {
    let loss = 0;
    if (s.o2 <= 0) loss += 6;
    if (s.h2o <= 0) loss += 3;
    if (s.food <= 0) loss += 1.4;
    if (s.T < 278 || s.T > 306) loss += 2.2;
    c.health = Math.max(0, c.health - loss * dt);
    if (c.health <= 0 && !c.dead) {
      c.dead = true;
      const why = [];
      if (s.o2 <= 0) why.push("oxygen exhausted");
      if (s.h2o <= 0) why.push("water exhausted");
      if (s.food <= 0) why.push("starvation");
      if (s.T < 278) why.push("cabin too cold");
      if (s.T > 306) why.push("cabin too hot");
      if (c.dose >= 600) why.push("radiation");
      else if (c.sick > 0) why.push("radiation sickness");
      s.cause = why.join(", ") || "medical";
      log(s, "c", "Crew loss: " + c.name + " (" + s.cause + ")");
    }
  }
  if (s.stormLeft > 0) {
    s.stormLeft -= dt;
     if(s.setpoint < 294 && s.T<283 ){
                  if (s.spSaved) { s.setpoint = s.spSaved; s.spSaved = 0; }
        }
    if (s.stormLeft <= 0) {

      s.stormLeft = 0; s.sciOff = false;       if (s.spSaved) { s.setpoint = s.spSaved; s.spSaved = 0; };
      log(s, "g", "The storm has passed. Normal operations resume.");
    }
  }
    if (s.sheltLeft > 0) { s.sheltLeft -= dt; if (s.sheltLeft <= 0) { s.sheltLeft = 0; log(s, "g", "All clear: EVA reopens."); } }
  if (s.season) for (const ep of s.season.eps) if (ep.h >= s.t && ep.h < s.t + dt) fireSpe(s, ep);

  if (s.body === "mars" && s.stormLeft === 0 && s.pending.length === 0 && s.rand() < 0.004 * dt) {
    fireEvent(s, "storm");
  }
  for (const e of s.pending) {
    e.left -= dt;
    if (e.left <= 0 && !e.done) { e.done = true; resolveEvent(s, e, e.def, true); }
  }
  s.pending = s.pending.filter((e) => !e.done);
  if (Math.floor((s.t + dt) / 24) > Math.floor(s.t / 24)) {
    s.budget += s.D.inc;
        for (const c of alive) crewDay(s, c);
    for (const b of s.buildQ) {
      if (b.wait > 0) b.wait -= 1;
      else b.left -= 1;
    }
    for (const b of s.buildQ.filter((b) => b.left <= 0)) {
      BUILD[b.k].apply(s);
      log(s, "g", "Built: " + BUILD[b.k].n);
    }
    s.buildQ = s.buildQ.filter((b) => b.left > 0);
  }
  if (s.t % 2 === 0) {
    s.hist.push({ t: s.t, gen, bat: (s.batKWh / s.batMax) * 100, T: s.T - 273.15, shed });
    if (s.hist.length > 600) s.hist.shift();
  }
  if (s.crew.every((c) => c.health <= 0)) s.alive = false;
  s.t += dt;
  if (Math.floor(s.t / 24) >= s.len) s.alive = false;
}