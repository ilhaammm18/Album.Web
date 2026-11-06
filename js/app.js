/* ==========================================================================
   Moments — Interactive Photography Wall Engine
   ========================================================================== */

/* ---------- State & DOM Elements ---------- */
const wallEl = document.getElementById('wall');
const overlayEl = document.getElementById('wall-overlay');
const aboutEl = document.getElementById('about');
const headerEl = document.getElementById('site-header');
const hintEl = document.getElementById('hint');
const navLinks = document.querySelectorAll('.nav-link');

// Centre Focus Lightbox Elements
const centreOverlayEl = document.getElementById('centre-overlay');
const centreBackdropEl = document.getElementById('centre-backdrop');
const centreModalEl = document.getElementById('centre-modal');
const centreFrameEl = document.getElementById('centre-frame');
const centreImg = document.getElementById('centre-img');
const centreHeaderEl = document.getElementById('centre-header');
const centreFooterEl = document.getElementById('centre-footer');
const centreTitleEl = document.getElementById('centre-title');
const centreDateEl = document.getElementById('centre-date');
const btnPrevMoment = document.getElementById('btn-prev-moment');
const btnNextMoment = document.getElementById('btn-next-moment');
const btnCloseFrame = document.getElementById('btn-close-frame');

let rows = [];
let cards = [];
let vw = innerWidth;
let vh = innerHeight;

const pointer = { x: 0, y: 0, active: false };   // raw, centre-origin
const mouse = { x: 0, y: 0, init: false };       // lerped, centre-origin

let mode = 'hidden';          // 'wall' | 'leaving' | 'hidden'
let view = null;              // 'wall' | 'about'
let hoveredCard = null;
let activeCard = null;
let introFocus = false;
let focusTimer = null;
let speedMul = 1;
let introUntil = 0;
let hoverReadyAt = 0;
let currentActivePhotoIndex = 0;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ==========================================================================
   BUILD WALL
   ========================================================================== */
function makeCardEl(p, w, h, seed) {
  const el = document.createElement('article');
  el.className = 'card';
  el.style.width = w + 'px';
  el.style.height = h + 'px';
  el.style.marginLeft = -w / 2 + 'px';
  el.style.marginTop = -h / 2 + 'px';

  const img = new Image();
  img.alt = `${p.cat} — ${p.title}`;
  img.decoding = 'async';
  img.onload = () => img.classList.add('loaded');
  img.onerror = () => {
    if (p.url && !img.dataset.proxied) {
      img.dataset.proxied = '1';
      img.src = `https://wsrv.nl/?url=${encodeURIComponent(p.url)}&w=600&q=80&output=webp`;
      return;
    }
    img.onerror = null;
    img.src = `https://picsum.photos/seed/moments-${seed}/900/650`;
  };
  img.src = p.url || (p.id ? IMG(p.id) : `https://picsum.photos/seed/moments-${seed}/900/650`);

  const cap = document.createElement('div');
  cap.className = 'cap';
  cap.innerHTML = `
    <div class="cap-inner">
      <div class="cap-cat">${p.cat}</div>
      <div class="cap-title">${p.title}</div>
      <div class="cap-meta">${p.place} · ${p.year}</div>
    </div>`;

  el.append(img, cap);
  return el;
}

