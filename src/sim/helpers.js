import { SOL } from "./constants.js";

export function rng(s) {
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const clk = (s, t) => {
  const L = dayLenH(s);
  return { d: Math.floor(t / L), h: Math.floor(t % L) };
};

export const dayLenH = (s) => (s.body === "mars" ? SOL : 24);