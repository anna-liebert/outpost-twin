import { wireControls } from "./ui/controls.js";
import { render } from "./ui/panels.js";
import { tick } from "./ui/loop.js";
import { S } from "./ui/state.js";
import { tryInit3D } from "./ui/scene3d.js";
import { buildPolicy } from "./ui/policy.js";
import { startTut } from "./ui/tutorial.js";
import { wireSelfTest } from "./selftest/runner.js";

wireControls();
wireSelfTest();
tryInit3D();
buildPolicy();
render(S);
requestAnimationFrame(tick);
try { if (!localStorage.getItem("otw-tut")) startTut(); } catch (e) {}