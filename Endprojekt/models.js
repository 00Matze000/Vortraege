// ============================================================
//  Den Wald von oben zählen — Modulare 3D-Modellbibliothek
//  Definiert prozedurale Low-Poly-Modelle für Vegetation und Fauna.
//  Jedes Modell liefert eine THREE.Group mit Metadaten und
//  einer Update-Methode für Animationen/Wind.
// ============================================================

import * as THREE from 'three';

// ------- Harmonische Farbpalette (Wald & Tiere) -------
export const COL = {
  void: 0x050d08,
  moss: 0x0a1f14,
  forest: 0x0d3b24,
  emerald: 0x1d6b3e,
  verdant: 0x2d9669,
  mist: 0xa8d5b9,
  gold: 0xc9a961,
  goldHi: 0xe6c878,
  bone: 0xede4ca,
  barkLow: 0x302419, // Dunkelbraun
  barkUp: 0xa86838,  // Rot-Orange für Spiegelrinde
  birchBark: 0xebe8de, // Birken-Weiß
  birchDark: 0x222222, // Birken-Schwarz
  deadWood: 0x2b2015, // Totholz
  tuft: 0x3aa66a, // Farn- und Grasgrün
  tuftDry: 0x8a855c, // Mutes Gras
  heath: 0x6b6b3a, // Heide-Mischung
  heathFlor: 0x94547a, // Heide-Blüte (Violett)
  mushCapRed: 0xba3223, // Fliegenpilz-Rot
  mushCapBrn: 0x6e482f, // Steinpilz-Braun
  mushStem: 0xede4ca, // Pilzstiel-Creme
  berryRed: 0xbf2626, // Preiselbeere
  berryBlue: 0x2b4694, // Heidelbeere
  boulder: 0x404d44, // Fels-Grau
  beechBark: 0x8a9296, // Silbergraue Buchenrinde
  beechLeaf: 0x1e5229, // Dunkles Buchengrün
  beechLeafRed: 0x7a221a, // Rote Herbstfärbung (Rotbuche)
  spruceNeedle: 0x0f301d, // Dunkles Fichtennadel-Grün
  spruceBark: 0x4f3627, // Rotbraune Fichtenborke
  cloverLeaf: 0x3d9447, // Sauerkleeblatt-Hellgrün
  blackberryFruit: 0x050508 // Tiefschwarze Brombeere
};

// ------- Hilfsfunktion: Fügt Explosionsmetadaten hinzu -------
// Jedes Mesh in der Gruppe merkt sich seine Standard-Position und
// eine Explosionsrichtung.
function prepareForExplosion(mesh, customDir = null) {
  mesh.userData.defaultPos = mesh.position.clone();
  mesh.userData.defaultRot = mesh.rotation.clone();

  if (customDir) {
    mesh.userData.explodeDir = customDir.clone().normalize();
  } else {
    // Standardmäßig radial vom Ursprung wegblasen
    const dir = mesh.position.clone();
    if (dir.lengthSq() < 0.0001) {
      dir.set(0, 1, 0); // Nach oben blasen, falls genau im Zentrum
    }
    mesh.userData.explodeDir = dir.normalize();
  }
}

// ------- Hilfsfunktion: Setzt den Explosionszustand einer Gruppe -------
export function applyExplosion(group, factor) {
  group.traverse(child => {
    if (child.isMesh && child.userData.defaultPos) {
      // Position verschieben
      const shift = child.userData.explodeDir.clone().multiplyScalar(factor * 1.5);
      child.position.copy(child.userData.defaultPos).add(shift);

      // Bei starker Explosion auch leichte Rotation erzeugen für cooleren Effekt
      if (factor > 0) {
        child.rotation.x = child.userData.defaultRot.x + factor * 0.2;
        child.rotation.y = child.userData.defaultRot.y + factor * 0.2;
      } else {
        child.rotation.copy(child.userData.defaultRot);
      }
    }
  });
}

// ============================================================
//  VEGETATIONSMODELLE
// ============================================================

// 1. Waldkiefer (Pinus sylvestris)
export function createScotsPine(options = {}) {
  const age = options.age !== undefined ? options.age : 1.0; // 0.5 bis 1.8
  const group = new THREE.Group();

  group.userData = {
    name: 'Waldkiefer',
    latin: 'Pinus sylvestris',
    category: 'Flora (Nadelbaum)',
    description: 'Die dominante Baumart der sandigen Brandenburger Wälder. Charakteristisch ist die zweigeteilte Borke: unten dunkel und tief gefurcht, oben leuchtend fuchsrot (Spiegelrinde). Die Krone bildet flache, schirmartige Nadelkissen.',
    polyCount: 0
  };

  const s = age;
  const lowerLen = 6.5 * s;
  const upperLen = 4.5 * s;

  // Materialien
  const barkLowMat = new THREE.MeshStandardMaterial({ color: COL.barkLow, roughness: 1.0, flatShading: true });
  const barkUpMat = new THREE.MeshStandardMaterial({ color: COL.barkUp, roughness: 0.9, flatShading: true });
  const needleMat = new THREE.MeshStandardMaterial({ color: COL.emerald, roughness: 0.85, flatShading: true });
  const branchMat = new THREE.MeshStandardMaterial({ color: COL.deadWood, roughness: 1.0, flatShading: true });
  const coneMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 1.0, flatShading: true });

  // 1. Unterer Stamm (dunkel, tief gefurcht, hohe Auflösung)
  const trunkLowGeo = new THREE.CylinderGeometry(0.18 * s, 0.32 * s, lowerLen, 32, 12);
  const posLow = trunkLowGeo.attributes.position;
  for (let i = 0; i < posLow.count; i++) {
    const y = posLow.getY(i);
    // Nur den Mittelteil des Stammes stören, Enden sauber lassen
    if (y > -lowerLen / 2 + 0.2 && y < lowerLen / 2 - 0.2) {
      const angle = Math.atan2(posLow.getZ(i), posLow.getX(i));
      // Mehrstufige Rauschfunktion für plastische Rindenfurchen
      const noise = (Math.sin(y * 8) * 0.03 * s) +
        (Math.sin(angle * 12) * 0.02 * s) +
        (Math.cos(y * 15 + angle * 6) * 0.01 * s);
      posLow.setX(i, posLow.getX(i) + Math.cos(angle) * noise);
      posLow.setZ(i, posLow.getZ(i) + Math.sin(angle) * noise);
    }
  }
  trunkLowGeo.computeVertexNormals();

  const trunkLow = new THREE.Mesh(trunkLowGeo, barkLowMat);
  trunkLow.position.y = lowerLen / 2;
  group.add(trunkLow);
  prepareForExplosion(trunkLow, new THREE.Vector3(0, -0.2, 0));

  // 2. Oberer Stamm (rot-orange Spiegelrinde, gewunden)
  const trunkUpGeo = new THREE.CylinderGeometry(0.08 * s, 0.18 * s, upperLen, 24, 8);
  const posUp = trunkUpGeo.attributes.position;
  for (let i = 0; i < posUp.count; i++) {
    const y = posUp.getY(i);
    const angle = Math.atan2(posUp.getZ(i), posUp.getX(i));
    // Sanftere Krümmungsstörung
    const noise = Math.sin(y * 4) * 0.015 * s + Math.cos(angle * 6) * 0.008 * s;
    posUp.setX(i, posUp.getX(i) + Math.cos(angle) * noise);
    posUp.setZ(i, posUp.getZ(i) + Math.sin(angle) * noise);
  }
  trunkUpGeo.computeVertexNormals();

  const trunkUp = new THREE.Mesh(trunkUpGeo, barkUpMat);
  trunkUp.position.set(0.12 * s, lowerLen + upperLen / 2 - 0.08, 0);
  trunkUp.rotation.z = -0.06;
  group.add(trunkUp);
  prepareForExplosion(trunkUp, new THREE.Vector3(0, 0.2, 0));

  // 3. Knorrige Äste (Aus mehreren Zylindern für Krümmungen)
  const branchConfigs = [
    // Tiefe Äste
    { start: [0.05 * s, lowerLen + 0.4 * s, 0], dir: [-1.2, 0.4, 0.6], len: 2.2 * s, thickness: 0.10 * s },
    { start: [0.08 * s, lowerLen + 1.2 * s, 0], dir: [1.1, 0.5, -0.5], len: 2.0 * s, thickness: 0.09 * s },
    { start: [0.10 * s, lowerLen + 2.0 * s, 0], dir: [-0.4, 0.6, -1.2], len: 1.8 * s, thickness: 0.08 * s },
    // Höhere Äste
    { start: [0.12 * s, lowerLen + 2.8 * s, 0], dir: [0.5, 0.7, 1.0], len: 1.6 * s, thickness: 0.07 * s },
    { start: [0.12 * s, lowerLen + 3.4 * s, 0], dir: [-0.9, 0.5, -0.3], len: 1.4 * s, thickness: 0.06 * s },
    { start: [0.12 * s, lowerLen + 3.8 * s, 0], dir: [0.8, 0.6, 0.4], len: 1.2 * s, thickness: 0.05 * s }
  ];

  const branches = [];
  branchConfigs.forEach((cfg) => {
    const branchGroup = new THREE.Group();
    branchGroup.position.set(...cfg.start);

    const dir = new THREE.Vector3(...cfg.dir).normalize();
    const up = new THREE.Vector3(0, 1, 0);

    // Zweiteiliger gekrümmter Ast
    const partLen = cfg.len / 2;

    // Basisteil des Astes
    const geo1 = new THREE.CylinderGeometry(cfg.thickness * 0.8, cfg.thickness, partLen, 8);
    const mesh1 = new THREE.Mesh(geo1, branchMat);
    mesh1.quaternion.setFromUnitVectors(up, dir);
    mesh1.position.copy(dir).multiplyScalar(partLen / 2);
    branchGroup.add(mesh1);

    // Endteil des Astes (leicht nach oben gebogen)
    const bendDir = dir.clone().add(new THREE.Vector3(0, 0.25, 0)).normalize();
    const geo2 = new THREE.CylinderGeometry(cfg.thickness * 0.4, cfg.thickness * 0.8, partLen, 8);
    const mesh2 = new THREE.Mesh(geo2, branchMat);
    mesh2.quaternion.setFromUnitVectors(up, bendDir);
    mesh2.position.copy(dir).multiplyScalar(partLen).add(bendDir.clone().multiplyScalar(partLen / 2));
    branchGroup.add(mesh2);

    group.add(branchGroup);
    prepareForExplosion(branchGroup, dir);

    branches.push({
      group: branchGroup,
      basePos: branchGroup.position.clone(),
      dir: dir,
      endPoint: cfg.start, // Speichert den Astursprung
      tipPos: new THREE.Vector3(...cfg.start).add(dir.clone().multiplyScalar(partLen)).add(bendDir.clone().multiplyScalar(partLen))
    });
  });

  // 4. Baumkronen-Nadelkissen (14 detaillierte Nadelwolken auf den Ästen und an der Spitze)
  const pads = [];
  const padConfigs = [
    // Untere Nadelkissen auf Astenden
    { x: -1.8 * s, y: lowerLen + 1.2 * s, z: 0.9 * s, r: 1.1 * s },
    { x: 1.6 * s, y: lowerLen + 2.0 * s, z: -0.7 * s, r: 1.0 * s },
    { x: -0.6 * s, y: lowerLen + 2.7 * s, z: -1.6 * s, r: 0.95 * s },
    { x: 0.7 * s, y: lowerLen + 3.6 * s, z: 1.3 * s, r: 0.9 * s },
    { x: -1.1 * s, y: lowerLen + 4.0 * s, z: -0.4 * s, r: 0.85 * s },

    // Hauptkrone (geschachtelt an der Spitze)
    { x: 0.1 * s, y: lowerLen + upperLen - 0.8 * s, z: 0.2 * s, r: 1.4 * s },
    { x: -0.5 * s, y: lowerLen + upperLen - 0.3 * s, z: -0.3 * s, r: 1.3 * s },
    { x: 0.6 * s, y: lowerLen + upperLen + 0.2 * s, z: 0.4 * s, r: 1.2 * s },
    { x: -0.2 * s, y: lowerLen + upperLen + 0.7 * s, z: 0.1 * s, r: 1.0 * s },
    { x: 0.3 * s, y: lowerLen + upperLen + 1.2 * s, z: -0.2 * s, r: 0.8 * s },

    // Kleine Füllwolken
    { x: 0.8 * s, y: lowerLen + upperLen - 1.2 * s, z: -0.8 * s, r: 0.7 * s },
    { x: -1.0 * s, y: lowerLen + upperLen - 0.6 * s, z: 0.8 * s, r: 0.75 * s }
  ];

  padConfigs.forEach((cfg) => {
    // Hochauflösende Nadelwolke (Icosahedron Detail 2 = viel mehr Polygone)
    const padGeo = new THREE.IcosahedronGeometry(cfg.r, 2);

    // Vertices leicht stören für organische Büscheligkeit
    const pos = padGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const angle = Math.atan2(pos.getZ(i), pos.getX(i));
      const dist = Math.sin(pos.getY(i) * 10) * 0.04 * cfg.r;
      pos.setX(i, pos.getX(i) + Math.cos(angle) * dist);
      pos.setZ(i, pos.getZ(i) + Math.sin(angle) * dist);
    }
    padGeo.computeVertexNormals();

    // Material mit minimalem Farbunterschied für Krone
    const padMat = needleMat.clone();
    // Leichtes Rauschen in die Farbe einrechnen
    padMat.color.multiplyScalar(0.85 + Math.random() * 0.2);

    const pad = new THREE.Mesh(padGeo, padMat);
    pad.scale.set(1.15, 0.55, 1.15); // Flach drücken
    pad.position.set(cfg.x, cfg.y, cfg.z);
    pad.rotation.set((Math.random() - 0.5) * 0.2, Math.random() * Math.PI, (Math.random() - 0.5) * 0.2);
    group.add(pad);

    prepareForExplosion(pad, new THREE.Vector3(cfg.x, 0.4 * s, cfg.z));
    pads.push({
      mesh: pad,
      basePos: pad.position.clone(),
      offset: [cfg.x, cfg.z],
      y: cfg.y,
      rotY: pad.rotation.y
    });

    // Optionale kleine Zapfen an den Rändern der Nadelkissen
    if (Math.random() < 0.7) {
      const coneGeo = new THREE.ConeGeometry(0.02 * s, 0.07 * s, 5);
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(
        cfg.x + (Math.random() - 0.5) * cfg.r * 0.8,
        cfg.y - cfg.r * 0.2,
        cfg.z + (Math.random() - 0.5) * cfg.r * 0.8
      );
      cone.rotation.set(2.0 + Math.random() * 0.5, 0, (Math.random() - 0.5) * 0.5);
      group.add(cone);
      prepareForExplosion(cone, new THREE.Vector3(cone.position.x, cone.position.y - 0.1, cone.position.z));
    }
  });

  // Wind-Sway Funktion
  group.userData.update = function (time, windSpeed = 1.0) {
    const sway = Math.sin(time * 1.5) * 0.05 * windSpeed * s;
    const swayCos = Math.cos(time * 1.2) * 0.04 * windSpeed * s;

    // Die Kronenteile wiegen sich weich im Wind
    pads.forEach((pad, idx) => {
      pad.mesh.position.x = pad.basePos.x + sway * (idx % 4 + 1) * 0.25;
      pad.mesh.position.z = pad.basePos.z + swayCos * (idx % 3 + 1) * 0.25;
      pad.mesh.rotation.y = pad.rotY + sway * 0.08;
    });

    // Oberer Stamm biegt sich
    trunkUp.rotation.z = -0.06 + sway * 0.15;
    trunkUp.rotation.x = swayCos * 0.12;

    // Auch Äste schwingen mit
    branches.forEach((b, idx) => {
      b.group.rotation.z = sway * 0.08 * (idx % 2 === 0 ? 1 : -1);
      b.group.rotation.x = swayCos * 0.05;
    });
  };

  return group;
}

// 1b. Hohe Waldkiefer (Pinus sylvestris - Tall / High Canopy)
export function createScotsPine2(options = {}) {
  const age = options.age !== undefined ? options.age : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Hohe Waldkiefer',
    latin: 'Pinus sylvestris var. elata',
    category: 'Flora (Nadelbaum)',
    description: 'Eine schlanke, besonders hohe Wuchsform der Waldkiefer. Die Äste setzen erst sehr weit oben an, wodurch eine lichtdurchflutete, hohe Schirmkrone entsteht.',
    polyCount: 0
  };

  const s = age;
  const lowerLen = 8.5 * s;
  const upperLen = 3.5 * s;

  const barkLowMat = new THREE.MeshStandardMaterial({ color: COL.barkLow, roughness: 1.0, flatShading: true });
  const barkUpMat = new THREE.MeshStandardMaterial({ color: COL.barkUp, roughness: 0.9, flatShading: true });
  const needleMat = new THREE.MeshStandardMaterial({ color: 0x185c34, roughness: 0.85, flatShading: true }); // Etwas dunkleres Grün
  const branchMat = new THREE.MeshStandardMaterial({ color: COL.deadWood, roughness: 1.0, flatShading: true });

  // Unterer Stamm (Sehr lang und gerade)
  const trunkLowGeo = new THREE.CylinderGeometry(0.15 * s, 0.28 * s, lowerLen, 20, 10);
  const posLow = trunkLowGeo.attributes.position;
  for (let i = 0; i < posLow.count; i++) {
    const y = posLow.getY(i);
    if (y > -lowerLen / 2 + 0.2 && y < lowerLen / 2 - 0.2) {
      const angle = Math.atan2(posLow.getZ(i), posLow.getX(i));
      const noise = Math.sin(y * 8) * 0.02 * s + Math.cos(angle * 8) * 0.01 * s;
      posLow.setX(i, posLow.getX(i) + Math.cos(angle) * noise);
      posLow.setZ(i, posLow.getZ(i) + Math.sin(angle) * noise);
    }
  }
  trunkLowGeo.computeVertexNormals();

  const trunkLow = new THREE.Mesh(trunkLowGeo, barkLowMat);
  trunkLow.position.y = lowerLen / 2;
  group.add(trunkLow);
  prepareForExplosion(trunkLow, new THREE.Vector3(0, -0.2, 0));

  // Oberer Stamm
  const trunkUpGeo = new THREE.CylinderGeometry(0.07 * s, 0.15 * s, upperLen, 16, 6);
  const posUp = trunkUpGeo.attributes.position;
  for (let i = 0; i < posUp.count; i++) {
    const y = posUp.getY(i);
    const angle = Math.atan2(posUp.getZ(i), posUp.getX(i));
    const noise = Math.sin(y * 5) * 0.012 * s;
    posUp.setX(i, posUp.getX(i) + Math.cos(angle) * noise);
    posUp.setZ(i, posUp.getZ(i) + Math.sin(angle) * noise);
  }
  trunkUpGeo.computeVertexNormals();

  const trunkUp = new THREE.Mesh(trunkUpGeo, barkUpMat);
  trunkUp.position.set(0.05 * s, lowerLen + upperLen / 2 - 0.05, 0);
  group.add(trunkUp);
  prepareForExplosion(trunkUp, new THREE.Vector3(0, 0.2, 0));

  // Knorrige Hoch-Äste (Nur 3 Stück, erst im oberen Drittel)
  const branchConfigs = [
    { start: [0.05 * s, lowerLen + 0.5 * s, 0], dir: [-1.1, 0.6, 0.6], len: 1.8 * s, thickness: 0.07 * s },
    { start: [0.06 * s, lowerLen + 1.4 * s, 0], dir: [1.0, 0.7, -0.4], len: 1.6 * s, thickness: 0.06 * s },
    { start: [0.05 * s, lowerLen + 2.2 * s, 0], dir: [-0.4, 0.8, -1.0], len: 1.4 * s, thickness: 0.05 * s }
  ];

  const branches = [];
  branchConfigs.forEach((cfg) => {
    const branchGroup = new THREE.Group();
    branchGroup.position.set(...cfg.start);

    const dir = new THREE.Vector3(...cfg.dir).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const partLen = cfg.len / 2;

    const geo1 = new THREE.CylinderGeometry(cfg.thickness * 0.8, cfg.thickness, partLen, 6);
    const mesh1 = new THREE.Mesh(geo1, branchMat);
    mesh1.quaternion.setFromUnitVectors(up, dir);
    mesh1.position.copy(dir).multiplyScalar(partLen / 2);
    branchGroup.add(mesh1);

    const bendDir = dir.clone().add(new THREE.Vector3(0, 0.3, 0)).normalize();
    const geo2 = new THREE.CylinderGeometry(cfg.thickness * 0.4, cfg.thickness * 0.8, partLen, 6);
    const mesh2 = new THREE.Mesh(geo2, branchMat);
    mesh2.quaternion.setFromUnitVectors(up, bendDir);
    mesh2.position.copy(dir).multiplyScalar(partLen).add(bendDir.clone().multiplyScalar(partLen / 2));
    branchGroup.add(mesh2);

    group.add(branchGroup);
    prepareForExplosion(branchGroup, dir);

    branches.push({
      group: branchGroup,
      basePos: branchGroup.position.clone(),
      dir: dir
    });
  });

  // Nadelkissen (kompakter, weit oben)
  const pads = [];
  const padConfigs = [
    { x: -1.3 * s, y: lowerLen + 1.2 * s, z: 0.7 * s, r: 0.85 * s },
    { x: 1.2 * s, y: lowerLen + 1.9 * s, z: -0.5 * s, r: 0.8 * s },
    { x: -0.4 * s, y: lowerLen + 2.5 * s, z: -1.1 * s, r: 0.75 * s },
    // Hauptgipfel
    { x: 0.0, y: lowerLen + upperLen - 0.4 * s, z: 0.0, r: 1.15 * s },
    { x: -0.3 * s, y: lowerLen + upperLen + 0.3 * s, z: -0.2 * s, r: 0.9 * s },
    { x: 0.3 * s, y: lowerLen + upperLen + 0.7 * s, z: 0.2 * s, r: 0.75 * s }
  ];

  padConfigs.forEach((cfg) => {
    const padGeo = new THREE.IcosahedronGeometry(cfg.r, 2);
    const pos = padGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const angle = Math.atan2(pos.getZ(i), pos.getX(i));
      const dist = Math.sin(pos.getY(i) * 10) * 0.04 * cfg.r;
      pos.setX(i, pos.getX(i) + Math.cos(angle) * dist);
      pos.setZ(i, pos.getZ(i) + Math.sin(angle) * dist);
    }
    padGeo.computeVertexNormals();

    const padMat = needleMat.clone();
    padMat.color.multiplyScalar(0.85 + Math.random() * 0.2);

    const pad = new THREE.Mesh(padGeo, padMat);
    pad.scale.set(1.15, 0.55, 1.15);
    pad.position.set(cfg.x, cfg.y, cfg.z);
    pad.rotation.set((Math.random() - 0.5) * 0.2, Math.random() * Math.PI, (Math.random() - 0.5) * 0.2);
    group.add(pad);
    prepareForExplosion(pad, new THREE.Vector3(cfg.x, 0.4 * s, cfg.z));

    pads.push({
      mesh: pad,
      basePos: pad.position.clone(),
      rotY: pad.rotation.y
    });
  });

  group.userData.update = function (time, windSpeed = 1.0) {
    const sway = Math.sin(time * 1.6) * 0.04 * windSpeed * s;
    const swayCos = Math.cos(time * 1.3) * 0.03 * windSpeed * s;

    pads.forEach((pad, idx) => {
      pad.mesh.position.x = pad.basePos.x + sway * (idx % 3 + 1) * 0.2;
      pad.mesh.position.z = pad.basePos.z + swayCos * (idx % 2 + 1) * 0.2;
      pad.mesh.rotation.y = pad.rotY + sway * 0.06;
    });

    trunkUp.rotation.z = sway * 0.12;
    trunkUp.rotation.x = swayCos * 0.10;

    branches.forEach((b, idx) => {
      b.group.rotation.z = sway * 0.06 * (idx % 2 === 0 ? 1 : -1);
      b.group.rotation.x = swayCos * 0.04;
    });
  };

  return group;
}

