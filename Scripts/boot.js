// ── boot.js — Polaris Warp Entry Page ──

(function () {

  const canvas   = document.getElementById('warp');
  const ctx      = canvas.getContext('2d');
  const logo     = document.getElementById('logo');
  const sub      = document.getElementById('sub');
  const line     = document.getElementById('line');
  const btn      = document.getElementById('jumpBtn');
  const footer   = document.getElementById('footer');
  const flash    = document.getElementById('flash');
  const mainFrame = document.getElementById('mainFrame');

  // ── CANVAS RESIZE ──
  let W, H, cx, cy;
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    cx = W / 2;
    cy = H / 2;
  }
  resize();
  window.addEventListener('resize', resize);

  // ── STARS ──
  const STAR_COUNT = 700;
  function rand(a, b) { return a + Math.random() * (b - a); }

  class Star {
    constructor() { this.reset(true); }

    reset(initial) {
      this.x  = rand(-1, 1);
      this.y  = rand(-1, 1);
      this.z  = initial ? Math.random() : 0.98 + Math.random() * 0.02;
      this.pz = this.z;
      const r = Math.random();
      this.hue = r < 0.55 ? [255, 255, 255]
               : r < 0.78 ? [210, 218, 255]
               : r < 0.92 ? [185, 165, 255]
               :             [165, 205, 255];
    }

    update(speed) {
      this.pz = this.z;
      this.z -= speed;
      if (this.z <= 0.001) this.reset(false);
    }
  }

  const stars = Array.from({ length: STAR_COUNT }, () => new Star());

  // ── WARP STATE ──
  let jumped     = false;
  let jumpedAt   = 0;
  let flashed    = false;
  let redirected = false;

  // Timeline after click (ms)
  const T2   = 4200;   // end of hard burn
  const T3   = 4500;   // flash peak
  const T4   = 5700;   // navigate (crossfade complete)
  const DEST = 'main.html';

  // ── SPEED CURVE ──
  // Single smooth-step³ blend — no hard phase boundaries
  function getSpeed(elapsed) {
    if (!jumped) return 0.00028;   // idle drift

    const tNorm  = Math.min(elapsed, T2) / T2;
    const smooth = tNorm * tNorm * (3 - 2 * tNorm);      // smoothstep
    const cubic  = smooth * smooth * smooth;               // extra weight at start

    let speed = 0.00028 + cubic * (0.064 - 0.00028);

    // Keep climbing gently after burn peaks
    if (elapsed > T2) speed += (elapsed - T2) * 0.000045;

    return speed;
  }

  // ── ENGAGE ──
  function engage() {
    if (jumped) return;
    jumped   = true;
    jumpedAt = performance.now();

    // Silently preload main.html — it'll be ready well before the flash
    mainFrame.src = DEST;

    // Dismiss all HUD elements
    logo.classList.add('gone');
    sub.classList.add('gone');
    line.classList.add('gone');
    btn.classList.add('gone');
    footer.classList.add('gone');
  }

  btn.addEventListener('click', e => { e.stopPropagation(); engage(); });
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'Enter') engage();
  });

  // ── DRAW LOOP ──
  let prevSpeed = 0;

  function draw(now) {
    const elapsed = jumped ? now - jumpedAt : 0;
    const speed   = getSpeed(elapsed);

    // Lerp smooths out per-frame jitter
    prevSpeed += (speed - prevSpeed) * 0.18;
    const s = prevSpeed;

    const trail = 1 + s * 460;

    // Background fade — short trails at low speed, long glowing streaks at high
    const fadeAlpha = Math.max(0.09, 0.88 - s * 10);
    ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
    ctx.fillRect(0, 0, W, H);

    // Radial centre glow — builds smoothly with speed
    const glowT = Math.min(1, Math.max(0, (s - 0.004) / 0.045));
    if (glowT > 0) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.58);
      g.addColorStop(0,    `rgba(75,38,195,${glowT * 0.22})`);
      g.addColorStop(0.35, `rgba(50,22,140,${glowT * 0.09})`);
      g.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // Stars
    stars.forEach(star => {
      star.update(s);

      const sx  = (star.x / star.z)  * cx + cx;
      const sy  = (star.y / star.z)  * cy + cy;
      const spx = (star.x / star.pz) * cx + cx;
      const spy = (star.y / star.pz) * cy + cy;

      if (sx < -40 || sx > W + 40 || sy < -40 || sy > H + 40) return;

      const bright = Math.min(1, (1 - star.z) * 1.25);
      const [r, g, b] = star.hue;

      const dx = sx - spx, dy = sy - spy;
      const tx = sx - dx * trail, ty = sy - dy * trail;

      const gr = ctx.createLinearGradient(tx, ty, sx, sy);
      gr.addColorStop(0,   `rgba(${r},${g},${b},0)`);
      gr.addColorStop(0.6, `rgba(${r},${g},${b},${bright * 0.4})`);
      gr.addColorStop(1,   `rgba(${r},${g},${b},${bright})`);

      const lw = Math.max(0.35, (1 - star.z) * (0.9 + s * 7));

      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = gr;
      ctx.lineWidth   = lw;
      ctx.shadowColor = `rgba(${r},${g},${b},${bright * 0.45})`;
      ctx.shadowBlur  = s > 0.01 ? lw * 2.5 : 0;
      ctx.stroke();
    });

    // Flash → crossfade sequence
    if (jumped) {
      if (elapsed >= T3 && !flashed) {
        flashed = true;

        // 1. Snap to white
        flash.classList.add('bright');

        // 2. Fade flash out + fade main.html in simultaneously
        setTimeout(() => {
          flash.classList.add('fadeout');
          mainFrame.classList.add('visible');
        }, 120);
      }

      // 3. Navigate once crossfade is complete — URL updates invisibly
      if (elapsed >= T4 && !redirected) {
        redirected = true;
        window.location.href = DEST;
      }
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);

})();