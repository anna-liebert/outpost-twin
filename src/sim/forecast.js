import { CREW } from "./constants.js";
import { fork } from "./mission.js";
import { step } from "./step.js";

export function forecast(s, days) {
  const f = fork(s);
  const series = [];
  let fail = null;

  for (let h = 0; h < days * 24; h++) {
    step(f, 1);

    if (h % 6 === 0) {
      const alive = f.crew.filter((c) => c.health > 0).length;
      series.push({
        d: h / 24,
        bat: (f.batKWh / f.batMax) * 100,
        T: f.T - 273.15,
        o2Days: f.o2 / ((alive * CREW.o2) || 1),
      });
    }

    if (!fail) {
      if (f.o2 <= 0) fail = { k: "Oxygen", d: h / 24 };
      else if (f.h2o <= 0) fail = { k: "Water", d: h / 24 };
      else if (f.T < 278) fail = { k: "Cabin cold", d: h / 24 };
      else if (f.T > 306) fail = { k: "Cabin hot", d: h / 24 };
      else if (f.food <= 0) fail = { k: "Food", d: h / 24 };
    }
    f.pending = [];
  }
  return { series, fail, final: f };
}