// 1c. Krüppel-Kiefer (Pinus sylvestris - Crooked / Gnarled)
export function createScotsPine3(options = {}) {
  const age = options.age !== undefined ? options.age : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Krüppel-Kiefer',
    latin: 'Pinus sylvestris var. nana',
    category: 'Flora (Nadelbaum)',
    description: 'Eine knorrige, stark verkrümmte Kiefernform, wie man sie auf kargen Sanddünen oder windexponierten Flächen findet. Der Stamm wächst gewunden und die Krone ist asymmetrisch verschoben.',
    polyCount: 0
  };

  const s = age;
  const lowerLen = 4.2 * s;
  const upperLen = 3.5 * s;

  const barkLowMat = new THREE.MeshStandardMaterial({ color: COL.barkLow, roughness: 1.0, flatShading: true });
  const barkUpMat = new THREE.MeshStandardMaterial({ color: COL.barkUp, roughness: 0.9, flatShading: true });
  const needleMat = new THREE.MeshStandardMaterial({ color: 0x227340, roughness: 0.85, flatShading: true });
  const branchMat = new THREE.MeshStandardMaterial({ color: COL.deadWood, roughness: 1.0, flatShading: true });

  // Unterer Stamm (stark geneigt)
  const trunkLowGeo = new THREE.CylinderGeometry(0.16 * s, 0.28 * s, lowerLen, 16, 8);
  const posLow = trunkLowGeo.attributes.position;
  // Kurve in den Stamm biegen
  for (let i = 0; i < posLow.count; i++) {
    const y = posLow.getY(i);
    const angle = Math.atan2(posLow.getZ(i), posLow.getX(i));
    const bend = Math.sin((y / lowerLen + 0.5) * Math.PI) * 0.14 * s;
    posLow.setX(i, posLow.getX(i) + bend);
  }
  trunkLowGeo.computeVertexNormals();

  const trunkLow = new THREE.Mesh(trunkLowGeo, barkLowMat);
  trunkLow.position.set(0.15 * s, lowerLen / 2, 0);
  trunkLow.rotation.z = -0.15; // Schiefstellung
  group.add(trunkLow);
  prepareForExplosion(trunkLow, new THREE.Vector3(0.1, -0.1, 0));

  // Oberer Stamm (knickt in Gegenrichtung ab)
  const trunkUpGeo = new THREE.CylinderGeometry(0.08 * s, 0.16 * s, upperLen, 16, 6);
  const posUp = trunkUpGeo.attributes.position;
  for (let i = 0; i < posUp.count; i++) {
    const y = posUp.getY(i);
    const angle = Math.atan2(posUp.getZ(i), posUp.getX(i));
    const bend = Math.cos((y / upperLen) * Math.PI) * 0.12 * s;
    posUp.setX(i, posUp.getX(i) + bend);
  }
  trunkUpGeo.computeVertexNormals();

  const trunkUp = new THREE.Mesh(trunkUpGeo, barkUpMat);
  // Knick nach rechts oben
  trunkUp.position.set(0.55 * s, lowerLen + upperLen / 2 - 0.2 * s, 0.1 * s);
  trunkUp.rotation.set(0.1, 0, -0.4);
  group.add(trunkUp);
  prepareForExplosion(trunkUp, new THREE.Vector3(0.3, 0.1, 0));

  // Knorrige, weit ausladende Äste
  const branchConfigs = [
    { start: [0.22 * s, lowerLen + 0.2 * s, 0.05 * s], dir: [-1.4, -0.1, 0.8], len: 2.0 * s, thickness: 0.08 * s },
    { start: [0.45 * s, lowerLen + 1.0 * s, 0.10 * s], dir: [1.3, 0.4, 0.5], len: 2.2 * s, thickness: 0.08 * s },
    { start: [0.60 * s, lowerLen + 2.0 * s, 0.08 * s], dir: [-0.6, 0.8, -1.3], len: 1.6 * s, thickness: 0.06 * s }
  ];

  const branches = [];
  branchConfigs.forEach((cfg) => {
    const branchGroup = new THREE.Group();
    branchGroup.position.set(...cfg.start);

    const dir = new THREE.Vector3(...cfg.dir).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const partLen = cfg.len / 2;

    const geo1 = new THREE.CylinderGeometry(cfg.thickness * 0.8, cfg.thickness, partLen, 6);
    const mesh1 = new THREE.Mesh(geo1, branchMat);
    mesh1.quaternion.setFromUnitVectors(up, dir);
    mesh1.position.copy(dir).multiplyScalar(partLen / 2);
    branchGroup.add(mesh1);

    const bendDir = dir.clone().add(new THREE.Vector3(0, 0.5, 0.1)).normalize();
    const geo2 = new THREE.CylinderGeometry(cfg.thickness * 0.4, cfg.thickness * 0.8, partLen, 6);
    const mesh2 = new THREE.Mesh(geo2, branchMat);
    mesh2.quaternion.setFromUnitVectors(up, bendDir);
    mesh2.position.copy(dir).multiplyScalar(partLen).add(bendDir.clone().multiplyScalar(partLen / 2));
    branchGroup.add(mesh2);

    group.add(branchGroup);
    prepareForExplosion(branchGroup, dir);

    branches.push({
      group: branchGroup,
      basePos: branchGroup.position.clone(),
      dir: dir
    });
  });

  // Bemooste, zerzauste Kronenwolken
  const pads = [];
  const padConfigs = [
    { x: -1.3 * s, y: lowerLen + 0.1 * s, z: 0.8 * s, r: 0.9 * s },
    { x: 1.8 * s, y: lowerLen + 1.2 * s, z: 0.6 * s, r: 1.0 * s },
    { x: -0.6 * s, y: lowerLen + 1.8 * s, z: -1.1 * s, r: 0.8 * s },
    // Scheitelkrone, nach rechts geschoben
    { x: 0.6 * s, y: lowerLen + upperLen - 0.2 * s, z: 0.2 * s, r: 1.1 * s },
    { x: 0.3 * s, y: lowerLen + upperLen + 0.4 * s, z: -0.2 * s, r: 0.85 * s }
  ];

  padConfigs.forEach((cfg) => {
    const padGeo = new THREE.IcosahedronGeometry(cfg.r, 2);
    const pos = padGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const angle = Math.atan2(pos.getZ(i), pos.getX(i));
      const dist = Math.sin(pos.getY(i) * 8) * 0.05 * cfg.r;
      pos.setX(i, pos.getX(i) + Math.cos(angle) * dist);
      pos.setZ(i, pos.getZ(i) + Math.sin(angle) * dist);
    }
    padGeo.computeVertexNormals();

    const padMat = needleMat.clone();
    padMat.color.multiplyScalar(0.8 + Math.random() * 0.25);

    const pad = new THREE.Mesh(padGeo, padMat);
    pad.scale.set(1.25, 0.45, 1.25);
    pad.position.set(cfg.x, cfg.y, cfg.z);
    pad.rotation.set((Math.random() - 0.5) * 0.3, Math.random() * Math.PI, (Math.random() - 0.5) * 0.3);
    group.add(pad);
    prepareForExplosion(pad, new THREE.Vector3(cfg.x, 0.3 * s, cfg.z));

    pads.push({
      mesh: pad,
      basePos: pad.position.clone(),
      rotY: pad.rotation.y
    });
  });

  group.userData.update = function (time, windSpeed = 1.0) {
    const sway = Math.sin(time * 1.3) * 0.07 * windSpeed * s;
    const swayCos = Math.cos(time * 1.1) * 0.05 * windSpeed * s;

    pads.forEach((pad, idx) => {
      pad.mesh.position.x = pad.basePos.x + sway * (idx % 3 + 1) * 0.25;
      pad.mesh.position.z = pad.basePos.z + swayCos * (idx % 2 + 1) * 0.25;
    });

    trunkUp.rotation.z = -0.4 + sway * 0.15;
    trunkUp.rotation.x = 0.1 + swayCos * 0.12;

    branches.forEach((b, idx) => {
      b.group.rotation.z = sway * 0.08 * (idx % 2 === 0 ? 1 : -1);
      b.group.rotation.x = swayCos * 0.06;
    });
  };

  return group;
}

// 1d. Kieferngruppe (Pine Group Cluster)
export function createPineGroup(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Kieferngruppe',
    latin: 'Pinus sylvestris Coetus',
    category: 'Flora (Baumgruppe)',
    description: 'Eine landschaftliche Baumgruppe bestehend aus drei unterschiedlichen Waldkiefern (klassisch, hoch und krüppelig gewachsen) sowie einer Jungkiefer. Perfekt als Wald-Element.',
    polyCount: 0
  };

  const s = scale;

  // 1. Klassische Kiefer im Zentrum
  const p1 = createScotsPine({ age: 0.95 });
  p1.position.set(0, 0, 0);
  group.add(p1);

  // 2. Hohe Kiefer rechts-hinten
  const p2 = createScotsPine2({ age: 1.05 });
  p2.position.set(1.8 * s, 0, -1.4 * s);
  group.add(p2);

  // 3. Krüppel-Kiefer links-vorne
  const p3 = createScotsPine3({ age: 0.8 });
  p3.position.set(-1.6 * s, 0, 1.2 * s);
  group.add(p3);

  // 4. Junge Kiefer (Sapling) dazwischen
  const p4 = createYoungPine({ age: 0.85 });
  p4.position.set(0.7 * s, 0, 1.4 * s);
  group.add(p4);

  // Gruppen-Explosion
  // Da createScotsPine bereits prepareForExplosion aufruft, müssen wir die relativen Offsets beibehalten,
  // aber die Explosionsrichtung radial vom Gruppenzentrum verschieben!
  p1.traverse(child => { if (child.isMesh) prepareForExplosion(child, child.position.clone().add(new THREE.Vector3(0, 0, 0))); });
  p2.traverse(child => { if (child.isMesh) prepareForExplosion(child, child.position.clone().add(new THREE.Vector3(1.8 * s, 0, -1.4 * s))); });
  p3.traverse(child => { if (child.isMesh) prepareForExplosion(child, child.position.clone().add(new THREE.Vector3(-1.6 * s, 0, 1.2 * s))); });
  p4.traverse(child => { if (child.isMesh) prepareForExplosion(child, child.position.clone().add(new THREE.Vector3(0.7 * s, 0, 1.4 * s))); });

  group.userData.update = function (time, windSpeed = 1.0) {
    p1.userData.update(time, windSpeed);
    p2.userData.update(time, windSpeed);
    p3.userData.update(time, windSpeed);
    p4.userData.update(time, windSpeed);
  };

  return group;
}

// 2. Hänge-Birke (Betula pendula)
export function createBirch(options = {}) {
  const age = options.age !== undefined ? options.age : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Hänge-Birke',
    latin: 'Betula pendula',
    category: 'Flora (Laubbaum)',
    description: 'Pionierbaum mit auffallend weißer Rinde, die durch Korkstoff (Betulin) entsteht. Im Alter bricht die Borke unten tief und schwarz auf. Die Zweige sind extrem dünn und hängen elegant herab.',
    polyCount: 0
  };

  const s = age;
  const height = 9.0 * s;

  // Materialien
  const whiteBark = new THREE.MeshStandardMaterial({ color: COL.birchBark, roughness: 0.85, flatShading: true });
  const darkBark = new THREE.MeshStandardMaterial({ color: COL.birchDark, roughness: 1.0, flatShading: true });
  const leafMat = new THREE.MeshStandardMaterial({ color: COL.verdant, roughness: 0.7, flatShading: true });
  const branchMat = new THREE.MeshStandardMaterial({ color: COL.deadWood, roughness: 1.0, flatShading: true });

  // Stamm aus 12 Segmenten für eine feine Krümmung
  const segments = 12;
  const segHeight = height / segments;
  const stems = [];

  for (let i = 0; i < segments; i++) {
    const bottomR = (0.24 - (i * 0.016)) * s;
    const topR = (0.24 - ((i + 1) * 0.016)) * s;
    const segGeo = new THREE.CylinderGeometry(topR, bottomR, segHeight, 20, 2);

    // Die untersten Segmente sind stark zerklüftet und dunkel, höhere sind weiß
    const isBase = (i <= 1);
    const mat = isBase ? darkBark : whiteBark;

    const seg = new THREE.Mesh(segGeo, mat);
    seg.position.y = (i * segHeight) + (segHeight / 2);

    // Organischer Wuchs (S-Kurve im Stamm)
    seg.position.x = Math.sin(i * 0.4) * 0.08 * s;
    seg.position.z = Math.cos(i * 0.3) * 0.04 * s;
    seg.rotation.z = Math.cos(i * 0.4) * 0.03;

    group.add(seg);
    prepareForExplosion(seg, new THREE.Vector3(seg.position.x, 0.1 * i, seg.position.z));
    stems.push(seg);

    // Wir fügen plastische Rindenflecken ("Birkenaugen") als extrem flache Platten hinzu, die tangential aufliegen
    if (i > 1 && i < segments - 2) {
      const eyeGeo = new THREE.BoxGeometry(0.05 * s, 0.015 * s, 0.002 * s);
      const eyeCount = 2 + Math.floor(Math.random() * 2);
      for (let e = 0; e < eyeCount; e++) {
        const eye = new THREE.Mesh(eyeGeo, darkBark);
        const angle = Math.random() * Math.PI * 2;
        const radius = (bottomR + topR) / 2;
        eye.position.set(
          seg.position.x + Math.cos(angle) * radius * 0.99,
          seg.position.y + (Math.random() - 0.5) * segHeight * 0.6,
          seg.position.z + Math.sin(angle) * radius * 0.99
        );
        // Tangential zur Oberfläche drehen
        eye.rotation.set(0, -angle + Math.PI / 2, 0);
        group.add(eye);
        prepareForExplosion(eye, new THREE.Vector3(Math.cos(angle) * 1.2, 0.1 * i, Math.sin(angle) * 1.2));
      }
    }
  }

  // Dünne Äste und hängende Zweige
  const branchConfigs = [
    { start: [0.1 * s, height * 0.5, 0.05 * s], dir: [-1.2, 0.5, 0.8], len: 2.2 * s },
    { start: [-0.1 * s, height * 0.6, -0.05 * s], dir: [1.2, 0.6, -0.6], len: 2.0 * s },
    { start: [0.05 * s, height * 0.7, 0.1 * s], dir: [-0.6, 0.7, -1.2], len: 1.8 * s },
    { start: [-0.05 * s, height * 0.8, -0.1 * s], dir: [0.8, 0.8, 0.5], len: 1.6 * s }
  ];

  const twigs = [];
  branchConfigs.forEach((cfg) => {
    const branchGroup = new THREE.Group();
    branchGroup.position.set(...cfg.start);

    const dir = new THREE.Vector3(...cfg.dir).normalize();
    const up = new THREE.Vector3(0, 1, 0);

    // Hauptast
    const branchGeo = new THREE.CylinderGeometry(0.02 * s, 0.04 * s, cfg.len, 8);
    const branch = new THREE.Mesh(branchGeo, branchMat);
    branch.quaternion.setFromUnitVectors(up, dir);
    branch.position.copy(dir).multiplyScalar(cfg.len / 2);
    branchGroup.add(branch);

    // Hängender Zweig (zeigt nach unten)
    const hangDir = new THREE.Vector3(dir.x * 0.3, -0.9, dir.z * 0.3).normalize();
    const twigGeo = new THREE.CylinderGeometry(0.008 * s, 0.02 * s, cfg.len * 0.8, 6);
    const twig = new THREE.Mesh(twigGeo, branchMat);
    twig.quaternion.setFromUnitVectors(up, hangDir);
    twig.position.copy(dir).multiplyScalar(cfg.len).add(hangDir.clone().multiplyScalar(cfg.len * 0.4));
    branchGroup.add(twig);

    group.add(branchGroup);
    prepareForExplosion(branchGroup, dir);

    twigs.push({
      group: branchGroup,
      basePos: branchGroup.position.clone(),
      dir: dir,
      hangDir: hangDir,
      len: cfg.len
    });
  });

  // Blätterkrone: 16 herabhängende, filigranere Laubwolken (zierlichere Radien)
  const leaves = [];
  const leafConfigs = [
    // Laub an den hängenden Zweigen der Äste
    { pos: [-1.5 * s, height * 0.38, 1.0 * s], r: 0.55 * s },
    { pos: [1.4 * s, height * 0.44, -0.8 * s], r: 0.55 * s },
    { pos: [-0.8 * s, height * 0.54, -1.3 * s], r: 0.5 * s },
    { pos: [1.0 * s, height * 0.62, 0.7 * s], r: 0.5 * s },

    // Zusätzliche äußere Hängelaub-Wolken
    { pos: [-1.2 * s, height * 0.48, -0.5 * s], r: 0.45 * s },
    { pos: [1.1 * s, height * 0.56, 0.9 * s], r: 0.45 * s },
    { pos: [-0.5 * s, height * 0.65, 1.2 * s], r: 0.45 * s },
    { pos: [0.6 * s, height * 0.68, -1.1 * s], r: 0.45 * s },

    // Hauptkrone oben (geschachtelt)
    { pos: [-0.5 * s, height * 0.72, 0.3 * s], r: 0.7 * s },
    { pos: [0.6 * s, height * 0.75, -0.3 * s], r: 0.65 * s },
    { pos: [-0.3 * s, height * 0.82, -0.5 * s], r: 0.65 * s },
    { pos: [0.4 * s, height * 0.85, 0.4 * s], r: 0.6 * s },
    { pos: [0.0, height * 0.92, 0.0], r: 0.8 * s },
    { pos: [-0.6 * s, height * 0.88, -0.1 * s], r: 0.55 * s },
    { pos: [0.5 * s, height * 0.90, 0.2 * s], r: 0.55 * s },
    { pos: [0.1 * s, height * 0.98, -0.2 * s], r: 0.5 * s }
  ];

  leafConfigs.forEach((cfg, idx) => {
    const leafGeo = new THREE.IcosahedronGeometry(cfg.r, 2);

    // Vertices leicht stören für organische Birkenblätter-Optik
    const pos = leafGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const angle = Math.atan2(pos.getZ(i), pos.getX(i));
      const dist = Math.sin(pos.getY(i) * 12) * 0.03 * cfg.r;
      pos.setX(i, pos.getX(i) + Math.cos(angle) * dist);
      pos.setZ(i, pos.getZ(i) + Math.sin(angle) * dist);
    }
    leafGeo.computeVertexNormals();

    const leaf = new THREE.Mesh(leafGeo, leafMat);
    // Vertikal leicht strecken für hängenden Wuchs
    leaf.scale.set(0.8, 1.4, 0.8);
    leaf.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    group.add(leaf);

    prepareForExplosion(leaf, new THREE.Vector3(cfg.pos[0], 0.2 * s, cfg.pos[2]));
    leaves.push({
      mesh: leaf,
      basePos: leaf.position.clone(),
      offset: [cfg.pos[0], cfg.pos[2]],
      y: cfg.pos[1]
    });
  });

  group.userData.update = function (time, windSpeed = 1.0) {
    const sway = Math.sin(time * 2.1) * 0.06 * windSpeed * s;
    const swayCos = Math.cos(time * 1.8) * 0.05 * windSpeed * s;

    // Weiche Blätterkronen wanken stärker als Nadelbäume
    leaves.forEach((leaf, idx) => {
      leaf.mesh.position.x = leaf.basePos.x + sway * (idx % 4 + 1) * 0.3;
      leaf.mesh.position.z = leaf.basePos.z + swayCos * (idx % 3 + 1) * 0.3;
      leaf.mesh.rotation.z = sway * 0.12;
    });

    // Stamm biegt sich elastisch
    stems.forEach((seg, idx) => {
      if (idx > 0) {
        seg.rotation.z = Math.sin(idx * 0.5) * 0.02 + sway * (idx / segments) * 0.10;
        seg.rotation.x = swayCos * (idx / segments) * 0.06;
      }
    });

    // Äste schwingen mit
    twigs.forEach((t, idx) => {
      t.group.rotation.z = sway * 0.12 * (idx % 2 === 0 ? 1 : -1);
      t.group.rotation.y = swayCos * 0.08;
    });
  };

  return group;
}

// 3. Junge Kiefer (Sapling)
export function createYoungPine(options = {}) {
  const age = options.age !== undefined ? options.age : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Junge Kiefer',
    latin: 'Pinus sylvestris (juvenil)',
    category: 'Flora (Nadelbaum)',
    description: 'Eine junge Waldkiefer. Im Gegensatz zu ausgewachsenen Kiefern ist ihr Stamm noch schlank und grünlich-braun. Ihre Krone ist dichter am Boden und kegelförmiger strukturiert.',
    polyCount: 0
  };

  const s = age;
  const height = 4.0 * s;

  const barkMat = new THREE.MeshStandardMaterial({ color: 0x47392b, roughness: 0.9, flatShading: true });
  const needleMat = new THREE.MeshStandardMaterial({ color: COL.emerald, roughness: 0.8, flatShading: true });
  const twigMat = new THREE.MeshStandardMaterial({ color: 0x3d3225, roughness: 0.95, flatShading: true });

  // Schlanker, detaillierter Stamm (16 Segmente statt 6)
  const trunkGeo = new THREE.CylinderGeometry(0.04 * s, 0.08 * s, height, 16, 4);
  // Leicht stören
  const pos = trunkGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const angle = Math.atan2(pos.getZ(i), pos.getX(i));
    const noise = Math.sin(y * 6) * 0.006 * s;
    pos.setX(i, pos.getX(i) + Math.cos(angle) * noise);
    pos.setZ(i, pos.getZ(i) + Math.sin(angle) * noise);
  }
  trunkGeo.computeVertexNormals();

  const trunk = new THREE.Mesh(trunkGeo, barkMat);
  trunk.position.y = height / 2;
  group.add(trunk);
  prepareForExplosion(trunk, new THREE.Vector3(0, -0.1, 0));

  // Nadelbüschel etagenartig übereinander (Tannenbaum-artig, Detail 2)
  const pads = [];
  const padCount = 5;

  for (let i = 0; i < padCount; i++) {
    const r = (0.75 - i * 0.12) * s;
    const y = (1.2 + i * 0.65) * s;

    // Etagen-Hauptwolke
    const padGeo = new THREE.IcosahedronGeometry(r, 2);
    // Plustern
    const posPad = padGeo.attributes.position;
    for (let j = 0; j < posPad.count; j++) {
      const angle = Math.atan2(posPad.getZ(j), posPad.getX(j));
      const dist = Math.cos(posPad.getY(j) * 8) * 0.04 * r;
      posPad.setX(j, posPad.getX(j) + Math.cos(angle) * dist);
      posPad.setZ(j, posPad.getZ(j) + Math.sin(angle) * dist);
    }
    padGeo.computeVertexNormals();

    const pad = new THREE.Mesh(padGeo, needleMat);
    pad.scale.set(1.2, 0.55, 1.2);
    pad.position.set(0, y, 0);
    pad.rotation.y = i * 0.6;
    group.add(pad);
    prepareForExplosion(pad, new THREE.Vector3(0, 0.25 * i, 0));
    pads.push({
      mesh: pad,
      basePos: pad.position.clone(),
      rotY: pad.rotation.y,
      weight: (i + 1)
    });

    // 4 kleine radiale Zweiglein pro Etage für mehr Detail
    if (i < padCount - 1) {
      const miniGeo = new THREE.IcosahedronGeometry(r * 0.4, 1);
      for (let j = 0; j < 4; j++) {
        const angle = (j / 4) * Math.PI * 2 + i * 0.5;
        const dist = r * 0.95;
        const mx = Math.sin(angle) * dist;
        const mz = Math.cos(angle) * dist;
        const my = y - 0.1 * s;

        // Kleiner Ast
        const branchGeo = new THREE.CylinderGeometry(0.01 * s, 0.015 * s, dist, 6);
        const branch = new THREE.Mesh(branchGeo, twigMat);
        branch.rotation.set(0.25, angle + Math.PI / 2, 0);
        branch.position.set(mx / 2, my, mz / 2);
        group.add(branch);
        prepareForExplosion(branch, new THREE.Vector3(mx, 0.1, mz));

        const miniPad = new THREE.Mesh(miniGeo, needleMat);
        miniPad.scale.set(1.2, 0.6, 1.2);
        miniPad.position.set(mx, my + 0.05 * s, mz);
        group.add(miniPad);
        prepareForExplosion(miniPad, new THREE.Vector3(mx, 0.15, mz));

        pads.push({
          mesh: miniPad,
          basePos: miniPad.position.clone(),
          rotY: Math.random() * Math.PI,
          weight: (i + 1.5)
        });
      }
    }
  }

  group.userData.update = function (time, windSpeed = 1.0) {
    const sway = Math.sin(time * 2.4) * 0.06 * windSpeed * s;
    pads.forEach((p) => {
      p.mesh.position.x = p.basePos.x + sway * p.weight * 0.2;
      p.mesh.rotation.z = sway * p.weight * 0.04;
    });
    trunk.rotation.z = sway * 0.04;
  };

  return group;
}

