/* ═══════════════════════════════════════════════════════════════════
   Determinismus 3D — zwei Loss-Landschaften nebeneinander
   Links: globaler RNG → Pfade driften auseinander
   Rechts: PRNGKey(42) → Pfade legen sich übereinander
   ═══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  // ─── Loss-Funktion und Gradient ────────────────────────────────
  // Wellige Landschaft mit mehreren lokalen Minima + globalem Bowl
  const A = 1.6, K = 0.55, Q = 0.018;
  function loss(x, z){
    return A * Math.sin(K * x) * Math.cos(K * z) + Q * (x*x + z*z);
  }
  function gradX(x, z){
    return A * K * Math.cos(K * x) * Math.cos(K * z) + 2 * Q * x;
  }
  function gradZ(x, z){
    return -A * K * Math.sin(K * x) * Math.sin(K * z) + 2 * Q * z;
  }

  // ─── Mulberry32 — deterministischer PRNG ──────────────────────
  function mulberry32(seed){
    let s = seed >>> 0;
    return function(){
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ─── Pfad berechnen (gradient descent + Noise) ────────────────
  function computePath(rng, opts){
    opts = opts || {};
    const steps = opts.steps || 140;
    const lr = opts.lr || 0.18;
    const noise = opts.noise || 0.45;
    // Startposition aus rng (1× Aufruf für Reproduzierbarkeit der Trajektorie)
    let x = (rng() - 0.5) * 14;
    let z = (rng() - 0.5) * 14;
    const path = [];
    for (let i = 0; i < steps; i++){
      const y = loss(x, z);
      path.push([x, y, z]);
      const gx = gradX(x, z);
      const gz = gradZ(x, z);
      const nx = (rng() - 0.5) * noise;
      const nz = (rng() - 0.5) * noise;
      x -= lr * (gx + nx);
      z -= lr * (gz + nz);
      if (x < -10) x = -10; if (x > 10) x = 10;
      if (z < -10) z = -10; if (z > 10) z = 10;
    }
    return path;
  }

  // ─── Surface-Mesh bauen ───────────────────────────────────────
  function buildSurface(){
    const seg = 80;
    const size = 22;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++){
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = loss(x, z);
      pos.setY(i, y);
      // Farbe nach Höhe — drei Zonen: dunkles Grün (tief) · Olive (mid) · sattes Rot (hoch)
      const t = Math.max(0, Math.min(1, (y + 2.2) / 5.4));
      let r, g, b;
      if (t < 0.5) {
        // Tiefen: dunkles Grün → helles Oliv
        const u = t / 0.5;
        r = 0.10 + 0.55 * u;
        g = 0.34 + 0.30 * u;
        b = 0.18 + 0.10 * u;
      } else {
        // Höhen: Oliv → leuchtendes Rot
        const u = (t - 0.5) / 0.5;
        r = 0.65 + 0.20 * u;
        g = 0.64 - 0.50 * u;
        b = 0.28 - 0.18 * u;
      }
      colors[i*3]     = r;
      colors[i*3 + 1] = g;
      colors[i*3 + 2] = b;
    }
    geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.65,
      metalness: 0.08,
      flatShading: false,
      transparent: false
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;

    // Höhenlinien-Overlay — kräftiger, hilft beim Lesen der Topographie
    const wireGeo = new THREE.WireframeGeometry(geo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x1a1f2e,
      transparent: true,
      opacity: 0.16
    });
    const wire = new THREE.LineSegments(wireGeo, wireMat);
    mesh.add(wire);

    return mesh;
  }

  // ─── Scene-Factory ────────────────────────────────────────────
  function buildScene(canvas, accentColor){
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xece4d4, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xd8cdb8, 28, 60);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(20, 16, 20);
    camera.lookAt(0, 0, 0);

    // Lights — stärkere Direktionalität für klare Topografie-Lesbarkeit
    const amb = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(amb);
    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(10, 18, 8);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xc8d4ff, 0.30);
    fill.position.set(-8, 6, -10);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffe0a0, 0.22);
    rim.position.set(0, 4, -14);
    scene.add(rim);

    // Surface
    const surface = buildSurface();
    scene.add(surface);

    // Trail-Container
    const trailGroup = new THREE.Group();
    scene.add(trailGroup);

    // Ball (aktuell laufender)
    const ballGeo = new THREE.SphereGeometry(0.28, 24, 16);
    const ballMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: 0.9,
      metalness: 0.3,
      roughness: 0.4
    });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.visible = false;
    scene.add(ball);


    // Achsen-Ring am Boden
    const ringGeo = new THREE.RingGeometry(10, 10.15, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = -2.4;
    scene.add(ring);

    function resize(){
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    return { renderer, scene, camera, ball, trailGroup, accentColor, resize };
  }

  // ─── Run-Animation ────────────────────────────────────────────
  function spawnRun(ctx, path){
    ctx.activePath = path;
    ctx.activeStep = 0;
    ctx.ball.visible = true;
  }

  function finalizeTrail(ctx, path){
    // Pfad-Punkte auf y-Offset
    const points = path.map(p => new THREE.Vector3(p[0], p[1] + 0.45, p[2]));
    const curve = new THREE.CatmullRomCurve3(points);

    // Outer Halo — heller Rand, hebt den Trail von ähnlich gefärbtem Untergrund ab
    const haloGeo = new THREE.TubeGeometry(curve, Math.max(20, path.length), 0.20, 8, false);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xfaf6ee,           // Cream-Halo gegen alle Höhenfarben
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    ctx.trailGroup.add(halo);

    // Inner Tube — Akzentfarbe
    const tubeGeo = new THREE.TubeGeometry(curve, Math.max(20, path.length), 0.13, 6, false);
    const mat = new THREE.MeshBasicMaterial({
      color: ctx.accentColor,
      transparent: false,
      depthWrite: true
    });
    const tube = new THREE.Mesh(tubeGeo, mat);
    ctx.trailGroup.add(tube);

    // Start-Marker — Halo + Kern
    const startHaloGeo = new THREE.SphereGeometry(0.32, 14, 10);
    const startHaloMat = new THREE.MeshBasicMaterial({
      color: 0xfaf6ee,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    });
    const startHalo = new THREE.Mesh(startHaloGeo, startHaloMat);
    startHalo.position.set(path[0][0], path[0][1] + 0.5, path[0][2]);
    ctx.trailGroup.add(startHalo);

    const startGeo = new THREE.SphereGeometry(0.22, 14, 10);
    const startMat = new THREE.MeshBasicMaterial({
      color: ctx.accentColor
    });
    const startMarker = new THREE.Mesh(startGeo, startMat);
    startMarker.position.set(path[0][0], path[0][1] + 0.5, path[0][2]);
    ctx.trailGroup.add(startMarker);
  }

  function clearTrails(ctx){
    while (ctx.trailGroup.children.length){
      const c = ctx.trailGroup.children[0];
      ctx.trailGroup.remove(c);
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    }
  }

  // ─── Init ─────────────────────────────────────────────────────
  function init(){
    const canvasL = document.getElementById('detCanvasLeft');
    const canvasR = document.getElementById('detCanvasRight');
    if (!canvasL || !canvasR) return;

    const left  = buildScene(canvasL, 0xb54338);   // Crimson — passt zum Tag „Globaler RNG"
    const right = buildScene(canvasR, 0x4760ff);   // helles Indigo — passt zum Tag „PRNGKey(42)"

    left.runs = 0;
    right.runs = 0;
    left.activePath = null;
    right.activePath = null;

    const leftRunsEl  = document.getElementById('leftRuns');
    const rightRunsEl = document.getElementById('rightRuns');

    // Deterministischer RNG für rechts wird bei jedem Reset frisch geseedet
    function newRightRng(){ return mulberry32(42); }
    // Globaler Math.random für links
    const leftRng = Math.random;

    function doReset(side){
      const ctx = side === 'left' ? left : right;
      const rng = side === 'left' ? leftRng : newRightRng();
      const path = computePath(rng, { steps: 130, lr: 0.16, noise: 0.55 });
      // Falls schon ein aktiver Lauf läuft → den alten finalisieren
      if (ctx.activePath){
        finalizeTrail(ctx, ctx.activePath);
      }
      spawnRun(ctx, path);
      ctx.runs++;
      if (side === 'left') leftRunsEl.textContent = ctx.runs;
      else rightRunsEl.textContent = ctx.runs;
    }

    function doBurst(n){
      for (let i = 0; i < n; i++){
        const lp = computePath(leftRng,    { steps: 130, lr: 0.16, noise: 0.55 });
        const rp = computePath(newRightRng(),{ steps: 130, lr: 0.16, noise: 0.55 });
        finalizeTrail(left, lp);
        finalizeTrail(right, rp);
      }
      left.runs += n;
      right.runs += n;
      leftRunsEl.textContent = left.runs;
      rightRunsEl.textContent = right.runs;
      // Bälle ausblenden — wir haben keinen aktiven Lauf
      left.ball.visible = false; left.activePath = null;
      right.ball.visible = false; right.activePath = null;
    }

    function doClear(){
      clearTrails(left);
      clearTrails(right);
      left.runs = 0; right.runs = 0;
      leftRunsEl.textContent = 0;
      rightRunsEl.textContent = 0;
      left.ball.visible = false; left.activePath = null;
      right.ball.visible = false; right.activePath = null;
    }

    // Buttons
    document.getElementById('detResetBtn').addEventListener('click', () => {
      doReset('left');
      doReset('right');
    });
    document.getElementById('detBurstBtn').addEventListener('click', () => doBurst(25));
    document.getElementById('detClearBtn').addEventListener('click', doClear);

    // Resize
    function resizeAll(){
      left.resize();
      right.resize();
    }
    window.addEventListener('resize', resizeAll);
    resizeAll();
    // Kurze Verzögerung — falls Container noch ohne Größe
    setTimeout(resizeAll, 100);
    setTimeout(resizeAll, 500);

    // Sichtbarkeitsbeobachtung — RAF nur wenn Section sichtbar
    let visible = false;
    const detSection = document.getElementById('sdet');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => visible = e.isIntersecting);
    }, { threshold: 0.05 });
    obs.observe(detSection);

    // Auto-Initial-Run nach erstem Sichtbar-Werden
    let initialDone = false;

    // Animations-Schleife
    function tickSide(ctx){
      if (ctx.activePath){
        ctx.activeStep += 1.4;  // Ball-Geschwindigkeit
        const idx = Math.floor(ctx.activeStep);
        if (idx >= ctx.activePath.length){
          finalizeTrail(ctx, ctx.activePath);
          ctx.activePath = null;
          ctx.ball.visible = false;
        } else {
          const p = ctx.activePath[idx];
          ctx.ball.position.set(p[0], p[1] + 0.32, p[2]);
        }
      }
      // Sehr sanfte Kamera-Rotation
      const t = performance.now() * 0.00004;
      const r = 22;
      ctx.camera.position.x = r * Math.cos(t);
      ctx.camera.position.z = r * Math.sin(t);
      ctx.camera.position.y = 14;
      ctx.camera.lookAt(0, 0, 0);
      ctx.renderer.render(ctx.scene, ctx.camera);
    }

    function loop(){
      if (visible){
        if (!initialDone){
          initialDone = true;
          doReset('left');
          doReset('right');
        }
        tickSide(left);
        tickSide(right);
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // ─── Bootstrap ────────────────────────────────────────────────
  function boot(){
    if (!window.THREE) { setTimeout(boot, 50); return; }
    init();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