function buildWall() {
  wallEl.innerHTML = '';
  rows = [];
  cards = [];
  hoveredCard = null;
  activeCard = null;
  introFocus = false;
  vw = innerWidth;
  vh = innerHeight;

  const { ROWS, GAP, BLEED } = WALL_CONFIG;
  const rowH = (vh + BLEED * 2 - GAP * (ROWS - 1)) / ROWS;
  const firstY = -vh / 2 - BLEED + rowH / 2;
  let seed = 0;

  for (let r = 0; r < ROWS; r++) {
    // Baris bergantian arah: Kanan (+1), Kiri (-1), Kanan (+1) ...
    const dir = r % 2 === 0 ? 1 : -1;
    const speed = 36 + (r % 3) * 8; // px / detik (gerakan mulus & elegan)
    const cy = firstY + r * (rowH + GAP);

    const minTrack = vw + 650;
    const specs = [];
    let total = 0;
    let c = 0;
    while (total < minTrack || specs.length < 8) {
      const photoIdx = (r * 7 + c) % PHOTOS.length;
      const p = PHOTOS[photoIdx];
      const hf = 0.9 + ((r * 13 + c * 7) % 5) * 0.025;
      const h = Math.round(rowH * hf);
      const ar = p.o === 'p' ? 0.74 + ((r + c) % 3) * 0.04 : 1.36 + ((r * 3 + c * 5) % 5) * 0.07;
      const w = Math.round(h * ar);
      specs.push({ p, photoIndex: photoIdx, w, h });
      total += w + GAP;
      c++;
    }

    const row = { r, dir, speed, total, cy, rowH, cards: [] };
    let x = -total / 2;

    specs.forEach((s, i) => {
      const el = makeCardEl(s.p, s.w, s.h, seed++);
      wallEl.appendChild(el);
      const jitter = ((r * 31 + i * 17) % 9) - 4;
      const bx = x + s.w / 2;
      const by = cy + jitter;
      const card = {
        el, row, r, p: s.p, photoIndex: s.photoIndex, w: s.w, h: s.h,
        baseX: bx, baseY: by,
        offX: 0, offY: 0,
        currX: bx, currY: by, currScale: 1,
        targetScale: 1,
        hold: 0,
        lastZ: -1,
      };
      row.cards.push(card);
      cards.push(card);
      x += s.w + GAP;
    });

    rows.push(row);
  }
  render();
}

function unitFromCentre(c) {
  const d = Math.hypot(c.baseX, c.baseY);
  return d < 1 ? [c.row.dir, 0] : [c.baseX / d, c.baseY / d];
}

/* ==========================================================================
   HOVER & FOCUS LIGHTBOX SYSTEM
   ========================================================================== */
function syncFocusUI() {
  wallEl.classList.toggle('has-focus', !!(hoveredCard || activeCard));
  wallEl.style.cursor = activeCard ? 'default' : hoveredCard ? 'pointer' : 'default';
  hintEl.textContent = 'MOVE / CLICK TO OPEN';
}

function setHovered(c) {
  if (c === hoveredCard) return;
  if (hoveredCard) hoveredCard.el.classList.remove('is-hovered');
  hoveredCard = c;
  if (c) {
    c.el.style.setProperty('--inv', (1 / WALL_CONFIG.HOVER_SCALE).toFixed(4));
    c.el.classList.add('is-hovered');
  }
  syncFocusUI();
}

function showCentreOverlay(show) {
  if (show) {
    centreBackdropEl.classList.remove('opacity-0', 'pointer-events-none');
    centreBackdropEl.classList.add('opacity-100', 'pointer-events-auto');

    centreOverlayEl.classList.remove('opacity-0', 'pointer-events-none');
    centreOverlayEl.classList.add('opacity-100', 'pointer-events-auto');

    centreModalEl.classList.remove('scale-95', 'opacity-0', 'pointer-events-none');
    centreModalEl.classList.add('scale-100', 'opacity-100', 'pointer-events-auto');

    btnPrevMoment.classList.remove('pointer-events-none');
    btnPrevMoment.classList.add('pointer-events-auto');
    btnNextMoment.classList.remove('pointer-events-none');
    btnNextMoment.classList.add('pointer-events-auto');

    hintEl.classList.add('opacity-0');
    wallEl.classList.add('is-dimmed');
  } else {
    centreBackdropEl.classList.add('opacity-0', 'pointer-events-none');
    centreBackdropEl.classList.remove('opacity-100', 'pointer-events-auto');

    centreOverlayEl.classList.add('opacity-0', 'pointer-events-none');
    centreOverlayEl.classList.remove('opacity-100', 'pointer-events-auto');

    centreModalEl.classList.add('scale-95', 'opacity-0', 'pointer-events-none');
    centreModalEl.classList.remove('scale-100', 'opacity-100', 'pointer-events-auto');

    btnPrevMoment.classList.add('pointer-events-none');
    btnPrevMoment.classList.remove('pointer-events-auto');
    btnNextMoment.classList.add('pointer-events-none');
    btnNextMoment.classList.remove('pointer-events-auto');

    hintEl.classList.remove('opacity-0');
    wallEl.classList.remove('is-dimmed');
  }
}

