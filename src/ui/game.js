import { newState } from "../sim/mission.js";
import { randomStart } from "../sim/season.js";
import { $ } from "./dom.js";
import { render } from "./panels.js";
import { S, mlen, season, setMission, setRightKey, setSite } from "./state.js";
import { buildCrew } from "./crewpanel.js";
import { buildPolicy } from "./policy.js";

function startFor() {
  if (season === "none") return null;
  if (season === "quiet") return "2018-06-01";
  if (season === "busy") return "2024-01-01";
  return randomStart(Math.random, mlen);
}

export function boot(body) {
  setSite(body);
  setMission(newState(body, Math.floor(Math.random() * 1e6), "standard", mlen, startFor()));
  setRightKey(null);
  buildCrew();
  buildPolicy();
  $("end").style.display = "none";
  render(S);
}