  // ---------- Custom cursor (indigo square) ----------
  (function customCursor(){
    const c = document.getElementById('cursor');
    if (!c) return;
    // Touch-Geräte: Standard-Cursor wieder aktivieren
    if (matchMedia('(pointer: coarse)').matches){
      document.body.style.cursor = '';
      c.remove();
      return;
    }
    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let tx = x, ty = y;
    function tick(){
      x += (tx - x) * 0.35;
      y += (ty - y) * 0.35;
      c.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) translate(-50%,-50%)';
      requestAnimationFrame(tick);
    }
    window.addEventListener('mousemove', (e) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!c.classList.contains('is-active')) c.classList.add('is-active');
    }, { passive: true });
    window.addEventListener('mouseleave', () => c.classList.remove('is-active'));
    window.addEventListener('mouseenter', () => c.classList.add('is-active'));
    // Hover-Effekt über interaktiven Elementen
    const hoverSel = 'a, button, .dot, .det-btn, .btn, [role="button"], [data-target], input, textarea, select';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest && e.target.closest(hoverSel)) c.classList.add('is-hover');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest && e.target.closest(hoverSel)) c.classList.remove('is-hover');
    });
    requestAnimationFrame(tick);
  })();

  // ---------- Boot screen ----------
  (function runBoot(){
    const boot = document.getElementById('boot');
    if (!boot) return;
    const linesEl = document.getElementById('bootLines');
    const barEl = document.getElementById('bootBar');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const steps = [
      ['[pure]',   'f(x) → y · keine Side Effects',                   'OK'],
      ['[check]',  'Modell-Objekt nach hidden state durchsucht',      '0'],
      ['[seed]',   'PRNGKey(42) · root-key erzeugt',                  'OK'],
      ['[split]',  'jax.random.split(key, 8) · subkeys verteilt',     '•'],
      ['[arch]',   'nn.Dense(features=256) · zustandslos',            '•'],
      ['[init]',   'params = model.init(key, x_dummy)',               '•'],
      ['[apply]',  'y = model.apply(params, x)',                      '•'],
      ['[jit]',    '@jax.jit · step(params, x, y) kompiliert',        '•'],
      ['[scale]',  'replicating step() · 1000 GPUs · null Mutation',  '•'],
      ['[ready]',  'zustandslos · deterministisch · skalierbar',      'GO'],
    ];
    let i = 0;
    function addLine(){
      if (i >= steps.length){
        setTimeout(() => boot.classList.add('done'), 300);
        setTimeout(() => boot.remove(), 1200);
        return;
      }
      const [t, m, s] = steps[i];
      const row = document.createElement('div');
      row.className = 'boot__line';
      const okClass = (s === 'OK' || s === 'SET' || s === 'GO' || s === '0') ? 's--ok' : '';
      row.innerHTML = '<span class="t">' + t + '</span>' +
                      '<span class="m">' + m + '</span>' +
                      '<span class="s ' + okClass + '">' + s + '</span>';
      linesEl.appendChild(row);
      const all = linesEl.querySelectorAll('.boot__line');
      all.forEach((l, idx) => {
        if (idx < all.length - 5) l.classList.add('boot__line--faded');
      });
      barEl.style.width = (((i + 1) / steps.length) * 100).toFixed(1) + '%';
      i++;
      setTimeout(addLine, reduce ? 100 : (340 + Math.random() * 260));
    }
    addLine();
  })();

  // ---------- Progress bar ----------
  const progress = document.getElementById('progress');
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    progress.style.width = pct + '%';
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // ---------- Dot navigation ----------
  const dots = document.querySelectorAll('.dotnav .dot');
  const sections = ['s1','s2','s3','sdet','s4','s6','s7'].map(id => document.getElementById(id));

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const id = dot.dataset.target;
      document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
    });
  });

  const navObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const idx = sections.indexOf(e.target);
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      }
    });
  }, { threshold: 0.5 });
  sections.forEach(s => navObs.observe(s));

  // ---------- Reveal system ----------
  const revealEls = document.querySelectorAll('.reveal');
  // Stagger delays per-section
  document.querySelectorAll('.section').forEach(sec => {
    sec.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.transitionDelay = (i * 80) + 'ms';
    });
  });

  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  revealEls.forEach(el => revealObs.observe(el));

  // ---------- PRNG chaos visual: many GPU threads ----------
  (function makeChaos() {
    const wrap = document.getElementById('chaosVis');
    if (!wrap) return;
    const N = 14;
    for (let i = 0; i < N; i++) {
      const t = document.createElement('div');
      t.className = 'thread';
      const angle = (i / N) * 360 + (Math.random() * 8 - 4);
      const len = 70 + Math.random() * 40;
      t.style.width = len + 'px';
      t.style.transform = `rotate(${angle}deg)`;
      t.style.opacity = 0.25 + Math.random() * 0.45;
      wrap.appendChild(t);
    }
  })();

  // ---------- Gradient descent canvas animation ----------
  (function gradAnim() {
    const c = document.getElementById('gradCanvas');
    if (!c) return;
    const ctx = c.getContext('2d');

    // Hi-DPI
    function resizeCanvas() {
      const rect = c.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      c.width = rect.width * dpr;
      c.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let step = 0;
    let pos = -2.4; // start far from minimum
    const lr = 0.12;
    let running = false;

    // Loss curve: parabola with mild noise → gradient = 2*x
    const loss = x => x * x * 0.5 + 0.4;
    const grad = x => x;

    function draw() {
      const rect = c.getBoundingClientRect();
      const W = rect.width, H = rect.height;
      ctx.clearRect(0, 0, W, H);

      // BG
      ctx.fillStyle = '#faf6ee';
      ctx.fillRect(0, 0, W, H);

      // Map x ∈ [-3, 3] → canvas
      const mapX = x => 30 + ((x + 3) / 6) * (W - 60);
      const mapY = y => H - 30 - y * (H - 60) / 5;

      // Grid
      ctx.strokeStyle = 'rgba(216,205,184,0.5)';
      ctx.lineWidth = 1;
      for (let i = -3; i <= 3; i++) {
        const x = mapX(i);
        ctx.beginPath();
        ctx.moveTo(x, 20); ctx.lineTo(x, H - 20);
        ctx.stroke();
      }

      // Axis baseline
      ctx.strokeStyle = '#d8cdb8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(20, H - 30); ctx.lineTo(W - 20, H - 30);
      ctx.stroke();

      // Loss curve
      ctx.strokeStyle = '#3a4cd6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = -3; x <= 3; x += 0.05) {
        const px = mapX(x), py = mapY(loss(x));
        if (x === -3) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Past trail
      ctx.fillStyle = 'rgba(200,134,42,0.3)';
      const trail = window._trail || (window._trail = []);
      trail.forEach(p => {
        ctx.beginPath();
        ctx.arc(mapX(p.x), mapY(loss(p.x)), 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Current point
      const px = mapX(pos), py = mapY(loss(pos));
      // halo
      ctx.fillStyle = 'rgba(200,134,42,0.18)';
      ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c8862a';
      ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1a1f2e';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Labels
      ctx.fillStyle = '#6b6356';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('loss(params)', 24, 28);
      ctx.textAlign = 'right';
      ctx.fillText('params →', W - 24, H - 12);

      // readouts
      const stepEl = document.getElementById('stepN');
      const lossEl = document.getElementById('lossN');
      const paramEl = document.getElementById('paramN');
      if (stepEl) stepEl.textContent = step;
      if (lossEl) lossEl.textContent = loss(pos).toFixed(3);
      if (paramEl) paramEl.textContent = pos.toFixed(3);
    }

    function tick() {
      if (!running) return;
      // GD step
      const g = grad(pos);
      pos = pos - lr * g;
      step++;
      window._trail = window._trail || [];
      if (step % 2 === 0) window._trail.push({ x: pos });
      draw();

      if (Math.abs(pos) < 0.02 && step > 18) {
        // Reset & loop
        setTimeout(() => {
          pos = -2.4 + (Math.random() * 0.4 - 0.2);
          step = 0;
          window._trail = [];
        }, 1200);
      }
      setTimeout(tick, 280);
    }

    // Start when section visible
    const target = c.parentElement;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !running) {
          running = true;
          draw();
          tick();
        } else if (!e.isIntersecting) {
          running = false;
        }
      });
    }, { threshold: 0.3 });
    io.observe(target);

    draw();
  })();

  // ---------- Scroll-tied parallax for blobs + drift glyphs ----------
  (function parallax() {
    const blobs = [...document.querySelectorAll('#bgBlobs .blob, #bgDrift [data-speed]')];
    if (!blobs.length) return;

    let scrollY = window.scrollY;
    let target = scrollY;
    let raf = 0;
    let t0 = performance.now();
    let prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Cache speed + base orientation per element
    const items = blobs.map((el, i) => {
      const speed = parseFloat(el.dataset.speed || '0.3');
      // some elements get a slow ambient drift so motion never fully stops
      const ambSpeedX = (i % 2 === 0 ? 1 : -1) * (0.012 + Math.random() * 0.018);
      const ambSpeedY = (i % 3 === 0 ? 1 : -1) * (0.008 + Math.random() * 0.014);
      const phase = Math.random() * Math.PI * 2;
      // Preserve any existing rotate from inline style
      const baseTransform = el.style.transform || '';
      return { el, speed, ambSpeedX, ambSpeedY, phase, baseTransform };
    });

    function update() {
      // ease scroll target
      scrollY += (target - scrollY) * 0.18;
      const t = (performance.now() - t0) / 1000;

      for (const it of items) {
        const sy = -scrollY * it.speed;
        const ax = Math.sin(t * it.ambSpeedX + it.phase) * 18;
        const ay = Math.cos(t * it.ambSpeedY + it.phase) * 14;
        it.el.style.transform = `translate3d(${ax}px, ${sy + ay}px, 0) ${it.baseTransform}`;
      }

      raf = requestAnimationFrame(update);
    }

    function onScroll() {
      target = window.scrollY;
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    if (!prefersReduced) {
      raf = requestAnimationFrame(update);
    } else {
      // Static fallback: one update only
      for (const it of items) {
        it.el.style.transform = `translate3d(0, ${-window.scrollY * it.speed}px, 0) ${it.baseTransform}`;
      }
    }
  })();

  // ---------- Global background FX canvas: drifting particles + soft connections ----------
  (function bgFx() {
    const c = document.getElementById('bgFx');
    if (!c) return;
    const ctx = c.getContext('2d');
    let W = 0, H = 0, dpr = window.devicePixelRatio || 1;

    function resize() {
      const rect = c.getBoundingClientRect();
      W = window.innerWidth;
      H = window.innerHeight;
      c.width = W * dpr;
      c.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // Particle field — gentle drift, occasional connections to mimic graph-like activity
    const N = Math.min(48, Math.floor((W * H) / 32000));
    const parts = [];
    for (let i = 0; i < N; i++) {
      parts.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.4 + 0.6,
        hue: Math.random() < 0.6 ? 'indigo' : 'amber',
        alpha: 0.35 + Math.random() * 0.4,
      });
    }

    let mouseX = -9999, mouseY = -9999;
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
    window.addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; });

    let prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function frame() {
      ctx.clearRect(0, 0, W, H);

      // Connections
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const a = parts[i], b = parts[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 18000) {
            const alpha = (1 - d2 / 18000) * 0.18;
            ctx.strokeStyle = `rgba(58,76,214,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Particles
      for (const p of parts) {
        // Mouse repulsion (tiny)
        const mdx = p.x - mouseX, mdy = p.y - mouseY;
        const md2 = mdx * mdx + mdy * mdy;
        if (md2 < 12000) {
          const f = (1 - md2 / 12000) * 0.4;
          p.vx += (mdx / Math.sqrt(md2 + 1)) * f * 0.05;
          p.vy += (mdy / Math.sqrt(md2 + 1)) * f * 0.05;
        }
        // Friction
        p.vx *= 0.985; p.vy *= 0.985;
        // Drift baseline
        p.vx += (Math.random() - 0.5) * 0.005;
        p.vy += (Math.random() - 0.5) * 0.005;

        if (!prefersReduced) {
          p.x += p.vx;
          p.y += p.vy;
        }

        // Wrap
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;

        const color = p.hue === 'indigo'
          ? `rgba(58,76,214,${p.alpha})`
          : `rgba(200,134,42,${p.alpha})`;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        // soft glow
        ctx.fillStyle = p.hue === 'indigo'
          ? `rgba(58,76,214,${p.alpha * 0.15})`
          : `rgba(200,134,42,${p.alpha * 0.15})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(frame);
    }
    frame();
  })();

  // ---------- Section-aware background tinting ----------
  (function bgTint() {
    const sectionTints = {
      s1: 'rgba(243,237,226,1)',
      s2: 'rgba(243,237,226,1)',
      s3: 'rgba(238,230,214,1)',
      s4: 'rgba(236,228,212,1)',
      s5: 'rgba(243,237,226,1)',
      s6: 'rgba(238,230,214,1)',
    };
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && e.intersectionRatio > 0.5) {
          // Optional: could swap accent hue here based on section
        }
      });
    }, { threshold: [0.5] });
    Object.keys(sectionTints).forEach(id => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
  })();


  // ---------- Keyboard navigation ----------
  document.addEventListener('keydown', (e) => {
    const active = sections.findIndex((s, i) => dots[i].classList.contains('active'));
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      const next = Math.min(sections.length - 1, active + 1);
      sections[next].scrollIntoView({ behavior: 'smooth' });
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      const prev = Math.max(0, active - 1);
      sections[prev].scrollIntoView({ behavior: 'smooth' });
    } else if (e.key === 'Home') {
      e.preventDefault();
      sections[0].scrollIntoView({ behavior: 'smooth' });
    } else if (e.key === 'End') {
      e.preventDefault();
      sections[sections.length - 1].scrollIntoView({ behavior: 'smooth' });
    }
  });