function updateOverlayText(momentNum, dateText) {
  centreTitleEl.textContent = `Momen #${momentNum}`;
  centreDateEl.textContent = dateText;
}

function setActive(c, intro = false) {
  setHovered(null);
  activeCard = c;
  introFocus = intro;
  currentActivePhotoIndex = typeof c.photoIndex === 'number' ? c.photoIndex : 0;
  const photo = PHOTOS[currentActivePhotoIndex] || c.p;

  // Muat gambar beresolusi tinggi murni tanpa blur
  centreImg.src = getHighResUrl(photo);
  updateOverlayText(currentActivePhotoIndex + 1, photo.dateFormatted || '03 November 2026');

  showCentreOverlay(true);
  if (overlayEl) overlayEl.classList.remove('is-visible');
  syncFocusUI();
}

function clearActive() {
  clearTimeout(focusTimer);
  showCentreOverlay(false);
  if (overlayEl) overlayEl.classList.add('is-visible');
  activeCard = null;
  introFocus = false;
  hoverReadyAt = performance.now() + 250;
  syncFocusUI();
}

function goToMoment(targetIndex, direction = 1) {
  if (!PHOTOS.length) return;
  const n = PHOTOS.length;
  const newIndex = ((targetIndex % n) + n) % n;
  currentActivePhotoIndex = newIndex;
  const photo = PHOTOS[newIndex];

  // Animasi transisi geser & fade halus dan tajam
  centreImg.style.opacity = '0';
  centreImg.style.transform = direction > 0 ? 'translateX(24px) scale(0.97)' : 'translateX(-24px) scale(0.97)';
  centreTitleEl.style.opacity = '0';
  centreDateEl.style.opacity = '0';
  centreTitleEl.style.transform = direction > 0 ? 'translateX(16px)' : 'translateX(-16px)';
  centreDateEl.style.transform = direction > 0 ? 'translateX(16px)' : 'translateX(-16px)';

  setTimeout(() => {
    centreImg.src = getHighResUrl(photo);
    updateOverlayText(newIndex + 1, photo.dateFormatted || '03 November 2026');

    centreImg.style.transform = 'translateX(0) scale(1)';
    centreImg.style.opacity = '1';
    centreTitleEl.style.transform = 'translateX(0)';
    centreDateEl.style.transform = 'translateX(0)';
    centreTitleEl.style.opacity = '1';
    centreDateEl.style.opacity = '1';
  }, 110);
}

function nextMoment() {
  goToMoment(currentActivePhotoIndex + 1, 1);
}

function prevMoment() {
  goToMoment(currentActivePhotoIndex - 1, -1);
}

// Mendeteksi kartu di bawah kursor
function pickAt(x, y) {
  let best = null;
  let bestD = Infinity;
  for (const r of rows) {
    if (Math.abs(y - r.cy) > r.rowH * 0.85) continue;
    for (const c of r.cards) {
      if (c === activeCard) continue;
      if (Math.abs(x - c.currX) <= c.w / 2 + 5 && Math.abs(y - c.currY) <= c.h / 2 + 5) {
        const dx = x - c.currX;
        const dy = y - c.currY;
        const d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = c; }
      }
    }
  }
  return best;
}

function detectHover() {
  const { x, y } = pointer;
  if (hoveredCard) {
    const c = hoveredCard;
    if (Math.abs(x - c.currX) <= (c.w * c.currScale) / 2 && Math.abs(y - c.currY) <= (c.h * c.currScale) / 2) return;
  }
  setHovered(pickAt(x, y));
}

/* ==========================================================================
   PHYSICS & ANIMATION LOOP
   ========================================================================== */
let last = performance.now();

function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (mode !== 'hidden') step(now, dt);
  requestAnimationFrame(tick);
}

