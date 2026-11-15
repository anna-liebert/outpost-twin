export const $ = (id) => document.getElementById(id);
export function setSeg(id, key, val) {
  [...$(id).children].forEach((x) => x.classList.toggle("on", x.dataset[key] === val));
}