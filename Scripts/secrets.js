// ── Cursor ──
const cursor = document.getElementById('cursor');
const ring   = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
});
(function animateRing() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  ring.style.left = rx + 'px';
  ring.style.top  = ry + 'px';
  requestAnimationFrame(animateRing);
})();

// ── Background stars ──
const bgCanvas = document.getElementById('bg');
const bgCtx    = bgCanvas.getContext('2d');
let stars = [];

function resizeBg() {
  bgCanvas.width  = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
function initStars() {
  stars = [];
  for (let i = 0; i < 220; i++) {
    stars.push({
      x:  Math.random() * bgCanvas.width,
      y:  Math.random() * bgCanvas.height,
      r:  Math.random() * 1.4 + 0.2,
      a:  Math.random() * 0.5 + 0.1,
      ph: Math.random() * Math.PI * 2,
      sp: Math.random() * 0.3 + 0.05
    });
  }
}
let bt = 0;
function drawBg() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  bt += 0.006;
  for (const s of stars) {
    const a = s.a * (0.6 + Math.sin(bt * s.sp + s.ph) * 0.4);
    bgCtx.beginPath();
    bgCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    bgCtx.fillStyle = `rgba(180,150,255,${Math.min(1, a).toFixed(2)})`;
    bgCtx.fill();
  }
  requestAnimationFrame(drawBg);
}
window.addEventListener('resize', () => { resizeBg(); initStars(); });
resizeBg(); initStars(); drawBg();

// ── Background black hole (Interstellar style, ghosted) ──
const bh    = document.getElementById('bh');
const bhCtx = bh.getContext('2d');
const BH    = 420;
bh.width = BH; bh.height = BH;

const bcx     = BH / 2, bcy = BH / 2;
const BR_SING = 95;
const BR_PHOT = 108;
const BR_DI   = 104;
const BR_DO   = 200;
let bht = 0;

function drawBH() {
  bhCtx.clearRect(0, 0, BH, BH);
  bht += 0.003;

  bhCtx.save();
  bhCtx.translate(bcx, bcy);

  // Accretion disk layers
  for (let i = 0; i < 52; i++) {
    const frac  = i / 52;
    const r     = BR_DI + frac * (BR_DO - BR_DI);
    const angle = bht * (1 - frac * 0.6) + frac * Math.PI * 3.2;
    const heat  = Math.pow(1 - frac, 1.5);
    const alpha = heat * 0.5;

    let col;
    if (frac < 0.15) {
      const v = Math.round(215 + 40 * (1 - frac / 0.15));
      col = `rgba(${v},${Math.round(v * 0.9)},${Math.round(v * 0.78)},${alpha})`;
    } else if (frac < 0.45) {
      const f2 = (frac - 0.15) / 0.30;
      col = `rgba(255,${Math.round(195 - f2 * 95)},${Math.round(75 - f2 * 55)},${alpha})`;
    } else {
      const f2 = (frac - 0.45) / 0.55;
      col = `rgba(${Math.round(215 - f2 * 80)},${Math.round(75 - f2 * 55)},${Math.round(18 - f2 * 14)},${alpha * 0.8})`;
    }

    for (let s = 0; s < 3; s++) {
      const sa = angle + (s / 3) * Math.PI * 2;
      const sw = (0.4 + frac * 0.5) * (Math.PI / 3);
      bhCtx.save();
      bhCtx.scale(1, 0.28 + frac * 0.07);
      bhCtx.beginPath();
      bhCtx.arc(0, 0, r, sa, sa + sw);
      bhCtx.strokeStyle = col;
      bhCtx.lineWidth   = 1.2 + heat * 2.8;
      bhCtx.shadowColor = col;
      bhCtx.shadowBlur  = heat * 10;
      bhCtx.stroke();
      bhCtx.restore();
    }
  }

  // Lensed back arc
  for (let i = 0; i < 30; i++) {
    const frac  = i / 30;
    const r     = BR_DI * 0.97 + frac * (BR_DO * 0.5 - BR_DI * 0.97);
    const heat  = Math.pow(1 - frac, 1.8);
    const alpha = heat * 0.4;
    const col   = `rgba(${Math.round(255 - frac * 80)},${Math.round(185 - frac * 115)},${Math.round(95 - frac * 75)},${alpha})`;
    bhCtx.save();
    bhCtx.scale(1, 0.22);
    bhCtx.beginPath();
    bhCtx.arc(0, 0, r, Math.PI + 0.2, Math.PI * 2 - 0.2);
    bhCtx.strokeStyle = col;
    bhCtx.lineWidth   = 1 + heat * 3.2;
    bhCtx.shadowColor = col;
    bhCtx.shadowBlur  = heat * 9;
    bhCtx.stroke();
    bhCtx.restore();
  }

  bhCtx.restore();

  // Photon ring
  const pp = 0.7 + Math.sin(bht * 2) * 0.3;
  const pg = bhCtx.createRadialGradient(bcx, bcy, BR_PHOT - 4, bcx, bcy, BR_PHOT + 4);
  pg.addColorStop(0,   'rgba(255,210,130,0)');
  pg.addColorStop(0.5, `rgba(255,220,160,${pp * 0.55})`);
  pg.addColorStop(1,   'rgba(255,190,80,0)');
  bhCtx.beginPath();
  bhCtx.arc(bcx, bcy, BR_PHOT, 0, Math.PI * 2);
  bhCtx.strokeStyle = pg;
  bhCtx.lineWidth   = 6;
  bhCtx.shadowColor = `rgba(255,200,100,${pp * 0.5})`;
  bhCtx.shadowBlur  = 14;
  bhCtx.stroke();

  // Event horizon
  const eg = bhCtx.createRadialGradient(bcx, bcy, 0, bcx, bcy, BR_SING);
  eg.addColorStop(0,    'rgba(0,0,0,1)');
  eg.addColorStop(0.88, 'rgba(0,0,0,1)');
  eg.addColorStop(1,    'rgba(0,0,0,0.95)');
  bhCtx.beginPath();
  bhCtx.arc(bcx, bcy, BR_SING, 0, Math.PI * 2);
  bhCtx.fillStyle = eg;
  bhCtx.fill();

  requestAnimationFrame(drawBH);
}
drawBH();