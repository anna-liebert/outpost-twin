import { newState } from "../sim/mission.js";
export let autoPaused = false;
export let resumeSpeed = 1;
export let rightKey = null;
export let mlen = 180;
export let site = "mars";
export let tut = null;
export let S = newState("mars", 1);
export let speed = 1;
export let season = "random";
export function setTut(v) { tut = v; }
export function setMlen(v) { mlen = v; }
export function setSite(v) { site = v; }
export function setSeason(v) { season = v; }
export function setAutoPaused(v) { autoPaused = v; }
export function setResumeSpeed(v) { resumeSpeed = v; }
export function setRightKey(v) { rightKey = v; }
export let LEVEL = "assisted";
try { const sv = localStorage.getItem("outpostLevel"); if (sv === "standard" || sv === "assisted") LEVEL = sv; else if (sv === "std") LEVEL = "standard"; else if (sv === "jr") LEVEL = "assisted"; } catch (e) {}
export const TXT = (std, easy) => (LEVEL === "assisted" ? easy : std);
export let autoCrew = false;
export function setAutoCrew(v) { autoCrew = v; }
export function setLevelValue(v) { LEVEL = v; }

export function setMission(v) { S = v; }
export function setSpeed(v) { speed = v; }