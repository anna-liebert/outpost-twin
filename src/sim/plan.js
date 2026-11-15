export const PLAN = { moon: ["evaIce", "evaClean", "sci", "ivaMaint"], mars: ["evaIce", "evaIce", "evaClean", "sci"] };

export function applyPlan(s) {
  s.crew.forEach((c, i) => {
    if (c.health <= 0) return;
    if (c.stress > 55) c.task = "rest";
    else if (c.task === "rest" && c.stress > 20) return;
    else c.task = PLAN[s.body][i];
  });
}