function step(now, dt) {
  const f = dt * 60;
  const k = (a) => 1 - Math.pow(1 - a, f);
  const diag = Math.hypot(vw, vh);

  // Cursor interpolation
  if (pointer.active) {
    if (!mouse.init) { mouse.x = pointer.x; mouse.y = pointer.y; mouse.init = true; }
    mouse.x = lerp(mouse.x, pointer.x, k(0.28));
    mouse.y = lerp(mouse.y, pointer.y, k(0.28));
  }

  // Flow speed: berhenti saat foto terbuka, melambat saat hover
  const targetSpeed = mode !== 'wall' ? 0.4 : activeCard ? 0 : hoveredCard ? 0.15 : 1;
  speedMul = lerp(speedMul, targetSpeed, k(0.08));

  // 1) Constant linear marquee advance
  for (const row of rows) {
    const dx = row.dir * row.speed * speedMul * dt;
    const half = row.total / 2;
    for (const c of row.cards) {
      c.baseX += dx;
      if (c.baseX > half) {
        c.baseX -= row.total;
      } else if (c.baseX < -half) {
        c.baseX += row.total;
      }
    }
  }

  // 2) Hover detection
  if (mode === 'wall' && pointer.active && !activeCard && now > hoverReadyAt) detectHover();
  else if (hoveredCard) setHovered(null);

  // 3) Targets for focused cards
  let hx = 0, hy = 0, hHalfW = 0, hExtraW = 0, hExtraH = 0;
  if (hoveredCard) {
    const c = hoveredCard;
    const maxY = Math.max(0, vh / 2 - (c.h * WALL_CONFIG.HOVER_SCALE) / 2 - 16);
    hx = c.baseX;
    hy = clamp(c.baseY, -maxY, maxY);
    hHalfW = (c.w * WALL_CONFIG.HOVER_SCALE) / 2;
    hExtraW = (c.w * (WALL_CONFIG.HOVER_SCALE - 1)) / 2;
    hExtraH = (c.h * (WALL_CONFIG.HOVER_SCALE - 1)) / 2;
  }

  // 4) Targets for cards
  const CURSOR_R_SQ = WALL_CONFIG.CURSOR_R * WALL_CONFIG.CURSOR_R;
  const HOVER_R_SQ = WALL_CONFIG.HOVER_R * WALL_CONFIG.HOVER_R;
  const freeCursor = pointer.active && mode === 'wall' && !activeCard;
  const aPos = k(mode === 'leaving' ? WALL_CONFIG.LERP_LEAVE : now < introUntil ? WALL_CONFIG.LERP_INTRO : WALL_CONFIG.LERP_POS);
  const aScale = k(now < introUntil ? WALL_CONFIG.LERP_INTRO : WALL_CONFIG.LERP_SCALE);

  for (const c of cards) {
    if (c === hoveredCard && !activeCard) {
      c.targetScale = WALL_CONFIG.HOVER_SCALE;
      const py = hy - c.baseY;
      c.offX = lerp(c.offX, 0, aPos);
      c.offY = lerp(c.offY, py, aPos);
      c.currX = c.baseX + c.offX;
      c.currY = c.baseY + c.offY;
      c.currScale = lerp(c.currScale, c.targetScale, aScale);
      continue;
    }

    let px = 0, py = 0, s = 1;

    if (mode === 'leaving') {
      const [ux, uy] = unitFromCentre(c);
      px = ux * diag * 0.85;
      py = uy * diag * 0.85;
      s = 0.8;
    } else {
      // Hover card repulsion
      if (hoveredCard) {
        const dx = c.baseX - hx, dy = c.baseY - hy;

        if (c.r === hoveredCard.r) {
          const adx = Math.abs(dx);
          const RANGE = 720;
          if (adx < RANGE) {
            const fr = 1 - adx / RANGE;
            px += Math.sign(dx || 1) * (hExtraW + 22) * Math.pow(fr, 0.55);
          }
        } else if (Math.abs(c.r - hoveredCard.r) === 1) {
          const reach = hHalfW + c.w / 2 + 40;
          const adx = Math.abs(dx);
          if (adx < reach) {
            const ov = 1 - adx / reach;
            py += Math.sign(dy || 1) * (hExtraH + 16) * Math.pow(ov, 0.7);
          }
        }

        if (Math.abs(dx) < WALL_CONFIG.HOVER_R && Math.abs(dy) < WALL_CONFIG.HOVER_R) {
          const dSq = dx * dx + dy * dy;
          if (dSq < HOVER_R_SQ) {
            const d = Math.sqrt(dSq) || 0.001;
            const fr = 1 - d / WALL_CONFIG.HOVER_R;
            const m = Math.pow(fr, 1.2) * 80;
            px += (dx / d) * m;
            py += (dy / d) * m;
            s = Math.min(s, 1 - fr * 0.05);
          }
        }
      }

      // Free cursor parting
      if (freeCursor) {
        const dx = c.baseX + px - mouse.x, dy = c.baseY + py - mouse.y;
        if (Math.abs(dx) < WALL_CONFIG.CURSOR_R && Math.abs(dy) < WALL_CONFIG.CURSOR_R) {
          const dSq = dx * dx + dy * dy;
          if (dSq < CURSOR_R_SQ) {
            const d = Math.sqrt(dSq) || 0.001;
            const fr = 1 - d / WALL_CONFIG.CURSOR_R;
            const m = Math.pow(fr, 1.3) * (hoveredCard ? 30 : 110);
            px += (dx / d) * m;
            py += (dy / d) * m;
          }
        }
      }
    }

    c.targetScale = s;

    if (now >= c.hold) {
      c.offX = lerp(c.offX, px, aPos);
      c.offY = lerp(c.offY, py, aPos);
      c.currX = c.baseX + c.offX;
      c.currY = c.baseY + c.offY;
      c.currScale = lerp(c.currScale, c.targetScale, aScale);
    }
  }

  render();
}

