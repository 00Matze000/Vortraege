// ============================================================
//  Den Wald von oben zählen — Cinematic Three.js Scene Engine
//  Scroll-driven camera flight through a Brandenburg Scots pine
//  forest (Pinus sylvestris monoculture, royal emerald + gold)
// ============================================================

import * as THREE from 'three';
// Hand-built showcase models (see models.js) — detailed pines, ground
// flora and animals with their own userData.update() animations.
import {
  createScotsPine, createScotsPine2, createScotsPine3, createBirch, createYoungPine,
  createFern, createBerryBush, createMushroom, createSteinpilz,
  createJuniper, createBlackberry, createWoodSorrel, createMossPatch, createLichen,
  createCalamagrostis, createGrassTuft, createPineCone, createBoulderCluster,
  createStump, createStumpDecayed, createStumpFallen,
  createDeer, createBoar, createFox, createHare, createBirdFlying, createBirdSitting,
} from './models.js';

// ------- Colors -------
const COL = {
  void:    0x050d08,
  moss:    0x0a1f14,
  forest:  0x0d3b24,
  emerald: 0x1d6b3e,
  verdant: 0x2d9669,
  mist:    0xa8d5b9,
  gold:    0xc9a961,
  goldHi:  0xe6c878,
  bone:    0xede4ca,
};

// ------- Renderer -------
const canvas = document.getElementById('scene-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
// Cap pixel ratio at 1.5: with all the additive god-ray / mist / firefly
// overdraw, rendering at full 2× DPR is fragment-bound and stutters while
// scrolling. 1.5 keeps edges crisp but roughly halves the fragment load.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.32;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ------- Scene -------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a1a10);
scene.fog = new THREE.FogExp2(0x14352a, 0.011);

// ------- Camera -------
const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 1.7, 8);

// ------- Lights -------
// Ambient royal mist — pushed brighter & greener so the world stays legible
const hemi = new THREE.HemisphereLight(0xb6e8c6, 0x123a25, 1.35);
scene.add(hemi);

// Key light — golden dawn through canopy
const key = new THREE.DirectionalLight(0xfae5a8, 2.0);
key.position.set(-25, 40, -10);
scene.add(key);

// Emerald rim — verdant moonlight from opposite side
const rim = new THREE.DirectionalLight(0x5fd6a0, 1.05);
rim.position.set(20, 15, 25);
scene.add(rim);

// Soft fill from below — bounced moss light
const fill = new THREE.DirectionalLight(0x2d9669, 0.5);
fill.position.set(0, -10, 0);
scene.add(fill);

// Beacon deep in forest (volumetric hint)
const beacon = new THREE.PointLight(0xe6c878, 2.4, 80, 2.0);
beacon.position.set(8, 6, -45);
scene.add(beacon);

// Second beacon further down corridor
const beacon2 = new THREE.PointLight(0x9fe6b8, 1.4, 60, 2.0);
beacon2.position.set(-6, 4, -90);
scene.add(beacon2);

// ============================================================
//  PINE FOREST — heavily instanced Scots pines
//  Each old pine = dark lower trunk + orange "mirror bark"
//  upper trunk + irregular umbrella crown pads in the top
//  third + a few gnarled crown branches. Plus young pines,
//  sparse birches, grass tufts, heather, deadwood, mushrooms,
//  pine cones and mossy boulders.
// ============================================================
const PINE_COUNT  = 620;   // dominant old-growth Scots pines
const YOUNG_COUNT = 60;    // young pines, grouped at clearing edges
const BIRCH_COUNT = 26;    // sparse birch accents
const TUFT_COUNT  = 1500;  // grass tufts
const HEATH_COUNT = 900;   // heather / dry shrubs
const LOG_COUNT   = 70;    // fallen trunks
const STUMP_COUNT = 90;    // cut stumps
const MUSH_COUNT  = 240;   // mushrooms (stem + cap)
const PCONE_COUNT = 500;   // pine cones on the litter
const BOULDER_COUNT = 200; // mossy boulders

// --- Geometries ---
const pineLowGeo   = new THREE.CylinderGeometry(0.20, 0.36, 7.0, 7, 2); // bare lower 2/3
const pineUpGeo    = new THREE.CylinderGeometry(0.12, 0.20, 4.0, 7, 1); // orange upper bark
const padGeoA      = new THREE.IcosahedronGeometry(1.2, 1);  // crown pad, soft
const padGeoB      = new THREE.DodecahedronGeometry(1.05, 0); // crown pad, chunky
const pBranchGeo   = new THREE.CylinderGeometry(0.04, 0.08, 1.6, 5, 1);
const youngTrunkGeo = new THREE.CylinderGeometry(0.06, 0.12, 4.5, 6, 1);
const youngPadGeo  = new THREE.IcosahedronGeometry(0.7, 0);
const birchTrunkGeo = new THREE.CylinderGeometry(0.08, 0.13, 6.5, 7, 1);
const birchBlobGeo = new THREE.IcosahedronGeometry(0.8, 0);
const tuftGeo      = new THREE.ConeGeometry(0.4, 0.9, 5, 1);
const heathGeo     = new THREE.TetrahedronGeometry(0.45, 0);
const logGeo       = new THREE.CylinderGeometry(0.22, 0.3, 6, 7, 1);
const stumpGeo     = new THREE.CylinderGeometry(0.3, 0.42, 0.7, 7, 1);
const mushStemGeo  = new THREE.CylinderGeometry(0.035, 0.055, 0.2, 5, 1);
const mushCapGeo   = new THREE.ConeGeometry(0.16, 0.15, 7, 1);
const pconeGeo     = new THREE.IcosahedronGeometry(0.08, 0);
const boulderGeo   = new THREE.DodecahedronGeometry(0.6, 0);

// --- Materials ---
// Materials carrying per-instance colors stay white so the
// palette in the instanceColor buffer reads true.
const barkLowMat = new THREE.MeshStandardMaterial({
  color: 0x2b2218, roughness: 1.0, metalness: 0, flatShading: true,
});
const barkUpMat = new THREE.MeshStandardMaterial({
  color: 0xffffff, roughness: 0.95, metalness: 0, flatShading: true,
});
const needleMat = new THREE.MeshStandardMaterial({
  color: 0xffffff, roughness: 0.8, metalness: 0, flatShading: true,
});
const birchBarkMat = new THREE.MeshStandardMaterial({
  color: 0xd9d2ba, roughness: 0.9, metalness: 0, flatShading: true,
});
const deadWoodMat = new THREE.MeshStandardMaterial({
  color: 0x241c12, roughness: 1, metalness: 0, flatShading: true,
});
const tuftMat = new THREE.MeshStandardMaterial({
  color: 0xffffff, roughness: 0.85, metalness: 0, flatShading: true,
});
const heathMat = new THREE.MeshStandardMaterial({
  color: 0xffffff, roughness: 0.9, metalness: 0, flatShading: true,
});
const mushStemMat = new THREE.MeshStandardMaterial({
  color: 0xcfc4a4, roughness: 0.9, metalness: 0, flatShading: true,
});
const mushCapMat = new THREE.MeshStandardMaterial({
  color: 0xffffff, roughness: 0.7, metalness: 0, flatShading: true,
});
const pconeMat = new THREE.MeshStandardMaterial({
  color: 0x281a0e, roughness: 1, metalness: 0, flatShading: true,
});
const boulderMat = new THREE.MeshStandardMaterial({
  color: 0x152b1c, roughness: 1, metalness: 0, flatShading: true,
});

