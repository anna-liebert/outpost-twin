import { DIFF } from "./constants.js";
import { rng } from "./helpers.js";
import { seasonEvents } from "./season.js";
export function newState(body, seed, diff = "standard", len = 180, start = null) {
  const D = DIFF[diff];

  return {
        hist: [],
        o2Max: 400, h2oMax: 1500, foodMax: 600,
    isruN: body === "mars" ? 2 : 1,
    ghN: body === "mars" ? 1 : 0,
    fission: body === "mars" ? D.mf : 0,
        budget: D.bud,
    buildQ: [],
        pending: [],
    stormLeft: 0,
    sciOff: false,
    eid: 0,
        prio: ["lifeSupport", "thermal","isru", "science"],
    science: 0,
        T: 293,
    Cth: 6e7,
    UA: 38,
    setpoint: 294,
        arrayEff: 0.29,
    dust: 0,
    tau: body === "mars" ? 0.5 : 0,
    batEff: 0.92,
    last: { gen: 0, load: 0, sun: 0 },
    body, seed, diff, D, len,
    t: 0,
    rand: rng(seed),
    alive: true,
    o2: D.o2, h2o: D.h2o, food: D.food,
    arrayM2: D.arr,
    batKWh: D.bat * 0.62,
    batMax: D.bat,
    log: [],
    shield: 0, shieldWork: 0, sheltLeft: 0, sickN: 0, evaLost: 0, grounded: 0, spes: [],
    season: start ? { start, eps: seasonEvents(start, len) } : null,
    crew: [
      { name: "Okafor", role: "Commander", health: 100, dose: 0, sick: 0, stress: 12, task: "ivaMaint" },
      { name: "Reyes", role: "Engineer", health: 100, dose: 0, sick: 0, stress: 12, task: "ivaMaint" },
      { name: "Lindqvist", role: "Medic", health: 100, dose: 0, sick: 0, stress: 12, task: "ivaMaint" },
      { name: "Tanaka", role: "Geologist", health: 100, dose: 0, sick: 0, stress: 12, task: "ivaMaint" },
    ],
  };
}

export function fork(s) {
  const c = JSON.parse(JSON.stringify(s));
  c.rand = rng(s.seed + Math.floor(s.t) * 7919);
  return c;
}