/* ═══════════════════════════════════════════════════════════════
   INTERACTIVE LAYER — runs after base IIFE in main file
   ═══════════════════════════════════════════════════════════════ */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ─────────────── BOOT SCREEN ─────────────── */
  function runBoot(){
    const boot = document.getElementById('boot');
    if(!boot) return;
    const linesEl = boot.querySelector('.boot__lines');
    const progEl = boot.querySelector('.boot__progress-bar');
    const steps = [
      ['[init]',   'python 3.12 · keras 3.0.5 detected',                 'OK'],
      ['[env]',    'KERAS_BACKEND = "jax"',                              'SET'],
      ['[trace]',  'tracing model forward-pass …',                       '•'],
      ['[jaxpr]',  'lowered to Jaxpr · 127 primitives',                  '•'],
      ['[xla]',    'compiling HLO → device binary (tpu-v5p) …',          '•'],
      ['[fuse]',   'fusing matmul + bias + gelu (×18)',                  '•'],
      ['[ready]',  'runtime ready · hand-off to UI layer',               'GO'],
    ];
    let i = 0;
    const addLine = () => {
      if(i >= steps.length){
        setTimeout(() => boot.classList.add('done'), 260);
        setTimeout(() => boot.remove(), 1200);
        return;
      }
      const [t,m,s] = steps[i];
      const row = document.createElement('div');
      row.className = 'boot__line';
      row.innerHTML = `<span class="t">${t}</span><span class="m">${m}</span><span class="s ${s==='OK'||s==='SET'||s==='GO'?'s--ok':''}">${s}</span>`;
      linesEl.appendChild(row);
      // fade older lines
      const all = linesEl.querySelectorAll('.boot__line');
      all.forEach((l,idx) => { if(idx < all.length - 4) l.classList.add('boot__line--faded'); });
      progEl.style.width = (((i+1)/steps.length)*100).toFixed(1) + '%';
      i++;
      setTimeout(addLine, reduce ? 120 : (280 + Math.random()*260));
    };
    addLine();
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', runBoot);
  } else runBoot();

  /* ─────────────── TOKEN RAIN (hero canvas) ─────────────── */
  function initTokenRain(){
    const canvas = document.getElementById('tokenCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const tokens = [
      'jit','grad','vmap','pmap','keras.ops','jnp','tf','torch','XLA','HLO',
      'Dense','Adam','loss','∂u/∂t','θ','ν·∇²u','fit()','pjit','trace','[·,·]',
      '@jax.jit','fn(x)','Array','compile','device','TPU','GPU','f32','bf16',
      'shard','psum','lax','scan','vjp','jvp','haiku','flax'
    ];
    let W=0,H=0,dpr=Math.min(2,window.devicePixelRatio||1);
    const drops = [];
    function resize(){
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W*dpr; canvas.height = H*dpr;
      ctx.scale(dpr,dpr);
      ctx.textBaseline = 'top';
    }
    function spawn(n){
      for(let i=0;i<n;i++){
        drops.push({
          x: Math.random()*W,
          y: Math.random()*H - H,
          v: 20 + Math.random()*50,
          tok: tokens[(Math.random()*tokens.length)|0],
          size: 10 + Math.random()*4,
          a: 0.08 + Math.random()*0.25,
          hue: Math.random() < 0.15 ? 'blue' : 'mute',
        });
      }
    }
    resize(); spawn(80);
    window.addEventListener('resize', () => { resize(); });
    let last = performance.now(), running = true;
    function tick(t){
      if(!running) return;
      const dt = Math.min(0.05,(t-last)/1000); last = t;
      ctx.clearRect(0,0,W,H);
      ctx.font = '400 12px "JetBrains Mono",monospace';
      for(const d of drops){
        d.y += d.v * dt;
        if(d.y > H + 20){
          d.y = -20; d.x = Math.random()*W;
          d.tok = tokens[(Math.random()*tokens.length)|0];
        }
        ctx.fillStyle = d.hue === 'blue'
          ? `rgba(79,142,247,${d.a*1.2})`
          : `rgba(255,255,255,${d.a*0.5})`;
        ctx.fillText(d.tok, d.x, d.y);
      }
      requestAnimationFrame(tick);
    }
    if(!reduce) requestAnimationFrame(tick);

    // pause when not in viewport
    const io = new IntersectionObserver((es) => {
      es.forEach(e => {
        if(e.isIntersecting && !running){
          running = true; last = performance.now();
          if(!reduce) requestAnimationFrame(tick);
        } else if(!e.isIntersecting){
          running = false;
        }
      });
    },{threshold:0.01});
    io.observe(canvas);
  }
  initTokenRain();

  /* ─────────────── PARALLAX BG ─────────────── */
  function initParallax(){
    const el = document.getElementById('parallaxBg');
    if(!el || reduce) return;
    let target = 0, cur = 0, raf = 0;
    const onScroll = () => {
      target = window.scrollY;
      if(!raf) raf = requestAnimationFrame(update);
    };
    const update = () => {
      cur += (target - cur) * 0.08;
      el.style.transform = `translateY(${-cur * 0.15}px)`;
      if(Math.abs(target-cur) > 0.3) raf = requestAnimationFrame(update);
      else raf = 0;
    };
    window.addEventListener('scroll', onScroll, {passive:true});
  }
  initParallax();

  /* ─────────────── TIMELINE SCRUB MARKER ─────────────── */
  function initTimelineScrub(){
    const tl = document.querySelector('.timeline');
    if(!tl) return;
    const marker = document.createElement('div');
    marker.className = 'tl-marker';
    tl.appendChild(marker);
    const rows = [...tl.querySelectorAll('.tl-row')];
    // restructure: rows use display:contents, so get direct children (year+card pairs)
    const pairs = [];
    const years = [...tl.querySelectorAll('.tl-year')];
    const cards = [...tl.querySelectorAll('.tl-card')];
    years.forEach((y,i) => pairs.push({y, card: cards[i], row: rows[i]}));

    let ticking = false;
    const onScroll = () => {
      if(ticking) return; ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const tlRect = tl.getBoundingClientRect();
        const focusY = window.innerHeight * 0.5;
        // find active
        let activeIdx = -1;
        pairs.forEach((p,i) => {
          const r = p.y.getBoundingClientRect();
          const cy = r.top + r.height/2;
          if(cy <= focusY) activeIdx = i;
        });
        pairs.forEach((p,i) => {
          p.row.classList.toggle('past', i < activeIdx);
          p.row.classList.toggle('active', i === activeIdx);
        });
        if(activeIdx >= 0){
          const r = pairs[activeIdx].y.getBoundingClientRect();
          const topInTL = r.top - tlRect.top + r.height/2 - 9;
          marker.style.top = topInTL + 'px';
          marker.style.opacity = '1';
        } else {
          marker.style.opacity = '0';
        }
      });
    };
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }
  initTimelineScrub();

  /* ─────────────── ARCH DISPATCH PACKETS + CLICKABLE BACKEND ─────────────── */
  function initArch(){
    const conn = document.getElementById('archConn');
    if(!conn) return;
    const svg = conn.querySelector('svg');
    const paths = [...svg.querySelectorAll('path')];
    // create packets
    const packets = [];
    for(let i=0;i<3;i++){
      const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('r','3');
      c.setAttribute('class','arch-packet');
      svg.appendChild(c);
      packets.push({el:c, path:paths[i%paths.length], t:Math.random(), speed:0.4+Math.random()*0.3});
    }
    let selectedIdx = 1; // jax
    const backends = [...document.querySelectorAll('.arch-backend')];
    backends.forEach((b,i) => {
      b.addEventListener('click', () => {
        backends.forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        selectedIdx = i;
        // update all paths to route through selected
        paths.forEach((p,j) => {
          p.classList.toggle('active', j === selectedIdx);
        });
        // badge update
        backends.forEach((bb,j) => {
          const badge = bb.querySelector('.arch-backend__badge');
          if(badge) badge.textContent = j === selectedIdx ? 'Selected' : '';
        });
      });
    });
    // initialize selection
    backends[selectedIdx]?.classList.add('selected');
    paths.forEach((p,j) => p.classList.toggle('active', j === selectedIdx));

    // animate packets along their path
    if(reduce) return;
    let last = performance.now();
    const tick = (t) => {
      const dt = Math.min(0.05,(t-last)/1000); last=t;
      packets.forEach(p => {
        // all packets route through selected path
        p.path = paths[selectedIdx];
        p.t += p.speed * dt;
        if(p.t > 1.2){ p.t = -0.1; }
        if(p.t < 0 || p.t > 1){ p.el.style.opacity='0'; return; }
        try{
          const L = p.path.getTotalLength();
          const pt = p.path.getPointAtLength(p.t * L);
          p.el.setAttribute('cx', pt.x);
          p.el.setAttribute('cy', pt.y);
          p.el.style.opacity = (1 - Math.abs(0.5 - p.t)*1.2).toFixed(2);
        }catch(e){}
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  initArch();

  /* ─────────────── CODE BACKEND SWITCHER ─────────────── */
  function initCodeSwitcher(){
    const tabs = document.querySelectorAll('.code-tab-btn');
    if(!tabs.length) return;
    const envVal = document.getElementById('codeEnvVal');
    const badge = document.getElementById('codeBadge');
    const card = document.getElementById('codeCard');
    tabs.forEach(t => {
      t.addEventListener('click', () => {
        const be = t.dataset.backend;
        tabs.forEach(x => x.setAttribute('aria-selected', x === t ? 'true' : 'false'));
        if(envVal){
          envVal.textContent = be;
          envVal.classList.remove('code-swap');
          void envVal.offsetWidth;
          envVal.classList.add('code-swap');
        }
        if(badge){
          badge.textContent = 'KERAS_BACKEND = ' + be;
        }
        if(card){
          const colors = {jax:'rgba(79,142,247,.35)',tensorflow:'rgba(245,184,74,.35)',torch:'rgba(255,90,95,.35)'};
          card.style.borderColor = colors[be] || '';
        }
      });
    });
  }
  initCodeSwitcher();

  /* ─────────────── JAX PLAYGROUNDS ─────────────── */
  function initPlaygrounds(){
    // JIT
    const jitBtn = document.getElementById('pgJitBtn');
    if(jitBtn){
      const stages = document.querySelectorAll('.pg-jit__stage');
      jitBtn.addEventListener('click', () => {
        stages.forEach(s => s.classList.remove('on'));
        jitBtn.disabled = true;
        jitBtn.textContent = 'Compiling…';
        stages.forEach((s,i) => {
          setTimeout(() => s.classList.add('on'), i * 320);
        });
        setTimeout(() => {
          jitBtn.disabled = false;
          jitBtn.textContent = 'Re-run trace';
        }, stages.length * 320 + 300);
      });
    }

    // GRAD
    const gradSvg = document.getElementById('pgGrad');
    if(gradSvg){
      const point = gradSvg.querySelector('.pg-grad__pt');
      const tangent = gradSvg.querySelector('.pg-grad__tan');
      const valEl = document.getElementById('pgGradVal');
      const W = 200, H = 60;
      // f(x) = sin(x/20) * 20 + 30;  f'(x) = cos(x/20)
      const fy = x => Math.sin(x/30)*18 + 30;
      const fd = x => Math.cos(x/30) * (18/30);
      let x = 100;
      const update = () => {
        const y = fy(x);
        point.setAttribute('cx', x);
        point.setAttribute('cy', y);
        const d = fd(x);
        const dx = 35;
        tangent.setAttribute('x1', x - dx);
        tangent.setAttribute('y1', y - d*dx);
        tangent.setAttribute('x2', x + dx);
        tangent.setAttribute('y2', y + d*dx);
        if(valEl) valEl.textContent = `∂f/∂x = ${d.toFixed(3)}`;
      };
      update();
      let dragging = false;
      const setFromEvent = (ev) => {
        const r = gradSvg.getBoundingClientRect();
        const cx = (ev.touches?ev.touches[0].clientX:ev.clientX) - r.left;
        x = Math.max(10, Math.min(W-10, cx * (W/r.width)));
        update();
      };
      gradSvg.addEventListener('pointerdown', e => {dragging=true; setFromEvent(e); gradSvg.setPointerCapture(e.pointerId)});
      gradSvg.addEventListener('pointermove', e => {if(dragging) setFromEvent(e)});
      gradSvg.addEventListener('pointerup', () => dragging=false);
      gradSvg.addEventListener('pointercancel', () => dragging=false);
    }

    // VMAP
    const vmapSlider = document.getElementById('pgVmapSlider');
    if(vmapSlider){
      const viz = document.getElementById('pgVmapViz');
      const lbl = document.getElementById('pgVmapLbl');
      const render = () => {
        const n = parseInt(vmapSlider.value,10);
        viz.innerHTML = '';
        for(let i=0;i<n;i++){
          const c = document.createElement('div');
          c.className = 'pg-vmap__cell';
          c.style.opacity = (0.4 + (i/n)*0.6).toFixed(2);
          c.style.animation = `vmapIn .25s ${i*10}ms both`;
          viz.appendChild(c);
        }
        if(lbl) lbl.innerHTML = `batch = <b>${n}</b> · eine Funktion, N parallele Auswertungen`;
      };
      vmapSlider.addEventListener('input', render);
      render();
    }

    // PMAP
    const pmapBtn = document.getElementById('pgPmapBtn');
    if(pmapBtn){
      const devs = document.getElementById('pgPmapDevs');
      const lbl = document.getElementById('pgPmapLbl');
      let n = 4;
      const render = () => {
        devs.innerHTML = '';
        for(let i=0;i<n;i++){
          const d = document.createElement('div');
          d.className = 'pg-pmap__device';
          d.style.animation = `pmapIn .3s ${i*50}ms both`;
          devs.appendChild(d);
        }
        if(lbl) lbl.textContent = `${n} devices · SPMD shard`;
      };
      pmapBtn.addEventListener('click', () => {
        n = n === 1 ? 2 : n === 2 ? 4 : n === 4 ? 8 : n === 8 ? 16 : 1;
        render();
      });
      render();
    }
  }
  initPlaygrounds();

  /* ─────────────── PERFORMANCE BAR DETAILS ─────────────── */
  function initPerfBars(){
    const bars = document.querySelectorAll('.bar');
    const details = {
      '1.0': 'Eager · keine Fusion · 100% Baseline',
      '1.4': 'TorchDynamo · AOT Inductor · selektive Fusion',
      '1.3': 'tf.function · XLA nur opt-in',
      '2.1': 'jit() · XLA volle Operator-Fusion',
      '3.1': 'TPU v5p · SparseCore · 459 TFLOPS bf16',
      '3.8': 'TPU Pod · pjit · collective all-reduce'
    };
    bars.forEach(b => {
      const val = b.querySelector('.bar__val')?.textContent.replace('×','').trim();
      const d = details[val];
      if(!d) return;
      const det = document.createElement('div');
      det.className = 'bar__detail';
      det.innerHTML = `<span>→ ${d}</span>`;
      b.querySelector('.bar__track').appendChild(det);
    });
  }
  initPerfBars();

  /* ─────────────── HERO TITLE GLITCH ─────────────── */
  function initHeroGlitch(){
    // wrap individual letters in glitch spans
    const h1 = document.querySelector('#s1 h1');
    if(!h1 || reduce) return;
    // only wrap a few chars to avoid layout shift
    const target = h1.querySelectorAll('em');
    target.forEach(em => {
      em.classList.add('glitch-target');
    });
    setInterval(() => {
      target.forEach(em => {
        if(Math.random() < 0.4){
          em.classList.add('glitching');
          setTimeout(() => em.classList.remove('glitching'), 400);
        }
      });
    }, 4200);
  }
  initHeroGlitch();

  /* ─────────────── 3D BACKGROUND-ORB (Wireframe-Struktur hinter allem) ─────────────── */
  // Subtil rotierende geometrische Struktur — gibt dem ambient-glow Tiefe ohne aufdringlich zu sein.
  function initOrb3D(){
    const mount = document.getElementById('orb3d');
    if(!mount || reduce) return;
    const tryInit = () => {
      if(typeof THREE === 'undefined'){ setTimeout(tryInit, 80); return; }
      buildOrb();
    };
    tryInit();

    function buildOrb(){
      const scene = new THREE.Scene();
      const w = () => mount.clientWidth;
      const h = () => mount.clientHeight;
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
      camera.position.set(0, 0, 8);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w(), h());
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);

      // Äußere Wireframe-Dodecahedron (Haupt-Struktur)
      const outer = new THREE.Mesh(
        new THREE.DodecahedronGeometry(3.2, 0),
        new THREE.MeshBasicMaterial({ color: 0x4f8ef7, wireframe: true, transparent: true, opacity: 0.55 })
      );
      scene.add(outer);

      // Innere Icosahedron gegenläufig rotierend
      const inner = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.8, 0),
        new THREE.MeshBasicMaterial({ color: 0x8bb4ff, wireframe: true, transparent: true, opacity: 0.4 })
      );
      scene.add(inner);

      // Ganz innen kleiner Octahedron als Fokus-Punkt
      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.8, 0),
        new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.3 })
      );
      scene.add(core);

      function frame(now){
        // Sehr langsame, dekorative Rotation
        outer.rotation.y = now * 0.00008;
        outer.rotation.x = now * 0.00005;
        inner.rotation.y = -now * 0.00012;
        inner.rotation.z = now * 0.00007;
        core.rotation.x = now * 0.0002;
        core.rotation.y = now * -0.00018;

        renderer.render(scene, camera);
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);

      window.addEventListener('resize', () => {
        renderer.setSize(w(), h());
      });
    }
  }
  initOrb3D();

  /* ─────────────── ALT: 3D HERO ORBIT — abgelegt, 2D-SVG ist wieder aktiv ─────────────── */
  function _initHeroOrbit3D_disabled(){
    const mount = document.getElementById('heroOrbit3D');
    if(!mount || reduce) return;
    // Warten bis THREE via CDN geladen ist (defer-Script)
    const tryInit = () => {
      if(typeof THREE === 'undefined'){ setTimeout(tryInit, 80); return; }
      build();
    };
    tryInit();

    function build(){
      const scene = new THREE.Scene();
      const w = () => mount.clientWidth;
      const h = () => mount.clientHeight;
      const camera = new THREE.PerspectiveCamera(42, w()/h(), 0.1, 100);
      camera.position.set(0, 2.2, 13.5);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w(), h());
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);

      const KERAS_R = 1.4;

      // Keras-Zentrum: Wireframe-Icosahedron + innerer Glow-Sphere
      const kerasWire = new THREE.Mesh(
        new THREE.IcosahedronGeometry(KERAS_R, 1),
        new THREE.MeshBasicMaterial({ color: 0x8bb4ff, wireframe: true, transparent: true, opacity: 0.85 })
      );
      scene.add(kerasWire);

      const kerasGlow = new THREE.Mesh(
        new THREE.SphereGeometry(KERAS_R * 1.25, 24, 24),
        new THREE.MeshBasicMaterial({
          color: 0x4f8ef7, transparent: true, opacity: 0.16,
          blending: THREE.AdditiveBlending, depthWrite: false
        })
      );
      scene.add(kerasGlow);

      // Subtle Dust-Cloud als innere Füllung
      const kerasCore = new THREE.Mesh(
        new THREE.SphereGeometry(KERAS_R * 0.4, 16, 16),
        new THREE.MeshBasicMaterial({
          color: 0xffffff, transparent: true, opacity: 0.5,
          blending: THREE.AdditiveBlending, depthWrite: false
        })
      );
      scene.add(kerasCore);

      // Satelliten-Factory: Gruppe mit Ring + Mesh, auf Orbital-Ebene gekippt
      function makeSatellite({ geo, color, radius, tilt }){
        const group = new THREE.Group();
        // Mesh
        const mat = new THREE.MeshBasicMaterial({ color, wireframe: true });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(radius, 0, 0);
        // Glow-Shell um Satelliten
        const satGlow = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 16, 16),
          new THREE.MeshBasicMaterial({
            color, transparent: true, opacity: 0.25,
            blending: THREE.AdditiveBlending, depthWrite: false
          })
        );
        satGlow.position.copy(mesh.position);
        // Orbit-Ring als Torus (dünn, dezent)
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(radius, 0.012, 6, 96),
          new THREE.MeshBasicMaterial({ color: 0x4f8ef7, transparent: true, opacity: 0.18 })
        );
        group.add(mesh, satGlow, ring);
        // Tilt auf Orbital-Ebene
        group.rotation.x = tilt.x || 0;
        group.rotation.y = tilt.y || 0;
        group.rotation.z = tilt.z || 0;
        return { group, mesh, satGlow, radius };
      }

      const jax = makeSatellite({
        geo: new THREE.SphereGeometry(0.32, 14, 14),
        color: 0x4f8ef7, radius: 5.0, tilt: { x: 0.15, z: 0.05 }
      });
      const tf = makeSatellite({
        geo: new THREE.OctahedronGeometry(0.4, 0),
        color: 0xf5b84a, radius: 4.3, tilt: { x: Math.PI/2 + 0.2, z: 0.3 }
      });
      const pt = makeSatellite({
        geo: new THREE.TetrahedronGeometry(0.48, 0),
        color: 0xff5a5f, radius: 5.7, tilt: { y: Math.PI/2, z: -0.4 }
      });
      scene.add(jax.group, tf.group, pt.group);

      // Maus-Parallax (subtil — Kamera kippt leicht mit Cursor)
      const mouse = { x: 0, y: 0 };
      window.addEventListener('pointermove', (e) => {
        mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
        mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
      });

      // Animation-Timing (passt zu CSS: 4.3s delay, 6s duration)
      const start = performance.now();
      const DELAY = 4300;
      const ROT_DUR = 3600;   // Phase 1: 1x rotieren
      const CONV_DUR = 2200;  // Phase 2: konvergieren
      const TOTAL = DELAY + ROT_DUR + CONV_DUR;

      function frame(now){
        const elapsed = now - start;

        // Phase-Zuordnung
        let rotT = 0, convT = 0;
        if(elapsed > DELAY){
          const since = elapsed - DELAY;
          if(since < ROT_DUR){
            rotT = since / ROT_DUR;
          } else {
            rotT = 1;
            convT = Math.min(1, (since - ROT_DUR) / CONV_DUR);
          }
        }

        // Rotation pro Satellit (eigene Achse durch Tilt)
        // Local rotation um y-axis der Gruppe → Satellit läuft auf seiner gekippten Orbital-Ebene
        const rot = rotT * Math.PI * 2;
        jax.group.rotation.y = jax.group.userData.baseY = (jax.group.userData.baseY || 0.15) + (rotT === 1 ? 0 : (rot - (jax.group.rotation.y - 0.15)) * 0);
        // Simpler: setze direkt
        jax.group.rotation.y = 0.15 + rot;
        tf.group.rotation.y  = 0.3 - rot * 1.1;
        pt.group.rotation.y  = -0.1 + rot * 0.95;

        // Konvergenz: lerp mesh-position.x von radius → Keras-Surface-radius
        const ease = 1 - Math.pow(1 - convT, 3);
        const endRadius = KERAS_R;  // landen auf der Sphere-Oberfläche
        jax.mesh.position.x = jax.radius + (endRadius - jax.radius) * ease;
        tf.mesh.position.x  = tf.radius  + (endRadius - tf.radius)  * ease;
        pt.mesh.position.x  = pt.radius  + (endRadius - pt.radius)  * ease;
        jax.satGlow.position.x = jax.mesh.position.x;
        tf.satGlow.position.x  = tf.mesh.position.x;
        pt.satGlow.position.x  = pt.mesh.position.x;
        // Satelliten-Glow ausblenden wenn sie auf der Sphere landen
        jax.satGlow.material.opacity = 0.25 * (1 - ease * 0.7);
        tf.satGlow.material.opacity  = 0.25 * (1 - ease * 0.7);
        pt.satGlow.material.opacity  = 0.25 * (1 - ease * 0.7);
        // Orbit-Ringe ausfaden
        jax.group.children[2].material.opacity = 0.18 * (1 - ease * 0.9);
        tf.group.children[2].material.opacity  = 0.18 * (1 - ease * 0.9);
        pt.group.children[2].material.opacity  = 0.18 * (1 - ease * 0.9);

        // Keras-Sphere langsam drehen + Core-Puls
        kerasWire.rotation.y += 0.0025;
        kerasWire.rotation.x += 0.0012;
        const pulse = 1 + Math.sin(now * 0.0008) * 0.08;
        kerasGlow.scale.setScalar(pulse);
        kerasCore.scale.setScalar(1 + Math.sin(now * 0.0012) * 0.15);

        // Maus-Parallax: Kamera sanft tilten
        camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.03;
        camera.position.y += (2.2 + mouse.y * -0.8 - camera.position.y) * 0.03;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);

      // Resize
      window.addEventListener('resize', () => {
        renderer.setSize(w(), h());
        camera.aspect = w() / h();
        camera.updateProjectionMatrix();
      });
    }
  }
  // initHeroOrbit3D();  // deaktiviert — 2D-SVG-Orbit ist wieder im Hero aktiv

  /* ─────────────── STARFIELD — scroll-reaktiv: je tiefer, desto mehr Sterne kommen & gehen ─────────────── */
  function initStarfield(){
    const canvas = document.getElementById('starfield-bg');
    if(!canvas || reduce) return;
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0;
    function resize(){
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    // Total Pool — mehr als vorher, nicht alle gleichzeitig sichtbar.
    // Jeder Stern hat einen Threshold (0..1) — Scroll-Progress entscheidet welche „aktiv" sind.
    const stars = [];
    const N = 160;
    function makeStar(s){
      s.x = Math.random() * W;
      s.y = Math.random() * H;
      s.r = 0.4 + Math.random() * 1.7;
      s.baseAlpha = 0.25 + Math.random() * 0.55;
      s.phase = Math.random() * Math.PI * 2;
      s.speed = 0.35 + Math.random() * 1.1;              // Twinkle-Tempo
      s.hue = Math.random() < 0.13 ? 'amber' : 'blue';
      s.vx = (Math.random() - 0.5) * 0.05;
      s.vy = (Math.random() - 0.5) * 0.05;
      s.threshold = Math.random();                        // Sichtbarkeits-Schwelle 0..1
      s.life = Math.random();                             // Lifecycle-Progress 0..1
      s.lifeSpeed = 0.0008 + Math.random() * 0.0022;      // wie schnell Stern kommt & geht
      return s;
    }
    function seed(){
      stars.length = 0;
      for(let i = 0; i < N; i++) stars.push(makeStar({}));
    }

    resize();
    window.addEventListener('resize', resize);

    function scrollRatio(){
      const h = document.documentElement;
      const max = Math.max(1, h.scrollHeight - h.clientHeight);
      return Math.min(1, Math.max(0, h.scrollTop / max));
    }

    let t = 0;
    let rafId = null;
    function frame(){
      t += 0.016;
      ctx.clearRect(0, 0, W, H);

      // Basis-Dichte 18% (wenig Sterne oben), linear hoch auf 100% unten
      const baseMin = 0.18;
      const visibilityCap = baseMin + scrollRatio() * (1 - baseMin);

      for(let i = 0; i < stars.length; i++){
        const s = stars[i];

        // Lifecycle: jeder Stern faded rein (sin-Kurve) und bei Reset an neuer Position respawnen
        s.life += s.lifeSpeed;
        if(s.life >= 1){
          // Reset: neue Position, neue Threshold, neuer Lifecycle
          makeStar(s);
        }

        // Scroll-basiert sichtbar?
        if(s.threshold > visibilityCap) continue;

        // Lifecycle-Faktor: 0 (geboren) → 1 (Mitte) → 0 (gestorben)
        const lifeFactor = Math.sin(s.life * Math.PI);
        if(lifeFactor < 0.02) continue;

        // Twinkle
        const twinkle = (Math.sin(t * s.speed + s.phase) + 1) / 2;
        const alpha = s.baseAlpha * (0.35 + twinkle * 0.65) * lifeFactor;

        // Drift + Edge-Wrap
        s.x += s.vx;
        s.y += s.vy;
        if(s.x < -5) s.x = W + 5;
        if(s.x > W + 5) s.x = -5;
        if(s.y < -5) s.y = H + 5;
        if(s.y > H + 5) s.y = -5;

        ctx.fillStyle = s.hue === 'amber'
          ? `rgba(220, 165, 70, ${alpha * 0.8})`
          : `rgba(140, 180, 240, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      rafId = requestAnimationFrame(frame);
    }
    frame();
  }
  initStarfield();

  /* ─────────────── FLUID CANVAS — Curl-Noise Partikel (Use Case: PINN) ─────────────── */
  function initFluidCanvas(){
    const canvas = document.getElementById('fluidCanvas');
    if(!canvas || reduce) return;
    const ctx = canvas.getContext('2d');

    function resize(){
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // Minimales 2D Value-Noise mit Smoothstep
    const hash = (x, y) => {
      const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return s - Math.floor(s);
    };
    const smooth = t => t * t * (3 - 2 * t);
    function noise2d(x, y){
      const xi = Math.floor(x), yi = Math.floor(y);
      const xf = x - xi, yf = y - yi;
      const a = hash(xi, yi), b = hash(xi+1, yi);
      const c = hash(xi, yi+1), d = hash(xi+1, yi+1);
      const u = smooth(xf), v = smooth(yf);
      return (a + (b-a)*u) * (1-v) + (c + (d-c)*u) * v;
    }
    // fractal brownian motion — mehrere Octaves addiert für organischeres Feld
    function fbm(x, y){
      return noise2d(x, y) + 0.5 * noise2d(x*2, y*2) + 0.25 * noise2d(x*4, y*4);
    }
    // Curl (2D divergenz-frei): wirbelartige Bewegung statt gerichtetem Drift
    function curl(x, y, t){
      const eps = 0.5;
      const s = 0.006;
      const n1 = fbm(x*s, (y+eps)*s + t);
      const n2 = fbm(x*s, (y-eps)*s + t);
      const n3 = fbm((x+eps)*s, y*s + t);
      const n4 = fbm((x-eps)*s, y*s + t);
      return { vx: (n1 - n2) / (2*eps) * 300, vy: -(n3 - n4) / (2*eps) * 300 };
    }

    const W = () => canvas.width / (window.devicePixelRatio || 1);
    const H = () => canvas.height / (window.devicePixelRatio || 1);
    const particles = [];
    const N = 2600;
    function spawn(p){
      p.x = Math.random() * W();
      p.y = Math.random() * H();
      p.age = 0;
      p.life = 160 + Math.random() * 200;
      p.hue = Math.random() < 0.12 ? 'amber' : 'blue'; // ab und zu ein amber-Partikel für Tiefe
    }
    for(let i = 0; i < N; i++){
      const p = {}; spawn(p); p.age = Math.random() * p.life;
      particles.push(p);
    }

    let t = 0;
    let rafId = null;
    let userPaused = false;
    function frame(){
      if(userPaused){ rafId = null; return; }
      t += 0.0025;
      // Schritt 1: Fade mit normalem Blending — langsamer → hellere Trails im Steady-State
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.018)';
      ctx.fillRect(0, 0, W(), H());

      // Schritt 2: Partikel mit 'lighter' (additiv) — Trails glühen wie Licht
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      for(let i = 0; i < particles.length; i++){
        const p = particles[i];
        const v = curl(p.x, p.y, t);
        const nx = p.x + v.vx * 0.6;
        const ny = p.y + v.vy * 0.6;
        const speed = Math.hypot(v.vx, v.vy);
        const alpha = Math.min(1, 0.55 + speed * 0.045);
        ctx.strokeStyle = p.hue === 'amber'
          ? `rgba(220, 165, 70, ${alpha * 0.8})`
          : `rgba(70, 120, 210, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        p.x = nx; p.y = ny; p.age++;
        if(p.age > p.life || p.x < -10 || p.x > W()+10 || p.y < -10 || p.y > H()+10){
          spawn(p);
        }
      }
      rafId = requestAnimationFrame(frame);
    }
    // Nur laufen lassen wenn sichtbar — spart Akku
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if(e.isIntersecting){
          if(!rafId && !userPaused) frame();
        } else if(rafId){
          cancelAnimationFrame(rafId); rafId = null;
        }
      });
    }, {threshold: 0.05});
    io.observe(canvas);

    // Play/Pause-Button
    const btn = document.querySelector('.canvas-toggle[data-target="fluidCanvas"]');
    if(btn){
      btn.addEventListener('click', () => {
        userPaused = !userPaused;
        btn.dataset.state = userPaused ? 'paused' : 'playing';
        btn.setAttribute('aria-label', userPaused ? 'Animation starten' : 'Animation pausieren');
        if(!userPaused && !rafId) frame();
      });
    }
  }
  initFluidCanvas();

  /* ─────────────── BAYES CANVAS — Posterior-Verteilungen animiert (Use Case: BayesFlow) ─────────────── */
  function initBayesCanvas(){
    const canvas = document.getElementById('bayesCanvas');
    if(!canvas || reduce) return;
    const ctx = canvas.getContext('2d');

    function resize(){
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const W = () => canvas.width / (window.devicePixelRatio || 1);
    const H = () => canvas.height / (window.devicePixelRatio || 1);

    const PAD = 44;
    const SCALE_X = 4;
    const PEAK_FRAC = 0.72;

    function gaussian(x, mu, sigma){
      return Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
    }
    function xToPx(xVal){ return (xVal + SCALE_X) / (2*SCALE_X) * W(); }

    // Zeichnet Gauss-Kurve als Path — gefüllt ODER Outline
    function curvePath(mu, sigma){
      const w = W(), h = H();
      ctx.beginPath();
      for(let i = 0; i <= 200; i++){
        const xNorm = -SCALE_X + (i/200) * (2*SCALE_X);
        const y = h - PAD - gaussian(xNorm, mu, sigma) * h * PEAK_FRAC;
        const x = (i/200) * w;
        if(i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    }
    function closeCurveToAxis(){
      const w = W(), h = H();
      ctx.lineTo(w, h - PAD);
      ctx.lineTo(0, h - PAD);
      ctx.closePath();
    }
    function drawOutline(mu, sigma, color, lineWidth, dashed){
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = color;
      if(dashed) ctx.setLineDash([3, 4]); else ctx.setLineDash([]);
      curvePath(mu, sigma);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    function drawAxis(){
      const w = W(), h = H();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h - PAD);
      ctx.lineTo(w, h - PAD);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText('θ', w - 16, h - PAD + 18);
      ctx.fillText('p(θ)', 8, 18);
    }
    function drawSigmaLabel(sigma){
      const w = W(), h = H();
      ctx.fillStyle = 'rgba(140, 180, 240, 0.75)';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(`σ = ${sigma.toFixed(2)}`, w - 80, 18);
    }
    function drawDataPoints(phase){
      const w = W(), h = H();
      const positions = [-1.2, -0.4, 0.1, 0.3, 0.7, 1.4, -0.2, 0.5, 0.0, 0.8];
      const visible = Math.floor(phase * positions.length);
      ctx.shadowBlur = 6;
      ctx.shadowColor = 'rgba(245, 184, 74, 0.6)';
      for(let i = 0; i < visible; i++){
        const xNorm = positions[i];
        const x = (xNorm + SCALE_X) / (2*SCALE_X) * w;
        // Subtle pulse auf dem jüngsten Punkt
        const isLatest = (i === visible - 1);
        const pulse = isLatest ? 1 + Math.sin(Date.now() / 180) * 0.15 : 1;
        ctx.fillStyle = 'rgba(245, 184, 74, 0.95)';
        ctx.beginPath();
        ctx.arc(x, h - PAD - 7, 3 * pulse, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    // Box-Muller Gauss-Sample (für die dezenten Shimmer-Partikel)
    function randn(){
      const u1 = Math.max(1e-9, Math.random());
      const u2 = Math.random();
      return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }

    // Sehr dezente Shimmer-Partikel — minimaler Akzent, keine Ablenkung
    const samples = [];
    const S = 35;
    function spawnSample(s, sigma){
      s.x = randn() * sigma;
      s.y = Math.random();
      s.maxLife = 90 + Math.random() * 80;
      s.life = 0;
      s.r = 0.5 + Math.random() * 0.6;
    }
    for(let i = 0; i < S; i++){
      const s = {}; spawnSample(s, 1.5);
      s.life = Math.random() * s.maxLife;
      samples.push(s);
    }

    // Animation-Loop
    let t = 0;
    let rafId = null;
    let userPaused = false;
    function frame(){
      if(userPaused){ rafId = null; return; }
      t += 0.003;
      const phase = (1 - Math.cos(t)) / 2;
      const sigma = 1.6 - phase * 1.2;

      // Canvas jeden Frame löschen — keine Trails, klare Kurven-Darstellung
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W(), H());

      drawAxis();

      // Prior: gestrichelte dünne Outline (bleibt über den ganzen Loop als Referenz sichtbar)
      drawOutline(0, 1.6, 'rgba(255,255,255,0.24)', 1.2, true);

      // Posterior GEFÜLLT mit vertikalem Gradient — Hauptaussage, etwas gedämpft
      const w = W(), h = H();
      curvePath(0, sigma);
      closeCurveToAxis();
      const grad = ctx.createLinearGradient(0, h - PAD, 0, h - PAD - h * PEAK_FRAC);
      grad.addColorStop(0, 'rgba(79, 142, 247, 0.32)');
      grad.addColorStop(1, 'rgba(79, 142, 247, 0.02)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Posterior-Outline mit sanftem Glow — scharfe Kante oben
      ctx.shadowBlur = 7;
      ctx.shadowColor = 'rgba(79, 142, 247, 0.45)';
      drawOutline(0, sigma, 'rgba(150, 190, 245, 0.88)', 2, false);
      ctx.shadowBlur = 0;

      // Dezente Shimmer-Partikel nur INNERHALB der Posterior-Fläche
      // (additive glow, kleine Punkte — wie Glitzer, verdeckt nichts)
      ctx.globalCompositeOperation = 'lighter';
      const peakH = h * PEAK_FRAC;
      for(let i = 0; i < samples.length; i++){
        const s = samples[i];
        s.life++;
        if(s.life > s.maxLife){
          spawnSample(s, sigma);
          continue;
        }
        const xVal = s.x;
        const density = gaussian(xVal, 0, sigma);
        const px = xToPx(xVal);
        const py = h - PAD - density * peakH * s.y;
        if(px < 0 || px > w) continue;
        const t01 = s.life / s.maxLife;
        const ageAlpha = Math.sin(Math.PI * t01);
        ctx.fillStyle = `rgba(180, 210, 255, ${ageAlpha * 0.28})`;
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Beobachtungen als amber Punkte — zeigt "Daten kommen rein"
      ctx.globalCompositeOperation = 'source-over';
      drawDataPoints(phase);

      // Sigma-Label oben rechts — macht den Wandel vom breit zu schmal numerisch sichtbar
      drawSigmaLabel(sigma);

      rafId = requestAnimationFrame(frame);
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if(e.isIntersecting){
          if(!rafId && !userPaused) frame();
        } else if(rafId){
          cancelAnimationFrame(rafId); rafId = null;
        }
      });
    }, {threshold: 0.1});
    io.observe(canvas);

    // Play/Pause-Button
    const btn = document.querySelector('.canvas-toggle[data-target="bayesCanvas"]');
    if(btn){
      btn.addEventListener('click', () => {
        userPaused = !userPaused;
        btn.dataset.state = userPaused ? 'paused' : 'playing';
        btn.setAttribute('aria-label', userPaused ? 'Animation starten' : 'Animation pausieren');
        if(!userPaused && !rafId) frame();
      });
    }
  }
  initBayesCanvas();

  /* ─────────────── EXTRA KEYFRAMES (injected) ─────────────── */
  const kf = document.createElement('style');
  kf.textContent = `
    @keyframes vmapIn{from{transform:scaleY(.2);opacity:0}to{transform:scaleY(1);opacity:var(--_o,1)}}
    @keyframes pmapIn{from{transform:translateY(6px);opacity:0}to{transform:none;opacity:1}}
  `;
  document.head.appendChild(kf);

  /* ─────────────── CUSTOM CURSOR (blue dot, only when moving) ─────────────── */
  if (!reduce) {
    const dot = document.createElement('div');
    dot.className = 'custom-cursor';
    document.body.appendChild(dot);

    let hideTimer = 0;
    let lastX = -1, lastY = -1;
    let rafId = 0;
    let pendingX = 0, pendingY = 0;

    function update(){
      rafId = 0;
      // 14px dot → offset by half (7px) to center under cursor
      dot.style.transform = `translate3d(${pendingX - 7}px, ${pendingY - 7}px, 0)`;
    }

    window.addEventListener('mousemove', (e) => {
      if (e.clientX === lastX && e.clientY === lastY) return;
      lastX = e.clientX; lastY = e.clientY;
      pendingX = e.clientX; pendingY = e.clientY;
      if (!rafId) rafId = requestAnimationFrame(update);

      if (!dot.classList.contains('is-moving')) dot.classList.add('is-moving');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => dot.classList.remove('is-moving'), 600);
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      dot.classList.remove('is-moving');
    });
  }
})();
