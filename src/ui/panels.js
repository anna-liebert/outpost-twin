import { $, setSeg } from "./dom.js";
import { f1, barHTML, doseHTML } from "./format.js";
import { LIMIT } from "../sim/constants.js";
import { clk } from "../sim/helpers.js";
import { decide } from "../sim/events.js";
import { BUILD, LEAD, LOCAL, MARS_WAIT, buildOK, tryBuild } from "../sim/build.js";
import { log } from "../sim/log.js";
import { whyHTML } from "./learn.js";
import { updateCrew } from "./crewpanel.js";
import { LEVEL, autoPaused, resumeSpeed, rightKey, setAutoPaused, setRightKey, setSpeed } from "./state.js";
export function render(s) {
  const { d, h } = clk(s, s.t);
  $("clock").textContent = `Day ${d + 1} · ${String(h).padStart(2, "0")}:00`;

  const D = s.D;
  const crew = s.crew
    .map((c) => `<div class="row"><span>${c.name} · ${c.role}</span><span class="m">${c.health > 0 ? f1(c.health, 0) + " %" : "lost"}</span></div>`)
    .join("");

  $("stats").innerHTML =
    "<h2>Consumables</h2>" +
    barHTML("Oxygen", s.o2, D.o2, "kg", D.o2 * 0.3, D.o2 * 0.1) +
    barHTML("Water", s.h2o, D.h2o, "kg", D.h2o * 0.3, D.h2o * 0.1) +
    barHTML("Food", s.food, D.food, "kg", D.food * 0.3, D.food * 0.1) +
    "<h2>Power</h2>" +
    barHTML("Battery", s.batKWh, s.batMax, "kWh", s.batMax * 0.3, s.batMax * 0.1) +
    `<div class="row"><span>Generation</span><span class="m">${f1(s.last.gen)} kW</span></div>` +
    `<div class="row"><span>Load served</span><span class="m">${f1(s.last.load)} kW</span></div>` +
    `<div class="row"><span>Shed</span><span class="m">${f1(s.last.shed)} kW</span></div>` +
    "<h2>Cabin</h2>" +
    `<div class="row"><span>Temperature</span><span class="m">${f1(s.T - 273.15)} °C</span></div>` +
    `<div class="row"><span>Science</span><span class="m">${f1(s.science)}</span></div>` +
    `<div class="row"><span>Budget</span><span class="m">$${f1(s.budget, 0)}M</span></div>` +
    "<h2>Crew</h2>" + crew +
    `<h2>Radiation · limit ${LIMIT} mSv</h2>` + s.crew.map((c) => doseHTML(c.name, c.dose, LIMIT)).join("") +
    (s.sheltLeft > 0 ? `<div class="tag">Sheltering: ${Math.ceil(s.sheltLeft)} h left. No outdoor work until then.</div>` : "");

  $("log").innerHTML = s.log
    .slice(0, 12)
    .map((e) => {
      const c = clk(s, e.t);
      return `<div class="${e.l}"><b>Day ${c.d + 1} ${String(c.h).padStart(2, "0")}:00</b> ${e.m}</div>`;
    })
    .join("");
    renderRight(s);
    renderEnd(s);
    drawChart(s);
    updateCrew(s);
  const st = s.season;
  $("seaTag").innerHTML = st
    ? "<b>Real date replayed: " + new Date(Date.parse(st.start + "T00:00Z") + s.t * 36e5).toISOString().slice(0, 10) + "</b><br>" +
      "Season starts " + st.start + ". Storm timing: NASA DONKI archive. Doses: game estimate."
    : "No solar storms in this mission.";
  const done = s.spes.slice(-4).reverse().map((x) => {
    const c = clk(s, x.t);
    return `<div>Day ${c.d + 1}: ${x.hard ? "strong" : "ordinary"} storm, ${x.sheltered ? "sheltered" : "carried on"}${x.sick ? ", " + x.sick + " ill" : ""}</div>`;
  }).join("");
  $("seaTag").innerHTML += (done ? "<br><b>Storms so far</b>" + done : "");
}

