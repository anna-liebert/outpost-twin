export const CREW = {
  o2: 0.84,
  co2: 1.0,
  drink: 2.5,
  hyg: 1.8,
  food: 0.62,
  metW: 136,
};

export const BODIES = {
 moon: { name: "Moon", g: 1.62, solar: 1361, dust: 0.002, sink: { day: 200, night: 100 } },
mars: { name: "Mars", g: 3.71, solar: 590, dust: 0.0028, sink: { day: 240, night: 190 } },
};

export const TASKS = {
  ivaMaint: { n: "Maintain systems (IVA)", eva: 0, desc: "Routine upkeep inside. No strain." },
  rest: { n: "Rest & recover", eva: 0, desc: "Stress down 6 a day, health back." },
  sci: { n: "Science (IVA)", eva: 0, desc: "Lab work: 3 science points a day." },
  evaClean: { n: "EVA: clean solar panels", eva: 6, desc: "Wipes off 22% of the dust. Stress up 4 a day." },
    evaShield: { n: "EVA: pile regolith on the habitat", eva: 6, desc: "8 crew-days per layer, up to 3. Digger draws 3 kW. Stress up 4 a day." },
  evaIce: { n: "EVA: haul ice and regolith", eva: 6, desc: "Feeds the water plants. Stress up 4 a day." },
};
export const SOL = 24 + 39 / 60 + 35.244 / 3600;
export const DIFF = {
  standard: { name: "Standard", o2: 100, h2o: 600, food: 300, arr: 140, bat: 480, rc: 0.95, rd: 0.25, bud: 420, inc: 14, isru: 0.8, mf: 10 },
};
export const RAD = { moon: 1.369, mars: 0.64 };
export const LIMIT = 600;
export const SPE = { soft: 40, hard: 300, shelter: 0.05, inside: 0.5, perLayer: 0.65, sickAt: 250, sickHealth: 30, sickDays: 7, limitHealth: 1, confine: 3 };