// 4. Gemeiner Wurmfarn (Dryopteris filix-mas)
export function createFern(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Wurmfarn',
    latin: 'Dryopteris filix-mas',
    category: 'Flora (Farn)',
    description: 'Ein typischer Bewohner schattiger Waldschichten. Seine Wedel wachsen trichterförmig aus einem kräftigen, schuppigen Wurzelstock heraus.',
    polyCount: 0
  };

  const s = scale;
  const fernMat = new THREE.MeshStandardMaterial({ color: COL.tuft, roughness: 0.8, side: THREE.DoubleSide, flatShading: true });
  const rootMat = new THREE.MeshStandardMaterial({ color: 0x3d2a1b, roughness: 1.0, flatShading: true });

  // 1. Schuppiger Wurzelstock (Farnkopf an der Basis)
  const rootGeo = new THREE.CylinderGeometry(0.12 * s, 0.08 * s, 0.25 * s, 10);
  const root = new THREE.Mesh(rootGeo, rootMat);
  root.position.y = 0.1 * s;
  group.add(root);
  prepareForExplosion(root, new THREE.Vector3(0, -0.05, 0));

  // Schuppen auf dem Wurzelkopf
  const scaleGeo = new THREE.ConeGeometry(0.03 * s, 0.08 * s, 4);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const sc = new THREE.Mesh(scaleGeo, rootMat);
    sc.position.set(Math.sin(angle) * 0.1 * s, 0.12 * s, Math.cos(angle) * 0.1 * s);
    sc.rotation.set(0.4, angle, 0.2);
    group.add(sc);
    prepareForExplosion(sc, new THREE.Vector3(Math.sin(angle) * 0.2, 0.05, Math.cos(angle) * 0.2));
  }

  // 2. 16 elegant geschwungene Wedel radial angeordnet
  const frondCount = 16;
  const fronds = [];

  for (let i = 0; i < frondCount; i++) {
    const angle = (i / frondCount) * Math.PI * 2;
    const frond = new THREE.Group();

    // Spindel (Mittelrippe) aus 8 Segmenten für eine perfekte Kurve
    const spindleSegments = 8;
    const segmentLen = 0.18 * s;
    const spindleNodes = [];

    let currentPos = new THREE.Vector3(0, 0.1 * s, 0);
    let currentDir = new THREE.Vector3(0, 1, 0);

    for (let j = 0; j < spindleSegments; j++) {
      // Dickenverjüngung
      const rBase = 0.016 * s * (1.0 - j / spindleSegments);
      const rTop = 0.016 * s * (1.0 - (j + 1) / spindleSegments);
      const spineGeo = new THREE.CylinderGeometry(rTop, rBase, segmentLen, 6);
      const spine = new THREE.Mesh(spineGeo, fernMat);

      // Biegerichtung nach außen
      const bendFactor = 0.15 + (j * 0.05); // Krümmung nimmt nach oben zu
      const angleDir = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
      currentDir.addScaledVector(angleDir, bendFactor).normalize();

      const up = new THREE.Vector3(0, 1, 0);
      spine.quaternion.setFromUnitVectors(up, currentDir);

      // Pivot anpassen, damit die Segmente aneinander hängen
      spine.position.copy(currentPos).addScaledVector(currentDir, segmentLen / 2);
      frond.add(spine);

      spindleNodes.push({
        pos: currentPos.clone().addScaledVector(currentDir, segmentLen / 2),
        dir: currentDir.clone(),
        width: rBase * 10
      });

      // Nächster Punkt
      currentPos.addScaledVector(currentDir, segmentLen);

      // 3. Fiederchen links/rechts von der Spindel
      if (j > 0) {
        const fiederLen = 0.28 * s * (1.0 - j / spindleSegments);
        const fiederWidth = 0.05 * s * (1.0 - j / spindleSegments);
        const fiederGeo = new THREE.ConeGeometry(fiederWidth, fiederLen, 3);

        // Links
        const f1 = new THREE.Mesh(fiederGeo, fernMat);
        const fiederDir1 = new THREE.Vector3()
          .crossVectors(currentDir, new THREE.Vector3(0, 1, 0))
          .normalize();

        // Leicht nach oben und vorne neigen
        fiederDir1.addScaledVector(currentDir, 0.2).normalize();

        f1.quaternion.setFromUnitVectors(up, fiederDir1);
        f1.position.copy(spindleNodes[j - 1].pos).addScaledVector(fiederDir1, fiederLen / 2);
        f1.scale.set(1.0, 1.0, 0.25); // Flach stauchen
        frond.add(f1);

        // Rechts
        const f2 = new THREE.Mesh(fiederGeo, fernMat);
        const fiederDir2 = fiederDir1.clone().negate().addScaledVector(currentDir, 0.2).normalize();
        f2.quaternion.setFromUnitVectors(up, fiederDir2);
        f2.position.copy(spindleNodes[j - 1].pos).addScaledVector(fiederDir2, fiederLen / 2);
        f2.scale.set(1.0, 1.0, 0.25);
        frond.add(f2);
      }
    }

    group.add(frond);

    // Für die Explosionsansicht merken wir uns die Kind-Elemente
    frond.traverse(child => {
      if (child.isMesh) {
        prepareForExplosion(child, new THREE.Vector3(Math.sin(angle), 0.4, Math.cos(angle)));
      }
    });

    fronds.push(frond);
  }

  group.userData.update = function (time, windSpeed = 1.0) {
    fronds.forEach((frond, idx) => {
      // Wedel wiegen sich im Wind
      const swayFactor = 0.45 + Math.sin(time * 1.8 + idx) * 0.04 * windSpeed;
      frond.rotation.x = swayFactor;
      frond.rotation.z = Math.cos(time * 2.2 + idx) * 0.03 * windSpeed;
    });
  };

  return group;
}

// 5. Beerenstrauch (Vaccinium)
export function createBerryBush(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Heidelbeerstrauch',
    latin: 'Vaccinium myrtillus',
    category: 'Flora (Zwergstrauch)',
    description: 'Ein Zwergstrauch, der dichte Teppiche auf sauren Nadelwaldböden bildet. Trägt essbare, tiefblaue Beeren.',
    polyCount: 0
  };

  const s = scale;
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x247a3e, roughness: 0.7, flatShading: true });
  const berryMat = new THREE.MeshStandardMaterial({ color: COL.berryBlue, roughness: 0.5, metalness: 0.1, flatShading: true });
  const unripeMat = new THREE.MeshStandardMaterial({ color: 0x8bad3f, roughness: 0.6, flatShading: true });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x473e2b, roughness: 1.0, flatShading: true });

  // 1. Verzweigtes Astwerk (5 geschwungene Hauptäste)
  const branches = [];
  const branchConfigs = [
    { dir: [0.1, 0.9, 0.0], len: 0.6 * s, thickness: 0.025 * s, rot: [0.1, 0, -0.1] },
    { dir: [-0.5, 0.7, 0.3], len: 0.55 * s, thickness: 0.02 * s, rot: [0.2, 0.5, 0.3] },
    { dir: [0.4, 0.75, -0.4], len: 0.5 * s, thickness: 0.02 * s, rot: [-0.2, -0.4, -0.25] },
    { dir: [-0.2, 0.8, -0.5], len: 0.45 * s, thickness: 0.018 * s, rot: [0.3, -0.2, 0.15] },
    { dir: [0.3, 0.6, 0.6], len: 0.4 * s, thickness: 0.015 * s, rot: [-0.15, 0.3, -0.2] }
  ];

  branchConfigs.forEach((cfg, idx) => {
    const bGroup = new THREE.Group();
    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3(...cfg.dir).normalize();

    // Unterer Hauptast-Zylinder
    const geo = new THREE.CylinderGeometry(cfg.thickness * 0.7, cfg.thickness, cfg.len, 8);
    const mesh = new THREE.Mesh(geo, stemMat);
    mesh.quaternion.setFromUnitVectors(up, dir);
    mesh.position.copy(dir).multiplyScalar(cfg.len / 2);
    bGroup.add(mesh);

    // Verzweigungen
    const subGeo = new THREE.CylinderGeometry(0.008 * s, cfg.thickness * 0.7, cfg.len * 0.5, 6);
    const subDir = dir.clone().add(new THREE.Vector3((idx % 2 === 0 ? 0.4 : -0.4), 0.2, (idx % 3 === 0 ? 0.3 : -0.3))).normalize();
    const subMesh = new THREE.Mesh(subGeo, stemMat);
    subMesh.quaternion.setFromUnitVectors(up, subDir);
    subMesh.position.copy(dir).multiplyScalar(cfg.len * 0.6).add(subDir.clone().multiplyScalar(cfg.len * 0.25));
    bGroup.add(subMesh);

    group.add(bGroup);
    prepareForExplosion(bGroup, dir);

    branches.push({
      group: bGroup,
      basePos: bGroup.position.clone(),
      dir: dir,
      len: cfg.len
    });
  });

  // 2. Ca. 40 Blätter (einzeln skaliert und flach gedrückt)
  const leafGeo = new THREE.DodecahedronGeometry(0.08 * s, 0);
  const leafCount = 35;
  const leaves = [];

  for (let i = 0; i < leafCount; i++) {
    // Blätter zufällig an den Ästen verteilen
    const bIdx = i % branches.length;
    const branch = branches[bIdx];
    const progress = 0.3 + (Math.random() * 0.65); // Nicht ganz unten wachsen lassen
    const posOnAst = branch.dir.clone().multiplyScalar(branch.len * progress);

    // Zufällige Blattausrichtung
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    // Blatt flach strecken
    leaf.scale.set(1.1, 0.15, 0.7);
    leaf.position.copy(posOnAst);

    // Leicht nach außen abstehen lassen
    const angle = Math.random() * Math.PI * 2;
    leaf.position.x += Math.sin(angle) * 0.05 * s;
    leaf.position.z += Math.cos(angle) * 0.05 * s;
    leaf.position.y += (Math.random() - 0.5) * 0.05 * s;

    leaf.rotation.set(
      Math.random() * 0.5,
      angle + Math.PI / 2,
      0.5 + Math.random() * 0.5
    );
    group.add(leaf);
    prepareForExplosion(leaf, new THREE.Vector3(leaf.position.x * 2.0, leaf.position.y, leaf.position.z * 2.0));
    leaves.push({
      mesh: leaf,
      basePos: leaf.position.clone(),
      rotZ: leaf.rotation.z
    });
  }

  // 3. 25-30 glänzende Beeren an dünnen Stängeln
  const berryGeo = new THREE.IcosahedronGeometry(0.035 * s, 1);
  const berryCount = 13;
  const berries = [];

  for (let i = 0; i < berryCount; i++) {
    const bIdx = i % branches.length;
    const branch = branches[bIdx];
    const progress = 0.5 + (Math.random() * 0.45);
    const posOnAst = branch.dir.clone().multiplyScalar(branch.len * progress);

    const isRipe = Math.random() > 0.25;
    const mat = isRipe ? berryMat : unripeMat;

    const bGroup = new THREE.Group();
    bGroup.position.copy(posOnAst);

    // Stängel
    const stemLength = 0.05 * s;
    const stemGeo = new THREE.CylinderGeometry(0.004 * s, 0.004 * s, stemLength, 4);
    const bStem = new THREE.Mesh(stemGeo, stemMat);
    bStem.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    bStem.position.y = -stemLength / 2;
    bGroup.add(bStem);

    // Beere
    const berry = new THREE.Mesh(berryGeo, mat);
    berry.position.copy(bStem.position).addScaledVector(new THREE.Vector3(0, -1, 0), stemLength / 2);
    bGroup.add(berry);

    group.add(bGroup);
    prepareForExplosion(bGroup, new THREE.Vector3(bGroup.position.x * 1.8, bGroup.position.y - 0.1, bGroup.position.z * 1.8));
    berries.push({
      group: bGroup,
      basePos: bGroup.position.clone()
    });
  }

  group.userData.update = function (time, windSpeed = 1.0) {
    const sway = Math.sin(time * 2.2) * 0.05 * windSpeed * s;
    const swayCos = Math.cos(time * 1.9) * 0.04 * windSpeed * s;

    // Äste wiegen sich
    branches.forEach((b, idx) => {
      b.group.rotation.z = sway * (idx % 2 === 0 ? 0.08 : -0.08);
      b.group.rotation.x = swayCos * 0.05;
    });

    // Blättchen flattern
    leaves.forEach((l, idx) => {
      l.mesh.rotation.z = l.rotZ + Math.sin(time * 4.0 + idx) * 0.03 * windSpeed;
    });
  };

  return group;
}

// 6. Roter Fliegenpilz (Amanita muscaria)
export function createMushroom(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Fliegenpilz',
    latin: 'Amanita muscaria',
    category: 'Flora (Pilz)',
    description: 'Ein weltbekannter, auffälliger Giftpilz. Lebt in Mykorrhiza-Symbiose vor allem mit Birken und Fichten. Die charakteristischen weißen Punkte auf dem roten Hut sind Reste der Hüllschicht (Velum).',
    polyCount: 0
  };

  const s = scale;
  const stemMat = new THREE.MeshStandardMaterial({ color: COL.mushStem, roughness: 0.9, flatShading: true });
  const lamellMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true });
  const capMat = new THREE.MeshStandardMaterial({ color: COL.mushCapRed, roughness: 0.55, flatShading: true });
  const dotMat = new THREE.MeshStandardMaterial({ color: 0xfffef0, roughness: 0.95, flatShading: true });

  // 1. Stiel (gebogen, detailliert mit Knollenbasis)
  const stemGroup = new THREE.Group();
  const stemGeo = new THREE.CylinderGeometry(0.04 * s, 0.07 * s, 0.45 * s, 20, 4);

  // Stiel leicht krümmen
  const pos = stemGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    // Biegen
    pos.setX(i, pos.getX(i) + Math.sin((y + 0.225) * 5) * 0.02 * s);
  }
  stemGeo.computeVertexNormals();

  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = 0.225 * s;
  stemGroup.add(stem);

  // Knolle an der Basis (Sphäre, abgeplattet)
  const bulbGeo = new THREE.IcosahedronGeometry(0.09 * s, 2);
  const bulb = new THREE.Mesh(bulbGeo, stemMat);
  bulb.position.y = 0.05 * s;
  bulb.scale.set(1.0, 0.7, 1.0);
  stemGroup.add(bulb);

  group.add(stemGroup);
  prepareForExplosion(stemGroup, new THREE.Vector3(0, -0.1, 0));

  // 2. Gefaltete Manschette (Velum partiale)
  const ringGeo = new THREE.CylinderGeometry(0.045 * s, 0.095 * s, 0.06 * s, 24, 2);
  // Vertices verzerren für Faltenwurf
  const posRing = ringGeo.attributes.position;
  for (let i = 0; i < posRing.count; i++) {
    const angle = Math.atan2(posRing.getZ(i), posRing.getX(i));
    const wave = Math.sin(angle * 12) * 0.008 * s;
    if (posRing.getY(i) < 0) { // nur unten falten
      posRing.setX(i, posRing.getX(i) + Math.cos(angle) * wave);
      posRing.setZ(i, posRing.getZ(i) + Math.sin(angle) * wave);
    }
  }
  ringGeo.computeVertexNormals();

  const ring = new THREE.Mesh(ringGeo, stemMat);
  ring.position.y = 0.32 * s;
  group.add(ring);
  prepareForExplosion(ring, new THREE.Vector3(0, -0.05, 0));

  // 3. Hut (Kuppelform, hochauflösende Sphäre mit Loch unten)
  const capGroup = new THREE.Group();
  capGroup.position.y = 0.44 * s;

  // Der Hut wird aus einer Halbsphäre konstruiert
  const capGeo = new THREE.SphereGeometry(0.24 * s, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.scale.set(1.15, 0.95, 1.15); // Leicht platt
  capGroup.add(cap);

  // Lamellen unter dem Hut (40 radiale Blätter)
  const lamellCount = 40;
  const lamellGeo = new THREE.BoxGeometry(0.006 * s, 0.03 * s, 0.22 * s);
  for (let i = 0; i < lamellCount; i++) {
    const angle = (i / lamellCount) * Math.PI * 2;
    const lamell = new THREE.Mesh(lamellGeo, lamellMat);

    lamell.rotation.set(0, -angle, 0.08); // Leicht nach außen geneigt

    // Positionieren unter der Wölbung
    const dist = 0.11 * s;
    lamell.position.set(Math.sin(angle) * dist, -0.02 * s, Math.cos(angle) * dist);
    capGroup.add(lamell);
  }

  group.add(capGroup);
  prepareForExplosion(capGroup, new THREE.Vector3(0, 0.25 * s, 0));

  // 4. 42 weiße Flocken (Velumreste, erhaben auf der Hutoberfläche)
  const dotGeo = new THREE.IcosahedronGeometry(0.018 * s, 1);
  const dots = [];

  // Wir verteilen die Punkte mathematisch sauber (Fibonacci-Gitter auf Halbkugel)
  const dotCount = 42;
  for (let i = 0; i < dotCount; i++) {
    // Sphärische Koordinaten (nur obere Halbkugel)
    const phi = Math.acos(0.15 + 0.85 * (i / dotCount));
    const theta = i * 2.39996; // Golden angle in rad

    const r = 0.245 * s; // Leicht außerhalb des Hutes für Plastizität
    const dx = Math.sin(phi) * Math.cos(theta) * r * 1.15;
    const dy = Math.cos(phi) * r * 0.95;
    const dz = Math.sin(phi) * Math.sin(theta) * r * 1.15;

    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(dx, dy, dz);

    // An der Oberfläche ausrichten
    const normal = new THREE.Vector3(dx, dy * 1.2, dz).normalize();
    dot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

    // Unregelmäßige Flockenform
    dot.scale.set(
      0.8 + Math.random() * 0.6,
      0.2 + Math.random() * 0.2, // Flach
      0.8 + Math.random() * 0.6
    );

    capGroup.add(dot);
  }

  group.userData.update = function (time, windSpeed = 1.0) {
    // Atmen-Animation: Der Hut pulsiert sanft und organisch
    const breathe = 1.0 + Math.sin(time * 1.2) * 0.018;
    capGroup.scale.set(breathe, 1.0 + Math.cos(time * 1.2) * 0.008, breathe);

    // Ganz leichtes Wanken im Wind
    const sway = Math.sin(time * 0.8) * 0.015 * windSpeed;
    stemGroup.rotation.z = sway;
    capGroup.position.x = Math.sin(time * 0.8) * 0.008 * windSpeed * s;
  };

  return group;
}

// 7. Heidekraut (Calluna vulgaris)
export function createHeather(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Heidekraut',
    latin: 'Calluna vulgaris',
    category: 'Flora (Zwergstrauch)',
    description: 'Prägt das Unterholz sandiger Wälder. Bildet von Spätsommer bis Herbst violette Teppiche. Extrem widerstandsfähig gegen Trockenheit.',
    polyCount: 0
  };

  const s = scale;
  const greenMat = new THREE.MeshStandardMaterial({ color: COL.heath, roughness: 0.9, flatShading: true });
  const flowerMat = new THREE.MeshStandardMaterial({ color: COL.heathFlor, roughness: 0.85, flatShading: true });
  const flowerLightMat = new THREE.MeshStandardMaterial({ color: 0xb56c9a, roughness: 0.85, flatShading: true });

  // 18 fein verzweigte Triebe in einem dichten Horst
  const branchCount = 18;
  const branches = [];

  for (let i = 0; i < branchCount; i++) {
    const angle = (i / branchCount) * Math.PI * 2 + Math.random() * 0.4;
    const dist = (0.05 + Math.random() * 0.12) * s;
    const h = (0.35 + Math.random() * 0.35) * s;

    const branchGroup = new THREE.Group();

    // Zweig-Stamm (detaillierter Zylinder)
    const bGeo = new THREE.CylinderGeometry(0.012 * s, 0.025 * s, h, 8);
    const branch = new THREE.Mesh(bGeo, greenMat);
    branch.position.y = h / 2;
    branchGroup.add(branch);

    // Haupttrieb nach außen neigen
    branchGroup.position.set(Math.sin(angle) * dist, 0, Math.cos(angle) * dist);

    const leanX = (Math.random() - 0.5) * 0.25 + Math.sin(angle) * 0.25;
    const leanZ = (Math.random() - 0.5) * 0.25 + Math.cos(angle) * 0.25;
    branchGroup.rotation.set(leanX, angle, leanZ);

    group.add(branchGroup);
    prepareForExplosion(branchGroup, new THREE.Vector3(Math.sin(angle), 0.3, Math.cos(angle)));

    branches.push({
      group: branchGroup,
      baseRot: [leanX, angle, leanZ]
    });

    // 8-12 winzige Blütenkelche traubenartig am oberen Teil des Triebes wachsen lassen
    const flowerCount = 8 + Math.floor(Math.random() * 5);
    const flGeo = new THREE.ConeGeometry(0.015 * s, 0.035 * s, 4);

    for (let f = 0; f < flowerCount; f++) {
      const isLight = Math.random() > 0.5;
      const mat = isLight ? flowerLightMat : flowerMat;
      const fl = new THREE.Mesh(flGeo, mat);

      // Entlang der oberen Triebhälfte verteilen
      const progress = 0.4 + (f / flowerCount) * 0.55;
      const flY = h * progress;
      const flAngle = f * 2.4; // Spiralförmig
      const flDist = 0.02 * s + Math.random() * 0.01 * s;

      fl.position.set(Math.sin(flAngle) * flDist, flY, Math.cos(flAngle) * flDist);
      fl.rotation.set(0.5 + Math.random() * 0.5, flAngle, (Math.random() - 0.5) * 0.5);

      branchGroup.add(fl);
    }
  }

  group.userData.update = function (time, windSpeed = 1.0) {
    const sway = Math.sin(time * 2.5) * 0.05 * windSpeed * s;
    const swayCos = Math.cos(time * 2.1) * 0.04 * windSpeed * s;

    branches.forEach((b, idx) => {
      b.group.rotation.x = b.baseRot[0] + sway * (idx % 2 === 0 ? 0.6 : -0.6);
      b.group.rotation.z = b.baseRot[2] + swayCos * (idx % 3 === 0 ? 0.4 : -0.4);
    });
  };

  return group;
}

// 8. Grasbüschel (Poaceae)
export function createGrassTuft(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Grasbüschel',
    latin: 'Poaceae',
    category: 'Flora (Gras)',
    description: 'Typisches Wald- und Lichtungsgras, das sandigen Waldboden stabilisiert.',
    polyCount: 0
  };

  const s = scale;
  const greenMat = new THREE.MeshStandardMaterial({ color: COL.tuft, roughness: 0.8, side: THREE.DoubleSide, flatShading: true });
  const dryMat = new THREE.MeshStandardMaterial({ color: COL.tuftDry, roughness: 0.9, side: THREE.DoubleSide, flatShading: true });
  const darkGreenMat = new THREE.MeshStandardMaterial({ color: 0x1f5c35, roughness: 0.8, side: THREE.DoubleSide, flatShading: true });

  // 80 Halme für üppigen Bewuchs (vorher 14)
  const bladeCount = 80;
  const blades = [];

  for (let i = 0; i < bladeCount; i++) {
    const angle = (i / bladeCount) * Math.PI * 2 + Math.random() * 0.3;
    const h = (0.35 + Math.random() * 0.55) * s;
    const w = (0.015 + Math.random() * 0.02) * s;

    // Zufällige Farbwahl (frisch, trocken, dunkel)
    const randCol = Math.random();
    const mat = randCol < 0.6 ? greenMat : (randCol < 0.85 ? darkGreenMat : dryMat);

    const bladeGroup = new THREE.Group();
    const dist = Math.random() * 0.08 * s;
    bladeGroup.position.set(Math.sin(angle) * dist, 0, Math.cos(angle) * dist);

    // Jeder Halm wird aus 3 leicht geneigten Segmenten gebaut, um eine weiche Biegung darzustellen
    const segCount = 3;
    const segH = h / segCount;
    let currentY = 0;
    const segments = [];

    // Basisneigung nach außen
    const baseLean = 0.15 + Math.random() * 0.3;

    for (let j = 0; j < segCount; j++) {
      // Breitenverjüngung
      const wBase = w * (1.0 - j / segCount);
      const wTop = w * (1.0 - (j + 1) / segCount);

      const segGeo = new THREE.ConeGeometry(wBase, segH, 3);
      const seg = new THREE.Mesh(segGeo, mat);

      seg.position.y = segH / 2;

      // Jedes Segment neigt sich etwas stärker in die gleiche Richtung
      const segGroup = new THREE.Group();
      segGroup.position.y = currentY;

      const dirX = Math.sin(angle) * (baseLean + j * 0.12);
      const dirZ = Math.cos(angle) * (baseLean + j * 0.12);
      segGroup.rotation.set(dirX, angle, dirZ);

      segGroup.add(seg);
      bladeGroup.add(segGroup);

      segments.push(segGroup);
      currentY = segH;
    }

    group.add(bladeGroup);

    // Für die Explosion
    bladeGroup.traverse(child => {
      if (child.isMesh) {
        prepareForExplosion(child, new THREE.Vector3(Math.sin(angle), 0.25, Math.cos(angle)));
      }
    });

    blades.push({
      group: bladeGroup,
      segments: segments,
      angle: angle,
      baseLean: baseLean
    });
  }

  group.userData.update = function (time, windSpeed = 1.0) {
    const sway = Math.sin(time * 2.8) * 0.08 * windSpeed * s;
    const swayCos = Math.cos(time * 2.4) * 0.05 * windSpeed * s;

    blades.forEach((b, idx) => {
      // Wind biegt die Segmente des Halmes dynamisch durch
      b.segments.forEach((seg, sIdx) => {
        const leanX = Math.sin(b.angle) * (b.baseLean + sIdx * 0.15) + sway * (sIdx + 1) * 0.2;
        const leanZ = Math.cos(b.angle) * (b.baseLean + sIdx * 0.15) + swayCos * (sIdx + 1) * 0.2;
        seg.rotation.set(leanX, b.angle, leanZ);
      });
    });
  };

  return group;
}