// --- Gentle wind sway, injected into instanced materials ---
// Phase derives from the instance world position (instanceMatrix
// column 3), so every crown / tuft moves slightly out of step.
// uTime lives in material.userData and is driven from the tick loop.
const swayMats = [];
function addWindSway(mat, amp) {
  mat.userData.uTime = { value: 0 };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = mat.userData.uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
{
  float swayPhase = instanceMatrix[3][0] * 0.35 + instanceMatrix[3][2] * 0.27;
  float swayH = clamp(position.y * 0.4 + 0.5, 0.0, 1.0);
  transformed.x += sin(uTime * 0.6 + swayPhase) * ${amp.toFixed(3)} * swayH;
  transformed.z += sin(uTime * 0.47 + swayPhase * 1.31 + 1.7) * ${(amp * 0.8).toFixed(3)} * swayH;
}`);
  };
  swayMats.push(mat);
}
addWindSway(needleMat, 0.09); // crown pads (pines, birches, young pines)
addWindSway(tuftMat, 0.05);   // grass — more subtle

// --- Instanced meshes ---
const pineLow     = new THREE.InstancedMesh(pineLowGeo, barkLowMat, PINE_COUNT);
const pineUp      = new THREE.InstancedMesh(pineUpGeo, barkUpMat, PINE_COUNT);
const padsA       = new THREE.InstancedMesh(padGeoA, needleMat, PINE_COUNT * 3);
const padsB       = new THREE.InstancedMesh(padGeoB, needleMat, PINE_COUNT * 2);
const pBranches   = new THREE.InstancedMesh(pBranchGeo, deadWoodMat, PINE_COUNT * 3);
const youngTrunks = new THREE.InstancedMesh(youngTrunkGeo, barkLowMat, YOUNG_COUNT);
const youngPads   = new THREE.InstancedMesh(youngPadGeo, needleMat, YOUNG_COUNT * 3);
const birchTrunks = new THREE.InstancedMesh(birchTrunkGeo, birchBarkMat, BIRCH_COUNT);
const birchBlobs  = new THREE.InstancedMesh(birchBlobGeo, needleMat, BIRCH_COUNT * 3);
const tufts       = new THREE.InstancedMesh(tuftGeo, tuftMat, TUFT_COUNT);
const heath       = new THREE.InstancedMesh(heathGeo, heathMat, HEATH_COUNT);
const logs        = new THREE.InstancedMesh(logGeo, deadWoodMat, LOG_COUNT);
const stumps      = new THREE.InstancedMesh(stumpGeo, deadWoodMat, STUMP_COUNT);
const mushStems   = new THREE.InstancedMesh(mushStemGeo, mushStemMat, MUSH_COUNT);
const mushCaps    = new THREE.InstancedMesh(mushCapGeo, mushCapMat, MUSH_COUNT);
const pcones      = new THREE.InstancedMesh(pconeGeo, pconeMat, PCONE_COUNT);
const boulders    = new THREE.InstancedMesh(boulderGeo, boulderMat, BOULDER_COUNT);

[pineLow, pineUp, padsA, padsB, pBranches, youngTrunks, youngPads,
 birchTrunks, birchBlobs, tufts, heath, logs, stumps,
 mushStems, mushCaps, pcones, boulders].forEach(m => {
  m.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  // These never move as a whole — only their instances were baked once.
  // Skipping the per-frame matrix recompute keeps the tick loop lean.
  m.matrixAutoUpdate = false;
  m.matrixWorldAutoUpdate = false;
});

// --- Per-instance color buffers ---
function makeColorBuf(n) { return new Float32Array(n * 3); }
const upBarkColors    = makeColorBuf(PINE_COUNT);
const padAColors      = makeColorBuf(PINE_COUNT * 3);
const padBColors      = makeColorBuf(PINE_COUNT * 2);
const youngPadColors  = makeColorBuf(YOUNG_COUNT * 3);
const birchBlobColors = makeColorBuf(BIRCH_COUNT * 3);
const tuftColors      = makeColorBuf(TUFT_COUNT);
const heathColors     = makeColorBuf(HEATH_COUNT);
const mushCapColors   = makeColorBuf(MUSH_COUNT);

// Greens — wide royal-emerald spectrum
const greenLow  = [0x0a3a22, 0x123f25, 0x0d3b24, 0x174d2a, 0x103820];
const greenMid  = [0x1d6b3e, 0x238047, 0x2a8a55, 0x186039, 0x256b41];
const greenHigh = [0x4fbf80, 0x6fd396, 0x3eb874, 0x52c989, 0x84e3a8];
const greenFern = [0x3aa66a, 0x4fbf80, 0x2d9669, 0x68d098, 0x57c48b];
// Scots pine "mirror bark" — reddish orange upper trunk
const barkOrange = [0xa86838, 0x96572e, 0xb87844, 0x8e5230, 0xa05f33];
// Heather / dry grass — muted gold-greens
const heathTones = [0x6b6b3a, 0x7a7044, 0x57663a, 0x8a7a4a, 0x4f5c36];
// Mushroom caps — gold & bone accents
const mushTones = [0xc9a961, 0xe6c878, 0xb89048, 0xd9c27a, 0xede4ca];
// Outlier crown tints — break up the uniform green carpet
const greenYellow = [0x7a8c3e, 0x8fa04a, 0x6f8038, 0x9aa852];
const greenGray   = [0x4a6b55, 0x5d7a64, 0x3f5c49, 0x6b8270];
const greenDark   = [0x07301c, 0x0a2a18, 0x0d3320, 0x113524];
// Dead snag bark — sun-bleached grey
const snagBark    = [0x8a7f6a, 0x9a8f78, 0x7a705c];

const pineData = [];
const dummy = new THREE.Object3D();
const leanEuler = new THREE.Euler();
const axisV = new THREE.Vector3();

let rand = mulberry32(7);

// --- Forest track ------------------------------------------------
// A sandy walking path winds gently along the camera corridor.
// pathX(z) is its centre line; everything on the floor keeps off it.
const PATH_HALF = 1.6;
function pathX(z) { return Math.sin(z * 0.045) * 1.4; }
function keepOffPath(x, z, margin) {
  const d = x - pathX(z);
  if (Math.abs(d) < margin) {
    return pathX(z) + (d >= 0 ? 1 : -1) * (margin + rand() * 1.5);
  }
  return x;
}

function setColor(buf, i, hex) {
  const c = new THREE.Color(hex);
  buf[i * 3] = c.r; buf[i * 3 + 1] = c.g; buf[i * 3 + 2] = c.b;
}

// Cluster centres — even-aged stands, like managed monoculture blocks
const CLUSTERS = [];
for (let c = 0; c < 40; c++) {
  const side = rand() < 0.5 ? -1 : 1;
  CLUSTERS.push({
    x: side * (6 + rand() * 46),
    z: -rand() * 226 + 8,
    r: 6 + rand() * 11,
    age: 0.8 + rand() * 0.5,
  });
}

// Clearings — real gaps in the canopy holding only grass & heather.
// Pines that land inside get pushed out to the rim, which also gives
// the rims a denser, more natural edge.
const GAPS = [];
for (let g = 0; g < 9; g++) {
  const side = g % 2 === 0 ? -1 : 1;
  GAPS.push({
    x: side * (7 + rand() * 32),
    z: -8 - rand() * 195,
    r: 5 + rand() * 7,
  });
}

const UP_VEC = new THREE.Vector3(0, 1, 0);
const branchDir = new THREE.Vector3();

for (let i = 0; i < PINE_COUNT; i++) {
  // 72 % of pines belong to a stand cluster, the rest scatter freely
  let x, z, ageBase = 1.0;
  if (rand() < 0.72) {
    const c = CLUSTERS[Math.floor(rand() * CLUSTERS.length)];
    const a = rand() * Math.PI * 2;
    const rr = (rand() + rand()) * 0.5 * c.r;
    x = c.x + Math.cos(a) * rr;
    z = c.z + Math.sin(a) * rr;
    ageBase = c.age;
  } else {
    const angle = rand() * Math.PI * 2;
    const radius = 4 + rand() * 55;
    x = Math.cos(angle) * radius + (rand() - 0.5) * 6;
    z = -rand() * 230 + 12;
  }
  // Keep the clearings open: push trees out to the gap rim
  for (const gp of GAPS) {
    const gdx = x - gp.x, gdz = z - gp.z;
    const gd = Math.sqrt(gdx * gdx + gdz * gdz);
    if (gd < gp.r) {
      const f = (gp.r + rand() * 2.5) / Math.max(gd, 0.001);
      x = gp.x + gdx * f;
      z = gp.z + gdz * f;
    }
  }
  z = Math.max(-218, Math.min(12, z));
  // Carve clearing along path
  const pathDist = Math.abs(x);
  const finalX = pathDist < 3.4 ? (x > 0 ? 3.4 + rand() * 2 : -3.4 - rand() * 2) : x;
  // Character trees: a few dead bare snags + oversized leaning veterans
  const charRoll = rand();
  const isSnag  = charRoll < 0.02 && Math.abs(finalX) > 6;
  const isGiant = !isSnag && charRoll < 0.055;
  // Age variation within the stand — wider spread than before
  let s = Math.max(0.68, Math.min(1.5, ageBase * (0.78 + rand() * 0.55)));
  if (isGiant) s = Math.min(1.85, s * 1.45);
  const nearPath = Math.abs(finalX) < 7;
  const wb = nearPath ? 0.78 : 1.0; // keep crowns off the camera corridor

  // Slight trunk lean — veterans lean visibly harder
  const leanAmp = isGiant ? 0.22 : 0.11;
  const yaw = rand() * Math.PI;
  leanEuler.set((rand() - 0.5) * leanAmp, yaw, (rand() - 0.5) * leanAmp);
  axisV.set(0, 1, 0).applyEuler(leanEuler);

  const lowerLen = 7.0 * s;
  const upperLen = 4.0 * s;

  // Per-tree crown tint: mostly emerald, but yellow-green, grey-green
  // and extra-dark outliers break the uniform green carpet
  const tintRoll = rand();
  let palLowT = greenLow, palMidT = greenMid, palHighT = greenHigh;
  if (tintRoll < 0.10)      { palLowT = greenDark; palMidT = greenYellow; palHighT = greenYellow; }
  else if (tintRoll < 0.19) { palLowT = greenGray; palMidT = greenGray;   palHighT = greenGray; }
  else if (tintRoll < 0.30) { palLowT = greenDark; palMidT = greenDark;   palHighT = greenMid; }
  const crownVar = 0.75 + rand() * 0.6; // per-tree crown fullness

  // ---- Lower trunk: dark grey-brown plate bark, branch-free ----
  dummy.position.set(
    finalX + axisV.x * lowerLen * 0.5,
    axisV.y * lowerLen * 0.5,
    z + axisV.z * lowerLen * 0.5
  );
  dummy.rotation.copy(leanEuler);
  dummy.scale.set(s, s, s);
  dummy.updateMatrix();
  pineLow.setMatrixAt(i, dummy.matrix);

  // ---- Upper trunk: reddish-orange "mirror bark", slightly stronger lean (fake curve) ----
  const upC = lowerLen + upperLen * 0.5;
  dummy.position.set(finalX + axisV.x * upC, axisV.y * upC, z + axisV.z * upC);
  dummy.rotation.set(leanEuler.x * 1.35, yaw, leanEuler.z * 1.35);
  dummy.scale.set(s, s, s);
  dummy.updateMatrix();
  pineUp.setMatrixAt(i, dummy.matrix);
  const barkPal = isSnag ? snagBark : barkOrange;
  setColor(upBarkColors, i, barkPal[Math.floor(rand() * barkPal.length)]);

  // Crown anchor at trunk top
  const topLen = lowerLen + upperLen;
  const tx = finalX + axisV.x * topLen;
  const ty = axisV.y * topLen;
  const tz = z + axisV.z * topLen;
  // Push pads away from the path so the ascent stays clear
  const out = nearPath ? Math.sign(finalX) * 0.7 : 0;

  // ---- Umbrella crown: 3 + 2 irregular flattened needle pads, top third only ----
  // Dead snags carry no needles — their pads collapse to zero scale.
  for (let p = 0; p < 3; p++) {
    const py = ty + (-0.7 + p * 0.85 + rand() * 0.5) * s;
    dummy.position.set(
      tx + (rand() - 0.5) * 2.0 * s * wb + out,
      py,
      tz + (rand() - 0.5) * 2.0 * s * wb
    );
    dummy.rotation.set((rand() - 0.5) * 0.3, rand() * Math.PI, (rand() - 0.5) * 0.3);
    if (isSnag) {
      dummy.scale.setScalar(0.001);
    } else {
      dummy.scale.set(
        s * wb * crownVar * (0.85 + rand() * 0.55),
        s * (0.32 + rand() * 0.16),
        s * wb * crownVar * (0.85 + rand() * 0.55)
      );
    }
    dummy.updateMatrix();
    padsA.setMatrixAt(i * 3 + p, dummy.matrix);
    const palA = p === 0 ? palLowT : palMidT;
    setColor(padAColors, i * 3 + p, palA[Math.floor(rand() * palA.length)]);
  }
  for (let p = 0; p < 2; p++) {
    const py = ty + (p * 1.1 + rand() * 0.5) * s;
    dummy.position.set(
      tx + (rand() - 0.5) * 1.5 * s * wb + out,
      py,
      tz + (rand() - 0.5) * 1.5 * s * wb
    );
    dummy.rotation.set((rand() - 0.5) * 0.35, rand() * Math.PI, (rand() - 0.5) * 0.35);
    if (isSnag) {
      dummy.scale.setScalar(0.001);
    } else {
      dummy.scale.set(
        s * wb * crownVar * (0.7 + rand() * 0.5),
        s * (0.3 + rand() * 0.15),
        s * wb * crownVar * (0.7 + rand() * 0.5)
      );
    }
    dummy.updateMatrix();
    padsB.setMatrixAt(i * 2 + p, dummy.matrix);
    const palB = p === 0 ? palMidT : palHighT;
    setColor(padBColors, i * 2 + p, palB[Math.floor(rand() * palB.length)]);
  }

  // ---- Gnarled crown branches, anchored ON the trunk ----
  // The cylinder pivot is its centre, so the centre sits at the trunk
  // anchor + 0.42 × length along the branch direction — the inner end
  // stays buried inside the trunk instead of floating in mid-air.
  for (let b = 0; b < 3; b++) {
    const bA = (b / 3) * Math.PI * 2 + rand() * 1.8;
    // anchor point on the leaned trunk axis, inside the crown zone
    const along = lowerLen + upperLen * (0.35 + b * 0.22 + rand() * 0.15);
    const ax = finalX + axisV.x * along;
    const ay = axisV.y * along;
    const az = z + axisV.z * along;
    // outward + slightly raised, like old pine limbs
    branchDir.set(Math.cos(bA), 0.25 + rand() * 0.35, Math.sin(bA)).normalize();
    const bLen = (isSnag ? 2.0 : 1.3) * s * (0.6 + rand() * 0.4);
    dummy.position.set(
      ax + branchDir.x * bLen * 0.42,
      ay + branchDir.y * bLen * 0.42,
      az + branchDir.z * bLen * 0.42
    );
    dummy.quaternion.setFromUnitVectors(UP_VEC, branchDir);
    dummy.scale.set(s * 0.8, bLen / 1.6, s * 0.8); // geometry is 1.6 long
    dummy.updateMatrix();
    pBranches.setMatrixAt(i * 3 + b, dummy.matrix);
  }

  pineData.push({
    x: finalX, z, s,
    dead: isSnag,
    crownY: ty + 0.4 * s,         // crown centre height
    crownH: 3.6 * s,              // crown depth (top third)
    crownR: 2.2 * s * wb,         // crown radius
  });
}
pineUp.instanceColor = new THREE.InstancedBufferAttribute(upBarkColors, 3);
padsA.instanceColor  = new THREE.InstancedBufferAttribute(padAColors, 3);
padsB.instanceColor  = new THREE.InstancedBufferAttribute(padBColors, 3);

// --- Young pines: small groups at the clearing rims ---
// Little trunk + 2–3 offset irregular pads instead of a smooth cone,
// so they read as saplings rather than scattered toy triangles.
for (let i = 0; i < YOUNG_COUNT; i++) {
  const gp = GAPS[Math.floor(rand() * GAPS.length)];
  const a = rand() * Math.PI * 2;
  const rr = gp.r * (0.85 + rand() * 0.5); // hug the rim of the gap
  const x = gp.x + Math.cos(a) * rr;
  let z = gp.z + Math.sin(a) * rr;
  z = Math.max(-218, Math.min(12, z));
  const pathDist = Math.abs(x);
  const fx = pathDist < 2.8 ? (x > 0 ? 2.8 + rand() * 1.5 : -2.8 - rand() * 1.5) : x;
  const s = 0.5 + rand() * 0.55;

  dummy.position.set(fx, 2.25 * s, z);
  dummy.rotation.set((rand() - 0.5) * 0.12, rand() * Math.PI, (rand() - 0.5) * 0.12);
  dummy.scale.set(s, s, s);
  dummy.updateMatrix();
  youngTrunks.setMatrixAt(i, dummy.matrix);

  const padCount = rand() < 0.6 ? 3 : 2; // 2–3 pads, never a clean cone
  for (let k = 0; k < 3; k++) {
    dummy.position.set(
      fx + (rand() - 0.5) * 1.1 * s,
      (3.7 + k * 0.7 + rand() * 0.4) * s,
      z + (rand() - 0.5) * 1.1 * s
    );
    dummy.rotation.set(rand(), rand(), rand());
    if (k >= padCount) {
      dummy.scale.setScalar(0.001); // unused slot in the fixed buffer
    } else {
      dummy.scale.set(
        s * (0.55 + rand() * 0.6),
        s * (0.4 + rand() * 0.3),
        s * (0.55 + rand() * 0.6)
      );
    }
    dummy.updateMatrix();
    youngPads.setMatrixAt(i * 3 + k, dummy.matrix);
    const pal = k === 2 ? greenHigh : greenMid;
    setColor(youngPadColors, i * 3 + k, pal[Math.floor(rand() * pal.length)]);
  }
}
youngPads.instanceColor = new THREE.InstancedBufferAttribute(youngPadColors, 3);

// --- Birches: sparse bright-trunk accents between the pines ---
for (let i = 0; i < BIRCH_COUNT; i++) {
  const x = (rand() - 0.5) * 80;
  const z = -rand() * 220 + 10;
  const pathDist = Math.abs(x);
  const fx = pathDist < 3.0 ? (x > 0 ? 3.0 + rand() * 1.5 : -3.0 - rand() * 1.5) : x;
  const s = 0.8 + rand() * 0.4;

  dummy.position.set(fx, 3.25 * s, z);
  dummy.rotation.set((rand() - 0.5) * 0.1, rand() * Math.PI, (rand() - 0.5) * 0.1);
  dummy.scale.set(s, s, s);
  dummy.updateMatrix();
  birchTrunks.setMatrixAt(i, dummy.matrix);

  for (let k = 0; k < 3; k++) {
    dummy.position.set(
      fx + (rand() - 0.5) * 1.4 * s,
      (5.4 + k * 0.8 + rand() * 0.5) * s,
      z + (rand() - 0.5) * 1.4 * s
    );
    dummy.rotation.set(rand(), rand(), rand());
    dummy.scale.set(
      s * (0.8 + rand() * 0.5),
      s * (0.6 + rand() * 0.35),
      s * (0.8 + rand() * 0.5)
    );
    dummy.updateMatrix();
    birchBlobs.setMatrixAt(i * 3 + k, dummy.matrix);
    setColor(birchBlobColors, i * 3 + k, greenHigh[Math.floor(rand() * greenHigh.length)]);
  }
}
birchBlobs.instanceColor = new THREE.InstancedBufferAttribute(birchBlobColors, 3);

// --- Grass tufts on the forest floor (a share fills the clearings) ---
for (let i = 0; i < TUFT_COUNT; i++) {
  let x, z;
  if (rand() < 0.3) {
    const gp = GAPS[Math.floor(rand() * GAPS.length)];
    const a = rand() * Math.PI * 2;
    const rr = Math.sqrt(rand()) * gp.r;
    x = gp.x + Math.cos(a) * rr;
    z = gp.z + Math.sin(a) * rr;
  } else {
    x = (rand() - 0.5) * 110;
    z = -rand() * 240 + 14;
  }
  x = keepOffPath(x, z, PATH_HALF + 0.4);
  const s = 0.5 + rand() * 1.2;
  dummy.position.set(x, s * 0.45 - 0.1, z);
  dummy.rotation.set((rand() - 0.5) * 0.25, rand() * Math.PI, (rand() - 0.5) * 0.25);
  dummy.scale.set(s, s * (0.8 + rand() * 0.5), s);
  dummy.updateMatrix();
  tufts.setMatrixAt(i, dummy.matrix);
  setColor(tuftColors, i, greenFern[Math.floor(rand() * greenFern.length)]);
}
tufts.instanceColor = new THREE.InstancedBufferAttribute(tuftColors, 3);

// --- Heather / dry shrubs (gold-green, typical sandy pine floor) ---
for (let i = 0; i < HEATH_COUNT; i++) {
  let x, z;
  if (rand() < 0.35) {
    const gp = GAPS[Math.floor(rand() * GAPS.length)];
    const a = rand() * Math.PI * 2;
    const rr = Math.sqrt(rand()) * gp.r;
    x = gp.x + Math.cos(a) * rr;
    z = gp.z + Math.sin(a) * rr;
  } else {
    x = (rand() - 0.5) * 110;
    z = -rand() * 240 + 14;
  }
  x = keepOffPath(x, z, PATH_HALF + 0.4);
  const s = 0.4 + rand() * 1.0;
  dummy.position.set(x, s * 0.3 - 0.1, z);
  dummy.rotation.set(rand(), rand(), rand());
  dummy.scale.set(s, s * (0.6 + rand() * 0.5), s);
  dummy.updateMatrix();
  heath.setMatrixAt(i, dummy.matrix);
  setColor(heathColors, i, heathTones[Math.floor(rand() * heathTones.length)]);
}
heath.instanceColor = new THREE.InstancedBufferAttribute(heathColors, 3);

// --- Fallen trunks (deadwood) ---
for (let i = 0; i < LOG_COUNT; i++) {
  let x = (rand() - 0.5) * 90;
  const z = -rand() * 230 + 12;
  x = keepOffPath(x, z, PATH_HALF + 2.4); // logs are long — wide margin
  const sR = 0.7 + rand() * 0.6;
  const sLen = 0.5 + rand() * 0.9;
  dummy.position.set(x, 0.18 * sR, z);
  // pi/2 around z lays the cylinder flat, y gives a random heading
  dummy.rotation.set((rand() - 0.5) * 0.2, rand() * Math.PI, Math.PI / 2 + (rand() - 0.5) * 0.25);
  dummy.scale.set(sR, sLen, sR);
  dummy.updateMatrix();
  logs.setMatrixAt(i, dummy.matrix);
}

// --- Stumps ---
for (let i = 0; i < STUMP_COUNT; i++) {
  let x = (rand() - 0.5) * 95;
  const z = -rand() * 230 + 12;
  x = keepOffPath(x, z, PATH_HALF + 0.8);
  const s = 0.6 + rand() * 0.8;
  dummy.position.set(x, 0.3 * s - 0.1, z);
  dummy.rotation.set((rand() - 0.5) * 0.15, rand() * Math.PI, (rand() - 0.5) * 0.15);
  dummy.scale.set(s, s, s);
  dummy.updateMatrix();
  stumps.setMatrixAt(i, dummy.matrix);
}

// --- Mushrooms: gold/bone caps, clustered near trunks ---
for (let i = 0; i < MUSH_COUNT; i++) {
  let x, z;
  if (rand() < 0.5) {
    const p = pineData[Math.floor(rand() * pineData.length)];
    x = p.x + (rand() - 0.5) * 2.2;
    z = p.z + (rand() - 0.5) * 2.2;
  } else {
    x = (rand() - 0.5) * 70;
    z = -rand() * 150 + 10;
  }
  x = keepOffPath(x, z, PATH_HALF + 0.4);
  const s = 0.6 + rand() * 1.1;
  dummy.position.set(x, 0.1 * s, z);
  dummy.rotation.set(0, 0, 0);
  dummy.scale.set(s, s, s);
  dummy.updateMatrix();
  mushStems.setMatrixAt(i, dummy.matrix);

  dummy.position.set(x, 0.24 * s, z);
  dummy.rotation.set((rand() - 0.5) * 0.2, rand() * Math.PI, (rand() - 0.5) * 0.2);
  dummy.scale.set(s * (0.9 + rand() * 0.4), s, s * (0.9 + rand() * 0.4));
  dummy.updateMatrix();
  mushCaps.setMatrixAt(i, dummy.matrix);
  setColor(mushCapColors, i, mushTones[Math.floor(rand() * mushTones.length)]);
}
mushCaps.instanceColor = new THREE.InstancedBufferAttribute(mushCapColors, 3);

// --- Pine cones scattered on the litter ---
for (let i = 0; i < PCONE_COUNT; i++) {
  let x, z;
  if (rand() < 0.6) {
    const p = pineData[Math.floor(rand() * pineData.length)];
    x = p.x + (rand() - 0.5) * 3.5;
    z = p.z + (rand() - 0.5) * 3.5;
  } else {
    x = (rand() - 0.5) * 90;
    z = -rand() * 220 + 12;
  }
  x = keepOffPath(x, z, PATH_HALF + 0.2);
  const s = 0.7 + rand() * 0.9;
  dummy.position.set(x, 0.06, z);
  dummy.rotation.set(rand(), rand(), rand());
  dummy.scale.set(s, s * 1.4, s);
  dummy.updateMatrix();
  pcones.setMatrixAt(i, dummy.matrix);
}

// --- Mossy boulders ---
for (let i = 0; i < BOULDER_COUNT; i++) {
  let x = (rand() - 0.5) * 100;
  const z = -rand() * 230 + 14;
  x = keepOffPath(x, z, PATH_HALF + 0.9);
  const s = 0.4 + rand() * 1.4;
  dummy.position.set(x, s * 0.3 - 0.15, z);
  dummy.rotation.set(rand(), rand(), rand());
  dummy.scale.set(s, s * (0.55 + rand() * 0.3), s);
  dummy.updateMatrix();
  boulders.setMatrixAt(i, dummy.matrix);
}

scene.add(pineLow, pineUp, padsA, padsB, pBranches, youngTrunks, youngPads,
  birchTrunks, birchBlobs, tufts, heath, logs, stumps,
  mushStems, mushCaps, pcones, boulders);

// ============================================================
//  HERO MODELS — hand-built showcase pieces (models.js) placed
//  along the camera corridor of the first two scenes, where the
//  viewer is close enough to appreciate the detail. Every group
//  may carry userData.update(time, wind, anim) for animation.
// ============================================================

// --- Cheap global wind for the merged flora ---------------------
// Same trick as addWindSway, but the phase comes from the vertex's
// world position (the merge bakes world coords into the geometry),
// so each plant still moves out of step — at zero per-frame CPU cost.
const swayMergedMats = [];
function addMergedSway(mat, amp) {
  mat.userData.uTime = { value: 0 };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = mat.userData.uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
{
  float swayPhase = position.x * 0.3 + position.z * 0.25;
  float swayH = clamp(position.y * 0.16, 0.0, 1.0);
  transformed.x += sin(uTime * 0.6 + swayPhase) * ${amp.toFixed(3)} * swayH;
  transformed.z += sin(uTime * 0.47 + swayPhase * 1.31 + 1.7) * ${(amp * 0.8).toFixed(3)} * swayH;
}`);
  };
  swayMergedMats.push(mat);
}

