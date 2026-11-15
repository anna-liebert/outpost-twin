import { $, setSeg } from "./dom.js";
import { render } from "./panels.js";
import { LEVEL, S, setLevelValue, setRightKey } from "./state.js";
import { buildPolicy } from "./policy.js";
import { buildCrew } from "./crewpanel.js";

const G = ["game"];
const RW = (label, url) => ["real", label, url];
const SRC = {
  sol: RW("NASA GISS, Mars24 notes", "https://www.giss.nasa.gov/tools/mars24/help/notes.html"),
  water: RW("Space.com on NASA's ISS milestone, June 2023", "https://www.space.com/astronaut-pee-iss-water-recycling-98-percent-milestone"),
  moxie: RW("Space.com on MOXIE", "https://www.space.com/perseverance-mars-rover-ends-moxie-oxygen-experiment"),
  opp: RW("NASA JPL, Opportunity", "https://www.jpl.nasa.gov/news/six-things-about-opportunitys-recovery-efforts/"),
};

export function tagHTML(t) {
  if (Array.isArray(t[0])) return t.map(tagHTML).join(" ");
  return t[0] === "real"
    ? `<a class="tg real" href="${t[2]}" target="_blank" rel="noopener">Real world · ${t[1]}</a>`
    : '<span class="tg">Game rule</span>';
}

const GLOSS = [
  ["Sol", "A Mars solar day: 24 hours, 39 minutes and 35 seconds, about 40 minutes longer than an Earth day. The game's Mars clock runs on sols.",
   "One day on Mars. It is a little longer than a day on Earth, about 24 hours and 40 minutes.", SRC.sol],
  ["Digital twin", "A live computer model of a real system that you can copy and run ahead to test decisions. Here the model is the outpost, and the forecast button is the copy that runs ahead.",
   "A copy of the base inside the computer. You can test a plan on the copy before you try it for real.", G],
  ["Electrolysis", "Splitting water with electricity into hydrogen and oxygen. The game makes oxygen this way whenever the tank is below 80%. It needs 1.125 kg of water per kg of oxygen (from the chemistry), and half of that water is recovered. The 6.6 kWh per kg of oxygen is a game estimate.",
   "Using electricity to split water into air we can breathe and hydrogen. It costs a lot of power.", G],
  ["Water recycling", "Used water is cleaned and used again. The ISS reached 98% recovery of water from urine, sweat and cabin moisture in 2023; before a brine processor was added it was 93 to 94%. The game recycles 95% (a game choice, a little under the station), and a life-support system without power recycles less.",
   "Astronauts clean used water and drink it again. The space station now reuses 98% of its water.", [SRC.water, G]],
  ["ISRU", "In-situ resource utilisation: making useful things from what is on site. On Mars, the MOXIE experiment on the Perseverance rover made 122 grams of oxygen in 16 runs, at up to 12 grams an hour. A game plant is much bigger: about 64 grams of oxygen an hour on Mars. The game's numbers are tuned, not measured.",
   "Making water and air from the soil and ice around you instead of bringing them from Earth. A small machine on Mars called MOXIE really made oxygen this way.", [SRC.moxie, G]],
  ["Dust storm and tau", "Tau is how much dust blocks sunlight: higher means less light reaches the ground. Opportunity's last reading before the 2018 storm silenced it was 10.8, against a typical 0.5 at its site, and engineers estimated it needed a tau below 2.0 to recharge. In the game Mars starts at 0.5 and a storm adds 2.5, so the arrays make about 5% of normal output.",
   "Tau is a number for how dusty the sky is. A huge dust storm in 2018 blocked so much sun that the rover Opportunity could not charge its batteries.", [SRC.opp, G]],
  ["Load shedding", "Switching off the least important electricity users when power is short. In the game the priority list decides the order: the bottom item loses power first, and the amount left unserved is shown as Shed.",
   "When there is not enough power, some machines have to switch off. You choose which ones go last.", G],
  ["Fission power", "A small nuclear reactor that makes steady electricity day and night. In the game the Mars base starts with a 10 kW unit, a game assumption, because solar power alone could not keep the cabin warm through the night and through storms.",
   "A small nuclear power machine that works all day and all night, even in a dust storm.", G],
  ["Delivery time", "How long an order from Earth takes. In the game, Moon orders wait 30 to 60 days. Mars orders from Earth wait 180 days (about six months), so only a 365-day Mars mission can use them.",
   "Things ordered from Earth take a long time to arrive, so you have to order early.", G],
  ["Forecast", "A copy of the live mission is run ahead using your current settings and reports the first thing that fails. Storms are random, so the forecast shows one possible future, not a promise.",
   "The game tries your plan on a copy of the base and tells you what would go wrong first.", G],
   ["Radiation dose (mSv)", "The millisievert measures radiation dose. Real surface measurements: Moon 1.369 mSv/day (Chang'e-4, 2020), Mars 0.64 mSv/day (Curiosity RAD). The game's indoor factor (60%) is my own estimate.", "A number for how much radiation a person has soaked up. The Moon gives more than Mars because Mars has a thin atmosphere to help.", [RW("Chang'e-4 LND; Curiosity RAD"), G]],
["Career limit", "NASA's rule is a career total below 600 mSv for every astronaut. The game shows each person's total next to their name. Game rule: anyone who passes 600 mSv is grounded (no more spacewalks) and loses 1 health point a day.", "The most radiation an astronaut is allowed in a whole career. In the game, someone who passes it can no longer go outside and slowly gets weaker.", [RW("NASA-STD-3001"), G]],
["Shielding layer", "Piling regolith on the habitat. In the game each layer cuts the indoor dose by 8% (an invented rate); a layer takes 8 crew-days of EVA digging and 3 kW.", "Covering your home with soil so less radiation gets in.", G],
["Storm season", "Each mission replays a real stretch of space weather: you start on a real date and every storm NASA logged in its archive arrives at the matching hour. The same start date always brings the same storms.", "The game copies real space weather from a real year, so the storms you meet really happened.", [RW("NASA DONKI archive, 2012 to 2025"), G]],
["Solar particle event", "A burst of fast protons from the Sun. The archive gives when it happened, how many instruments saw it and the energy band (above 100 MeV is the penetrating kind). It gives no dose. The game's doses (40 mSv ordinary, 300 mSv above 100 MeV) and the 95% shelter cut are my estimates. Sheltering costs the outdoor days of the storm and adds stress; continuing lets anyone outside take the full dose.", "A burst of radiation from the Sun. Real storms set the timing. How strong the dose is in the game is our estimate. You can hide in the shelter or keep working.", [RW("NASA DONKI; limit from NASA-STD-3001"), G]],
[ "Radiation sickness", "Game rule built on the NASA per-event limit of 250 mSv: anyone who takes 250 mSv or more from one storm (only possible outside in a strong one) loses 30 health and is out of action for 7 days.", "If a person gets a very big dose all at once they get ill and cannot work for a week.", [RW("NASA-STD-3001"), G]],
[ "Assisted and Standard", "Two screens on one simulation. Standard shows every control. Assisted uses plainer words, hints on the storm card, a fixed power order and a suggested crew plan with an autopilot. The rules and numbers are the same in both.", "Assisted is the same game with easier words and fewer buttons. Standard shows everything.", G],
["DONKI", "NASA's Space Weather Database Of Notifications, Knowledge, Information at the Community Coordinated Modeling Center. The game uses its archived solar energetic particle records for 2012 to 2025, grouped into storm episodes when records are less than 72 hours apart (a game rule).", "NASA's logbook of space weather. The game reads the old pages of it.", [RW("ccmc.gsfc.nasa.gov/tools/DONKI"), G]],
];