// 9. Moosiger Felsbrocken
// 9. Moosiger Felsbrocken (Classic Single Findling)
export function createBoulder(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Moosiger Felsbrocken',
    latin: 'Glazial-Geschiebe',
    category: 'Boden (Geologie)',
    description: 'Ein einzelner, großer eiszeitlicher Findling aus skandinavischem Granit. Auf seiner kühlen, rauen Oberfläche siedeln sich dichte Teppiche aus Waldmoos an.',
    polyCount: 0
  };

  const s = scale;
  const rockMat = new THREE.MeshStandardMaterial({ color: COL.boulder, roughness: 0.95, flatShading: true });
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x1f4c22, roughness: 1.0, flatShading: true });
  const pebbleMat = new THREE.MeshStandardMaterial({ color: 0x5a635c, roughness: 0.9, flatShading: true });

  // Hauptfels
  const rockGeo = new THREE.IcosahedronGeometry(0.5 * s, 2);
  const pos = rockGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const noise = Math.sin(x * 5) * Math.cos(y * 5) * 0.05 * s + (Math.sin(z * 10) > 0 ? 0.02 : -0.02) * s;
    pos.setX(i, x * (0.95 + noise));
    pos.setY(i, y * (0.85 + noise));
    pos.setZ(i, z * (0.95 + noise));
  }
  rockGeo.computeVertexNormals();

  const rock = new THREE.Mesh(rockGeo, rockMat);
  rock.position.y = 0.22 * s;
  rock.scale.set(1.4, 0.8, 1.1);
  group.add(rock);
  prepareForExplosion(rock, new THREE.Vector3(0, -0.05, 0));

  // Nebenfels
  const subRockGeo = new THREE.DodecahedronGeometry(0.24 * s, 0);
  const subRock = new THREE.Mesh(subRockGeo, rockMat);
  subRock.position.set(0.4 * s, 0.12 * s, -0.2 * s);
  subRock.rotation.set(0.5, 0.2, -0.4);
  subRock.scale.set(1.2, 0.7, 0.9);
  group.add(subRock);
  prepareForExplosion(subRock, new THREE.Vector3(0.3, -0.02, -0.1));

  // 12 Moospolster oben drauf platziert
  const mossCount = 12;
  const mossGeo = new THREE.IcosahedronGeometry(0.12 * s, 1);
  const sproutGeo = new THREE.ConeGeometry(0.006 * s, 0.025 * s, 3);

  for (let i = 0; i < mossCount; i++) {
    const r = (0.10 + Math.random() * 0.08) * s;
    const moss = new THREE.Mesh(mossGeo, mossMat);
    moss.scale.set(1.5, 0.45, 1.5);

    const angle = (i / mossCount) * Math.PI * 2 + Math.random() * 0.5;
    const dist = (0.1 + Math.random() * 0.2) * s;

    const mx = Math.sin(angle) * dist;
    const mz = Math.cos(angle) * dist;
    const my = 0.26 * s + Math.cos(dist * 2.0) * 0.08 * s;

    moss.position.set(mx, my, mz);
    moss.rotation.set((Math.random() - 0.5) * 0.2, angle, (Math.random() - 0.5) * 0.2);
    group.add(moss);
    prepareForExplosion(moss, new THREE.Vector3(Math.sin(angle) * 1.5, 0.25, Math.cos(angle) * 1.5));

    const sproutCount = 5 + Math.floor(Math.random() * 3);
    for (let sp = 0; sp < sproutCount; sp++) {
      const sprout = new THREE.Mesh(sproutGeo, mossMat);
      const spAngle = Math.random() * Math.PI * 2;
      const spDist = Math.random() * r * 0.6;
      sprout.position.set(
        mx + Math.sin(spAngle) * spDist,
        my + 0.02 * s + Math.random() * 0.02 * s,
        mz + Math.cos(spAngle) * spDist
      );
      sprout.rotation.set(0.1, spAngle, 0.1);
      group.add(sprout);
      prepareForExplosion(sprout, new THREE.Vector3(Math.sin(angle) * 1.8, 0.3, Math.cos(angle) * 1.8));
    }
  }

  // Kleine Kieselsteine
  const pebbleGeo = new THREE.DodecahedronGeometry(0.04 * s, 0);
  for (let p = 0; p < 8; p++) {
    const pebble = new THREE.Mesh(pebbleGeo, pebbleMat);
    const angle = (p / 8) * Math.PI * 2 + Math.random() * 0.5;
    const dist = (0.55 + Math.random() * 0.15) * s;
    pebble.position.set(Math.sin(angle) * dist, 0.02 * s, Math.cos(angle) * dist);
    pebble.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    pebble.scale.set(1.0 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 1.0);
    group.add(pebble);
    prepareForExplosion(pebble, new THREE.Vector3(Math.sin(angle) * 1.2, 0, Math.cos(angle) * 1.2));
  }

  group.userData.update = function (time, windSpeed = 1.0) { };

  return group;
}

// 9b. Moosige Findlingsgruppe (Boulder Cluster)
export function createBoulderCluster(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Findlingsgruppe',
    latin: 'Glazial-Geschiebe-Gruppe',
    category: 'Boden (Geologie)',
    description: 'Eine eiszeitliche Gruppe aus skandinavischen Granit-Findlingen. Auf den kühlen, rauen Oberflächen der Felsen siedeln sich Moospolster an. Der Boden ist mit kleineren Kieselsteinen übersät.',
    polyCount: 0
  };

  const s = scale;
  const rockMat = new THREE.MeshStandardMaterial({ color: COL.boulder, roughness: 0.95, flatShading: true });
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x1f4c22, roughness: 1.0, flatShading: true });
  const pebbleMat = new THREE.MeshStandardMaterial({ color: 0x5a635c, roughness: 0.9, flatShading: true });

  const boulders = [
    { geo: new THREE.IcosahedronGeometry(0.45 * s, 2), pos: [0, 0.20 * s, 0], scale: [1.3, 0.75, 1.05], rot: [0, 0.2, 0.1] },
    { geo: new THREE.IcosahedronGeometry(0.32 * s, 2), pos: [0.42 * s, 0.14 * s, -0.32 * s], scale: [1.1, 0.8, 1.2], rot: [0.4, 0.8, -0.3] },
    { geo: new THREE.IcosahedronGeometry(0.24 * s, 1), pos: [-0.44 * s, 0.10 * s, 0.28 * s], scale: [1.2, 0.7, 0.9], rot: [-0.2, -0.6, 0.4] }
  ];

  boulders.forEach((b) => {
    const pos = b.geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const noise = Math.sin(x * 5) * Math.cos(y * 5) * 0.05 * s + (Math.sin(z * 10) > 0 ? 0.02 : -0.02) * s;
      pos.setX(i, x * (0.95 + noise));
      pos.setY(i, y * (0.85 + noise));
      pos.setZ(i, z * (0.95 + noise));
    }
    b.geo.computeVertexNormals();

    const mesh = new THREE.Mesh(b.geo, rockMat);
    mesh.position.set(...b.pos);
    mesh.rotation.set(...b.rot);
    mesh.scale.set(...b.scale);
    group.add(mesh);
    prepareForExplosion(mesh, new THREE.Vector3(b.pos[0] * 1.5, -0.02, b.pos[2] * 1.5));
  });

  const mossCount = 22;
  const mossGeo = new THREE.IcosahedronGeometry(0.09 * s, 1);
  const sproutGeo = new THREE.ConeGeometry(0.005 * s, 0.022 * s, 3);

  for (let i = 0; i < mossCount; i++) {
    const bTarget = i % 3 === 0 ? boulders[0] : (i % 3 === 1 ? boulders[1] : boulders[2]);
    const r = (0.08 + Math.random() * 0.07) * s;
    const moss = new THREE.Mesh(mossGeo, mossMat);
    moss.scale.set(1.4, 0.42, 1.4);

    const angle = Math.random() * Math.PI * 2;
    const dist = (0.08 + Math.random() * 0.16) * bTarget.pos[1];

    const mx = bTarget.pos[0] + Math.sin(angle) * dist;
    const mz = bTarget.pos[2] + Math.cos(angle) * dist;
    const my = bTarget.pos[1] + (bTarget.geo.parameters.radius * bTarget.scale[1]) * 0.6 + Math.random() * 0.05 * s;

    moss.position.set(mx, my, mz);
    moss.rotation.set((Math.random() - 0.5) * 0.2, angle, (Math.random() - 0.5) * 0.2);
    group.add(moss);
    prepareForExplosion(moss, new THREE.Vector3((mx - bTarget.pos[0]) * 1.8 + bTarget.pos[0], 0.2, (mz - bTarget.pos[2]) * 1.8 + bTarget.pos[2]));

    const sproutCount = 5 + Math.floor(Math.random() * 3);
    for (let sp = 0; sp < sproutCount; sp++) {
      const sprout = new THREE.Mesh(sproutGeo, mossMat);
      const spAngle = Math.random() * Math.PI * 2;
      const spDist = Math.random() * r * 0.5;
      sprout.position.set(
        mx + Math.sin(spAngle) * spDist,
        my + 0.015 * s + Math.random() * 0.015 * s,
        mz + Math.cos(spAngle) * spDist
      );
      sprout.rotation.set(0.1, spAngle, 0.1);
      group.add(sprout);
      prepareForExplosion(sprout, new THREE.Vector3((mx - bTarget.pos[0]) * 2.0 + bTarget.pos[0], 0.25, (mz - bTarget.pos[2]) * 2.0 + bTarget.pos[2]));
    }
  }

  const pebbleGeo = new THREE.DodecahedronGeometry(0.035 * s, 0);
  const pebbleCount = 18;
  for (let p = 0; p < pebbleCount; p++) {
    const pebble = new THREE.Mesh(pebbleGeo, pebbleMat);
    const angle = (p / pebbleCount) * Math.PI * 2 + Math.random() * 0.4;
    const dist = (0.5 + Math.random() * 0.35) * s;
    pebble.position.set(Math.sin(angle) * dist, 0.015 * s, Math.cos(angle) * dist);
    pebble.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    pebble.scale.set(1.0 + Math.random() * 0.6, 0.4 + Math.random() * 0.4, 1.0);
    group.add(pebble);
    prepareForExplosion(pebble, new THREE.Vector3(Math.sin(angle) * 1.3, 0, Math.cos(angle) * 1.3));
  }

  group.userData.update = function (time, windSpeed = 1.0) { };

  return group;
}

// 9c. Kieselsteinhaufen (Stone Pebbles)
export function createStonePebbles(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Kieselsteine',
    latin: 'Lapilli Silvani',
    category: 'Boden (Geologie)',
    description: 'Eine natürliche Ansammlung kleinerer Waldsteine und Kiesel. Ideal zum Ausstreuen auf dem Waldboden und zum Auffüllen von Lücken.',
    polyCount: 0
  };

  const s = scale;
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x5a635c, roughness: 0.9, flatShading: true });
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x1f4c22, roughness: 1.0, flatShading: true });

  // 6 mittlere Waldsteine als Haufen arranged
  const mediumCount = 7;
  const stoneGeos = [
    new THREE.DodecahedronGeometry(0.12 * s, 0),
    new THREE.IcosahedronGeometry(0.10 * s, 1),
    new THREE.DodecahedronGeometry(0.08 * s, 0)
  ];

  for (let i = 0; i < mediumCount; i++) {
    const geo = stoneGeos[i % stoneGeos.length].clone();
    // leicht deformieren
    const pos = geo.attributes.position;
    for (let j = 0; j < pos.count; j++) {
      const rx = pos.getX(j);
      const ry = pos.getY(j);
      const rz = pos.getZ(j);
      pos.setY(j, ry * 0.7); // flach drücken
    }
    geo.computeVertexNormals();

    const stone = new THREE.Mesh(geo, rockMat);

    // Auf dem Boden anhäufeln
    const angle = (i / mediumCount) * Math.PI * 2 + Math.random() * 0.5;
    const dist = (0.05 + Math.random() * 0.15) * s;
    const sx = Math.sin(angle) * dist;
    const sz = Math.cos(angle) * dist;
    const sy = 0.05 * s + (0.15 - dist) * 0.2;

    stone.position.set(sx, sy, sz);
    stone.rotation.set(Math.random() * 0.5, angle, Math.random() * 0.5);
    stone.scale.set(1.0 + Math.random() * 0.4, 1.0, 1.0 + Math.random() * 0.4);
    group.add(stone);
    prepareForExplosion(stone, new THREE.Vector3(Math.sin(angle) * 1.5, 0.1, Math.cos(angle) * 1.5));

    // Einige Steine bekommen kleine Moosflecken
    if (Math.random() < 0.6) {
      const patchGeo = new THREE.IcosahedronGeometry(0.04 * s, 0);
      const patch = new THREE.Mesh(patchGeo, mossMat);
      patch.scale.set(1.3, 0.3, 1.3);
      patch.position.set(
        stone.position.x + (Math.random() - 0.5) * 0.04 * s,
        stone.position.y + 0.04 * s,
        stone.position.z + (Math.random() - 0.5) * 0.04 * s
      );
      patch.rotation.copy(stone.rotation);
      group.add(patch);
      prepareForExplosion(patch, new THREE.Vector3(Math.sin(angle) * 1.7, 0.15, Math.cos(angle) * 1.7));
    }
  }

  // 16 kleine Kieselsteine weit verstreut
  const pebbleGeo = new THREE.DodecahedronGeometry(0.03 * s, 0);
  const pebbleCount = 16;
  for (let p = 0; p < pebbleCount; p++) {
    const pebble = new THREE.Mesh(pebbleGeo, rockMat);
    const angle = (p / pebbleCount) * Math.PI * 2 + Math.random() * 0.4;
    const dist = (0.22 + Math.random() * 0.28) * s;
    pebble.position.set(Math.sin(angle) * dist, 0.012 * s, Math.cos(angle) * dist);
    pebble.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    pebble.scale.set(1.0 + Math.random() * 0.5, 0.4 + Math.random() * 0.4, 1.0 + Math.random() * 0.5);
    group.add(pebble);
    prepareForExplosion(pebble, new THREE.Vector3(Math.sin(angle) * 1.3, 0, Math.cos(angle) * 1.3));
  }

  group.userData.update = function (time, windSpeed = 1.0) { };

  return group;
}

// 10. Totholz / Baumstumpf (Classic Single Stump)
export function createStump(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Baumstumpf',
    latin: 'Trunk Lignum',
    category: 'Boden (Totholz)',
    description: 'Überbleibsel einer alten Kiefer. Durch Holzfäule und Insektenbefall entsteht Totholz, eines der wichtigsten Mikrohabitate des Waldes für Pilze und Käferlarven.',
    polyCount: 0
  };

  const s = scale;
  const barkMat = new THREE.MeshStandardMaterial({ color: COL.deadWood, roughness: 1.0, flatShading: true });
  const innerWoodMat = new THREE.MeshStandardMaterial({ color: 0x9e7a56, roughness: 0.9, flatShading: true });
  const ringMat1 = new THREE.MeshStandardMaterial({ color: 0xb58e65, roughness: 0.9, flatShading: true });
  const ringMat2 = new THREE.MeshStandardMaterial({ color: 0x82603e, roughness: 0.95, flatShading: true });
  const fungusMat = new THREE.MeshStandardMaterial({ color: COL.bone, roughness: 0.8, flatShading: true });

  const stumpGroup = new THREE.Group();

  // 1. Holzkern
  const coreGeo = new THREE.CylinderGeometry(0.26 * s, 0.32 * s, 0.58 * s, 24, 6);
  const pos = coreGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y > 0.1 * s) {
      const angle = Math.atan2(pos.getZ(i), pos.getX(i));
      if (angle > 0.2 && angle < 0.6) {
        pos.setX(i, pos.getX(i) * 0.7);
        pos.setZ(i, pos.getZ(i) * 0.7);
      }
    }
  }
  coreGeo.computeVertexNormals();
  const core = new THREE.Mesh(coreGeo, innerWoodMat);
  core.position.y = 0.29 * s;
  stumpGroup.add(core);

  // 2. Abgeplatzte Rinde
  const barkCount = 5;
  for (let i = 0; i < barkCount; i++) {
    if (i === 1 || i === 3) continue; // Lücken lassen
    const startAngle = (i / barkCount) * Math.PI * 2;
    const lengthAngle = (1.0 / barkCount) * Math.PI * 2 * 1.05;

    const barkGeo = new THREE.CylinderGeometry(0.275 * s, 0.335 * s, 0.58 * s, 10, 4, false, startAngle, lengthAngle);
    const posB = barkGeo.attributes.position;
    for (let j = 0; j < posB.count; j++) {
      const y = posB.getY(j);
      const angle = Math.atan2(posB.getZ(j), posB.getX(j));
      const noise = Math.sin(y * 10) * 0.012 * s + Math.cos(angle * 16) * 0.008 * s;
      posB.setX(j, posB.getX(j) + Math.cos(angle) * noise);
      posB.setZ(j, posB.getZ(j) + Math.sin(angle) * noise);
    }
    barkGeo.computeVertexNormals();

    const barkMesh = new THREE.Mesh(barkGeo, barkMat);
    barkMesh.position.y = 0.29 * s;
    stumpGroup.add(barkMesh);
  }

  // 3. Jahresringe
  const ringGeo1 = new THREE.CylinderGeometry(0.245 * s, 0.245 * s, 0.01 * s, 24);
  const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
  ring1.position.y = 0.585 * s;
  stumpGroup.add(ring1);

  const ringGeo2 = new THREE.CylinderGeometry(0.16 * s, 0.16 * s, 0.012 * s, 24);
  const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
  ring2.position.y = 0.586 * s;
  stumpGroup.add(ring2);

  const ringGeo3 = new THREE.CylinderGeometry(0.08 * s, 0.08 * s, 0.014 * s, 16);
  const ring3 = new THREE.Mesh(ringGeo3, ringMat1);
  ring3.position.y = 0.587 * s;
  stumpGroup.add(ring3);

  // 4. Astrest
  const twigGeo = new THREE.CylinderGeometry(0.025 * s, 0.038 * s, 0.3 * s, 10);
  const twig = new THREE.Mesh(twigGeo, barkMat);
  twig.position.set(-0.24 * s, 0.3 * s, 0.15 * s);
  twig.rotation.set(0.3, 0.2, 1.25);
  stumpGroup.add(twig);

  group.add(stumpGroup);
  prepareForExplosion(stumpGroup, new THREE.Vector3(0, -0.05, 0));

  // 5. Baumpilze (Trameten)
  const fungusGeo = new THREE.IcosahedronGeometry(0.08 * s, 1);
  const fungConfigs = [
    { x: 0.24 * s, y: 0.18 * s, z: 0.18 * s, rx: 0.2, ry: 0.7, rz: 0.3, sx: 1.4, sy: 0.15, sz: 1.0 },
    { x: 0.26 * s, y: 0.26 * s, z: 0.14 * s, rx: 0.1, ry: 0.5, rz: 0.2, sx: 1.1, sy: 0.12, sz: 0.8 },
    { x: 0.22 * s, y: 0.34 * s, z: 0.20 * s, rx: 0.3, ry: 0.8, rz: 0.4, sx: 0.9, sy: 0.10, sz: 0.7 },
    { x: -0.22 * s, y: 0.22 * s, z: -0.20 * s, rx: 0.2, ry: -2.3, rz: 0.2, sx: 1.2, sy: 0.15, sz: 0.9 },
    { x: -0.24 * s, y: 0.30 * s, z: -0.16 * s, rx: 0.1, ry: -2.5, rz: 0.1, sx: 1.0, sy: 0.12, sz: 0.8 }
  ];

  fungConfigs.forEach((cfg) => {
    const f = new THREE.Mesh(fungusGeo, fungusMat);
    f.position.set(cfg.x, cfg.y, cfg.z);
    f.rotation.set(cfg.rx, cfg.ry, cfg.rz);
    f.scale.set(cfg.sx, cfg.sy, cfg.sz);
    group.add(f);
    prepareForExplosion(f, new THREE.Vector3(cfg.x * 2.0, 0, cfg.z * 2.0));
  });

  group.userData.update = function (time, windSpeed = 1.0) { };

  return group;
}

// 10b. Verrotteter Baumstumpf (Decaying Stump)
export function createStumpDecayed(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Morscher Baumstumpf',
    latin: 'Trunk Lignum Putridum',
    category: 'Boden (Totholz)',
    description: 'Ein stark verfallener und weichfauler Kiefernstumpf. Das Innere ist zersetzt und bildet eine Höhlung, während die Seiten stark bemoost sind und kleine Waldpilze tragen.',
    polyCount: 0
  };

  const s = scale;
  const barkMat = new THREE.MeshStandardMaterial({ color: 0x423325, roughness: 1.0, flatShading: true });
  const innerWoodMat = new THREE.MeshStandardMaterial({ color: 0x8a6340, roughness: 0.95, flatShading: true });
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x224c25, roughness: 1.0, flatShading: true });
  const capMat = new THREE.MeshStandardMaterial({ color: COL.mushCapRed, roughness: 0.7, flatShading: true });
  const stemMat = new THREE.MeshStandardMaterial({ color: COL.mushStem, roughness: 0.9, flatShading: true });

  const stumpGroup = new THREE.Group();

  const coreGeo = new THREE.CylinderGeometry(0.18 * s, 0.25 * s, 0.40 * s, 16, 4);
  const pos = coreGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    if (y > 0.18 * s) {
      const dist = Math.sqrt(x * x + z * z);
      if (dist < 0.14 * s) {
        pos.setY(i, y - 0.15 * s);
      } else {
        pos.setY(i, y + (Math.random() - 0.5) * 0.05 * s);
      }
    }
  }
  coreGeo.computeVertexNormals();

  const core = new THREE.Mesh(coreGeo, innerWoodMat);
  core.position.y = 0.2 * s;
  stumpGroup.add(core);

  const barkGeo = new THREE.CylinderGeometry(0.19 * s, 0.26 * s, 0.40 * s, 12, 3, false, 0, Math.PI * 1.5);
  const posB = barkGeo.attributes.position;
  for (let i = 0; i < posB.count; i++) {
    const y = posB.getY(i);
    const angle = Math.atan2(posB.getZ(i), posB.getX(i));
    const noise = Math.sin(y * 12) * 0.015 * s;
    posB.setX(i, posB.getX(i) + Math.cos(angle) * noise);
    posB.setZ(i, posB.getZ(i) + Math.sin(angle) * noise);
    if (y > 0.18 * s) {
      posB.setY(i, y + (Math.random() - 0.5) * 0.06 * s);
    }
  }
  barkGeo.computeVertexNormals();

  const bark = new THREE.Mesh(barkGeo, barkMat);
  bark.position.y = 0.2 * s;
  stumpGroup.add(bark);

  group.add(stumpGroup);
  prepareForExplosion(stumpGroup, new THREE.Vector3(0, -0.02, 0));

  const mossGeo = new THREE.IcosahedronGeometry(0.06 * s, 0);
  const mossConfigs = [
    { x: 0.12 * s, y: 0.22 * s, z: 0.10 * s, sx: 1.2, sy: 0.4, sz: 1.0 },
    { x: -0.10 * s, y: 0.24 * s, z: 0.12 * s, sx: 1.0, sy: 0.4, sz: 1.2 },
    { x: -0.14 * s, y: 0.18 * s, z: -0.12 * s, sx: 1.1, sy: 0.5, sz: 1.0 },
    { x: 0.20 * s, y: 0.05 * s, z: -0.15 * s, sx: 1.5, sy: 0.4, sz: 1.3 }
  ];

  mossConfigs.forEach((cfg) => {
    const moss = new THREE.Mesh(mossGeo, mossMat);
    moss.position.set(cfg.x, cfg.y, cfg.z);
    moss.scale.set(cfg.sx, cfg.sy, cfg.sz);
    group.add(moss);
    prepareForExplosion(moss, new THREE.Vector3(cfg.x * 1.8, 0.1, cfg.z * 1.8));
  });

  const mushCount = 3;
  for (let m = 0; m < mushCount; m++) {
    const mGroup = new THREE.Group();

    const stemGeo = new THREE.CylinderGeometry(0.006 * s, 0.009 * s, 0.06 * s, 5);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.03 * s;
    mGroup.add(stem);

    const capGeo = new THREE.SphereGeometry(0.016 * s, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.055 * s;
    mGroup.add(cap);

    const angle = (m / mushCount) * Math.PI * 2 + 0.3;
    const mx = Math.sin(angle) * 0.14 * s;
    const mz = Math.cos(angle) * 0.14 * s;
    const my = 0.18 * s + (Math.random() - 0.5) * 0.05 * s;

    mGroup.position.set(mx, my, mz);
    mGroup.rotation.set((Math.random() - 0.5) * 0.2, angle, (Math.random() - 0.5) * 0.2);
    group.add(mGroup);
    prepareForExplosion(mGroup, new THREE.Vector3(mx * 2.0, 0.1, mz * 2.0));
  }

  group.userData.update = function (time, windSpeed = 1.0) { };

  return group;
}

