import { forecast } from "../sim/forecast.js";
import { $ } from "./dom.js";
import { LEVEL, S } from "./state.js";

const NAMES = { lifeSupport: "Life support", thermal: "Heater", isru: "Water, oxygen & food plants", science: "Science" };
const DEFAULT_PRIO = ["lifeSupport", "thermal", "isru", "science"];
const PLAIN = { Oxygen: "you would run out of oxygen", Water: "you would run out of water", "Cabin cold": "the cabin would get too cold", "Cabin hot": "the cabin would get too hot", Food: "you would run out of food" };

export function buildPolicy() {
  const easy = LEVEL === "assisted";
  if (easy) S.prio = [...DEFAULT_PRIO];
  $("policy").innerHTML =
    (easy
      ? "<h2>Power</h2><div class=\"tag\">Air and heat are kept on first, then plants, then science. Switch to Standard mode to change the order.</div>"
      : "<h2>Power priority</h2><div class=\"tag\">When power runs short, the bottom item is switched off first.</div><div id=\"prio\"></div>") +
    "<h2>Cabin temperature</h2>" +
    '<div class="row"><span>Setpoint</span><span class="m" id="spVal"></span></div>' +
    '<input type="range" id="sp" min="15" max="25" step="1" style="width:100%">' +
    (easy ? '<div class="tag">About 20 °C is comfortable. Colder saves power, but below 5 °C the crew get hurt.</div>' : "") +
    (easy ? "<h2>What happens next?</h2>" : "<h2>Forecast</h2>") +
    (easy
      ? '<div style="display:flex;gap:6px"><button id="fcGo" class="pri">Look ahead 3 weeks</button></div><input type="hidden" id="fcDays" value="21">'
      : '<div style="display:flex;gap:6px"><select id="fcDays"><option value="7">7 days</option><option value="21" selected>21 days</option><option value="60">60 days</option><option value="180">180 days</option></select><button id="fcGo" class="pri">Run</button></div>') +
    '<div id="fcOut" class="tag" style="margin-top:6px"></div>';

  if (!easy) drawPrio();
  $("sp").value = Math.round(S.setpoint - 273.15);
  $("spVal").textContent = $("sp").value + " °C";
  $("sp").oninput = (e) => {
    S.setpoint = 273.15 + +e.target.value;
    $("spVal").textContent = e.target.value + " °C";
  };
  $("fcGo").onclick = runForecast;
}

function drawPrio() {
  $("prio").innerHTML = S.prio.map((g, i) =>
    `<div class="row"><span>${i + 1}. ${NAMES[g]}</span><span>` +
    `<button data-m="${i},-1" ${i === 0 ? "disabled" : ""}>▲</button>` +
    `<button data-m="${i},1" ${i === S.prio.length - 1 ? "disabled" : ""}>▼</button></span></div>`).join("");
  $("prio").querySelectorAll("[data-m]").forEach((b) => {
    b.onclick = () => {
      const [i, d] = b.dataset.m.split(",").map(Number);
      [S.prio[i], S.prio[i + d]] = [S.prio[i + d], S.prio[i]];
      drawPrio();
    };
  });
}

function runForecast() {
  const days = +$("fcDays").value;
  const fc = forecast(S, days);
  const low = Math.min(...fc.series.map((p) => p.bat));
  $("fcOut").textContent = LEVEL === "assisted"
    ? (fc.fail ? `If nothing changes, ${PLAIN[fc.fail.k] || fc.fail.k} in about ${Math.round(fc.fail.d)} days.` : `Looks fine for the next ${days} days.`)
    : (fc.fail ? `First failure: ${fc.fail.k}, in ${fc.fail.d.toFixed(1)} days.` : `No failure in the next ${days} days.`) + ` Lowest battery: ${low.toFixed(0)} %.`;
}