function render() {
  for (const c of cards) {
    c.el.style.transform = `translate3d(${c.currX.toFixed(2)}px, ${c.currY.toFixed(2)}px, 0) scale(${c.currScale.toFixed(3)})`;
    let z = 1;
    if (c === hoveredCard) z = 30;
    if (c.lastZ !== z) {
      c.el.style.zIndex = z;
      c.lastZ = z;
    }
  }
}

/* ==========================================================================
   VIEW NAVIGATION (WALL & ABOUT)
   ========================================================================== */
function setNav(v) {
  navLinks.forEach((a) => {
    const on = a.dataset.view === v;
    a.classList.toggle('is-active', on);
    a.toggleAttribute('aria-current', on);
  });
  headerEl.classList.toggle('is-about', v === 'about');
  hintEl.classList.toggle('is-hidden', v !== 'wall');
}

function enterWall() {
  const now = performance.now();
  const diag = Math.hypot(vw, vh);
  mode = 'wall';
  speedMul = 1;
  clearActive();
  setHovered(null);

  for (const c of cards) {
    const [ux, uy] = unitFromCentre(c);
    const far = diag * (0.62 + Math.random() * 0.25);
    c.offX = ux * far;
    c.offY = uy * far;
    c.currX = c.baseX + c.offX;
    c.currY = c.baseY + c.offY;
    c.currScale = 0.6;
    c.hold = now + Math.random() * 280;
  }
  introUntil = now + 2000;
  hoverReadyAt = now + 1000;
  render();

  wallEl.classList.add('is-visible');
  overlayEl.classList.add('is-visible');
}

function showWall(fromAbout) {
  if (view === 'wall') return;
  view = 'wall';
  setNav('wall');
  history.replaceState(null, '', '#wall');
  aboutEl.classList.remove('is-visible');
  setTimeout(() => { if (view === 'wall') enterWall(); }, fromAbout ? 350 : 0);
}

function showAbout() {
  if (view === 'about') return;
  view = 'about';
  setNav('about');
  history.replaceState(null, '', '#about');
  clearActive();
  setHovered(null);
  mode = 'leaving';
  wallEl.classList.remove('is-visible');
  overlayEl.classList.remove('is-visible');
  setTimeout(() => {
    if (view !== 'about') return;
    mode = 'hidden';
    aboutEl.scrollTop = 0;
    aboutEl.classList.add('is-visible');
  }, 520);
}

/* ==========================================================================
   EVENT LISTENERS
   ========================================================================== */
function updatePointer(e) {
  pointer.x = e.clientX - vw / 2;
  pointer.y = e.clientY - vh / 2;
  pointer.active = true;
}

wallEl.addEventListener('pointermove', updatePointer);
wallEl.addEventListener('pointerdown', updatePointer);
wallEl.addEventListener('pointerleave', () => {
  pointer.active = false;
  mouse.init = false;
});