// --- Bake a list of static model Groups into merged meshes -------
// All meshes that share visual material params are concatenated into a
// single non-indexed BufferGeometry → one draw call per material. World
// transforms are baked in, so the result is fully static (matrices frozen)
// and never needs a per-frame update. Detail (every triangle) is kept.
function mergeFloraByMaterial(groups) {
  const buckets = new Map();
  for (const g of groups) {
    g.updateMatrixWorld(true);
    g.traverse(o => {
      if (!o.isMesh || !o.geometry) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      if (!m) return;
      const key = [
        m.color ? m.color.getHexString() : 'fff',
        (m.roughness ?? 1).toFixed(2),
        (m.metalness ?? 0).toFixed(2),
        m.flatShading ? 1 : 0,
        m.emissive ? m.emissive.getHexString() : 'x',
        (m.emissiveIntensity ?? 1).toFixed(2),
        m.transparent ? 't' : 'o',
        (m.opacity ?? 1).toFixed(2),
        m.side,
      ].join('|');
      let b = buckets.get(key);
      if (!b) { b = { mat: m.clone(), posArrs: [], norArrs: [], total: 0 }; buckets.set(key, b); }
      let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      if (!geo.attributes.normal) geo.computeVertexNormals();
      geo.applyMatrix4(o.matrixWorld);
      const p = geo.attributes.position.array;
      const n = geo.attributes.normal.array;
      b.posArrs.push(p); b.norArrs.push(n); b.total += p.length;
    });
  }
  const out = new THREE.Group();
  out.matrixAutoUpdate = false;
  out.matrixWorldAutoUpdate = false;
  for (const b of buckets.values()) {
    const pos = new Float32Array(b.total);
    const nor = new Float32Array(b.total);
    let off = 0;
    for (let i = 0; i < b.posArrs.length; i++) {
      pos.set(b.posArrs[i], off); nor.set(b.norArrs[i], off); off += b.posArrs[i].length;
    }
    const mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    mg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    addMergedSway(b.mat, 0.06); // gentle shader wind, no CPU cost
    const mesh = new THREE.Mesh(mg, b.mat);
    mesh.matrixAutoUpdate = false;
    mesh.matrixWorldAutoUpdate = false;
    out.add(mesh);
  }
  return out;
}

