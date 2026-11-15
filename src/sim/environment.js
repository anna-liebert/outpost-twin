import { SOL } from "./constants.js";

export function sunFrac(s, hr) {
  if (s.body === "moon") {
    const ph = (hr % (29.53 * 24)) / (29.53 * 24);
    return ph > 0.93 && ph < 0.965 ? 0.0
      : Math.sin((hr / (29.53 * 24)) * Math.PI * 2 * 3) * 0.5 + 0.5 > 0.97 ? 0.2: 1;
  }
  const lh = (hr % SOL) / SOL;
  const e = Math.cos((lh - 0.5) * Math.PI * 2) * Math.cos(0.32);
  return Math.max(0, e);
}