// 10c. Liegendes Totholz (Fallen Log)
export function createStumpFallen(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Liegender Totholzstamm',
    latin: 'Lignum Jacens',
    category: 'Boden (Totholz)',
    description: 'Ein umgestürzter, verwitterter Kiefernstamm. Er liegt flach auf dem Boden, hat teilweise abgeplatzte Rinde und dient als idealer Wuchsort für Moos und holzzersetzende Pilze.',
    polyCount: 0
  };

  const s = scale;
  const barkMat = new THREE.MeshStandardMaterial({ color: COL.deadWood, roughness: 1.0, flatShading: true });
  const innerWoodMat = new THREE.MeshStandardMaterial({ color: 0x9a7553, roughness: 0.9, flatShading: true });
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x1f4c22, roughness: 1.0, flatShading: true });
  const fungusMat = new THREE.MeshStandardMaterial({ color: COL.bone, roughness: 0.85, flatShading: true });

  const logGroup = new THREE.Group();
  logGroup.position.set(0, 0.08 * s, 0);
  logGroup.rotation.set(Math.PI / 2, 0.05, 0.3);

  const logGeo = new THREE.CylinderGeometry(0.10 * s, 0.12 * s, 0.80 * s, 12, 3);
  const pos = logGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (Math.abs(y) > 0.35 * s) {
      pos.setY(i, y + (Math.random() - 0.5) * 0.06 * s);
    }
  }
  logGeo.computeVertexNormals();

  const logMesh = new THREE.Mesh(logGeo, innerWoodMat);
  logGroup.add(logMesh);

  const barkGeo = new THREE.CylinderGeometry(0.11 * s, 0.13 * s, 0.70 * s, 8, 2, false, 0, Math.PI * 1.4);
  const bark = new THREE.Mesh(barkGeo, barkMat);
  logGroup.add(bark);

  group.add(logGroup);
  prepareForExplosion(logGroup, new THREE.Vector3(0, 0.05, 0));

  const mossGeo = new THREE.IcosahedronGeometry(0.07 * s, 1);
  const mossCount = 4;
  for (let i = 0; i < mossCount; i++) {
    const moss = new THREE.Mesh(mossGeo, mossMat);
    moss.scale.set(1.4, 0.4, 1.4);

    const progress = -0.3 * s + (i / (mossCount - 1)) * 0.6 * s;
    const posOnLog = new THREE.Vector3(0, progress, 0.10 * s);
    posOnLog.applyQuaternion(logGroup.quaternion).add(logGroup.position);

    moss.position.copy(posOnLog);
    moss.rotation.set((Math.random() - 0.5) * 0.2, Math.random() * Math.PI, 0.1);
    group.add(moss);
    prepareForExplosion(moss, new THREE.Vector3(posOnLog.x, 0.2, posOnLog.z));
  }

  const fungusGeo = new THREE.IcosahedronGeometry(0.05 * s, 1);
  const fungCount = 4;
  for (let i = 0; i < fungCount; i++) {
    const f = new THREE.Mesh(fungusGeo, fungusMat);
    f.scale.set(1.4, 0.15, 1.0);

    const progress = -0.25 * s + i * 0.16 * s;
    const isLeft = i % 2 === 0;
    const posOnLog = new THREE.Vector3(isLeft ? -0.11 * s : 0.11 * s, progress, 0.02 * s);
    posOnLog.applyQuaternion(logGroup.quaternion).add(logGroup.position);

    f.position.copy(posOnLog);
    f.rotation.set(0.1, isLeft ? 2.5 : -0.7, 0);
    group.add(f);
    prepareForExplosion(f, new THREE.Vector3(posOnLog.x * 2.0, 0.05, posOnLog.z * 2.0));
  }

  group.userData.update = function (time, windSpeed = 1.0) { };

  return group;
}

// ============================================================
//  TIERMODELLE (FAUNA)
// ============================================================

// 11. Reh (Capreolus capreolus)
export function createDeer(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Reh',
    latin: 'Capreolus capreolus',
    category: 'Fauna (Säugetier)',
    description: 'Der häufigste Paarhufer unserer Wälder. Hervorragend an das Leben in Waldrandnischen angepasst (Schlüpfertyp). Rehe besitzen extrem feine Sinne (Sehen und Riechen).',
    polyCount: 0
  };

  const s = scale;
  const furMat = new THREE.MeshStandardMaterial({ color: 0x5a412a, roughness: 0.95, flatShading: true });
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0x9c856b, roughness: 0.95, flatShading: true });
  const whiteMat = new THREE.MeshStandardMaterial({ color: COL.bone, roughness: 1.0, flatShading: true });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x181513, roughness: 0.8, flatShading: true });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.1, metalness: 0.9, flatShading: false });
  const hornMat = new THREE.MeshStandardMaterial({ color: 0x47392e, roughness: 1.0, flatShading: true });

  const aBodyGeo = new THREE.IcosahedronGeometry(0.5, 2); // Mehr Polygone
  const aHeadGeo = new THREE.IcosahedronGeometry(0.14, 1);

  // 1. Rumpf (Geschichteter Körper mit Schulter & Gesäß, schlanker)
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, 1.25 * s, 0);

  const body = new THREE.Mesh(aBodyGeo, furMat);
  body.scale.set(0.95 * s, 0.44 * s, 0.36 * s);
  bodyGroup.add(body);

  // Heller Bauch (Bauchseite leicht abgesetzt)
  const belly = new THREE.Mesh(aBodyGeo, bellyMat);
  belly.scale.set(0.7 * s, 0.3 * s, 0.38 * s);
  belly.position.y = -0.12 * s;
  bodyGroup.add(belly);

  // Schulterwölbung
  const shoulder = new THREE.Mesh(aHeadGeo, furMat);
  shoulder.scale.set(1.4 * s, 1.4 * s, 1.4 * s);
  shoulder.position.set(0.32 * s, 0.08 * s, 0);
  bodyGroup.add(shoulder);

  // Gesäß/Hüfte
  const hip = new THREE.Mesh(aHeadGeo, furMat);
  hip.scale.set(1.6 * s, 1.6 * s, 1.6 * s);
  hip.position.set(-0.35 * s, 0.06 * s, 0);
  bodyGroup.add(hip);

  group.add(bodyGroup);
  prepareForExplosion(bodyGroup, new THREE.Vector3(0, 0.1, 0));

  // Rumpfspiegel (Weißer Fleck am Gesäß)
  const rumpWhite = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), whiteMat);
  rumpWhite.scale.set(0.25 * s, 0.52 * s, 0.62 * s);
  rumpWhite.position.set(-0.55 * s, 1.29 * s, 0);
  rumpWhite.rotation.y = Math.PI / 2;
  group.add(rumpWhite);
  prepareForExplosion(rumpWhite, new THREE.Vector3(-0.35, 0.1, 0));

  // Schwänzchen
  const tail = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 1), furMat);
  tail.position.set(-0.58 * s, 1.39 * s, 0);
  tail.rotation.z = -0.4;
  group.add(tail);
  prepareForExplosion(tail, new THREE.Vector3(-0.35, 0.2, 0));

  // 2. Beine mit Knien, Fesseln & Hufen (25% länger & graziler)
  const legCoords = [
    { name: 'FL', x: 0.33 * s, z: 0.14 * s, isFront: true },
    { name: 'FR', x: 0.33 * s, z: -0.14 * s, isFront: true },
    { name: 'BL', x: -0.35 * s, z: 0.14 * s, isFront: false },
    { name: 'BR', x: -0.35 * s, z: -0.14 * s, isFront: false }
  ];

  const legs = [];
  legCoords.forEach((coord) => {
    const legGroup = new THREE.Group();
    legGroup.position.set(coord.x, 1.2 * s, coord.z);

    // Oberschenkel
    const upperGeo = new THREE.CylinderGeometry(0.04 * s, 0.03 * s, 0.58 * s, 8);
    const upper = new THREE.Mesh(upperGeo, furMat);
    upper.position.y = -0.29 * s;
    upper.rotation.z = coord.isFront ? -0.1 : 0.15;
    legGroup.add(upper);

    // Kniegelenk-Kugel
    const jointGeo = new THREE.IcosahedronGeometry(0.03 * s, 0);
    const joint = new THREE.Mesh(jointGeo, furMat);
    joint.position.set(coord.isFront ? -0.02 * s : 0.03 * s, -0.58 * s, 0);
    legGroup.add(joint);

    // Unterschenkel (Unterbein)
    const lowerGeo = new THREE.CylinderGeometry(0.018 * s, 0.012 * s, 0.62 * s, 8);
    const lower = new THREE.Mesh(lowerGeo, furMat);
    lower.position.set(coord.isFront ? -0.02 * s : 0.02 * s, -0.88 * s, 0);
    lower.rotation.z = coord.isFront ? 0.08 : -0.1;
    legGroup.add(lower);

    // Gespaltene Hufe (Zwei kleine Zylinder, schwarz)
    const hoofGroup = new THREE.Group();
    hoofGroup.position.set(coord.isFront ? -0.02 * s : 0.01 * s, -1.2 * s, 0);

    const hoofGeo = new THREE.CylinderGeometry(0.012 * s, 0.015 * s, 0.05 * s, 5);
    const h1 = new THREE.Mesh(hoofGeo, darkMat);
    h1.position.z = 0.01 * s;
    const h2 = new THREE.Mesh(hoofGeo, darkMat);
    h2.position.z = -0.01 * s;
    hoofGroup.add(h1, h2);
    legGroup.add(hoofGroup);

    group.add(legGroup);
    prepareForExplosion(legGroup, new THREE.Vector3(coord.x * 1.5, -0.4, coord.z * 1.5));
    legs.push({
      group: legGroup,
      baseX: coord.x,
      isFront: coord.isFront
    });
  });

  // 3. Hals & Kopf-Gruppe (mit Geweih, grazilerer Hals)
  const neckPivot = new THREE.Group();
  // Pivot liegt an der Brust, um das Absenken zum Grasen darzustellen
  neckPivot.position.set(0.34 * s, 1.25 * s, 0);

  // Hals (Dünner und länger)
  const neckGeo = new THREE.CylinderGeometry(0.032 * s, 0.055 * s, 0.82 * s, 10, 3);
  const neckPos = neckGeo.attributes.position;
  for (let i = 0; i < neckPos.count; i++) {
    const y = neckPos.getY(i);
    // Sanfte Krümmung einbauen
    neckPos.setX(i, neckPos.getX(i) + Math.sin(y * 3) * 0.015 * s);
  }
  neckGeo.computeVertexNormals();

  const neck = new THREE.Mesh(neckGeo, furMat);
  neck.rotation.z = -0.45;
  neck.position.set(0.18 * s, 0.36 * s, 0);
  neckPivot.add(neck);

  // Kopf
  const headGroup = new THREE.Group();
  headGroup.position.set(0.36 * s, 0.72 * s, 0);

  const head = new THREE.Mesh(aHeadGeo, furMat);
  head.scale.set(1.2, 1.0, 0.85);
  headGroup.add(head);

  // Schnauze
  const snoutGeo = new THREE.CylinderGeometry(0.035 * s, 0.055 * s, 0.22 * s, 8);
  const snout = new THREE.Mesh(snoutGeo, furMat);
  snout.rotation.z = -1.5;
  snout.position.set(0.16 * s, -0.04 * s, 0);
  headGroup.add(snout);

  // Heller Unterkiefer
  const jawGeo = new THREE.CylinderGeometry(0.025 * s, 0.04 * s, 0.18 * s, 8);
  const jaw = new THREE.Mesh(jawGeo, bellyMat);
  jaw.rotation.z = -1.55;
  jaw.position.set(0.14 * s, -0.07 * s, 0);
  headGroup.add(jaw);

  // Nasenspitze
  const nose = new THREE.Mesh(new THREE.IcosahedronGeometry(0.028 * s, 0), darkMat);
  nose.position.set(0.28 * s, -0.04 * s, 0);
  headGroup.add(nose);

  // Glänzende 3D-Augen (Große Rehaugen)
  const eyeGeo = new THREE.SphereGeometry(0.018 * s, 8, 8);
  [0.05 * s, -0.05 * s].forEach((ez) => {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0.08 * s, 0.03 * s, ez);
    headGroup.add(eye);
  });

  // Aufmerksame Ohren mit weißer Innenseite
  const earGeo = new THREE.ConeGeometry(0.045 * s, 0.22 * s, 6);
  const ears = [];
  [0.07 * s, -0.07 * s].forEach((ez) => {
    const earGroup = new THREE.Group();
    earGroup.position.set(-0.04 * s, 0.1 * s, ez);

    const ear = new THREE.Mesh(earGeo, furMat);
    ear.rotation.set(ez > 0 ? 0.3 : -0.3, 0, -0.3);
    earGroup.add(ear);

    // Ohrinnenfläche
    const innerEarGeo = new THREE.ConeGeometry(0.032 * s, 0.18 * s, 4);
    const innerEar = new THREE.Mesh(innerEarGeo, whiteMat);
    innerEar.position.set(0.005 * s, 0, ez > 0 ? -0.005 * s : 0.005 * s);
    innerEar.rotation.copy(ear.rotation);
    earGroup.add(innerEar);

    headGroup.add(earGroup);
    ears.push(earGroup);
  });

  // Rehbock-Gehörn (Zwei kleine Geweihstangen)
  [0.03 * s, -0.03 * s].forEach((hz) => {
    const antler = new THREE.Group();
    antler.position.set(0.02 * s, 0.12 * s, hz);

    // Hauptspross
    const gGeo1 = new THREE.CylinderGeometry(0.008 * s, 0.015 * s, 0.16 * s, 5);
    const mainSpross = new THREE.Mesh(gGeo1, hornMat);
    mainSpross.rotation.set(hz > 0 ? 0.15 : -0.15, 0, -0.15);
    mainSpross.position.y = 0.08 * s;
    antler.add(mainSpross);

    // Nebenspross (zeigt nach vorne)
    const gGeo2 = new THREE.CylinderGeometry(0.005 * s, 0.008 * s, 0.08 * s, 5);
    const sideSpross = new THREE.Mesh(gGeo2, hornMat);
    sideSpross.rotation.set(0, 0, 0.6);
    sideSpross.position.set(0.03 * s, 0.1 * s, 0);
    antler.add(sideSpross);

    headGroup.add(antler);
  });

  neckPivot.add(headGroup);
  group.add(neckPivot);

  // Für die Explosion
  neckPivot.traverse(child => {
    if (child.isMesh) {
      prepareForExplosion(child, new THREE.Vector3(0.4, 0.45, 0));
    }
  });

  // Animations-Update
  group.userData.update = function (time, windSpeed = 1.0, animSpeed = 1.0) {
    const speed = animSpeed * 1.5;

    // Weiches Atmen (Körper wächst minimal)
    bodyGroup.scale.y = 1.0 + Math.sin(time * 1.8) * 0.015;
    bodyGroup.scale.z = 1.0 + Math.sin(time * 1.8) * 0.010;

    // Grasen: Der Hals neigt sich periodisch nach unten
    const grazeFactor = Math.max(0, Math.sin(time * 0.18 * speed));
    neckPivot.rotation.z = -grazeFactor * 0.8 + Math.sin(time * 2.0 * speed) * 0.015;

    // Kopf gleicht die Halsneigung leicht aus, damit der Blick zum Boden geht
    headGroup.rotation.z = grazeFactor * 0.3;

    // Beine bewegen sich leicht asynchron (Atmen/Ausbalancieren)
    legs.forEach((leg, idx) => {
      const offset = idx * Math.PI * 0.5;
      leg.group.rotation.z = Math.sin(time * 1.2 * speed + offset) * 0.03;
    });

    // Ohren wackeln ab und zu aufmerksam
    ears.forEach((ear, idx) => {
      const wiggle = Math.sin(time * 12 + idx) * 0.15 * (Math.sin(time * 0.4 + idx) > 0.82 ? 1.0 : 0.0);
      ear.rotation.y = wiggle;
    });
  };

  return group;
}

// 12. Wildschwein (Sus scrofa)
export function createBoar(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Wildschwein',
    latin: 'Sus scrofa',
    category: 'Fauna (Säugetier)',
    description: 'Ein wehrhaftes und anpassungsfähiges Waldsäugetier. Wildschweine leben in Familiengruppen (Rotten) und wühlen den Waldboden auf der Suche nach Eicheln, Engerlingen und Wurzeln auf.',
    polyCount: 0
  };

  const s = scale;
  const furMat = new THREE.MeshStandardMaterial({ color: 0x2c221a, roughness: 1.0, flatShading: true });
  const crestMat = new THREE.MeshStandardMaterial({ color: 0x1f1813, roughness: 1.0, flatShading: true });
  const tuskMat = new THREE.MeshStandardMaterial({ color: COL.bone, roughness: 0.8, flatShading: true });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f0c0a, roughness: 0.9, flatShading: true });
  const eyeMat = new THREE.SphereGeometry(0.015 * s, 8, 8);
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, metalness: 0.9, flatShading: false });

  const aBodyGeo = new THREE.IcosahedronGeometry(0.5, 2); // Mehr Polygone

  // 1. Rumpf (Gedrungen, massiver Brustkorb, breiter)
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, 0.46 * s, 0);

  const body = new THREE.Mesh(aBodyGeo, furMat);
  body.scale.set(1.15 * s, 0.72 * s, 0.7 * s);
  bodyGroup.add(body);

  // Nacken-Hump (Borstenkamm)
  const hump = new THREE.Mesh(aBodyGeo, furMat);
  hump.scale.set(0.6 * s, 0.62 * s, 0.58 * s);
  hump.position.set(0.2 * s, 0.18 * s, 0);
  bodyGroup.add(hump);

  // Borstenkamm-Details (Spitzer Rückenkamm)
  const crestGeo = new THREE.ConeGeometry(0.02 * s, 0.15 * s, 4);
  for (let i = 0; i < 14; i++) {
    const crest = new THREE.Mesh(crestGeo, crestMat);
    const progress = (i / 13);
    crest.position.set(
      (0.38 - progress * 0.8) * s,
      (0.34 - progress * 0.12) * s,
      0
    );
    crest.rotation.z = -0.3 + progress * 0.6;
    crest.scale.set(1.0, 1.0, 1.8);
    bodyGroup.add(crest);
  }

  // Schwanz (Ringelschwänzchen mit Quaste)
  const tailGroup = new THREE.Group();
  tailGroup.position.set(-0.55 * s, 0.08 * s, 0);
  tailGroup.rotation.z = -0.8;

  const tailGeo = new THREE.CylinderGeometry(0.012 * s, 0.012 * s, 0.22 * s, 6);
  const tail = new THREE.Mesh(tailGeo, furMat);
  tail.position.y = -0.11 * s;
  tailGroup.add(tail);

  const tuftGeo = new THREE.ConeGeometry(0.025 * s, 0.08 * s, 4);
  const tuft = new THREE.Mesh(tuftGeo, crestMat);
  tuft.position.set(0, -0.22 * s, 0);
  tailGroup.add(tuft);

  bodyGroup.add(tailGroup);
  group.add(bodyGroup);
  prepareForExplosion(bodyGroup, new THREE.Vector3(0, 0.08, 0));

  // 2. Kräftige Beine (20% kürzer für tiefen Schwerpunkt)
  const legCoords = [
    { name: 'FL', x: 0.28 * s, z: 0.18 * s, isFront: true },
    { name: 'FR', x: 0.28 * s, z: -0.18 * s, isFront: true },
    { name: 'BL', x: -0.28 * s, z: 0.18 * s, isFront: false },
    { name: 'BR', x: -0.28 * s, z: -0.18 * s, isFront: false }
  ];

  const legs = [];
  legCoords.forEach((coord) => {
    const legGroup = new THREE.Group();
    legGroup.position.set(coord.x, 0.28 * s, coord.z);

    const legGeo = new THREE.CylinderGeometry(0.062 * s, 0.052 * s, 0.26 * s, 10);
    const leg = new THREE.Mesh(legGeo, furMat);
    leg.position.y = -0.13 * s;
    legGroup.add(leg);

    // Klauen (Schalen, gespalten)
    const clawGeo = new THREE.CylinderGeometry(0.024 * s, 0.03 * s, 0.06 * s, 5);
    const c1 = new THREE.Mesh(clawGeo, darkMat);
    c1.position.set(0.015 * s, -0.28 * s, 0.018 * s);
    const c2 = new THREE.Mesh(clawGeo, darkMat);
    c2.position.set(0.015 * s, -0.28 * s, -0.018 * s);
    legGroup.add(c1, c2);

    // Afterklauen (Zusatzzehen hinten)
    const afterClawGeo = new THREE.ConeGeometry(0.012 * s, 0.035 * s, 4);
    const ac1 = new THREE.Mesh(afterClawGeo, darkMat);
    ac1.position.set(-0.025 * s, -0.24 * s, 0.018 * s);
    ac1.rotation.set(-0.3, 0, -0.4);
    const ac2 = new THREE.Mesh(afterClawGeo, darkMat);
    ac2.position.set(-0.025 * s, -0.24 * s, -0.018 * s);
    ac2.rotation.set(0.3, 0, -0.4);
    legGroup.add(ac1, ac2);

    group.add(legGroup);
    prepareForExplosion(legGroup, new THREE.Vector3(coord.x * 1.5, -0.2, coord.z * 1.5));
    legs.push({
      group: legGroup,
      baseX: coord.x
    });
  });

  // 3. Kopf-Gruppe (Niedrig sitzend, wuchtigerer Keil)
  const headPivot = new THREE.Group();
  headPivot.position.set(0.48 * s, 0.44 * s, 0);

  // Kopfkeil
  const head = new THREE.Mesh(aBodyGeo, furMat);
  head.scale.set(0.68 * s, 0.54 * s, 0.52 * s);
  head.position.set(0.12 * s, -0.04 * s, 0);
  headPivot.add(head);

  // Rüssel
  const snoutGeo = new THREE.ConeGeometry(0.12 * s, 0.35 * s, 10);
  const snout = new THREE.Mesh(snoutGeo, furMat);
  snout.rotation.z = -1.7;
  snout.position.set(0.35 * s, -0.14 * s, 0);
  headPivot.add(snout);

  // Rüsselscheibe
  const discGeo = new THREE.CylinderGeometry(0.065 * s, 0.065 * s, 0.025 * s, 8);
  const disc = new THREE.Mesh(discGeo, darkMat);
  disc.rotation.z = -1.7;
  disc.position.set(0.52 * s, -0.16 * s, 0);
  headPivot.add(disc);

  // Augen
  [0.055 * s, -0.055 * s].forEach((ez) => {
    const eye = new THREE.Mesh(eyeMat, eyeMaterial);
    eye.position.set(0.12 * s, 0.02 * s, ez);
    headPivot.add(eye);
  });

  // Gekrümmte Hauer / Stoßzähne (Reale Keiler-Stoßzähne)
  [0.095 * s, -0.095 * s].forEach((tz) => {
    const tuskGroup = new THREE.Group();
    tuskGroup.position.set(0.3 * s, -0.1 * s, tz);

    // Der Zahn krümmt sich nach oben und hinten
    const partGeo = new THREE.CylinderGeometry(0.01 * s, 0.018 * s, 0.08 * s, 5);
    const p1 = new THREE.Mesh(partGeo, tuskMat);
    p1.rotation.set(tz > 0 ? 0.3 : -0.3, 0, 0.6);
    tuskGroup.add(p1);

    const p2 = new THREE.Mesh(partGeo, tuskMat);
    p2.rotation.set(tz > 0 ? 0.6 : -0.6, 0, 1.3);
    p2.position.set(0.03 * s, 0.04 * s, 0);
    p2.scale.set(0.7, 0.7, 0.7);
    tuskGroup.add(p2);

    headPivot.add(tuskGroup);
  });

  // Buschige Ohren
  const earGeo = new THREE.ConeGeometry(0.065 * s, 0.2 * s, 6);
  [0.12 * s, -0.12 * s].forEach((ez) => {
    const ear = new THREE.Mesh(earGeo, furMat);
    ear.position.set(0.08 * s, 0.16 * s, ez);
    ear.rotation.set(ez > 0 ? 0.45 : -0.45, 0, -0.3);

    // Innenseite (Dunkle Borsten)
    const innerEar = new THREE.Mesh(new THREE.ConeGeometry(0.04 * s, 0.12 * s, 4), crestMat);
    innerEar.position.set(0, -0.01 * s, ez > 0 ? -0.01 * s : 0.01 * s);
    innerEar.rotation.copy(ear.rotation);
    ear.add(innerEar);

    headPivot.add(ear);
  });

  group.add(headPivot);

  // Für die Explosion
  headPivot.traverse(child => {
    if (child.isMesh) {
      prepareForExplosion(child, new THREE.Vector3(0.45, 0.2, 0));
    }
  });

  group.userData.update = function (time, windSpeed = 1.0, animSpeed = 1.0) {
    const speed = animSpeed * 1.5;

    // Schnüffeln: Kopf zuckt rhythmisch auf und ab
    headPivot.rotation.z = Math.sin(time * 4.2 * speed) * 0.05 - 0.12;
    headPivot.position.y = 0.44 * s + Math.cos(time * 3.8 * speed) * 0.016 * s;

    // Atmen (Rippenkorb dehnt sich aus)
    body.scale.set(1.15 * s, 0.72 * s, 0.7 * s * (1.0 + Math.sin(time * 1.8) * 0.018));

    // Beine wippen leicht
    legs.forEach((leg, idx) => {
      leg.group.rotation.z = Math.sin(time * 1.5 * speed + idx) * 0.02;
    });

    // Ringelschwänzchen wackelt ab und zu
    tailGroup.rotation.y = Math.sin(time * 8.0 * speed) * 0.2 * (Math.sin(time * 0.6) > 0.7 ? 1.0 : 0.0);
  };

  return group;
}




