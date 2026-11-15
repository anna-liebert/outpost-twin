import EPS from "../data/sep-episodes.json" with { type: "json" };

export const ARCHIVE_START = Date.parse("2012-01-01T00:00Z"), ARCHIVE_END = Date.parse("2025-12-31T23:59Z");

export function seasonEvents(startISO, lenDays) {
  const a = Date.parse(startISO + "T00:00Z");
  return EPS.map((e) => ({ t: e.t, h: Math.round((Date.parse(e.t) - a) / 36e5), hours: e.hours, n: e.n, hard: e.hard }))
    .filter((e) => e.h >= 0 && e.h < lenDays * 24);
}

export function randomStart(rand, lenDays) {
  const days = Math.floor((ARCHIVE_END - ARCHIVE_START) / 864e5) - lenDays;
  return new Date(ARCHIVE_START + Math.floor(rand() * days) * 864e5).toISOString().slice(0, 10);
}