// Click wall to centre / return
wallEl.addEventListener('click', (e) => {
  if (mode !== 'wall') return;
  updatePointer(e);
  if (activeCard) {
    clearActive();
    return;
  }
  const c = hoveredCard || pickAt(pointer.x, pointer.y);
  if (c) setActive(c);
});

// Navigation buttons
btnPrevMoment.addEventListener('click', (e) => {
  e.stopPropagation();
  prevMoment();
});

btnNextMoment.addEventListener('click', (e) => {
  e.stopPropagation();
  nextMoment();
});

btnCloseFrame.addEventListener('click', (e) => {
  e.stopPropagation();
  clearActive();
});

centreBackdropEl.addEventListener('click', (e) => {
  e.stopPropagation();
  clearActive();
});

centreOverlayEl.addEventListener('click', (e) => {
  if (e.target === centreOverlayEl) {
    clearActive();
  }
});

// Touch Swipe Gesture Support (Mobile / Tablet)
let touchStartX = 0;
let touchStartY = 0;
centreModalEl.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

centreModalEl.addEventListener('touchend', (e) => {
  const touchEndX = e.changedTouches[0].screenX;
  const touchEndY = e.changedTouches[0].screenY;
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
    if (dx < 0) nextMoment(); // Geser ke kiri -> Momen berikutnya
    else prevMoment();        // Geser ke kanan -> Momen sebelumnya
  }
}, { passive: true });

// View routing tabs
document.querySelectorAll('[data-view]').forEach((a) => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    if (a.dataset.view === 'about') showAbout();
    else showWall(view === 'about');
  });
});

// Keyboard controls (Esc = Close, ArrowLeft = Prev, ArrowRight = Next)
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    clearActive();
  } else if (e.key === 'ArrowLeft') {
    if (activeCard) prevMoment();
  } else if (e.key === 'ArrowRight') {
    if (activeCard) nextMoment();
  }
});

let resizeT = null;
addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => {
    buildWall();
    syncFocusUI();
  }, 120);
});

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
async function initApp() {
  if (PHOTO_API_URL && PHOTO_API_URL.trim() !== '') {
    try {
      const res = await fetch(PHOTO_API_URL);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.record || []);
      if (list && list.length > 0) {
        const CATEGORIES = ['LANDSCAPE', 'NATURE', 'ARCHITECTURE', 'PORTRAIT', 'MOMENTS'];
        PHOTOS = list.map((item, i) => {
          let raw = typeof item === 'string' ? item.trim() : (item.url || item.src || '');
          const srcMatch = raw.match(/src=["']([^"']+)["']/i);
          let cleanUrl = srcMatch ? srcMatch[1] : raw;
          let thumbUrl = cleanUrl;
          let highResUrl = cleanUrl;

          // Bypass blokir ISP Indonesia via Cloudflare CDN (wsrv.nl)
          if (cleanUrl.includes('ibb.co')) {
            thumbUrl = `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&w=600&q=80&output=webp`;
            highResUrl = `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&output=webp&q=95&we=true`;
          }

          const itemYear = (typeof item === 'object' && item.year) || 2024;
          return {
            photoIndex: i,
            momentNumber: i + 1,
            cat: (typeof item === 'object' && item.cat) || CATEGORIES[i % CATEGORIES.length],
            title: (typeof item === 'object' && item.title) || `Momen #${i + 1}`,
            place: (typeof item === 'object' && item.place) || 'Gallery Archive',
            year: itemYear,
            dateFormatted: extractPhotoDate(cleanUrl, i, item),
            o: (typeof item === 'object' && item.o) || (i % 4 === 1 ? 'p' : 'l'),
            url: thumbUrl,
            highResUrl: highResUrl,
            rawUrl: cleanUrl
          };
        });
      }
    } catch (err) {
      console.warn('Gagal memuat foto dari API eksternal, menggunakan fallback:', err);
    }
  }

  buildWall();
  if (location.hash === '#about') {
    view = 'about';
    mode = 'hidden';
    setNav('about');
    aboutEl.classList.add('is-visible');
  } else {
    view = 'wall';
    setNav('wall');
    enterWall();
  }
  requestAnimationFrame(tick);
}

// Start application
initApp();

