(function () {

  // ── Canvas setup ──
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
  `;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // ── Star class ──
  class ShootingStar {
    constructor(offsetX, offsetY) {
      this.offsetX = offsetX;
      this.offsetY = offsetY;
      this.reset();
    }

    reset() {
      const W = canvas.width;
      const H = canvas.height;

      // Start from top-right quadrant
      this.x = W * (0.65 + Math.random() * 0.3) + this.offsetX;
      this.y = H * (0.02 + Math.random() * 0.12) + this.offsetY;

      // Each star gets its own random speed — left and DOWN
      const speed = 2.8 + Math.random() * 2.4;
      this.vx = -speed * 0.75;  // left
      this.vy =  speed * 0.65;  // down

      // Long contrail — scales with speed so it feels physical
      this.trailSteps = 55 + Math.random() * 25;

      // History of positions for the contrail
      this.history = [];

      this.life    = 0;
      this.alpha   = 0;
      this.done    = false;
    }

    update() {
      this.life += 0.008;

      // Fade in gently then stay fully visible until off screen
      if (this.life < 0.12) {
        this.alpha = this.life / 0.12;
      } else {
        this.alpha = 1;
      }

      // Store position history for the trail
      this.history.push({ x: this.x, y: this.y });
      if (this.history.length > this.trailSteps) {
        this.history.shift();
      }

      this.x += this.vx;
      this.y += this.vy;

      // Only mark done once fully off screen
      const W = canvas.width;
      const H = canvas.height;
      if (this.x < -200 || this.y > H + 200) this.done = true;
    }

    draw() {
      if (this.alpha <= 0 || this.history.length < 2) return;

      const tail = this.history[0];

      // Gradient from tail (transparent) to head (bright)
      const grad = ctx.createLinearGradient(tail.x, tail.y, this.x, this.y);
      grad.addColorStop(0,    `rgba(255,255,255,0)`);
      grad.addColorStop(0.35, `rgba(200,185,255,${this.alpha * 0.25})`);
      grad.addColorStop(0.72, `rgba(220,210,255,${this.alpha * 0.7})`);
      grad.addColorStop(1,    `rgba(255,255,255,${this.alpha})`);

      ctx.save();

      // Draw trail as a smooth polyline through history
      ctx.beginPath();
      ctx.moveTo(this.history[0].x, this.history[0].y);
      for (let i = 1; i < this.history.length; i++) {
        ctx.lineTo(this.history[i].x, this.history[i].y);
      }
      ctx.lineTo(this.x, this.y);

      ctx.strokeStyle = grad;
      ctx.lineWidth   = 1.8;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.shadowColor = `rgba(170,150,255,${this.alpha * 0.5})`;
      ctx.shadowBlur  = 8;
      ctx.stroke();

      // Glowing head
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle   = `rgba(255,255,255,${this.alpha})`;
      ctx.shadowColor = `rgba(210,195,255,${this.alpha})`;
      ctx.shadowBlur  = 14;
      ctx.fill();

      ctx.restore();
    }
  }

  // ── Formation offsets — 5 stars, loose triangle cluster ──
  //
  //        [2]  [3]       ← back row, spread wide
  //           [1]         ← mid
  //        [0]            ← point, leads
  //     [4]               ← straggler, bottom-left
  //
  const formation = [
    { x: -80,  y:  40 },   // point — leads
    { x: -30,  y:   0 },   // mid
    { x:   0,  y: -40 },   // back-right
    { x:  55,  y: -55 },   // back-far-right
    { x: -50,  y:  80 },   // straggler below
  ];

  let stars   = [];
  let running = false;

  function launchFormation() {
    if (running) return;
    running = true;

    stars = formation.map((off, i) => {
      const s = new ShootingStar(off.x, off.y);
      // Slight stagger so they don't all appear in the exact same frame
      s.life = -(i * 0.04);
      return s;
    });
  }

  // ── Render loop ──
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (stars.length) {
      stars.forEach(s => { s.update(); s.draw(); });
      if (stars.every(s => s.done)) {
        stars   = [];
        running = false;
      }
    }

    requestAnimationFrame(animate);
  }

  animate();

  // ── Timing: fire every 9–14 seconds ──
  function scheduleNext() {
    const delay = 60000 + Math.random() * 30000;
    setTimeout(() => {
      launchFormation();
      scheduleNext();
    }, delay);
  }

  // First fire after page settles
  setTimeout(() => {
    launchFormation();
    scheduleNext();
  }, 3000);

})();