// 13. Rotfuchs (Vulpes vulpes)
export function createFox(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Rotfuchs',
    latin: 'Vulpes vulpes',
    category: 'Fauna (Säugetier)',
    description: 'Ein listiger, geschmeidiger Raubsäuger. Der Fuchs ist ein opportunistischer Jäger und profitiert von einer detailreichen Sensorik. Berühmt für seinen buschigen Schwanz (Lunte), der beim Balancieren hilft.',
    polyCount: 0
  };

  const s = scale;
  const redMat = new THREE.MeshStandardMaterial({ color: 0xa84518, roughness: 0.9, flatShading: true });
  const whiteMat = new THREE.MeshStandardMaterial({ color: COL.bone, roughness: 0.9, flatShading: true });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1f1915, roughness: 0.85, flatShading: true });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, metalness: 0.9, flatShading: false });

  const aBodyGeo = new THREE.IcosahedronGeometry(0.5, 2); // Mehr Polygone

  // 1. Rumpf (Schlank, gestreckt)
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, 0.36 * s, 0);

  const body = new THREE.Mesh(aBodyGeo, redMat);
  body.scale.set(1.05 * s, 0.32 * s, 0.26 * s);
  bodyGroup.add(body);

  // Weißer Latz (Brustfell, plastisch)
  const chestGeo = new THREE.IcosahedronGeometry(0.16 * s, 1);
  const chest = new THREE.Mesh(chestGeo, whiteMat);
  chest.scale.set(1.4, 1.8, 1.2);
  chest.position.set(0.44 * s, 0.04 * s, 0);
  bodyGroup.add(chest);

  // Schulter/Hüfte
  const shoulder = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12 * s, 1), redMat);
  shoulder.position.set(0.3 * s, 0.03 * s, 0);
  bodyGroup.add(shoulder);

  group.add(bodyGroup);
  prepareForExplosion(bodyGroup, new THREE.Vector3(0, 0.06, 0));

  // 2. Buschige Lunte (Schwanz, 5 Segmente für längere, buschigere Lunte)
  const tailGroup = new THREE.Group();
  tailGroup.position.set(-0.55 * s, 0.36 * s, 0);

  const tailSegments = 5;
  const tailNodes = [];

  for (let i = 0; i < tailSegments; i++) {
    const isTip = (i === tailSegments - 1);
    const mat = isTip ? whiteMat : redMat;
    const r = (i === 0 ? 0.07 : (i === 1 ? 0.14 : (i === 2 ? 0.15 : (i === 3 ? 0.11 : 0.06)))) * s;

    const nodeGeo = new THREE.IcosahedronGeometry(r, 1);
    const node = new THREE.Mesh(nodeGeo, mat);

    const step = -0.15 * s;
    node.position.set(step * i, -0.07 * i * s, 0);
    node.scale.set(1.4, 1.0, 1.0);
    tailGroup.add(node);

    tailNodes.push(node);
  }

  group.add(tailGroup);
  prepareForExplosion(tailGroup, new THREE.Vector3(-0.35, 0.15, 0));

  // 3. Beine (Rot, unten schwarz gestiefelt, kürzer und zierlicher)
  const legCoords = [
    { name: 'FL', x: 0.25 * s, z: 0.09 * s, isFront: true },
    { name: 'FR', x: 0.25 * s, z: -0.09 * s, isFront: true },
    { name: 'BL', x: -0.22 * s, z: 0.10 * s, isFront: false },
    { name: 'BR', x: -0.22 * s, z: -0.10 * s, isFront: false }
  ];

  const legs = [];
  legCoords.forEach((coord) => {
    const legGroup = new THREE.Group();
    legGroup.position.set(coord.x, 0.3 * s, coord.z);

    // Oberschenkel (Rot)
    const upperGeo = new THREE.CylinderGeometry(0.026 * s, 0.02 * s, 0.15 * s, 8);
    const upper = new THREE.Mesh(upperGeo, redMat);
    upper.position.y = -0.075 * s;
    upper.rotation.z = coord.isFront ? -0.15 : 0.2;
    legGroup.add(upper);

    // Kniegelenk
    const jointGeo = new THREE.IcosahedronGeometry(0.018 * s, 0);
    const joint = new THREE.Mesh(jointGeo, redMat);
    joint.position.set(coord.isFront ? -0.015 * s : 0.02 * s, -0.15 * s, 0);
    legGroup.add(joint);

    // Unterschenkel (Rot)
    const lowerGeo = new THREE.CylinderGeometry(0.015 * s, 0.011 * s, 0.15 * s, 8);
    const lower = new THREE.Mesh(lowerGeo, redMat);
    lower.position.set(coord.isFront ? -0.015 * s : 0.015 * s, -0.225 * s, 0);
    lower.rotation.z = coord.isFront ? 0.15 : -0.25;
    legGroup.add(lower);

    // Schwarze Pfoten (Stiefel)
    const pawGroup = new THREE.Group();
    pawGroup.position.set(coord.isFront ? -0.01 * s : 0.018 * s, -0.3 * s, 0);

    const pawGeo = new THREE.CylinderGeometry(0.014 * s, 0.014 * s, 0.05 * s, 5);
    const paw = new THREE.Mesh(pawGeo, darkMat);
    paw.rotation.x = Math.PI / 2;
    paw.scale.set(1.0, 1.0, 1.4);
    pawGroup.add(paw);
    legGroup.add(pawGroup);

    group.add(legGroup);
    prepareForExplosion(legGroup, new THREE.Vector3(coord.x * 1.5, -0.2, coord.z * 1.5));
    legs.push({
      group: legGroup,
      baseX: coord.x
    });
  });

  // 4. Kopf-Gruppe (Spitz, Backenbart, Mandelaugen, große Ohren)
  const headPivot = new THREE.Group();
  headPivot.position.set(0.33 * s, 0.38 * s, 0);

  // Hals
  const neckGeo = new THREE.CylinderGeometry(0.035 * s, 0.055 * s, 0.22 * s, 8);
  const neck = new THREE.Mesh(neckGeo, redMat);
  neck.rotation.z = -0.5;
  neck.position.set(0.08 * s, 0.1 * s, 0);
  headPivot.add(neck);

  // Kopf
  const headGroup = new THREE.Group();
  headGroup.position.set(0.18 * s, 0.2 * s, 0);

  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11 * s, 1), redMat);
  head.scale.set(1.1, 0.95, 0.95);
  headGroup.add(head);

  // Plastischer weißer Backenbart (flache Wangenkeile)
  const whiskerGeo = new THREE.ConeGeometry(0.05 * s, 0.14 * s, 3);
  [0.055 * s, -0.055 * s].forEach((wz) => {
    const whisker = new THREE.Mesh(whiskerGeo, whiteMat);
    whisker.position.set(0.02 * s, -0.04 * s, wz);
    whisker.rotation.set(wz > 0 ? 0.6 : -0.6, 0.2, wz > 0 ? -1.0 : 1.0);
    whisker.scale.set(1.0, 1.0, 0.2);
    headGroup.add(whisker);
  });

  // Schnauze (Weiß unten, rot oben)
  const snoutGeo = new THREE.ConeGeometry(0.05 * s, 0.18 * s, 5);
  const snout = new THREE.Mesh(snoutGeo, redMat);
  snout.rotation.z = -1.6;
  snout.position.set(0.13 * s, -0.02 * s, 0);
  headGroup.add(snout);

  // Weißes Kinn
  const chinGeo = new THREE.ConeGeometry(0.045 * s, 0.15 * s, 4);
  const chin = new THREE.Mesh(chinGeo, whiteMat);
  chin.rotation.z = -1.62;
  chin.position.set(0.11 * s, -0.045 * s, 0);
  headGroup.add(chin);

  // Schwarze Nase
  const nose = new THREE.Mesh(new THREE.DodecahedronGeometry(0.016 * s, 0), darkMat);
  nose.position.set(0.22 * s, -0.02 * s, 0);
  headGroup.add(nose);

  // Glänzende schwarze Mandelaugen
  const eyeGeo = new THREE.SphereGeometry(0.01 * s, 8, 8);
  [0.035 * s, -0.035 * s].forEach((ez) => {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0.05 * s, 0.02 * s, ez);
    eye.scale.set(1.4, 0.9, 0.9); // Mandelform
    headGroup.add(eye);
  });

  // Große spitze Ohren mit schwarzer Rückseite und weißer Innenseite
  const earGeo = new THREE.ConeGeometry(0.038 * s, 0.16 * s, 4);
  const ears = [];
  [0.05 * s, -0.05 * s].forEach((ez) => {
    const earGroup = new THREE.Group();
    earGroup.position.set(-0.02 * s, 0.09 * s, ez);

    // Ohr (Schwarz)
    const ear = new THREE.Mesh(earGeo, darkMat);
    ear.rotation.set(ez > 0 ? 0.35 : -0.35, 0, -0.2);
    earGroup.add(ear);

    // Ohrinnenseite (Weiß)
    const earInner = new THREE.Mesh(new THREE.ConeGeometry(0.028 * s, 0.13 * s, 4), whiteMat);
    earInner.position.set(0.005 * s, -0.005 * s, ez > 0 ? -0.005 * s : 0.005 * s);
    earInner.rotation.copy(ear.rotation);
    earGroup.add(earInner);

    headGroup.add(earGroup);
    ears.push(earGroup);
  });

  headPivot.add(headGroup);
  group.add(headPivot);

  // Für die Explosion
  headPivot.traverse(child => {
    if (child.isMesh) {
      prepareForExplosion(child, new THREE.Vector3(0.35, 0.35, 0));
    }
  });

  group.userData.update = function (time, windSpeed = 1.0, animSpeed = 1.0) {
    const speed = animSpeed * 1.5;

    // Schwanz wackelt sanft balancierend (physikalisch verzögert über Sinus-Wellen)
    tailGroup.rotation.y = Math.sin(time * 2.0 * speed) * 0.18;
    tailGroup.rotation.z = 0.32 + Math.cos(time * 1.6 * speed) * 0.08;

    // Schwanzsegmente wellenartig bewegen
    tailNodes.forEach((node, idx) => {
      node.rotation.y = Math.sin(time * 4.0 * speed - idx * 0.8) * 0.06;
    });

    // Aufmerksames Umschauen (Kopf-Drehung)
    const lookAngle = Math.sin(time * 0.45 * speed);
    if (lookAngle > 0.65) {
      headPivot.rotation.y = (lookAngle - 0.65) * 0.65;
    } else if (lookAngle < -0.65) {
      headPivot.rotation.y = (lookAngle + 0.65) * 0.65;
    } else {
      headPivot.rotation.y = 0;
    }

    // Beine wippen
    legs.forEach((leg, idx) => {
      leg.group.rotation.z = Math.sin(time * 1.6 * speed + idx * Math.PI) * 0.04;
    });
  };

  return group;
}

// 14. Feldhase (Lepus europaeus)
export function createHare(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Feldhase',
    latin: 'Lepus europaeus',
    category: 'Fauna (Säugetier)',
    description: 'Bekannt für seine extrem langen Ohren (Löffel) und kräftigen Hinterbeine, die ihm Fluchtgeschwindigkeiten von bis zu 70 km/h erlauben. Hasen sind klassische Fluchttiere und Meister des Hakenschlagens.',
    polyCount: 0
  };

  const s = scale;
  const furMat = new THREE.MeshStandardMaterial({ color: 0x6e5844, roughness: 0.95, flatShading: true });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xba9b80, roughness: 0.95, flatShading: true });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1613, roughness: 0.9, flatShading: true });
  const whiteMat = new THREE.MeshStandardMaterial({ color: COL.bone, roughness: 0.95, flatShading: true });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, metalness: 0.9, flatShading: false });
  const pinkMat = new THREE.MeshStandardMaterial({ color: 0xc4a199, roughness: 0.9, flatShading: true });

  const aBodyGeo = new THREE.IcosahedronGeometry(0.35, 2); // Detail 2

  // 1. Rumpf (Gedrungen, typisch gekrümmter Hasenrücken, kompakter)
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, 0.28 * s, 0);

  const body = new THREE.Mesh(aBodyGeo, furMat);
  body.scale.set(0.58 * s, 0.38 * s, 0.34 * s);
  bodyGroup.add(body);

  // Helleres Bauchfell
  const belly = new THREE.Mesh(aBodyGeo, lightMat);
  belly.scale.set(0.5 * s, 0.24 * s, 0.36 * s);
  belly.position.y = -0.08 * s;
  bodyGroup.add(belly);

  // Hinterhaunschen (Oberschenkelmuskeln der Sprungbeine, verkleinert)
  const haunchGeo = new THREE.IcosahedronGeometry(0.14, 1);
  const haunches = [];
  [0.13 * s, -0.13 * s].forEach((hz) => {
    const haunch = new THREE.Mesh(haunchGeo, furMat);
    haunch.scale.set(1.1 * s, 1.4 * s, 0.9 * s);
    haunch.position.set(-0.16 * s, 0.04 * s, hz);
    bodyGroup.add(haunch);
    haunches.push(haunch);
  });

  // Kleines Schwänzchen (Blume, weiß auf der Unterseite)
  const flowerGroup = new THREE.Group();
  flowerGroup.position.set(-0.35 * s, 0.08 * s, 0);

  const flowerTop = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05, 0), furMat);
  const flowerBottom = new THREE.Mesh(new THREE.IcosahedronGeometry(0.045, 0), whiteMat);
  flowerBottom.position.y = -0.02 * s;
  flowerGroup.add(flowerTop, flowerBottom);
  bodyGroup.add(flowerGroup);

  group.add(bodyGroup);
  prepareForExplosion(bodyGroup, new THREE.Vector3(0, 0.04, 0));

  // Beinchen (Vorderläufe dünn, Hinterläufe lang abgeflacht)
  const legs = [];

  // Vorderbeine (Schlank)
  [0.09 * s, -0.09 * s].forEach((zPos) => {
    const leg = new THREE.Group();
    leg.position.set(0.18 * s, 0.26 * s, zPos);

    const armGeo = new THREE.CylinderGeometry(0.016 * s, 0.012 * s, 0.18 * s, 6);
    const arm = new THREE.Mesh(armGeo, furMat);
    arm.position.y = -0.09 * s;
    arm.rotation.z = -0.1;
    leg.add(arm);

    const pawGeo = new THREE.CylinderGeometry(0.014 * s, 0.014 * s, 0.04 * s, 5);
    const paw = new THREE.Mesh(pawGeo, lightMat);
    paw.rotation.x = Math.PI / 2;
    paw.scale.set(1.0, 1.0, 1.5);
    paw.position.set(0.015 * s, -0.18 * s, 0);
    leg.add(paw);

    group.add(leg);
    prepareForExplosion(leg, new THREE.Vector3(0.18 * 1.5, -0.1, zPos * 1.5));
    legs.push(leg);
  });

  // Hinterbeine (Sehr lange Hasenpfoten am Boden liegend)
  [0.16 * s, -0.16 * s].forEach((zPos) => {
    const leg = new THREE.Group();
    leg.position.set(-0.16 * s, 0.16 * s, zPos);

    // Unterschenkel (Geneigt nach vorn)
    const shinGeo = new THREE.CylinderGeometry(0.016 * s, 0.014 * s, 0.18 * s, 6);
    const shin = new THREE.Mesh(shinGeo, furMat);
    shin.rotation.z = -0.7;
    shin.position.set(0.05 * s, -0.06 * s, 0);
    leg.add(shin);

    // Riesige Pfote (liegt flach am Boden)
    const pawGeo = new THREE.CylinderGeometry(0.016 * s, 0.018 * s, 0.14 * s, 5);
    const paw = new THREE.Mesh(pawGeo, lightMat);
    paw.rotation.set(0, 0, Math.PI / 2);
    paw.position.set(0.08 * s, -0.14 * s, 0);
    leg.add(paw);

    group.add(leg);
    prepareForExplosion(leg, new THREE.Vector3(-0.16 * 1.5, -0.05, zPos * 1.5));
    legs.push(leg);
  });

  // 2. Kopf (Rundlich, mit riesigen Löffeln)
  const headPivot = new THREE.Group();
  headPivot.position.set(0.20 * s, 0.38 * s, 0);

  // Hals
  const neckGeo = new THREE.CylinderGeometry(0.035 * s, 0.05 * s, 0.15 * s, 8);
  const neck = new THREE.Mesh(neckGeo, furMat);
  neck.rotation.z = -0.4;
  neck.position.set(0.03 * s, 0.06 * s, 0);
  headPivot.add(neck);

  // Kopf
  const headGroup = new THREE.Group();
  headGroup.position.set(0.08 * s, 0.14 * s, 0);

  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.095 * s, 1), furMat);
  head.scale.set(1.0, 1.0, 0.9);
  headGroup.add(head);

  // Schnauze (Weiß)
  const snoutGeo = new THREE.ConeGeometry(0.04 * s, 0.12 * s, 5);
  const snout = new THREE.Mesh(snoutGeo, whiteMat);
  snout.rotation.z = -1.6;
  snout.position.set(0.08 * s, -0.02 * s, 0);
  headGroup.add(snout);

  // Rosa Schnuppernase
  const nose = new THREE.Mesh(new THREE.DodecahedronGeometry(0.012 * s, 0), pinkMat);
  nose.position.set(0.14 * s, -0.02 * s, 0);
  headGroup.add(nose);

  // Knopfaugen (Seitenständig, dunkel)
  const eyeGeo = new THREE.SphereGeometry(0.014 * s, 8, 8);
  [0.04 * s, -0.04 * s].forEach((ez) => {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0.03 * s, 0.02 * s, ez);
    headGroup.add(eye);
  });

  // LANGE Löffel (Ohren) mit schwarzen Spitzen und rosa-weißer Innenseite
  const earGeo = new THREE.ConeGeometry(0.032 * s, 0.38 * s, 5);
  const ears = [];
  [0.045 * s, -0.045 * s].forEach((ez) => {
    const earGroup = new THREE.Group();
    earGroup.position.set(-0.02 * s, 0.07 * s, ez);

    // Ohr (Braun)
    const ear = new THREE.Mesh(earGeo, furMat);
    ear.rotation.set(ez > 0 ? 0.2 : -0.2, 0, 0.15);
    ear.scale.set(1.2, 1.0, 0.6); // Flach stauchen
    earGroup.add(ear);

    // Schwarze Löffelspitze
    const tipGeo = new THREE.ConeGeometry(0.032 * s, 0.08 * s, 5);
    const tip = new THREE.Mesh(tipGeo, darkMat);
    tip.position.y = 0.16 * s;
    tip.rotation.copy(ear.rotation);
    tip.scale.set(1.2, 1.0, 0.6);
    earGroup.add(tip);

    // Rosa-weiße Innenseite
    const earInner = new THREE.Mesh(new THREE.ConeGeometry(0.02 * s, 0.28 * s, 4), pinkMat);
    earInner.position.set(0.003 * s, -0.01 * s, ez > 0 ? -0.003 * s : 0.003 * s);
    earInner.rotation.copy(ear.rotation);
    earInner.scale.set(1.2, 1.0, 0.3);
    earGroup.add(earInner);

    headGroup.add(earGroup);
    ears.push(earGroup);
  });

  headPivot.add(headGroup);
  group.add(headPivot);

  // Für die Explosion
  headPivot.traverse(child => {
    if (child.isMesh) {
      prepareForExplosion(child, new THREE.Vector3(0.2, 0.25, 0));
    }
  });

  group.userData.update = function (time, windSpeed = 1.0, animSpeed = 1.0) {
    const speed = animSpeed * 1.5;

    // Nervöses Schnuppern (Kopf vibriert rhythmisch)
    headPivot.position.y = 0.44 * s + Math.sin(time * 12.0 * speed) * 0.005 * s;
    headPivot.position.x = 0.20 * s + Math.cos(time * 10.0 * speed) * 0.002 * s;

    // Ohren drehen sich aufmerksam unabhängig im Wind
    ears[0].rotation.y = Math.sin(time * 1.5 * speed) * 0.12;
    ears[1].rotation.y = Math.cos(time * 1.8 * speed) * 0.12;

    // Atem-Schulterschlag
    body.scale.set(0.7 * s, 0.45 * s * (1.0 + Math.sin(time * 2.0) * 0.012), 0.4 * s);
  };

  return group;
}

// 15. Singvogel (Rotkehlchen - Erithacus rubecula, sitzend)
export function createBirdSitting(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Singvogel (sitzt)',
    latin: 'Erithacus rubecula',
    category: 'Fauna (Vogel)',
    description: 'Ein kleines Rotkehlchen, sitzend auf einem bemoosten Ast. Bekannt für seine leuchtend orangefarbene Brust und seinen melodischen Gesang. Rotkehlchen sind neugierige Waldbewohner.',
    polyCount: 0
  };

  const s = scale;
  const furMat = new THREE.MeshStandardMaterial({ color: 0x6e5c4d, roughness: 0.9, flatShading: true }); // brauner Rücken
  const orangeMat = new THREE.MeshStandardMaterial({ color: 0xd45226, roughness: 0.85, flatShading: true }); // orange Brust
  const whiteMat = new THREE.MeshStandardMaterial({ color: COL.bone, roughness: 0.9, flatShading: true }); // helle Unterseite
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xc4964b, roughness: 0.8, flatShading: true }); // gelber Schnabel
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, flatShading: false }); // Augen
  const twigMat = new THREE.MeshStandardMaterial({ color: 0x4d3c2c, roughness: 1.0, flatShading: true }); // Ast
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x24542a, roughness: 1.0, flatShading: true }); // Moos

  // 1. Ast / Zweig (Unterlage)
  const branchGeo = new THREE.CylinderGeometry(0.016 * s, 0.016 * s, 0.45 * s, 6);
  const branch = new THREE.Mesh(branchGeo, twigMat);
  branch.rotation.z = Math.PI / 2;
  branch.position.y = 0.03 * s;
  group.add(branch);
  prepareForExplosion(branch, new THREE.Vector3(0, -0.05, 0));

  // Ein kleiner Moosflecken auf dem Ast
  const moss = new THREE.Mesh(new THREE.IcosahedronGeometry(0.024 * s, 0), mossMat);
  moss.position.set(-0.06 * s, 0.04 * s, 0);
  moss.scale.set(1.5, 0.4, 1.2);
  group.add(moss);
  prepareForExplosion(moss, new THREE.Vector3(-0.06 * 1.5, -0.04, 0));

  // 2. Vogel-Körper
  const birdGroup = new THREE.Group();
  birdGroup.position.set(0, 0.16 * s, 0);

  // Rumpf
  const bodyGeo = new THREE.IcosahedronGeometry(0.065 * s, 1);
  const body = new THREE.Mesh(bodyGeo, furMat);
  body.scale.set(1.0, 0.9, 1.3); // leicht gestreckt
  birdGroup.add(body);

  // Orange Kehle / Brust
  const breastGeo = new THREE.ConeGeometry(0.042 * s, 0.08 * s, 5);
  const breast = new THREE.Mesh(breastGeo, orangeMat);
  breast.position.set(0.035 * s, 0.01 * s, 0);
  breast.rotation.z = -1.2;
  breast.scale.set(1.0, 1.0, 0.7);
  birdGroup.add(breast);

  // Helle Unterseite (Bauch)
  const bellyGeo = new THREE.IcosahedronGeometry(0.055 * s, 0);
  const belly = new THREE.Mesh(bellyGeo, whiteMat);
  belly.position.set(0.01 * s, -0.03 * s, 0);
  belly.scale.set(1.1, 0.8, 1.1);
  birdGroup.add(belly);

  // Kopf Pivot für Twitch-Animation
  const headPivot = new THREE.Group();
  headPivot.position.set(0.045 * s, 0.055 * s, 0);

  // Kopf
  const headGeo = new THREE.IcosahedronGeometry(0.048 * s, 1);
  const head = new THREE.Mesh(headGeo, furMat);
  headPivot.add(head);

  // Orange Gesichtspartie
  const faceGeo = new THREE.IcosahedronGeometry(0.025 * s, 0);
  const face = new THREE.Mesh(faceGeo, orangeMat);
  face.position.set(0.02 * s, 0, 0);
  headPivot.add(face);

  // Schnabel
  const beakGeo = new THREE.ConeGeometry(0.008 * s, 0.03 * s, 4);
  const beak = new THREE.Mesh(beakGeo, beakMat);
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(0.055 * s, -0.005 * s, 0);
  headPivot.add(beak);

  // Augen
  const eyeGeo = new THREE.SphereGeometry(0.008 * s, 8, 8);
  [0.025 * s, -0.025 * s].forEach((ez) => {
    const eye = new THREE.Mesh(eyeGeo, darkMat);
    eye.position.set(0.02 * s, 0.008 * s, ez);
    headPivot.add(eye);
  });

  birdGroup.add(headPivot);

  // Flügel (Seitlich angelegt)
  const wingGeo = new THREE.ConeGeometry(0.028 * s, 0.09 * s, 4);
  [0.052 * s, -0.052 * s].forEach((wz) => {
    const wing = new THREE.Mesh(wingGeo, furMat);
    wing.position.set(-0.02 * s, 0.01 * s, wz);
    wing.rotation.set(wz > 0 ? -0.15 : 0.15, 0, -1.8);
    wing.scale.set(1.0, 1.0, 0.35);
    birdGroup.add(wing);
  });

  // Schwanzfedern
  const tailGeo = new THREE.BoxGeometry(0.09 * s, 0.008 * s, 0.038 * s);
  const tail = new THREE.Mesh(tailGeo, furMat);
  tail.position.set(-0.09 * s, -0.02 * s, 0);
  tail.rotation.z = -0.3;
  birdGroup.add(tail);

  // Beine / Krallen
  const legGeo = new THREE.CylinderGeometry(0.004 * s, 0.004 * s, 0.06 * s, 4);
  [0.02 * s, -0.02 * s].forEach((lz) => {
    const leg = new THREE.Mesh(legGeo, beakMat);
    leg.position.set(0.01 * s, -0.075 * s, lz);
    leg.rotation.z = 0.1;
    birdGroup.add(leg);
  });

  group.add(birdGroup);
  prepareForExplosion(birdGroup, new THREE.Vector3(0, 0.2, 0));

  // Animationen im Wind / Zeit
  let nextTwitchTime = 0;
  let targetHeadRotY = 0;
  let currentHeadRotY = 0;

  group.userData.update = function (time, windSpeed = 1.0, animSpeed = 1.0) {
    // Rumpf wippt ganz leicht im Wind
    birdGroup.rotation.z = Math.sin(time * 2.0) * 0.03 * windSpeed;

    // Nervöse Kopfbewegungen (Vogel-Twitch)
    if (time > nextTwitchTime) {
      if (Math.random() < 0.7) {
        targetHeadRotY = (Math.random() - 0.5) * 1.2;
      } else {
        targetHeadRotY = 0;
      }
      nextTwitchTime = time + 0.6 + Math.random() * 1.5;
    }

    currentHeadRotY += (targetHeadRotY - currentHeadRotY) * 0.25;
    headPivot.rotation.y = currentHeadRotY;

    // Schwanz wippt rhythmisch
    tail.rotation.z = -0.3 + Math.sin(time * 6.0) * 0.05 * animSpeed;
  };

  return group;
}