const heroGroup = new THREE.Group();   // animated heroes only (animals, birds)
const heroUpdates = [];

// Static flora is collected raw, then BAKED into a handful of merged meshes
// (see mergeFloraByMaterial) — that turns ~1000+ per-mesh draw calls into a
// dozen, while every triangle of detail is preserved. Animals stay live.
const floraRaw = [];

function placeFlora(g, x, z, ry, s) {
  g.position.set(x, 0, z);
  g.rotation.y = ry !== undefined ? ry : rand() * Math.PI * 2;
  if (s !== undefined) g.scale.multiplyScalar(s);
  floraRaw.push(g);
  return g;
}

function placeAnimal(g, x, z, ry, s) {
  g.position.set(x, 0, z);
  g.rotation.y = ry !== undefined ? ry : rand() * Math.PI * 2;
  if (s !== undefined) g.scale.multiplyScalar(s);
  heroGroup.add(g);
  if (g.userData.update) heroUpdates.push(g);
  return g;
}

// --- Showcase pines & birches framing the corridor ---
placeFlora(createScotsPine({ age: 1.25 }), -4.4, 3);
placeFlora(createScotsPine2({ age: 1.1 }), 4.2, -6);
placeFlora(createScotsPine({ age: 0.95 }), -4.0, -16);
placeFlora(createScotsPine3({ age: 1.0 }), 5.6, -21); // gnarled character pine
placeFlora(createScotsPine2({ age: 1.3 }), -5.2, -30);
placeFlora(createScotsPine({ age: 1.15 }), 4.6, -38);
placeFlora(createBirch({ age: 1.05 }), -6.4, -44);
placeFlora(createScotsPine2({ age: 0.9 }), 4.0, -52);
placeFlora(createScotsPine({ age: 1.35 }), -4.8, -60);
placeFlora(createBirch({ age: 0.9 }), 7.2, -12);
placeFlora(createYoungPine({ age: 0.8 }), 3.8, -1);
placeFlora(createYoungPine({ age: 0.6 }), -3.9, -8);
placeFlora(createYoungPine({ age: 0.7 }), 5.2, -33);