const WHY = {
  spe: {
    std: "The Sun can throw out bursts of fast protons. The archive says when, not how strong, so the game assumes 40 mSv for an ordinary storm and 300 mSv for one with protons above 100 MeV. Sheltering cuts the dose about 95%.",
    jr: "The Sun sometimes shoots out fast particles. Hiding in the shelter keeps the crew safe, but nobody can work outside until it is over.",
    tags: [RW("NASA DONKI archive"), G],
  },
  storm: {
    std: "Dust in the atmosphere blocks sunlight. Mars dust storms are real: in 2018 one stopped the Opportunity rover from recharging. Here the storm lasts 3 to 8 days and cuts solar output to about 5%, which is a game rule. The battery, the reactor and what you switch off decide whether the cabin stays warm.",
    jr: "Dust in the sky blocks the sun, so the solar panels make almost no power. A real storm in 2018 stopped the Opportunity rover from charging.",
    tags: [SRC.opp, G],
  },
};

export function whyHTML(e) {
  const w = WHY[e.k];
  if (!w) return "";
  return `<details class="why"><summary>Why is this happening?</summary><p>${LEVEL === "assisted" ? w.jr : w.std} ${tagHTML(w.tags)}</p></details>`;
}

export function learnHTML() {
  const J = LEVEL === "assisted";
  const intro = J
    ? 'Words used in the game. A <span class="tg real">Real world</span> tag links to a source. A <span class="tg">Game rule</span> tag means it is how this game works, and some numbers are only estimates.'
    : 'Terms used in the game. <span class="tg real">Real world</span> links to the source of a fact. <span class="tg">Game rule</span> marks how this game works, where numbers are tuned or estimated.';
  return `<p>${intro}</p>` + GLOSS.map((g) => `<h3>${g[0]}</h3><p>${J ? g[2] : g[1]} ${tagHTML(g[3])}</p>`).join("");
}

export function setLevel(l) {
  setLevelValue(l);
  try { localStorage.setItem("outpostLevel", l); } catch (e) {}
  setSeg("lvl", "l", l);
  $("lnBody").innerHTML = learnHTML();
  setRightKey(null);
  buildPolicy(); buildCrew();
  render(S);
}