// 16. Greifvogel (Mäusebussard - Buteo buteo, fliegend)
export function createBirdFlying(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Greifvogel (fliegt)',
    latin: 'Buteo buteo',
    category: 'Fauna (Vogel)',
    description: 'Ein Mäusebussard im Segelflug. Seine breiten Schwingen und die typische Gefiederzeichnung erlauben ihm ausdauerndes Kreisen in der Thermik über lichten Wäldern.',
    polyCount: 0
  };

  const s = scale;
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2d, roughness: 0.9, flatShading: true }); // dunkelbrauner Rumpf
  const patternMat = new THREE.MeshStandardMaterial({ color: 0x9c8a7b, roughness: 0.9, flatShading: true }); // hellere Federbänderung
  const beakMat = new THREE.MeshStandardMaterial({ color: 0xd4a52c, roughness: 0.7, flatShading: true }); // gelber Schnabel
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, flatShading: false }); // Augen

  const flyerGroup = new THREE.Group();
  flyerGroup.position.y = 1.0 * s;

  // 1. Rumpf
  const bodyGeo = new THREE.IcosahedronGeometry(0.12 * s, 1);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.scale.set(1.8, 0.75, 0.75);
  flyerGroup.add(body);

  // Kopf
  const headGeo = new THREE.IcosahedronGeometry(0.07 * s, 1);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.position.set(0.19 * s, 0.03 * s, 0);
  flyerGroup.add(head);

  // Gekrümmter Schnabel
  const beakGroup = new THREE.Group();
  beakGroup.position.set(0.24 * s, 0.03 * s, 0);

  const beakBaseGeo = new THREE.ConeGeometry(0.015 * s, 0.04 * s, 4);
  const beakBase = new THREE.Mesh(beakBaseGeo, beakMat);
  beakBase.rotation.z = -Math.PI / 2;
  beakGroup.add(beakBase);

  const beakTipGeo = new THREE.ConeGeometry(0.01 * s, 0.02 * s, 4);
  const beakTip = new THREE.Mesh(beakTipGeo, darkMat);
  beakTip.position.set(0.025 * s, -0.01 * s, 0);
  beakTip.rotation.z = -Math.PI / 2 - 0.4;
  beakGroup.add(beakTip);

  flyerGroup.add(beakGroup);

  // Augen
  const eyeGeo = new THREE.SphereGeometry(0.01 * s, 8, 8);
  [0.032 * s, -0.032 * s].forEach((ez) => {
    const eye = new THREE.Mesh(eyeGeo, darkMat);
    eye.position.set(0.21 * s, 0.05 * s, ez);
    flyerGroup.add(eye);
  });

  // Fächerförmiger Stoß
  const tailGeo = new THREE.BoxGeometry(0.25 * s, 0.01 * s, 0.18 * s);
  const tail = new THREE.Mesh(tailGeo, bodyMat);
  tail.position.set(-0.24 * s, -0.01 * s, 0);
  tail.rotation.z = -0.05;
  flyerGroup.add(tail);

  // 2. Flügel
  const leftWingPivot = new THREE.Group();
  leftWingPivot.position.set(0, 0.02 * s, 0.08 * s);

  const wingInnerGeo = new THREE.BoxGeometry(0.18 * s, 0.014 * s, 0.55 * s);
  const leftWingInner = new THREE.Mesh(wingInnerGeo, bodyMat);
  leftWingInner.position.set(-0.02 * s, 0, 0.25 * s);
  leftWingPivot.add(leftWingInner);

  const leftOuterPivot = new THREE.Group();
  leftOuterPivot.position.set(-0.02 * s, 0, 0.50 * s);

  const wingOuterGeo = new THREE.BoxGeometry(0.14 * s, 0.01 * s, 0.45 * s);
  const leftWingOuter = new THREE.Mesh(wingOuterGeo, patternMat);
  leftWingOuter.position.set(-0.02 * s, 0, 0.20 * s);
  leftOuterPivot.add(leftWingOuter);
  leftWingPivot.add(leftOuterPivot);

  flyerGroup.add(leftWingPivot);

  const rightWingPivot = new THREE.Group();
  rightWingPivot.position.set(0, 0.02 * s, -0.08 * s);

  const rightWingInner = new THREE.Mesh(wingInnerGeo, bodyMat);
  rightWingInner.position.set(-0.02 * s, 0, -0.25 * s);
  rightWingPivot.add(rightWingInner);

  const rightOuterPivot = new THREE.Group();
  rightOuterPivot.position.set(-0.02 * s, 0, -0.50 * s);

  const rightWingOuter = new THREE.Mesh(wingOuterGeo, patternMat);
  rightWingOuter.position.set(-0.02 * s, 0, -0.20 * s);
  rightOuterPivot.add(rightWingOuter);
  rightWingPivot.add(rightOuterPivot);

  flyerGroup.add(rightWingPivot);

  group.add(flyerGroup);

  flyerGroup.traverse((child) => {
    if (child.isMesh) {
      prepareForExplosion(child, new THREE.Vector3(child.position.x, 0.3 * s + child.position.y, child.position.z));
    }
  });

  group.userData.update = function (time, windSpeed = 1.0, animSpeed = 1.0) {
    const speed = animSpeed * 1.0;
    const isGliding = windSpeed > 1.4;

    if (isGliding) {
      const wingSway = Math.sin(time * 15.0) * 0.015 * windSpeed;
      leftWingPivot.rotation.x = wingSway;
      rightWingPivot.rotation.x = -wingSway;

      leftOuterPivot.rotation.x = 0.08 + wingSway * 0.5;
      rightOuterPivot.rotation.x = -0.08 - wingSway * 0.5;

      flyerGroup.rotation.z = Math.sin(time * 1.5) * 0.04;
      flyerGroup.position.y = 1.0 * s + Math.sin(time * 0.8) * 0.04 * s;
    } else {
      const flapFreq = 5.0 * speed;
      const flapAngle = Math.sin(time * flapFreq) * 0.35;

      leftWingPivot.rotation.x = flapAngle;
      rightWingPivot.rotation.x = -flapAngle;

      const outerFlapAngle = Math.sin(time * flapFreq - 0.5) * 0.15;
      leftOuterPivot.rotation.x = 0.06 + outerFlapAngle;
      rightOuterPivot.rotation.x = -0.06 - outerFlapAngle;

      flyerGroup.position.y = 1.0 * s + Math.sin(time * flapFreq) * 0.05 * s;
      flyerGroup.rotation.z = Math.sin(time * flapFreq - 0.5) * 0.03;
    }
  };

  return group;
}

// 17. Sauerklee (Oxalis acetosella)
export function createWoodSorrel(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Sauerklee',
    latin: 'Oxalis acetosella',
    category: 'Flora (Krautpflanze)',
    description: 'Eine zierliche Pflanze des schattigen Waldbodens. Die Blätter bestehen aus drei herzförmigen Fiedern, die sich bei Dunkelheit oder Regen nach unten klappen. Die Blüten sind weiß mit feiner rosa Aderung.',
    polyCount: 0
  };

  const s = scale;
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x6ca373, roughness: 0.9, side: THREE.DoubleSide, flatShading: true });
  const leafMat = new THREE.MeshStandardMaterial({ color: COL.cloverLeaf, roughness: 0.8, side: THREE.DoubleSide, flatShading: true });
  const whiteMat = new THREE.MeshStandardMaterial({ color: COL.bone, roughness: 0.85, side: THREE.DoubleSide, flatShading: true });
  const yellowMat = new THREE.MeshStandardMaterial({ color: COL.goldHi, roughness: 0.9, flatShading: true });

  const plantCount = 16;
  const plants = [];

  for (let p = 0; p < plantCount; p++) {
    const pGroup = new THREE.Group();
    const angle = (p / plantCount) * Math.PI * 2 + Math.random() * 0.4;
    const dist = (0.03 + Math.random() * 0.14) * s;
    const pX = Math.sin(angle) * dist;
    const pZ = Math.cos(angle) * dist;
    pGroup.position.set(pX, 0, pZ);

    const h = (0.08 + Math.random() * 0.08) * s;

    const stemGroup = new THREE.Group();
    const segCount = 3;
    const segH = h / segCount;
    let currentY = 0;
    const segments = [];
    const baseLean = 0.1 + Math.random() * 0.25;

    for (let j = 0; j < segCount; j++) {
      const segGeo = new THREE.CylinderGeometry(0.003 * s, 0.0035 * s, segH, 5);
      const seg = new THREE.Mesh(segGeo, stemMat);
      seg.position.y = segH / 2;

      const segGroup = new THREE.Group();
      segGroup.position.y = currentY;
      const dirX = Math.sin(angle) * (baseLean + j * 0.1);
      const dirZ = Math.cos(angle) * (baseLean + j * 0.1);
      segGroup.rotation.set(dirX, angle, dirZ);

      segGroup.add(seg);
      stemGroup.add(segGroup);
      segments.push(segGroup);
      currentY = segH;
    }
    pGroup.add(stemGroup);

    const leafCluster = new THREE.Group();
    leafCluster.position.y = currentY;
    const lastSeg = segments[segments.length - 1];

    const leafPartGeo = new THREE.DodecahedronGeometry(0.025 * s, 0);

    for (let l = 0; l < 3; l++) {
      const leafAngle = (l / 3) * Math.PI * 2;
      const leafGroup = new THREE.Group();
      leafGroup.rotation.y = leafAngle;

      const p1 = new THREE.Mesh(leafPartGeo, leafMat);
      p1.position.set(0.015 * s, 0, 0.01 * s);
      p1.scale.set(1.0, 0.1, 1.2);

      const p2 = new THREE.Mesh(leafPartGeo, leafMat);
      p2.position.set(0.015 * s, 0, -0.01 * s);
      p2.scale.set(1.0, 0.1, 1.2);

      leafGroup.add(p1, p2);
      leafGroup.rotation.z = -0.3;
      leafCluster.add(leafGroup);
    }
    lastSeg.add(leafCluster);

    if (Math.random() < 0.45) {
      const flowerStemGroup = new THREE.Group();
      const flH = h * 1.2;
      const flSegH = flH / 3;
      let flY = 0;
      const flSegs = [];

      for (let j = 0; j < segCount; j++) {
        const segGeo = new THREE.CylinderGeometry(0.0025 * s, 0.003 * s, flSegH, 5);
        const seg = new THREE.Mesh(segGeo, stemMat);
        seg.position.y = flSegH / 2;

        const segGroup = new THREE.Group();
        segGroup.position.y = flY;
        const flLean = (baseLean + 0.15) * 0.8;
        segGroup.rotation.set(Math.sin(angle + 0.5) * flLean, angle + 0.5, Math.cos(angle + 0.5) * flLean);

        segGroup.add(seg);
        flowerStemGroup.add(segGroup);
        flSegs.push(segGroup);
        flY = flSegH;
      }
      pGroup.add(flowerStemGroup);

      const flowerHead = new THREE.Group();
      flowerHead.position.y = flY;

      const centerGeo = new THREE.DodecahedronGeometry(0.008 * s, 0);
      const center = new THREE.Mesh(centerGeo, yellowMat);
      flowerHead.add(center);

      const petalGeo = new THREE.ConeGeometry(0.012 * s, 0.038 * s, 4);
      for (let pt = 0; pt < 5; pt++) {
        const ptAngle = (pt / 5) * Math.PI * 2;
        const petal = new THREE.Mesh(petalGeo, whiteMat);
        petal.position.set(Math.sin(ptAngle) * 0.02 * s, 0.01 * s, Math.cos(ptAngle) * 0.02 * s);
        petal.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.sin(ptAngle), 0.8, Math.cos(ptAngle)).normalize());
        petal.scale.set(1.2, 1.0, 0.3);
        flowerHead.add(petal);
      }

      flSegs[flSegs.length - 1].add(flowerHead);
    }

    group.add(pGroup);
    prepareForExplosion(pGroup, new THREE.Vector3(Math.sin(angle) * 1.5, 0.25, Math.cos(angle) * 1.5));

    plants.push({
      group: pGroup,
      segments: segments,
      angle: angle,
      baseLean: baseLean
    });
  }

  group.userData.update = function (time, windSpeed = 1.0) {
    const sway = Math.sin(time * 3.0) * 0.06 * windSpeed * s;
    const swayCos = Math.cos(time * 2.6) * 0.04 * windSpeed * s;

    plants.forEach((p, idx) => {
      p.segments.forEach((seg, sIdx) => {
        const leanX = Math.sin(p.angle) * (p.baseLean + sIdx * 0.1) + sway * (sIdx + 1) * 0.25;
        const leanZ = Math.cos(p.angle) * (p.baseLean + sIdx * 0.1) + swayCos * (sIdx + 1) * 0.25;
        seg.rotation.set(leanX, p.angle, leanZ);
      });
    });
  };

  return group;
}

// 18. Brombeere (Rubus sect. Rubus)
export function createBlackberry(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Brombeere',
    latin: 'Rubus sect. Rubus',
    category: 'Flora (Zwergstrauch)',
    description: 'Ein stacheliger, rankender Strauch. Trägt schmackhafte Sammelsteinfrüchte, die sich von grün über rot zu tiefschwarz verfärben. Die Ruten sind mit spitzen Dornen besetzt.',
    polyCount: 0
  };

  const s = scale;
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x546e3a, roughness: 0.9, flatShading: true });
  const thornMat = new THREE.MeshStandardMaterial({ color: 0x8c2b2b, roughness: 0.8, flatShading: true });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1f5424, roughness: 0.85, flatShading: true });
  const berryMat = new THREE.MeshStandardMaterial({ color: COL.blackberryFruit, roughness: 0.2, metalness: 0.2, flatShading: true });
  const unripeBerryMat = new THREE.MeshStandardMaterial({ color: 0xbf3030, roughness: 0.4, flatShading: true });

  const branches = [];
  const rutenCount = 5;

  for (let r = 0; r < rutenCount; r++) {
    const rGroup = new THREE.Group();
    const angle = (r / rutenCount) * Math.PI * 2 + Math.random() * 0.3;
    const dist = 0.05 * s;
    rGroup.position.set(Math.sin(angle) * dist, 0, Math.cos(angle) * dist);

    const segCount = 6;
    const ruteLen = 0.9 * s;
    const segH = ruteLen / segCount;
    let currentPos = new THREE.Vector3(0, 0, 0);
    let currentDir = new THREE.Vector3(0, 1, 0);
    const nodes = [];

    for (let j = 0; j < segCount; j++) {
      const thickness = 0.018 * s * (1.0 - j / segCount * 0.5);
      const segGeo = new THREE.CylinderGeometry(thickness * 0.8, thickness, segH, 6);
      const seg = new THREE.Mesh(segGeo, stemMat);

      const bendFactor = 0.15 + Math.sin(j / segCount * Math.PI) * 0.2;
      const angleDir = new THREE.Vector3(Math.sin(angle), -0.25, Math.cos(angle));
      currentDir.addScaledVector(angleDir, bendFactor).normalize();

      const up = new THREE.Vector3(0, 1, 0);
      seg.quaternion.setFromUnitVectors(up, currentDir);
      seg.position.copy(currentPos).addScaledVector(currentDir, segH / 2);
      rGroup.add(seg);

      nodes.push({
        pos: currentPos.clone().addScaledVector(currentDir, segH / 2),
        dir: currentDir.clone(),
        thickness: thickness
      });

      const thornCount = 3;
      const thornGeo = new THREE.ConeGeometry(0.004 * s, 0.015 * s, 4);
      for (let t = 0; t < thornCount; t++) {
        const thorn = new THREE.Mesh(thornGeo, thornMat);
        const tAngle = Math.random() * Math.PI * 2;
        const tPos = currentPos.clone().addScaledVector(currentDir, Math.random() * segH);

        thorn.position.copy(tPos).add(new THREE.Vector3(Math.sin(tAngle) * thickness, 0, Math.cos(tAngle) * thickness));

        const normal = new THREE.Vector3(Math.sin(tAngle), -0.5, Math.cos(tAngle)).normalize();
        thorn.quaternion.setFromUnitVectors(up, normal);
        rGroup.add(thorn);
      }

      currentPos.addScaledVector(currentDir, segH);
    }

    group.add(rGroup);
    prepareForExplosion(rGroup, new THREE.Vector3(Math.sin(angle), 0.3, Math.cos(angle)));

    branches.push({
      group: rGroup,
      basePos: rGroup.position.clone(),
      nodes: nodes,
      angle: angle
    });
  }

  const leaves = [];
  const leafGeo = new THREE.DodecahedronGeometry(0.04 * s, 0);
  const berryClusterGeo = new THREE.IcosahedronGeometry(0.009 * s, 0);

  branches.forEach((branch, bIdx) => {
    for (let l = 0; l < 6; l++) {
      const nodeIdx = 1 + Math.floor((l / 6) * (branch.nodes.length - 2));
      const node = branch.nodes[nodeIdx];

      const leafGroup = new THREE.Group();
      leafGroup.position.copy(node.pos);

      const pAngle = branch.angle + (l % 2 === 0 ? 1.0 : -1.0) + (Math.random() - 0.5) * 0.3;
      const lDir = new THREE.Vector3(Math.sin(pAngle), 0.3, Math.cos(pAngle)).normalize();

      const leafCount = 5;
      for (let lf = 0; lf < leafCount; lf++) {
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.scale.set(1.2, 0.1, 0.7);

        let offset;
        let rotY = pAngle;
        if (lf === 0) {
          offset = lDir.clone().multiplyScalar(0.06 * s);
        } else if (lf === 1 || lf === 2) {
          const pAnglePair = pAngle + (lf === 1 ? 0.6 : -0.6);
          offset = lDir.clone().multiplyScalar(0.03 * s).add(new THREE.Vector3(Math.sin(pAnglePair) * 0.035 * s, 0, Math.cos(pAnglePair) * 0.035 * s));
          rotY = pAnglePair;
        } else {
          const pAnglePair = pAngle + (lf === 3 ? 1.2 : -1.2);
          offset = new THREE.Vector3(Math.sin(pAnglePair) * 0.035 * s, -0.01 * s, Math.cos(pAnglePair) * 0.035 * s);
          rotY = pAnglePair;
        }

        leaf.position.copy(offset);
        leaf.rotation.set(0.2, rotY, 0.3);
        leafGroup.add(leaf);
      }

      branch.group.add(leafGroup);
      leaves.push({
        mesh: leafGroup,
        basePos: leafGroup.position.clone(),
        rotZ: leafGroup.rotation.z
      });
    }

    for (let b = 0; b < 3; b++) {
      const nodeIdx = 3 + Math.floor((b / 3) * (branch.nodes.length - 4));
      const node = branch.nodes[nodeIdx];

      const bCluster = new THREE.Group();
      const bAngle = branch.angle + (b % 2 === 0 ? 0.8 : -0.8);
      const bPos = node.pos.clone().add(new THREE.Vector3(Math.sin(bAngle) * 0.06 * s, -0.04 * s, Math.cos(bAngle) * 0.06 * s));
      bCluster.position.copy(bPos);

      const isRipe = (b + bIdx) % 2 === 0;
      const mat = isRipe ? berryMat : unripeBerryMat;

      const fruitCount = 14;
      for (let fr = 0; fr < fruitCount; fr++) {
        const fruitPart = new THREE.Mesh(berryClusterGeo, mat);
        const phi = Math.acos(-1.0 + 2.0 * (fr / fruitCount));
        const theta = fr * 2.39996;
        const rRadius = 0.015 * s;

        fruitPart.position.set(
          Math.sin(phi) * Math.cos(theta) * rRadius,
          Math.sin(phi) * Math.sin(theta) * rRadius,
          Math.cos(phi) * rRadius
        );
        bCluster.add(fruitPart);
      }

      branch.group.add(bCluster);
    }
  });

  group.userData.update = function (time, windSpeed = 1.0) {
    const speed = windSpeed * 2.0;
    const sway = Math.sin(time * 2.0) * 0.06 * speed * s;
    const swayCos = Math.cos(time * 1.6) * 0.04 * speed * s;

    branches.forEach((b, idx) => {
      b.group.rotation.z = sway * (idx % 2 === 0 ? 0.06 : -0.06);
      b.group.rotation.x = swayCos * 0.04;
    });

    leaves.forEach((l, idx) => {
      l.mesh.rotation.z = l.rotZ + Math.sin(time * 5.0 + idx) * 0.03 * windSpeed;
    });
  };

  return group;
}

// 19. Wald-Reitgras (Calamagrostis arundinacea)
export function createCalamagrostis(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Wald-Reitgras',
    latin: 'Calamagrostis arundinacea',
    category: 'Flora (Gras)',
    description: 'Ein hohes, horstartiges Gras der Waldlichtungen und lichten Kiefernwälder. Zeichnet sich durch schlanke, überhängende Halme und fedrige, goldbraun glänzende Blütenrispen aus.',
    polyCount: 0
  };

  const s = scale;
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x3e7d4a, roughness: 0.8, side: THREE.DoubleSide, flatShading: true });
  const strawMat = new THREE.MeshStandardMaterial({ color: COL.tuftDry, roughness: 0.85, side: THREE.DoubleSide, flatShading: true });
  const goldMat = new THREE.MeshStandardMaterial({ color: COL.gold, roughness: 0.9, flatShading: true });
  const goldHiMat = new THREE.MeshStandardMaterial({ color: COL.goldHi, roughness: 0.8, flatShading: true });

  const bladeCount = 65;
  const blades = [];

  for (let i = 0; i < bladeCount; i++) {
    const angle = (i / bladeCount) * Math.PI * 2 + Math.random() * 0.3;
    const h = (0.7 + Math.random() * 0.55) * s;
    const w = (0.012 + Math.random() * 0.012) * s;

    // Farbe: Hauptsächlich frisch grün, einige ältere Halme strohgelb/trocken
    const mat = Math.random() < 0.75 ? greenMat : strawMat;

    const bladeGroup = new THREE.Group();
    const dist = Math.random() * 0.1 * s;
    bladeGroup.position.set(Math.sin(angle) * dist, 0, Math.cos(angle) * dist);

    const segCount = 4;
    const segH = h / segCount;
    let currentY = 0;
    const segments = [];

    // Starker Überhang nach außen bei den hohen Halmen
    const baseLean = 0.2 + Math.random() * 0.35;

    for (let j = 0; j < segCount; j++) {
      const wBase = w * (1.0 - j / segCount);
      const wTop = w * (1.0 - (j + 1) / segCount);

      const segGeo = new THREE.ConeGeometry(wBase, segH, 4);
      const seg = new THREE.Mesh(segGeo, mat);
      seg.position.y = segH / 2;

      const segGroup = new THREE.Group();
      segGroup.position.y = currentY;

      // Zunehmende Neigung in dieselbe Richtung für eine schöne Bogenkrümmung
      const dirX = Math.sin(angle) * (baseLean + j * 0.16);
      const dirZ = Math.cos(angle) * (baseLean + j * 0.16);
      segGroup.rotation.set(dirX, angle, dirZ);

      segGroup.add(seg);
      bladeGroup.add(segGroup);
      segments.push(segGroup);
      currentY = segH;
    }

    // Rispenblüte an ca. 60% der höheren Halme
    if (h > 0.8 * s && Math.random() < 0.65) {
      const topSeg = segments[segments.length - 1];
      const plumeGroup = new THREE.Group();
      plumeGroup.position.y = segH;

      // Blütenähre als gestreckte, fedrige Form
      const flowerMat = Math.random() > 0.5 ? goldMat : goldHiMat;
      const plumeHeight = (0.18 + Math.random() * 0.1) * s;
      const plumeGeo = new THREE.ConeGeometry(0.018 * s, plumeHeight, 5);

      const plume = new THREE.Mesh(plumeGeo, flowerMat);
      plume.position.y = plumeHeight / 2;
      plume.rotation.x = 0.1; // leicht aus der Halmachse geknickt
      plumeGroup.add(plume);

      // Kleine Seitenästchen für die Blütenrispe
      const sidePlumeGeo = new THREE.ConeGeometry(0.008 * s, 0.06 * s, 3);
      for (let p = 0; p < 4; p++) {
        const sideP = new THREE.Mesh(sidePlumeGeo, flowerMat);
        const pAngle = (p / 4) * Math.PI * 2;
        sideP.position.set(Math.sin(pAngle) * 0.01 * s, 0.04 * s + p * 0.03 * s, Math.cos(pAngle) * 0.01 * s);
        sideP.rotation.set(0.6, pAngle, 0.2);
        plumeGroup.add(sideP);
      }

      topSeg.add(plumeGroup);
    }

    group.add(bladeGroup);

    bladeGroup.traverse(child => {
      if (child.isMesh) {
        prepareForExplosion(child, new THREE.Vector3(Math.sin(angle) * 1.8, 0.2, Math.cos(angle) * 1.8));
      }
    });

    blades.push({
      group: bladeGroup,
      segments: segments,
      angle: angle,
      baseLean: baseLean
    });
  }

  group.userData.update = function (time, windSpeed = 1.0) {
    const sway = Math.sin(time * 2.4) * 0.09 * windSpeed * s;
    const swayCos = Math.cos(time * 2.0) * 0.06 * windSpeed * s;

    blades.forEach((b, idx) => {
      b.segments.forEach((seg, sIdx) => {
        const leanX = Math.sin(b.angle) * (b.baseLean + sIdx * 0.14) + sway * (sIdx + 1) * 0.22;
        const leanZ = Math.cos(b.angle) * (b.baseLean + sIdx * 0.14) + swayCos * (sIdx + 1) * 0.22;
        seg.rotation.set(leanX, b.angle, leanZ);
      });
    });
  };

  return group;
}