// --- Path verges: dense grasses hugging the track on both sides ---
// The track itself (|x − pathX(z)| < PATH_HALF) stays completely clear.
for (let i = 0; i < 44; i++) {
  const z = 10 - i * 1.7 - rand() * 1.3; // +10 … −66
  const side = i % 2 === 0 ? 1 : -1;
  const off = PATH_HALF + 0.4 + rand() * 1.7;
  const g = rand() < 0.45
    ? createCalamagrostis({ scale: 0.65 + rand() * 0.7 })
    : createGrassTuft({ scale: 0.75 + rand() * 0.85 });
  placeFlora(g, pathX(z) + side * off, z);
}

// --- Fern groves in the half-shade of the big pines ---
[[-5.2, -2], [4.8, -11], [-6.0, -26], [5.6, -40], [-5.8, -54]].forEach(([cx, cz]) => {
  const n = 3 + Math.floor(rand() * 2);
  for (let k = 0; k < n; k++) {
    placeFlora(createFern({ scale: 0.7 + rand() * 0.6 }),
      cx + (rand() - 0.5) * 2.6, cz + (rand() - 0.5) * 2.6);
  }
});

// --- Deadwood corners: stumps, fallen logs, moss & lichen ---
placeFlora(createStump(), 4.5, -15);
placeFlora(createStump({ scale: 0.8 }), -6.2, -9);
placeFlora(createStumpDecayed(), -5.6, -49);
placeFlora(createStumpDecayed({ scale: 0.85 }), 7.0, -47);
placeFlora(createStumpFallen(), -7.5, -33, 0.7);
placeFlora(createStumpFallen({ scale: 0.8 }), 6.8, -7, 2.4);
[[-7.0, -32], [6.4, -6.4], [4.8, -15.8], [-5.9, -48.4]].forEach(([cx, cz]) => {
  placeFlora(createMossPatch({ scale: 0.9 + rand() * 0.6 }),
    cx + (rand() - 0.5) * 1.4, cz + (rand() - 0.5) * 1.4);
  if (rand() < 0.75) {
    placeFlora(createLichen({ scale: 0.8 + rand() * 0.5 }),
      cx + (rand() - 0.5) * 1.8, cz + (rand() - 0.5) * 1.8);
  }
});

