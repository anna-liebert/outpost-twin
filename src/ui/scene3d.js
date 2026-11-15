import * as THREE from "three";
import { dayLenH } from "../sim/helpers.js";
import { $ } from "./dom.js";
import { S } from "./state.js";

let renderer, scene, camera;
const orbit = { a: 0.7, e: 0.55, r: 46 };
let drag = null;
const parts = {};
const cache = {};

const mat = (color, emissive = 0) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.3, emissive });

export function init3D() {
  renderer = new THREE.WebGLRenderer({ canvas: $("cv"), antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05070d, 60, 160);
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);

  scene.add(new THREE.AmbientLight(0x8892ab, 0.35));
  parts.sun = new THREE.DirectionalLight(0xfff2dd, 1.3);
  scene.add(parts.sun);

  const g = new THREE.PlaneGeometry(240, 240, 60, 60);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, Math.sin(x * 0.07) * 0.5 + Math.cos(z * 0.09) * 0.45 + Math.sin((x + z) * 0.2) * 0.12);
  }
  g.computeVertexNormals();
  parts.terrain = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x585860, roughness: 1, flatShading: true }));
  parts.terrain.position.y = -0.2;
  scene.add(parts.terrain);

  parts.hab = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 12, 24), mat(0xc9ced9));
  parts.hab.rotation.z = Math.PI / 2;
  parts.hab.position.y = 3.4;
  scene.add(parts.hab);
  for (const x of [-6, 6]) {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3.2, 24, 12), mat(0xc9ced9));
    dome.position.set(x, 3.4, 0);
    scene.add(dome);
  }
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(3.25, 3.25, 1, 24), mat(0xe8b86d, 0x3a2a0a));
  stripe.rotation.z = Math.PI / 2;
  stripe.position.y = 3.4;
  scene.add(stripe);

  for (const name of ["arrays", "plants", "fission"]) {
    parts[name] = new THREE.Group();
    scene.add(parts[name]);
  }

  const cv = $("cv");
  cv.onpointerdown = (e) => { drag = { x: e.clientX, y: e.clientY, a: orbit.a, e: orbit.e }; cv.setPointerCapture(e.pointerId); };
  cv.onpointermove = (e) => {
    if (!drag) return;
    orbit.a = drag.a - (e.clientX - drag.x) * 0.006;
    orbit.e = Math.max(0.12, Math.min(1.3, drag.e + (e.clientY - drag.y) * 0.005));
  };
  cv.onpointerup = () => { drag = null; };
  cv.onwheel = (e) => { e.preventDefault(); orbit.r = Math.max(18, Math.min(100, orbit.r * (1 + e.deltaY * 0.001))); };

  sync3D();
}

export function sync3D() {
  const key = [S.body, Math.round(S.arrayM2), S.isruN, S.ghN, S.fission].join();
  if (cache.key === key) return;
  cache.key = key;

  parts.terrain.material.color.setHex(S.body === "mars" ? 0x8a5a44 : 0x58585f);
  scene.fog.color.setHex(S.body === "mars" ? 0x1a0e0c : 0x05070d);
  for (const name of ["arrays", "plants", "fission"]) {
    while (parts[name].children.length) parts[name].remove(parts[name].children[0]);
  }

  const panels = Math.max(1, Math.round(S.arrayM2 / 20));
  for (let i = 0; i < panels; i++) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(8, 0.15, 7), mat(0x1d3a8a, 0x08142e));
    panel.position.set(18 + Math.floor(i / 4) * 10, 2.4, -14 + (i % 4) * 9);
    panel.rotation.z = -0.35;
    parts.arrays.add(panel);
  }
  for (let i = 0; i < S.isruN; i++) {
    const plant = new THREE.Group();
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.4, 5, 16), mat(0xb08a4a));
    tank.position.y = 2.5;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 8), mat(0xd9d9e0));
    dome.position.y = 6.2;
    plant.add(tank, dome);
    plant.position.set(-18, 0, -10 + i * 9);
    parts.plants.add(plant);
  }
  for (let i = 0; i < S.ghN; i++) {
    const gh = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 8, 3, 1),
      new THREE.MeshStandardMaterial({ color: 0x2e8b57, emissive: 0x0a3a1c, transparent: true, opacity: 0.75 }));
    gh.rotation.z = Math.PI / 2;
    gh.position.set(0, 1.5, 16 + i * 7);
    parts.plants.add(gh);
  }
  for (let i = 0; i < Math.floor(S.fission / 10); i++) {
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 6, 12), mat(0x8a8f9c));
    core.position.set(-30, 3, -4 + i * 4);
    parts.fission.add(core);
  }
}

export function frame() {
  if (!renderer) return;
  const v = $("view"), w = v.clientWidth, h = v.clientHeight;
  if (renderer.domElement.width !== Math.floor(w * renderer.getPixelRatio()) ||
      renderer.domElement.height !== Math.floor(h * renderer.getPixelRatio())) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  if (!drag) orbit.a += 0.0008;
  camera.position.set(
    Math.sin(orbit.a) * Math.cos(orbit.e) * orbit.r,
    Math.sin(orbit.e) * orbit.r,
    Math.cos(orbit.a) * Math.cos(orbit.e) * orbit.r);
  camera.lookAt(0, 2, 0);

  const ang = ((S.t % dayLenH(S)) / dayLenH(S)) * Math.PI * 2;
  parts.sun.intensity = 0.15 + 1.3 * Math.max(0.1, S.last.sun);
  parts.sun.position.set(Math.cos(ang) * 50, 12 + Math.sin(ang) * 28, 10);
  parts.hab.material.emissive.setHex(S.T < 281 ? 0x0a2a3a : 0x000000);

  sync3D();
  renderer.render(scene, camera);
}

export function tryInit3D() {
  try {
    init3D();
    $("hud").textContent = "Drag to rotate · scroll to zoom";
  } catch (e) {
    renderer = null;
    $("cv").style.display = "none";
    $("hud").textContent = "3D view unavailable here (WebGL or the 3D library did not load). The simulation still works.";
  }
}
export const has3D = () => !!renderer;