// 20. Gemeiner Wacholder (Juniperus communis)
export function createJuniper(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Gemeiner Wacholder',
    latin: 'Juniperus communis',
    category: 'Flora (Nadelstrauch)',
    description: 'Ein immergrüner, säulenförmig wachsender Nadelstrauch, der besonders auf sandigen und nährstoffarmen Waldböden anzutreffen ist. Die Beerenzapfen reifen über zwei Jahre und färben sich im zweiten Jahr dunkelblau-grau.',
    polyCount: 0
  };

  const s = scale;
  const barkMat = new THREE.MeshStandardMaterial({ color: 0x483a30, roughness: 0.9, flatShading: true });
  const needleMat = new THREE.MeshStandardMaterial({ color: COL.spruceNeedle, roughness: 0.8, flatShading: true });
  const berryMat = new THREE.MeshStandardMaterial({ color: 0x475e7a, roughness: 0.5, flatShading: true }); // Wacholderbeeren (blau-grau)

  // 3-5 Hauptäste, die dicht beieinander aus der Basis wachsen (Säulenwuchs)
  const branchCount = 4 + Math.floor(Math.random() * 2);
  const branches = [];

  for (let b = 0; b < branchCount; b++) {
    const bGroup = new THREE.Group();

    // Wachsen radial sehr eng beieinander
    const angle = (b / branchCount) * Math.PI * 2;
    const dist = 0.04 * s;
    bGroup.position.set(Math.sin(angle) * dist, 0, Math.cos(angle) * dist);

    // Aufrechter Wuchs mit leichter Außenneigung
    const leanX = Math.sin(angle) * 0.12;
    const leanZ = Math.cos(angle) * 0.12;
    bGroup.rotation.set(leanX, angle, leanZ);

    const branchHeight = (1.1 + Math.random() * 0.4) * s;
    const trunkGeo = new THREE.CylinderGeometry(0.01 * s, 0.024 * s, branchHeight, 6);
    const trunk = new THREE.Mesh(trunkGeo, barkMat);
    trunk.position.y = branchHeight / 2;
    bGroup.add(trunk);

    // Nadelkissen entlang des Astes stapeln (erzeugt säulenartigen Look)
    const cushionCount = 7;
    const cushions = [];
    const needleGeo = new THREE.DodecahedronGeometry(0.09 * s, 0); // Stacheliges Nadelkissen

    for (let c = 0; c < cushionCount; c++) {
      const cMat = needleMat;
      const cushion = new THREE.Mesh(needleGeo, cMat);

      // Skalierung: unten etwas dicker, zur Spitze hin verjüngend
      const progress = c / cushionCount;
      const cScale = (0.7 + (1.0 - progress) * 0.6) * s;
      cushion.scale.set(cScale, cScale * 1.3, cScale); // vertikal gestreckt

      // Positionierung entlang des Stamms (mehr Dichte im oberen Bereich)
      const cY = branchHeight * (0.25 + progress * 0.7);
      // Leichter spiralförmiger Versatz um den Stamm herum
      const cAngle = c * 2.4;
      const cDist = 0.025 * s;
      cushion.position.set(Math.sin(cAngle) * cDist, cY, Math.cos(cAngle) * cDist);
      cushion.rotation.set(Math.random() * 0.3, cAngle, Math.random() * 0.3);

      bGroup.add(cushion);
      cushions.push(cushion);

      // Beerenzapfen in Clustern an den Nadelkissen anbringen
      if (progress > 0.3 && progress < 0.9) {
        const berryGeo = new THREE.IcosahedronGeometry(0.012 * s, 0);
        const berryCount = 2 + Math.floor(Math.random() * 3);

        for (let bg = 0; bg < berryCount; bg++) {
          const berry = new THREE.Mesh(berryGeo, berryMat);
          const bAngle = bg * (Math.PI * 2 / berryCount) + Math.random() * 0.5;
          const bRadius = cScale * 0.08;

          berry.position.set(
            cushion.position.x + Math.sin(bAngle) * bRadius,
            cushion.position.y + (Math.random() - 0.5) * 0.05 * s,
            cushion.position.z + Math.cos(bAngle) * bRadius
          );

          bGroup.add(berry);
        }
      }
    }

    group.add(bGroup);

    bGroup.traverse(child => {
      if (child.isMesh) {
        prepareForExplosion(child, new THREE.Vector3(Math.sin(angle) * 1.5, 0.4, Math.cos(angle) * 1.5));
      }
    });

    branches.push({
      group: bGroup,
      baseRot: [leanX, angle, leanZ]
    });
  }

  group.userData.update = function (time, windSpeed = 1.0) {
    const sway = Math.sin(time * 1.8) * 0.03 * windSpeed * s;
    const swayCos = Math.cos(time * 1.5) * 0.02 * windSpeed * s;

    branches.forEach((b, idx) => {
      b.group.rotation.x = b.baseRot[0] + sway * (idx % 2 === 0 ? 0.5 : -0.5);
      b.group.rotation.z = b.baseRot[2] + swayCos * (idx % 3 === 0 ? 0.3 : -0.3);
    });
  };

  return group;
}

// 21. Steinpilz (Boletus edulis)
export function createSteinpilz(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Steinpilz',
    latin: 'Boletus edulis',
    category: 'Flora (Pilz)',
    description: 'Der König der Speisepilze, lebt in Mykorrhiza-Symbiose mit der Waldkiefer. Charakteristisch sind der bauchige, hellbräunliche Stiel und der halbkugelige, dunkel-lederbraune Hut mit olivgelben Röhren auf der Unterseite.',
    polyCount: 0
  };

  const s = scale;

  // Materialien
  const stemMat = new THREE.MeshStandardMaterial({ color: 0xede4ca, roughness: 0.9, flatShading: true });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x61412c, roughness: 0.8, flatShading: true });
  const poresMat = new THREE.MeshStandardMaterial({ color: 0xa8a358, roughness: 0.95, flatShading: true });

  // 1. Stiel
  const stemHeight = 0.35 * s;
  const stemGeo = new THREE.CylinderGeometry(0.06 * s, 0.11 * s, stemHeight, 12, 6);
  const posStem = stemGeo.attributes.position;
  for (let i = 0; i < posStem.count; i++) {
    const y = posStem.getY(i);
    const normY = y / stemHeight;
    const factor = 1.0 + Math.max(0, 0.38 * (1.0 - Math.pow(normY + 0.1, 2) * 4));
    posStem.setX(i, posStem.getX(i) * factor);
    posStem.setZ(i, posStem.getZ(i) * factor);
  }
  stemGeo.computeVertexNormals();

  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = stemHeight / 2;
  group.add(stem);
  prepareForExplosion(stem, new THREE.Vector3(0, -0.2, 0));

  // 2. Röhren
  const poresGeo = new THREE.CylinderGeometry(0.19 * s, 0.19 * s, 0.02 * s, 16, 1);
  const pores = new THREE.Mesh(poresGeo, poresMat);
  pores.position.y = stemHeight - 0.01 * s;
  group.add(pores);
  prepareForExplosion(pores, new THREE.Vector3(0, 0.1, 0));

  // 3. Hut
  const capGeo = new THREE.SphereGeometry(0.20 * s, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.scale.set(1.0, 0.65, 1.0);
  cap.position.y = stemHeight - 0.01 * s;
  group.add(cap);
  prepareForExplosion(cap, new THREE.Vector3(0, 0.4, 0));

  group.userData.update = function (time, windSpeed = 1.0) { };

  return group;
}

// 22. Moosteppich (Pleurozium schreberi)
export function createMossPatch(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Moosteppich',
    latin: 'Pleurozium schreberi',
    category: 'Flora (Moos)',
    description: 'Ein detailreiches Polster aus Rotstängelmoos. Es besteht aus vielen wolkig ineinandergewachsenen Moosknubbeln, feinen Moosblättchen, rötlichen Sporenkapseln und einigen abgefallenen braunen Kiefernnadeln auf der Oberfläche.',
    polyCount: 0
  };

  const s = scale;

  // Farb-Materialien
  const mossBaseMat = new THREE.MeshStandardMaterial({ color: 0x3d5e1f, roughness: 1.0, flatShading: true });
  const mossMidMat = new THREE.MeshStandardMaterial({ color: 0x557a2b, roughness: 1.0, flatShading: true });
  const mossTopMat = new THREE.MeshStandardMaterial({ color: 0x7da844, roughness: 0.95, flatShading: true });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x9e3f28, roughness: 1.0, flatShading: true });
  const capsuleMat = new THREE.MeshStandardMaterial({ color: 0xbfb654, roughness: 0.9, flatShading: true });
  const needleMat = new THREE.MeshStandardMaterial({ color: 0x5c4233, roughness: 1.0, flatShading: true });

  // 1. Hügelige Basis
  const baseGeo = new THREE.BoxGeometry(0.6 * s, 0.05 * s, 0.6 * s, 4, 1, 4);
  const baseMesh = new THREE.Mesh(baseGeo, mossBaseMat);
  baseMesh.position.y = 0.015 * s;
  group.add(baseMesh);
  prepareForExplosion(baseMesh, new THREE.Vector3(0, -0.05, 0));

  // 2. Wolkige Moosknubbel
  const clusterCount = 35;
  const clusterMeshes = [];
  for (let i = 0; i < clusterCount; i++) {
    const px = (Math.random() - 0.5) * 0.52 * s;
    const pz = (Math.random() - 0.5) * 0.52 * s;
    const dist = Math.sqrt(px * px + pz * pz);
    const heightFactor = Math.max(0, 1.0 - Math.pow(dist / (0.36 * s), 2));
    const py = 0.02 * s + heightFactor * 0.06 * s + Math.random() * 0.015 * s;

    const r = (0.05 + Math.random() * 0.06) * s * (0.6 + heightFactor * 0.4);
    const geo = new THREE.DodecahedronGeometry(r, 0);

    let mat = mossMidMat;
    if (py > 0.06 * s) {
      mat = mossTopMat;
    } else if (py < 0.035 * s) {
      mat = mossBaseMat;
    }

    const knubbel = new THREE.Mesh(geo, mat);
    knubbel.scale.set(1.1, 0.7, 1.1);
    knubbel.position.set(px, py, pz);
    knubbel.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.4);

    group.add(knubbel);
    prepareForExplosion(knubbel, new THREE.Vector3(px * 1.8, 0.1, pz * 1.8));
    clusterMeshes.push(knubbel);
  }

  // 3. Feine Moosblättchen
  const leafCount = 40;
  const leafGeo = new THREE.ConeGeometry(0.008 * s, 0.03 * s, 3);
  leafGeo.rotateX(0.2);
  for (let i = 0; i < leafCount; i++) {
    const px = (Math.random() - 0.5) * 0.48 * s;
    const pz = (Math.random() - 0.5) * 0.48 * s;
    const dist = Math.sqrt(px * px + pz * pz);
    const heightFactor = Math.max(0, 1.0 - Math.pow(dist / (0.36 * s), 2));
    const py = 0.03 * s + heightFactor * 0.06 * s;

    const leaf = new THREE.Mesh(leafGeo, mossTopMat);
    leaf.position.set(px, py, pz);
    leaf.rotation.set((Math.random() - 0.5) * 0.5, Math.random() * Math.PI, (Math.random() - 0.5) * 0.5);
    group.add(leaf);
    prepareForExplosion(leaf, new THREE.Vector3(px * 2.0, 0.2, pz * 2.0));
  }

  // 4. Mooskapseln
  const capsuleCount = 22;
  const capsuleStems = [];
  for (let i = 0; i < capsuleCount; i++) {
    const cGroup = new THREE.Group();
    const angle = Math.random() * Math.PI * 2;
    const dist = (0.05 + Math.random() * 0.16) * s;
    const px = Math.sin(angle) * dist;
    const pz = Math.cos(angle) * dist;
    const heightFactor = Math.max(0, 1.0 - Math.pow(dist / (0.36 * s), 2));
    const py = 0.03 * s + heightFactor * 0.06 * s;

    cGroup.position.set(px, py, pz);

    const stemLen = (0.07 + Math.random() * 0.06) * s;
    const stemGeo = new THREE.CylinderGeometry(0.002 * s, 0.002 * s, stemLen, 4, 2);
    const posStem = stemGeo.attributes.position;
    for (let j = 0; j < posStem.count; j++) {
      const sy = posStem.getY(j);
      if (sy > -stemLen / 2 + 0.01 && sy < stemLen / 2 - 0.01) {
        posStem.setX(j, posStem.getX(j) + Math.sin(sy * 30) * 0.002 * s);
      }
    }
    stemGeo.computeVertexNormals();

    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = stemLen / 2;
    cGroup.add(stem);

    const capGeo = new THREE.CylinderGeometry(0.006 * s, 0.003 * s, 0.014 * s, 5);
    const cap = new THREE.Mesh(capGeo, capsuleMat);
    cap.position.set(0, stemLen, 0);
    cap.rotation.z = 0.5;
    cGroup.add(cap);

    const lidGeo = new THREE.ConeGeometry(0.0065 * s, 0.008 * s, 5);
    const lid = new THREE.Mesh(lidGeo, stemMat);
    lid.position.set(0.003 * s, stemLen + 0.006 * s, 0);
    lid.rotation.z = 0.8;
    cGroup.add(lid);

    cGroup.rotation.set((Math.random() - 0.5) * 0.2, Math.random() * Math.PI, (Math.random() - 0.5) * 0.2);
    group.add(cGroup);
    prepareForExplosion(cGroup, new THREE.Vector3(px * 1.5, 0.35, pz * 1.5));

    capsuleStems.push({
      group: cGroup,
      baseRotX: cGroup.rotation.x,
      baseRotZ: cGroup.rotation.z,
      freq: 1.4 + Math.random() * 1.2
    });
  }

  // 5. Kiefern-Nadeln
  const needleCount = 5;
  for (let i = 0; i < needleCount; i++) {
    const nGroup = new THREE.Group();
    const px = (Math.random() - 0.5) * 0.36 * s;
    const pz = (Math.random() - 0.5) * 0.36 * s;
    const dist = Math.sqrt(px * px + pz * pz);
    const py = 0.04 * s + Math.max(0, 1.0 - Math.pow(dist / (0.36 * s), 2)) * 0.06 * s;

    nGroup.position.set(px, py, pz);

    const needleGeo = new THREE.CylinderGeometry(0.0015 * s, 0.0015 * s, 0.08 * s, 4);
    const n1 = new THREE.Mesh(needleGeo, needleMat);
    n1.rotation.set(0.2, 0, 0.15);
    n1.position.set(0, 0, 0.03 * s);
    nGroup.add(n1);

    const n2 = new THREE.Mesh(needleGeo, needleMat);
    n2.rotation.set(-0.2, 0, -0.15);
    n2.position.set(0, 0, -0.03 * s);
    nGroup.add(n2);

    nGroup.rotation.set(Math.PI / 2 + (Math.random() - 0.5) * 0.3, Math.random() * Math.PI, (Math.random() - 0.5) * 0.3);
    group.add(nGroup);
    prepareForExplosion(nGroup, new THREE.Vector3(px * 1.2, 0.15, pz * 1.2));
  }

  group.userData.update = function (time, windSpeed = 1.0) {
    const strength = 0.10 * windSpeed;
    capsuleStems.forEach((c) => {
      c.group.rotation.x = c.baseRotX + Math.sin(time * c.freq) * strength;
      c.group.rotation.z = c.baseRotZ + Math.cos(time * c.freq * 0.95) * strength;
    });
  };

  return group;
}

// 23. Flechtenkissen (Cladonia rangiferina)
export function createLichen(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Flechtenkissen',
    latin: 'Cladonia rangiferina',
    category: 'Flora (Flechtengewächs)',
    description: 'Ein filigran verzweigtes Kissen der Rentierflechte. Die Geometrie nutzt prozedurale Y-Verzweigungen (Stämme, Ästchen und gegabelte Endspitzen), um die poröse, korallenartige Wuchsform exakt nachzubilden.',
    polyCount: 0
  };

  const s = scale;

  const branchMat = new THREE.MeshStandardMaterial({ color: 0xc1cfc6, roughness: 1.0, flatShading: true });
  const tipMat = new THREE.MeshStandardMaterial({ color: 0xd4e2da, roughness: 0.95, flatShading: true });
  const brownTipMat = new THREE.MeshStandardMaterial({ color: 0x9c7a5f, roughness: 1.0, flatShading: true });

  function createLichenBush(bx, bz, bScale = 1.0) {
    const bush = new THREE.Group();
    bush.position.set(bx, 0, bz);

    const stemHeight = (0.08 + Math.random() * 0.04) * s * bScale;
    const stemGeo = new THREE.CylinderGeometry(0.012 * s, 0.018 * s, stemHeight, 5);
    const stem = new THREE.Mesh(stemGeo, branchMat);
    stem.position.y = stemHeight / 2;
    bush.add(stem);

    const branchCount1 = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < branchCount1; i++) {
      const b1 = new THREE.Group();
      b1.position.set(0, stemHeight, 0);

      const angle = (i / branchCount1) * Math.PI * 2 + Math.random() * 0.4;
      const bAngle = 0.4 + Math.random() * 0.2;
      b1.rotation.set(Math.sin(angle) * bAngle, angle, Math.cos(angle) * bAngle);

      const bHeight1 = (0.07 + Math.random() * 0.04) * s * bScale;
      const bGeo1 = new THREE.CylinderGeometry(0.008 * s, 0.012 * s, bHeight1, 4);
      const bMesh1 = new THREE.Mesh(bGeo1, branchMat);
      bMesh1.position.y = bHeight1 / 2;
      b1.add(bMesh1);

      const branchCount2 = 2;
      for (let j = 0; j < branchCount2; j++) {
        const b2 = new THREE.Group();
        b2.position.set(0, bHeight1, 0);

        const angle2 = (j / branchCount2) * Math.PI + Math.random() * 0.3;
        const bAngle2 = 0.5 + Math.random() * 0.2;
        b2.rotation.set(Math.sin(angle2) * bAngle2, angle2, Math.cos(angle2) * bAngle2);

        const bHeight2 = (0.05 + Math.random() * 0.03) * s * bScale;
        const bGeo2 = new THREE.CylinderGeometry(0.005 * s, 0.008 * s, bHeight2, 4);
        const bMesh2 = new THREE.Mesh(bGeo2, branchMat);
        bMesh2.position.y = bHeight2 / 2;
        b2.add(bMesh2);

        const branchCount3 = 2;
        for (let k = 0; k < branchCount3; k++) {
          const b3 = new THREE.Group();
          b3.position.set(0, bHeight2, 0);

          const angle3 = (k / branchCount3) * Math.PI + Math.random() * 0.2;
          const bAngle3 = 0.6 + Math.random() * 0.15;
          b3.rotation.set(Math.sin(angle3) * bAngle3, angle3, Math.cos(angle3) * bAngle3);

          const bHeight3 = (0.03 + Math.random() * 0.02) * s * bScale;
          const bGeo3 = new THREE.CylinderGeometry(0.002 * s, 0.005 * s, bHeight3, 4);
          const bMesh3 = new THREE.Mesh(bGeo3, tipMat);
          bMesh3.position.y = bHeight3 / 2;
          b3.add(bMesh3);

          if (Math.random() < 0.6) {
            const tipGeo = new THREE.DodecahedronGeometry(0.0055 * s, 0);
            const tip = new THREE.Mesh(tipGeo, brownTipMat);
            tip.position.set(0, bHeight3, 0);
            b3.add(tip);
          } else {
            const tipGeo = new THREE.DodecahedronGeometry(0.0045 * s, 0);
            const tip = new THREE.Mesh(tipGeo, tipMat);
            tip.position.set(0, bHeight3, 0);
            b3.add(tip);
          }

          b2.add(b3);
        }
        b1.add(b2);
      }
      bush.add(b1);
    }
    return bush;
  }

  const bushCount = 14;
  const bushes = [];
  for (let i = 0; i < bushCount; i++) {
    const angle = (i / bushCount) * Math.PI * 2 + Math.random() * 0.3;
    const dist = (i === 0 ? 0.0 : (0.04 + Math.random() * 0.13)) * s;
    const bx = Math.sin(angle) * dist;
    const bz = Math.cos(angle) * dist;

    const edgeFactor = Math.max(0.6, 1.0 - (dist / (0.22 * s)) * 0.35);
    const bScale = edgeFactor * (0.85 + Math.random() * 0.3);

    const bush = createLichenBush(bx, bz, bScale);
    const leanAngle = dist * 1.2;
    bush.rotation.set(Math.sin(angle) * leanAngle, angle, Math.cos(angle) * leanAngle);

    group.add(bush);
    bushes.push(bush);

    bush.traverse(child => {
      if (child.isMesh) {
        prepareForExplosion(child, new THREE.Vector3(bx * 2.2, 0.25, bz * 2.2));
      }
    });
  }

  group.userData.update = function (time, windSpeed = 1.0) {
    const sway = Math.sin(time * 2.0) * 0.02 * windSpeed * s;
    const swayCos = Math.cos(time * 1.7) * 0.015 * windSpeed * s;

    bushes.forEach((bush, idx) => {
      bush.traverse(child => {
        if (child.isMesh && child !== bush.children[0]) {
          child.rotation.x += sway * 0.08 * (idx % 2 === 0 ? 1 : -1);
          child.rotation.z += swayCos * 0.08 * (idx % 3 === 0 ? 1 : -1);
        }
      });
    });
  };

  return group;
}

// 24. Kiefernzapfen (Strobilus pinus)
export function createPineCone(options = {}) {
  const scale = options.scale !== undefined ? options.scale : 1.0;
  const group = new THREE.Group();

  group.userData = {
    name: 'Kiefern-Zapfen',
    latin: 'Strobilus pinus',
    category: 'Flora (Waldstreu)',
    description: 'Ein abgefallener Samenzapfen der Waldkiefer. Die verholzten Schuppen öffnen sich bei Trockenheit und schließen sich bei Feuchtigkeit. Ein typisches Detail des Waldbodens.',
    polyCount: 0
  };

  const s = scale;

  // Material
  const coneMat = new THREE.MeshStandardMaterial({ color: 0x47382c, roughness: 1.0, flatShading: true });

  // 1. Spindel
  const spindleGeo = new THREE.CylinderGeometry(0.01 * s, 0.03 * s, 0.18 * s, 6);
  const spindle = new THREE.Mesh(spindleGeo, coneMat);
  spindle.rotation.x = Math.PI / 2;
  group.add(spindle);
  prepareForExplosion(spindle, new THREE.Vector3(0, -0.05, 0));

  // 2. Schuppen (Fibonacci-Spirale)
  const scaleCount = 45;
  const scaleGeo = new THREE.ConeGeometry(0.015 * s, 0.04 * s, 3);
  scaleGeo.rotateX(Math.PI / 3);

  for (let i = 0; i < scaleCount; i++) {
    const progress = i / scaleCount;
    const zPos = -0.08 * s + progress * 0.16 * s;
    const theta = i * 2.39996;
    const radFactor = Math.sin(progress * Math.PI);
    const radius = 0.045 * s * radFactor + 0.01 * s;

    const scaleMesh = new THREE.Mesh(scaleGeo, coneMat);
    const x = Math.sin(theta) * radius;
    const y = Math.cos(theta) * radius;
    scaleMesh.position.set(x, y, zPos);

    scaleMesh.lookAt(new THREE.Vector3(0, 0, zPos));
    const sc = (0.7 + radFactor * 0.5) * s;
    scaleMesh.scale.set(sc, sc, sc);

    group.add(scaleMesh);
    prepareForExplosion(scaleMesh, new THREE.Vector3(x * 2.5, y * 2.5, zPos * 0.5));
  }

  group.rotation.set(0.1, 0.5, 1.4);
  group.position.y = 0.03 * s;

  group.userData.update = function (time, windSpeed = 1.0) { };

  return group;
}

// ------- HELFER: Ermittelt die Gesamtanzahl der Polygone in einer Gruppe -------
export function calculatePolyCount(group) {
  let count = 0;
  group.traverse(child => {
    if (child.isMesh && child.geometry) {
      const geo = child.geometry;
      if (geo.index) {
        count += geo.index.count / 3;
      } else if (geo.attributes.position) {
        count += geo.attributes.position.count / 3;
      }
    }
  });
  return Math.round(count);
}
