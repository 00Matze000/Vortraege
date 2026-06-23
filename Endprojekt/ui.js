// ============================================================
//  Den Wald von oben zählen — Overlay / UI logic
//  Reveal-on-scroll, chapter rail, progress bar, HUD counters
//  Driven by a single requestAnimationFrame loop — the scroll
//  listener only flags "dirty", so no heavy layout work happens
//  inside the scroll event itself (keeps scrolling buttery).
// ============================================================

const reveals = [...document.querySelectorAll('.reveal')];
function checkReveals() {
  const vp = window.innerHeight;
  reveals.forEach(el => {
    if (el.classList.contains('in')) return;
    const r = el.getBoundingClientRect();
    if (r.top < vp * 0.9 && r.bottom > 0) el.classList.add('in');
  });
}

const scenes = [...document.querySelectorAll('.scene')];
const chapters = [...document.querySelectorAll('.chapter-rail .ch')];
const progressFill = document.getElementById('progress-fill');
const scrollCue = document.getElementById('scroll-cue');
const hudCount = document.getElementById('hud-count');
const hudFrame = document.getElementById('hud-frame');
const metaEl = document.querySelector('.meta');

const chapterNames = ['Prolog', 'I — Der Wald', 'II — Der Aufstieg', 'III — Die Erkennung', 'Epilog'];

// --- Smoothed scroll progress, mirrors the camera easing in scene.js ---
let targetT = 0;          // raw scroll position [0,1]
let smoothT = 0;          // eased value driving the chrome
let activeChapter = -1;   // last applied chapter (avoids redundant DOM writes)
let needsLayout = true;   // recompute scene/reveal positions this frame?
let lastW = 0;            // displayed progress width (avoids redundant writes)

function readScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  targetT = max > 0 ? window.scrollY / max : 0;
}

function onScroll() { needsLayout = true; }
function onResize() { needsLayout = true; }

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onResize);

let lastTime = performance.now();
function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 1 / 30);
  lastTime = now;

  // Recompute scroll target + reveal/chapter state only when something moved
  if (needsLayout) {
    needsLayout = false;
    readScroll();
    checkReveals();

    const vp = window.innerHeight;
    let active = 0;
    scenes.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      if (r.top < vp * 0.5 && r.bottom > vp * 0.4) active = i;
    });
    if (active !== activeChapter) {
      activeChapter = active;
      chapters.forEach((c, i) => c.classList.toggle('active', i === active));
      metaEl.innerHTML =
        `Endprojekt · MMXXVI<br/>Kapitel ${String(active).padStart(2, '0')} — ${chapterNames[active]}`;
    }
  }

  // Framerate-independent easing toward the scroll target
  smoothT += (targetT - smoothT) * (1 - Math.exp(-3.2 * dt));
  if (Math.abs(targetT - smoothT) < 0.0002) smoothT = targetT;

  // Progress bar (only write when it visibly changes)
  const w = +(smoothT * 100).toFixed(1);
  if (w !== lastW) {
    lastW = w;
    progressFill.style.width = w + '%';
  }

  // Scroll cue fades after leaving the first scene
  scrollCue.style.opacity = smoothT > 0.05 ? '0' : '1';

  // HUD counters track the eased progress, so they ramp smoothly too
  const detT = Math.max(0, Math.min(1, (smoothT - 0.55) / 0.25));
  // Detektionen pro Frame — passend zum gezeigten Windradwald-Frame (160 Bäume)
  const count = Math.floor(detT * 160);
  if (hudCount) hudCount.textContent = String(count).padStart(3, '0');
  if (hudFrame) {
    const frame = 4000 + Math.floor(smoothT * 8480);
    hudFrame.textContent = String(frame).padStart(5, '0') + ' / 12480';
  }

  requestAnimationFrame(loop);
}

readScroll();
smoothT = targetT;
requestAnimationFrame(loop);
