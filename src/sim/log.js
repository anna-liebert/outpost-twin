export function log(s, l, m) {
  s.log.unshift({ t: s.t, l, m });
  if (s.log.length > 80) s.log.pop();
}