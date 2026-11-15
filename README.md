# Outpost Twin: a lunar and Martian outpost digital twin

**Solo entry, NASA Space Apps Challenge 2026.** Challenge: Build a Junior Astronaut Mission Trainer

## In one sentence
A playable, deterministic simulation of a four-person Moon or Mars outpost in which you keep the crew alive through real solar storms, and learn why radiation, power and supplies trade off against each other.

## What it does
You run a surface outpost one hour at a time: power, air, water, food, cabin heat and crew work. You can copy the live mission and run it forward (the "digital twin" forecast) to test a plan before committing to it. Every mission replays a real stretch of space weather: you start on a real date, and each solar particle event that NASA logged for that date arrives at the matching hour. When one arrives you decide: shelter (almost no dose, but no outdoor work and a cramped crew) or carry on (people outside take the full dose). Doses add up toward the 600 mSv career limit. Someone who passes it can no longer go outside and slowly loses health, and a big dose in one storm makes a person ill.

Two modes run the same rules. **Assisted** uses plain words, hints on the storm card, a fixed power order and a suggested crew plan with an autopilot. **Standard** shows every control. Moon or Mars, and 90, 180 or 365 days.

## NASA data used
- **NASA DONKI** solar energetic particle archive, 2012 to 2025: the timing, duration and energy band (above 100 MeV is the penetrating kind) of every storm. Records closer than 72 hours are grouped into one storm episode.
- Measured surface radiation rates: Chang'e-4 LND on the Moon (1.369 mSv a day) and Curiosity RAD on Mars (0.64 mSv a day).
- NASA-STD-3001 career limit (600 mSv) and the 250 mSv per-event limit.
- Reference facts shown in the Learn panel with source links: ISS water recovery milestone, MOXIE oxygen on Mars, Opportunity and the 2018 dust storm, Mars solar day.

## What is real and what is a game estimate
Real: when storms happen, the surface dose rates, the limits. Game estimates, and labelled as such in the app: the dose a storm delivers (40 mSv ordinary, 300 mSv strong, because the archive gives no dose), the 95% shelter cut, equipment sizes, power and resource numbers, and the penalties for passing the limit. The Learn panel tags every statement "Real world" (with a link) or "Game rule".

## Why it is useful
Players learn that radiation is a budget, not a single event. In the self-test, a crew that always carries on loses everyone over a busy 365-day year, while a crew that shelters from strong storms and watches its dose budget survives and keeps most of its outdoor work.

## How it was checked
- Deterministic: same seed and same choices give the same mission.
- A built-in self-test (add `?tools` to the address) runs 560 scripted missions across worlds, lengths, seasons and four player strategies, and checks that numbers stay sane (no negative stores, battery within capacity). Report from the latest run: `selftest-report.txt`.
- Rendering was tested in headless Chromium.

## Run it
```
npm install
npm run dev
npm run build
```
Vite, vanilla JavaScript modules and three.js. No server and no API key are needed to play: the storm archive is bundled in `src/data`. `tools/episodes.mjs` rebuilds the storm episodes from a raw DONKI download.

## Limits
The physics is a simplified game model of an idea that had a scope too large for 2 days. The 3D view is a placeholder outpost. Doses are estimates. A future version could ground the dose model in ISS dosimetry from NASA's RadLab.

## Credits
Built solo by the author. The concept, the design decisions (one rule set with Assisted and Standard modes, real storm seasons, shelter versus carry-on), the playtesting, the bug reports and the balance direction are mine. I used an AI assistant (Claude by Anthropic) as a tutor and to help write code, and I tested and directed every step. Contains data from NASA's public DONKI archive. NASA does not endorse this project.