// --- Mushroom vignettes growing at the deadwood ---
[[4.0, -14.2], [-5.0, -48.2], [-6.9, -31.8]].forEach(([cx, cz]) => {
  const n = 3 + Math.floor(rand() * 3);
  for (let k = 0; k < n; k++) {
    const g = rand() < 0.6
      ? createMushroom({ scale: 0.55 + rand() * 0.6 })
      : createSteinpilz({ scale: 0.7 + rand() * 0.6 });
    placeFlora(g, cx + (rand() - 0.5) * 1.8, cz + (rand() - 0.5) * 1.8);
  }
});

// --- Berry corner on the right, shrubs scattered left ---
[[5.8, -17], [6.4, -19.5], [5.2, -21.5], [-6.0, -24]].forEach(([bx, bz]) => {
  placeFlora(createBerryBush({ scale: 0.75 + rand() * 0.4 }), bx, bz);
});
placeFlora(createBlackberry(), 6.6, -42);
placeFlora(createBlackberry({ scale: 0.8 }), -7.8, -16);
placeFlora(createJuniper(), -7.0, -14);
placeFlora(createJuniper({ scale: 0.8 }), 6.2, -57);
placeFlora(createJuniper({ scale: 0.9 }), -8.4, -36);

// --- Small floor accents: sorrel & oversized cones near the path ---
for (let i = 0; i < 5; i++) {
  const z = -3 - i * 11 - rand() * 4;
  const side = rand() < 0.5 ? 1 : -1;
  placeFlora(createWoodSorrel({ scale: 0.8 + rand() * 0.5 }),
    pathX(z) + side * (PATH_HALF + 0.5 + rand()), z);
}
for (let i = 0; i < 7; i++) {
  const z = 2 - i * 9 - rand() * 4;
  const side = rand() < 0.5 ? 1 : -1;
  placeFlora(createPineCone({ scale: 1.1 + rand() * 0.6 }),
    pathX(z) + side * (PATH_HALF + 0.3 + rand() * 1.6), z);
}

// --- Boulder groups ---
placeFlora(createBoulderCluster(), -8.2, -20);
placeFlora(createBoulderCluster({ scale: 0.75 }), 7.6, -36);
placeFlora(createBoulderCluster({ scale: 0.9 }), -9.4, -58);

// ---- Bake all static flora into merged meshes (few draw calls) ----
const floraGroup = mergeFloraByMaterial(floraRaw);
scene.add(floraGroup);

// --- Animals: few but believable, beside the corridor ---
placeAnimal(createDeer(), -6.5, -12, 0.7);
placeAnimal(createDeer({ scale: 0.9 }), 7.4, -29, -2.1);
placeAnimal(createDeer({ scale: 0.95 }), -8.8, -45, 1.9);
placeAnimal(createHare({ scale: 0.9 }), 3.8, -7.5);
placeAnimal(createHare(), -4.6, -22);
placeAnimal(createHare({ scale: 0.8 }), 5.4, -44);
placeAnimal(createBoar(), -9.5, -38, 0.4);
placeAnimal(createBoar({ scale: 0.85 }), -11, -41, 1.1);
placeAnimal(createFox(), 6.4, -24, 2.6);

// Songbird perched on the stump beside the path
const sittingBird = createBirdSitting();
sittingBird.position.set(4.5, 0.7, -15);
sittingBird.rotation.y = -0.8;
heroGroup.add(sittingBird);
if (sittingBird.userData.update) heroUpdates.push(sittingBird);

scene.add(heroGroup);

// ============================================================
//  BIRDS OF PREY (models.js) - circling above the canopy.
//  The model animates its own wing flap; the orbit comes from
//  the tick loop below.
// ============================================================
const birdGroup = new THREE.Group();
const birdAnims = [];
for (let i = 0; i < 4; i++) {
  const grp = createBirdFlying({ scale: 0.9 + rand() * 0.5 });
  birdGroup.add(grp);
  birdAnims.push({
    grp,
    cx: (rand() - 0.5) * 24,
    cz: -10 - rand() * 60,
    r: 7 + rand() * 9,
    h: 14 + rand() * 7,
    speed: 0.22 + rand() * 0.18,
    phase: rand() * 10,
    dir: rand() < 0.5 ? 1 : -1,
  });
}
scene.add(birdGroup);

