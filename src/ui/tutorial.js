import { fireEvent } from "../sim/events.js";
import { $, setSeg } from "./dom.js";
import { boot } from "./game.js";
import { render } from "./panels.js";
import { S, setRightKey, setSpeed, setTut, site, tut } from "./state.js";

export const TUT = [
  { sel: null, t: "You are running a digital twin",
    b: "This page simulates a four-person outpost one hour at a time: power, air, water, food and heat. Keep everyone alive until the mission ends. The model is live, so you can copy it and ask what happens next." },
  { sel: "header", t: "Choose a world, a length and a mode",
    b: "Moon or Mars, and 90, 180 or 365 days. Changing either starts a new mission. Assisted and Standard play by exactly the same rules: Assisted uses plainer words, hints and fewer controls. The speed buttons control how fast time passes." },
  { sel: "#stats", t: "Read the vitals",
    b: "Bars turn gold when low and red when critical. Oxygen, water and food are your stores. Generation and battery show power, and Shed is power the outpost wanted but could not get.",
    try: "The safe cabin range is about 5 to 33 °C. Outside it, health drains." },
  { sel: "#prio", t: "Decide who loses power first",
    b: "When supply falls short, the bottom item is switched off first. A bad order can kill the crew: on Mars, put the plants above the heater and the cabin can freeze.",
    try: "Try it: move an item with the arrows and see how the list changes." },
  { sel: "#fcGo", t: "Ask the twin what happens next",
    b: "A forecast copies the live mission and runs it ahead under your current settings. Nothing is committed. It names the first thing that fails and when.",
    try: "Try it: choose 180 days and press Run. On the Moon it should report food running out around day 121." },
  { sel: ".card", enter: () => { S.pending = []; fireEvent(S, "storm"); setRightKey(null); render(S); },
    t: "Events need a decision",
    b: "This is a sample dust storm. Every option has a cost. If you do not answer before the timer runs out, the default option applies." },
  { sel: ".sea", t: "Real solar storms",
    b: "Each mission replays a real stretch of space weather. When a solar storm arrives you get a short warning card: shelter (almost no dose, but no outdoor work and a cramped crew) or carry on (the people outside take the full dose). Doses add up toward the 600 mSv career limit, and a person who passes it can no longer go outside and slowly loses health.",
    try: "Open Learn for the rules. Strong storms (protons above 100 MeV) can make people ill in one go." },
  { sel: ".bl", t: "Spend the budget before you need it",
    b: "Money arrives every day. Items from Earth take weeks to arrive on the Moon, and on Mars only the greenhouse can be made on site in a 180-day mission. Order before you need it.",
    try: "Try it: order a greenhouse, then run the forecast again." },
  { sel: "#view", t: "The outpost",
    b: "The 3D view shows what you have built. Drag to rotate and scroll to zoom. New buildings appear when they are finished." },
  { sel: "footer", t: "Telemetry and the flight log",
    b: "The chart shows the last 10 days of battery, cabin temperature and generation. The log records what happened and what you chose. If the crew is lost, the end screen names the cause." },
  { sel: null, t: "Your first day",
    b: "Press Start mission: a fresh mission begins at 1×. A 180-day mission takes about 18 minutes, so use 4× or 16× when nothing is happening, and Pause whenever you need to think. You can reopen this tutorial from the header." },
];

export function startTut() {
  setSpeed(0); setSeg("spd", "s", "0");
  boot("moon"); setSeg("bodySel", "b", "moon");
  setTut({ i: 0 });
  showTut();
}

export function endTut(run) {
  setTut(null);
  $("tut").style.display = "none";
  if (run) { setSpeed(1); setSeg("spd", "s", "1"); }
  boot(site);
  try { localStorage.setItem("otw-tut", "1"); } catch (e) {}
}

export function showTut() {
  const st = TUT[tut.i];
  if (st.enter) st.enter();
  $("tut").style.display = "block";
  $("tutN").textContent = "Step " + (tut.i + 1) + " of " + TUT.length;
  $("tutT").textContent = st.t;
  $("tutB").textContent = st.b;
  $("tutTry").textContent = st.try || "";
  $("tutBack").disabled = tut.i === 0;
  $("tutNext").textContent = tut.i === TUT.length - 1 ? "Start mission" : "Next";
  placeTut();
  $("tutNext").focus({ preventScroll: true });
}

export function placeTut() {
  if (!tut) return;
  const st = TUT[tut.i], hl = $("tutHl"), card = $("tutCard");
  const el = st.sel ? document.querySelector(st.sel) : null;
  const W = innerWidth, H = innerHeight, cw = Math.min(360, W - 24);
  card.style.width = cw + "px";
  if (!el) {
    hl.style.display = "none";
    card.style.left = (W - cw) / 2 + "px";
    card.style.top = Math.max(12, H / 2 - card.offsetHeight / 2) + "px";
    return;
  }
  el.scrollIntoView({ block: "nearest" });
  const r = el.getBoundingClientRect(), ch = card.offsetHeight;
  hl.style.display = "block";
  hl.style.left = r.left - 4 + "px"; hl.style.top = r.top - 4 + "px";
  hl.style.width = r.width + 8 + "px"; hl.style.height = r.height + 8 + "px";
  let x, y;
  if (r.right + cw + 24 < W) { x = r.right + 16; y = r.top; }
  else if (r.left - cw - 24 > 0) { x = r.left - cw - 16; y = r.top; }
  else { x = (W - cw) / 2; y = r.bottom + 16 > H - ch ? r.top - ch - 16 : r.bottom + 16; }
  card.style.left = Math.max(12, Math.min(x, W - cw - 12)) + "px";
  card.style.top = Math.max(12, Math.min(y, H - ch - 12)) + "px";
}