function renderRight(s) {
  const key =LEVEL + "|" + s.pending.map((e) => e.id).join() + "|" + s.buildQ.map((b) => b.k).join() + "|" +
    Object.entries(BUILD).map(([k, b]) => (s.budget >= b.cost && buildOK(s, k) ? 1 : 0)).join("");
  if (key !== rightKey) {
    setRightKey(key);
    let h = "<h2>Decisions</h2>";
    if (!s.pending.length) h += '<p class="tag">Nothing needs a decision right now.</p>';
    for (const e of s.pending) {
      const hint = LEVEL === "assisted" && e.k === "spe"
        ? `<p class="tag"><b>Hint:</b> ${e.ep.hard ? "this is a strong storm. Sheltering is the safe choice." : "this is an ordinary storm, so the dose is small. Sheltering is safest; carrying on costs some dose that adds up toward the limit."}</p>` : "";
      h += `<div class="card"><h3>${e.title}</h3><p>${e.txt}</p>${hint}${whyHTML(e)}<div class="tag" data-et="${e.id}"></div><div class="opts">` +
        e.opts.map((o, i) => `<button data-e="${e.id}" data-i="${i}">${i + 1}. ${o}</button>`).join("") +
        "</div></div>";
    }
    $("right").innerHTML = h + buildHTML(s);
    $("right").querySelectorAll("[data-e]").forEach((b) => {
      b.onclick = () => answer(s, +b.dataset.e, +b.dataset.i);
    });
    $("right").querySelectorAll("[data-b]").forEach((b) => {
      b.onclick = () => {
        const k = b.dataset.b;
        if (tryBuild(s, k)) {
          log(s, "g", "Construction started: " + BUILD[k].n);
          setRightKey(null);
          render(s);
        }
      };
    });
  }
  for (const e of s.pending) {
    const el = document.querySelector(`[data-et="${e.id}"]`);
    if (el) el.textContent = "Auto-applies in " + Math.max(0, Math.ceil(e.left)) + " h";
  }
  s.buildQ.forEach((b, i) => {
    const el = document.querySelector(`[data-bq="${i}"]`);
    if (el) el.textContent = bqTxt(b);
  });
}
function renderEnd(s) {
  if (s.alive) return;
  const { d } = clk(s, s.t);
  const lost = s.crew.every((c) => c.health <= 0);
  $("endT").textContent = lost ? "Crew lost" : "Mission complete";
  $("endB").textContent = lost
    ? `All ${s.crew.length} crew were lost on day ${d + 1}: ${s.cause || "unknown cause"}.`
    : `The crew survived ${d} days. Science collected: ${f1(s.science)}.`;
  if (s.spes.length) {
    const n = s.spes.length, hid = s.spes.filter((x) => x.sheltered).length, top = Math.max(...s.crew.map((c) => c.dose));
    $("endB").textContent += ` Solar storms met: ${n} (sheltered ${hid}, carried on ${n - hid}). Illnesses: ${s.sickN}. Highest dose: ${f1(top, 0)} of ${LIMIT} mSv. Outdoor days given up to shelter: ${s.evaLost}.`;
  }
  $("end").style.display = "flex";
}
function answer(s, id, i) {
  decide(s, id, i);
  if (autoPaused && !s.pending.length) {
    setAutoPaused(false);
    setSpeed(resumeSpeed);
    setSeg("spd", "s", String(resumeSpeed));
  }
  render(s);

}
function buildHTML(s) {
  let h = "<h2>Build queue</h2>";

  h += s.buildQ.map((b, i) => `<div class="row"><span>${BUILD[b.k].n}</span><span class="m" data-bq="${i}">${bqTxt(b)}</span></div>`).join("")
    || '<div class="tag">Nothing under construction.</div>';
  h += '<div class="bl">' + Object.entries(BUILD).map(([k, b]) => {
    const ok = buildOK(s, k);
    const lead = s.body === "moon" ? LEAD[k] : LOCAL[k] ? 0 : MARS_WAIT;
    const when = !ok ? "no delivery before the mission ends" : (lead ? lead + " d delivery + " : "") + b.days + " d";
    const off = s.budget < b.cost || !ok ? "disabled" : "";
    return `<button data-b="${k}" ${off}>${b.n} · $${b.cost}M · ${when}</button>`;
  }).join("") + "</div>";
  return h;
}
function drawChart(s) {
  const cv = $("chart");
  const r = cv.getBoundingClientRect();
  const dp = Math.min(2, window.devicePixelRatio || 1);
  cv.width = r.width * dp;
  cv.height = r.height * dp;
  const c = cv.getContext("2d");
  c.scale(dp, dp);

  const hs = s.hist.slice(-120);
  if (hs.length < 2) return;
  const W = r.width, H = r.height;
  const series = [
    ["bat", "#E8B86D", 0, 100],
    ["T", "#69E8DA", 10, 35],
    ["gen", "#8892AB", 0, Math.max(10, ...hs.map((p) => p.gen))],
  ];

  c.strokeStyle = "#28324A"; c.lineWidth = 1;
  for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(0, (H * i) / 3); c.lineTo(W, (H * i) / 3); c.stroke(); }

  for (const [key, color, lo, hi] of series) {
    c.strokeStyle = color; c.lineWidth = 1.5; c.beginPath();
    hs.forEach((p, i) => {
      const x = (i / (hs.length - 1)) * W;
      const y = H - ((Math.max(lo, Math.min(hi, p[key])) - lo) / (hi - lo)) * H;
      if (i) c.lineTo(x, y); else c.moveTo(x, y);
    });
    c.stroke();
  }
  $("legend").innerHTML =
    '<span style="color:#E8B86D">battery %</span> · <span style="color:#69E8DA">cabin °C</span> · <span style="color:#8892AB">generation kW</span>';
}