// ============================================================
//  GROUND — subtle plane with vertex noise
// ============================================================
const groundGeo = new THREE.PlaneGeometry(400, 400, 80, 80);
const gPos = groundGeo.attributes.position;
for (let i = 0; i < gPos.count; i++) {
  const x = gPos.getX(i), y = gPos.getY(i);
  const n = Math.sin(x * 0.15) * 0.4 + Math.cos(y * 0.2) * 0.3 + (Math.random() - 0.5) * 0.6;
  // Flatten the terrain along the walking track (world z = -local y
  // after the -90° X rotation), so the path ribbon sits cleanly on it.
  const dPath = Math.abs(x - pathX(-y));
  const damp = THREE.MathUtils.smoothstep(dPath, PATH_HALF + 0.3, PATH_HALF + 2.8);
  gPos.setZ(i, n * damp);
}
groundGeo.computeVertexNormals();
// Vertex colors: mossy green base with warm brown-red needle-litter
// patches, so the floor is not one uniform green carpet.
const gColBuf = new Float32Array(gPos.count * 3);
const gMoss   = new THREE.Color(0x13351f);
const gMoss2  = new THREE.Color(0x1b3e24);
const gLitter = new THREE.Color(0x3d2a16);
const gLitter2 = new THREE.Color(0x4a3118);
const gTmp = new THREE.Color();
for (let i = 0; i < gPos.count; i++) {
  const x = gPos.getX(i), y = gPos.getY(i);
  // low-frequency patch noise, deterministic
  const n = Math.sin(x * 0.09 + 2.1) * Math.cos(y * 0.075 + 0.6)
          + Math.sin(x * 0.21 + y * 0.17) * 0.5;
  gTmp.copy(rand() < 0.5 ? gMoss : gMoss2);
  if (n > 0.45) {
    const k = Math.min(1, (n - 0.45) * 1.6);
    gTmp.lerp(rand() < 0.5 ? gLitter : gLitter2, k * 0.85);
  }
  gColBuf[i * 3] = gTmp.r; gColBuf[i * 3 + 1] = gTmp.g; gColBuf[i * 3 + 2] = gTmp.b;
}
groundGeo.setAttribute('color', new THREE.BufferAttribute(gColBuf, 3));
const groundMat = new THREE.MeshStandardMaterial({
  color: 0xffffff, roughness: 1, metalness: 0, flatShading: true, vertexColors: true,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.2;
scene.add(ground);

// --- The walking track: warm sandy ribbon with ragged edges ---
// Follows pathX(z) along the whole corridor; nothing is placed on it.
const trackGeo = new THREE.PlaneGeometry(PATH_HALF * 2, 250, 1, 200);
{
  const tPos = trackGeo.attributes.position;
  for (let i = 0; i < tPos.count; i++) {
    const lx = tPos.getX(i), ly = tPos.getY(i);
    const wz = -ly - 103; // world z of this vertex (see mesh transform)
    const edge = Math.sign(lx) * Math.sin(wz * 0.7 + lx * 3.1) * 0.18;
    tPos.setX(i, lx + pathX(wz) + edge);
  }
  trackGeo.computeVertexNormals();
}
// Sand tones with subtle per-vertex variation (trodden forest soil)
const tColBuf = new Float32Array(trackGeo.attributes.position.count * 3);
const tSand  = new THREE.Color(0x6e5a3c);
const tSand2 = new THREE.Color(0x7d6845);
const tDark  = new THREE.Color(0x55452e);
const tTmp = new THREE.Color();
for (let i = 0; i < trackGeo.attributes.position.count; i++) {
  const r = rand();
  tTmp.copy(r < 0.45 ? tSand : (r < 0.8 ? tSand2 : tDark));
  tColBuf[i * 3] = tTmp.r; tColBuf[i * 3 + 1] = tTmp.g; tColBuf[i * 3 + 2] = tTmp.b;
}
trackGeo.setAttribute('color', new THREE.BufferAttribute(tColBuf, 3));
const trackMat = new THREE.MeshStandardMaterial({
  color: 0xffffff, roughness: 1, metalness: 0, flatShading: true, vertexColors: true,
});
const track = new THREE.Mesh(trackGeo, trackMat);
track.rotation.x = -Math.PI / 2;
track.position.set(0, -0.1, -103);
scene.add(track);

// (Gold sun-pools on the floor removed — they read as a stray yellow blob.)

// (God rays removed — the scene is lit brighter overall instead.)

// ============================================================
//  FIREFLIES — drifting particles
// ============================================================
const FLY_COUNT = 600;
const flyGeo = new THREE.BufferGeometry();
const flyPos = new Float32Array(FLY_COUNT * 3);
const flySeed = new Float32Array(FLY_COUNT);
for (let i = 0; i < FLY_COUNT; i++) {
  flyPos[i * 3]     = (Math.random() - 0.5) * 80;
  flyPos[i * 3 + 1] = Math.random() * 18 + 0.5;
  flyPos[i * 3 + 2] = -Math.random() * 220 + 10;
  flySeed[i] = Math.random() * 1000;
}
flyGeo.setAttribute('position', new THREE.BufferAttribute(flyPos, 3));
flyGeo.setAttribute('seed', new THREE.BufferAttribute(flySeed, 1));

const flyMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0xf2d98a) },
    uSize: { value: 14 * renderer.getPixelRatio() },
  },
  vertexShader: `
    attribute float seed;
    uniform float uTime;
    uniform float uSize;
    varying float vAlpha;
    void main() {
      vec3 p = position;
      p.x += sin(uTime * 0.5 + seed) * 0.6;
      p.y += sin(uTime * 0.8 + seed * 1.3) * 0.4;
      p.z += cos(uTime * 0.4 + seed * 0.7) * 0.6;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = uSize / -mv.z;
      vAlpha = 0.5 + 0.5 * sin(uTime * 2.0 + seed);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    varying float vAlpha;
    void main() {
      vec2 c = gl_PointCoord - vec2(0.5);
      float d = length(c);
      if (d > 0.5) discard;
      float a = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(uColor, a * vAlpha * 0.85);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
const flies = new THREE.Points(flyGeo, flyMat);
scene.add(flies);

// ============================================================
//  MIST PLANES — volumetric haze fakery
// ============================================================
const mistGroup = new THREE.Group();
for (let i = 0; i < 8; i++) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 30),
    new THREE.MeshBasicMaterial({
      color: 0x1a3a26, transparent: true, opacity: 0.08, depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  m.position.set((Math.random() - 0.5) * 30, 4 + Math.random() * 6, -10 - i * 25);
  m.userData.baseX = m.position.x;
  m.rotation.y = (Math.random() - 0.5) * 0.4;
  mistGroup.add(m);
}
scene.add(mistGroup);

// ============================================================
//  DETECTION OVERLAY — wireframe boxes that fade in scene 4
//  Boxes frame the umbrella crowns in the top third, like
//  canopy detection seen from above.
// ============================================================
const detectionGroup = new THREE.Group();
// Hidden until the detection scene; toggled in the tick loop so its ~36
// boxes neither render nor recompute matrices during the rest of the scroll.
detectionGroup.visible = false;
const boxMat = new THREE.LineBasicMaterial({ color: COL.goldHi, transparent: true, opacity: 0 });
const cornerLen = 0.4;

// Pick ~36 prominent pines ahead of the drone camera position
const targets = pineData
  .filter(t => t.z < -50 && t.z > -160 && Math.abs(t.x) < 40)
  .slice(0, 36);

const boxes = [];
targets.forEach((t, idx) => {
  const h = t.crownH + 1.4;       // crown depth + margin
  const w = t.crownR * 2 + 0.8;   // crown diameter + margin
  const half = w / 2;
  // Build 8 corner brackets + crosshair as ONE merged LineSegments per box.
  // (Previously 9 separate line objects per box → 9× the draw calls.)
  const grp = new THREE.Group();
  grp.position.set(t.x, t.crownY, t.z);

  const pts = [];
  function bracket(x, y, z, dx, dy, dz) {
    pts.push(
      x, y, z,  x + dx * cornerLen, y, z,
      x, y, z,  x, y + dy * cornerLen, z,
      x, y, z,  x, y, z + dz * cornerLen,
    );
  }
  bracket(-half, -h/2, -half,  1,  1,  1);
  bracket( half, -h/2, -half, -1,  1,  1);
  bracket(-half, -h/2,  half,  1,  1, -1);
  bracket( half, -h/2,  half, -1,  1, -1);
  bracket(-half,  h/2, -half,  1, -1,  1);
  bracket( half,  h/2, -half, -1, -1,  1);
  bracket(-half,  h/2,  half,  1, -1, -1);
  bracket( half,  h/2,  half, -1, -1, -1);
  // Center crosshair dot
  pts.push(-0.2, 0, 0,  0.2, 0, 0,  0, -0.2, 0,  0, 0.2, 0);

  const boxGeo = new THREE.BufferGeometry();
  boxGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  grp.add(new THREE.LineSegments(boxGeo, boxMat));

  grp.userData.delay = (idx % 12) * 0.04;
  detectionGroup.add(grp);
  boxes.push(grp);
});
scene.add(detectionGroup);

// Scanning grid plane (for detection scene)
const scanGeo = new THREE.PlaneGeometry(120, 220, 40, 40);
const scanMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uOpacity: { value: 0 },
    uColor: { value: new THREE.Color(COL.goldHi) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uOpacity;
    uniform vec3 uColor;
    void main() {
      vec2 g = abs(fract(vUv * vec2(20.0, 36.0)) - 0.5);
      float line = step(0.46, max(g.x, g.y));
      float scan = smoothstep(0.0, 0.05, sin(vUv.y * 40.0 + uTime * 2.5) * 0.5 + 0.5);
      float a = line * (0.25 + 0.75 * scan);
      gl_FragColor = vec4(uColor, a * uOpacity);
    }
  `,
  transparent: true,
  depthWrite: false,
});
const scanPlane = new THREE.Mesh(scanGeo, scanMat);
scanPlane.rotation.x = -Math.PI / 2;
scanPlane.position.y = 0.05;
scanPlane.position.z = -100;
scene.add(scanPlane);

// ============================================================
//  FREEZE STATIC TRANSFORMS
//  By default three.js recomputes every world matrix in the
//  graph each frame (the Scene root flags itself dirty, which
//  forces the whole tree). Most of this forest never moves, so
//  we compute its world matrices once and switch the per-frame
//  recompute off — only animated subtrees (animated heroes,
//  birds, mist, detection boxes) keep updating. This is the
//  biggest single CPU win for scroll smoothness, detail intact.
// ============================================================
// 1) Freeze the static hero models (those without an animation).
const heroAnimated = new Set(heroUpdates);
for (const g of heroGroup.children) {
  if (!heroAnimated.has(g)) {
    g.matrixWorldAutoUpdate = false;
    g.traverse(o => { o.matrixAutoUpdate = false; });
  }
}
// heroGroup itself never moves: skip its own compose, but keep recursing
// into it so the animated children still update.
heroGroup.matrixAutoUpdate = false;

// 2) Freeze fully static decor (geometry baked, only shaders animate).
[ground, track, flies, scanPlane].forEach(o => {
  o.matrixWorldAutoUpdate = false;
});

// 3) Stop the Scene root from flagging the whole tree dirty every frame.
//    Animated branches keep matrixWorldAutoUpdate = true (the default),
//    so they still refresh; frozen branches above are now skipped.
scene.matrixAutoUpdate = false;
scene.updateMatrixWorld(true); // one full pass to bake every world matrix

// ============================================================
//  CAMERA PATH — 5 cinematic keyframes
//  Indexed by scroll-progress t in [0,1]
// ============================================================
const KEYS = [
  // t,  posX, posY, posZ,   lookX, lookY, lookZ,  fov, fogD
  { t: 0.00, p: [ 0,  1.7,   8], l: [ 0,  2.5,  -5], fov: 52, fog: 0.014 },
  { t: 0.22, p: [ 1.2,1.9, -18], l: [-0.4, 2.2,-40], fov: 46, fog: 0.011 },
  { t: 0.45, p: [-0.5, 8,  -45], l: [ 1.5, 4, -75], fov: 42, fog: 0.008 },
  { t: 0.68, p: [ 0,  32, -75], l: [ 0,  0, -100], fov: 50, fog: 0.005 },
  { t: 0.88, p: [-12, 55,-110], l: [ 5,  0, -150], fov: 38, fog: 0.0035 },
  { t: 1.00, p: [ 0,  85,-160], l: [ 0,  0, -210], fov: 32, fog: 0.002 },
];

const tmpV1 = new THREE.Vector3();
const tmpV2 = new THREE.Vector3();
function applyCameraFromProgress(t) {
  // find segment
  let a = KEYS[0], b = KEYS[KEYS.length - 1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (t >= KEYS[i].t && t <= KEYS[i + 1].t) { a = KEYS[i]; b = KEYS[i + 1]; break; }
  }
  const span = b.t - a.t || 1;
  const k = easeInOutCubic((t - a.t) / span);
  tmpV1.fromArray(a.p).lerp(tmpV2.fromArray(b.p), k);
  camera.position.copy(tmpV1);
  tmpV1.fromArray(a.l).lerp(tmpV2.fromArray(b.l), k);
  camera.lookAt(tmpV1);
  camera.fov = a.fov + (b.fov - a.fov) * k;
  camera.updateProjectionMatrix();
  scene.fog.density = a.fog + (b.fog - a.fog) * k;
}

// ============================================================
//  SCROLL DRIVER (smoothed)
// ============================================================
let targetProgress = 0;
let currentProgress = 0;

function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  targetProgress = max > 0 ? window.scrollY / max : 0;
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ============================================================
//  RESIZE
// ============================================================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================================
//  RAF LOOP
// ============================================================
const clock = new THREE.Clock();
// Higher = snappier, lower = more floaty. Framerate-independent (see below).
const PROGRESS_SMOOTH = 3.2;
// Hero animations beyond this distance from the camera are skipped (squared).
const HERO_UPDATE_DIST2 = 60 * 60;
function tick() {
  // Clamp dt so a tab-switch / dropped frames can't make the camera jump
  const dt = Math.min(clock.getDelta(), 1 / 30);
  const time = clock.elapsedTime;

  // Smooth progress toward the scroll target — framerate-independent easing
  // via 1 - e^(-k·dt) so the motion feels identical at 60 / 120 / 144 Hz.
  const smooth = 1 - Math.exp(-PROGRESS_SMOOTH * dt);
  currentProgress += (targetProgress - currentProgress) * smooth;
  // Settle exactly on target once close enough (avoids endless micro-lerp)
  if (Math.abs(targetProgress - currentProgress) < 0.0002) currentProgress = targetProgress;
  applyCameraFromProgress(currentProgress);

  // Particle update
  flyMat.uniforms.uTime.value = time;

  // Hero models: wind sway + idle animations (deer graze, mushrooms breathe…)
  // Only animate what's near the camera — distant / behind / far-below models
  // are imperceptible, so skipping them saves most of the per-frame CPU.
  const cp = camera.position;
  for (const g of heroUpdates) {
    const dx = g.position.x - cp.x, dy = g.position.y - cp.y, dz = g.position.z - cp.z;
    if (dx * dx + dy * dy + dz * dz < HERO_UPDATE_DIST2) g.userData.update(time, 1.0, 1.0);
  }

  // Wind sway uniform for the instanced crown / grass materials + merged flora
  swayMats.forEach(m => { m.userData.uTime.value = time; });
  swayMergedMats.forEach(m => { m.userData.uTime.value = time; });

  // Mist banks drift slowly sideways
  mistGroup.children.forEach((m, i) => {
    m.position.x = m.userData.baseX + Math.sin(time * 0.05 + i * 1.7) * 4;
  });

  // Birds of prey: circular loops above the crowns; flap is model-driven.
  // Heading follows the tangent of the orbit.
  birdAnims.forEach(b => {
    const a = time * b.speed * b.dir + b.phase;
    const vx = -Math.sin(a) * b.dir;
    const vz =  Math.cos(a) * b.dir;
    b.grp.position.set(
      b.cx + Math.cos(a) * b.r,
      b.h + Math.sin(time * 0.6 + b.phase) * 0.8,
      b.cz + Math.sin(a) * b.r
    );
    b.grp.rotation.y = Math.atan2(vx, vz);
    b.grp.userData.update(time, 1.0, 1.0);
  });

  // Detection visibility ramps up between t=0.55 and t=0.85
  const detT = THREE.MathUtils.clamp((currentProgress - 0.55) / 0.25, 0, 1);
  const detFade = easeOutCubic(detT) * (1 - Math.max(0, (currentProgress - 0.92) / 0.08));

  // Detection overlay only renders / recomputes while it's actually visible.
  const showDet = detFade > 0.002;
  detectionGroup.visible = showDet;
  detectionGroup.matrixWorldAutoUpdate = showDet;
  if (showDet) {
    boxMat.opacity = detFade * 0.95;
    // Stagger boxes appearing
    boxes.forEach((b, i) => {
      const local = THREE.MathUtils.clamp((detT - (i % 18) * 0.025), 0, 1);
      b.scale.setScalar(0.4 + easeOutCubic(local) * 0.6);
      b.rotation.y = time * 0.05 + i;
    });
  }

  // Scan plane: faint detection grid, also gated to the detection scene
  scanPlane.visible = showDet;
  if (showDet) {
    scanMat.uniforms.uTime.value = time;
    scanMat.uniforms.uOpacity.value = detFade * 0.18; // must not outshine forest
  }

  // Beacon pulse
  beacon.intensity = 1.2 + Math.sin(time * 1.5) * 0.4;

  // Subtle hemi shift toward gold late
  const lateness = THREE.MathUtils.smoothstep(currentProgress, 0.7, 1.0);
  hemi.color.setRGB(0.80 + lateness * 0.18, 0.95 - lateness * 0.06, 0.84 - lateness * 0.14);

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

// ============================================================
//  Helpers
// ============================================================
function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Signal ready to overlay layer
window.dispatchEvent(new CustomEvent('scene-ready'));
