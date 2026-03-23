(function () {

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

  const satellite = {
    x: 0, y: 0,
    vx: 0, vy: 0,
    alpha: 0,
    active: false,
  };

  function launch() {
    const W = canvas.width;
    const H = canvas.height;

    // Pick a random edge to start from
    const edge = Math.floor(Math.random() * 4);
    const speed = 0.4 + Math.random() * 0.25;

    // Random shallow angle so it crosses the full screen
    const angle = (15 + Math.random() * 30) * (Math.PI / 180);

    switch (edge) {
      case 0: // left → right, slight downward drift
        satellite.x  = -4;
        satellite.y  = H * (0.1 + Math.random() * 0.5);
        satellite.vx =  speed * Math.cos(angle);
        satellite.vy =  speed * Math.sin(angle);
        break;
      case 1: // right → left
        satellite.x  = W + 4;
        satellite.y  = H * (0.1 + Math.random() * 0.5);
        satellite.vx = -speed * Math.cos(angle);
        satellite.vy =  speed * Math.sin(angle);
        break;
      case 2: // top → bottom-right
        satellite.x  = W * (0.1 + Math.random() * 0.8);
        satellite.y  = -4;
        satellite.vx =  speed * Math.sin(angle) * (Math.random() > 0.5 ? 1 : -1);
        satellite.vy =  speed * Math.cos(angle);
        break;
      case 3: // bottom → top
        satellite.x  = W * (0.1 + Math.random() * 0.8);
        satellite.y  = H + 4;
        satellite.vx =  speed * Math.sin(angle) * (Math.random() > 0.5 ? 1 : -1);
        satellite.vy = -speed * Math.cos(angle);
        break;
    }

    satellite.alpha  = 0;
    satellite.active = true;
  }

  function isOffScreen() {
    const W = canvas.width;
    const H = canvas.height;
    const m = 20;
    return (
      satellite.x < -m || satellite.x > W + m ||
      satellite.y < -m || satellite.y > H + m
    );
  }

  function schedule() {
    // Every 45 seconds to 2 minutes
    const delay = 45000 + Math.random() * 75000;
    setTimeout(() => {
      launch();
      // Schedule next after this one finishes — handled in animate
    }, delay);
  }

  // First pass — wait a bit after load
  setTimeout(launch, 8000);

  let t = 0;

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (satellite.active) {
      const W = canvas.width;
      const H = canvas.height;

      // Edge fade
      const ex = Math.min(satellite.x, W - satellite.x) / (W * 0.12);
      const ey = Math.min(satellite.y, H - satellite.y) / (H * 0.12);
      const edgeFade = Math.min(1, Math.max(0, Math.min(ex, ey)));
      satellite.alpha = edgeFade * 0.8;

      if (satellite.alpha > 0.01) {
        // Direction vector for placing wing lights perpendicular to travel
        const len  = Math.sqrt(satellite.vx ** 2 + satellite.vy ** 2);
        const perpX = -satellite.vy / len;   // perpendicular to direction
        const perpY =  satellite.vx / len;

        const wingSpread = 5; // px from centre to each light

        ctx.save();

        // ── Main body — white dot ──
        ctx.beginPath();
        ctx.arc(satellite.x, satellite.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle   = `rgba(255, 255, 255, ${satellite.alpha})`;
        ctx.shadowColor = `rgba(220, 215, 255, ${satellite.alpha * 0.5})`;
        ctx.shadowBlur  = 4;
        ctx.fill();

        // ── Red light — left wing, blinks every ~1.2s ──
        const redBlink  = Math.sin(t * 0.045) > 0.3;
        const redAlpha  = redBlink ? satellite.alpha : satellite.alpha * 0.08;
        const redX = satellite.x + perpX * wingSpread;
        const redY = satellite.y + perpY * wingSpread;

        ctx.beginPath();
        ctx.arc(redX, redY, 1.2, 0, Math.PI * 2);
        ctx.fillStyle   = `rgba(255, 60, 60, ${redAlpha})`;
        ctx.shadowColor = `rgba(255, 40, 40, ${redAlpha * 0.8})`;
        ctx.shadowBlur  = redBlink ? 6 : 1;
        ctx.fill();

        // ── Green light — right wing, blinks offset from red ──
        const greenBlink  = Math.sin(t * 0.045 + Math.PI) > 0.3; // offset phase
        const greenAlpha  = greenBlink ? satellite.alpha : satellite.alpha * 0.08;
        const greenX = satellite.x - perpX * wingSpread;
        const greenY = satellite.y - perpY * wingSpread;

        ctx.beginPath();
        ctx.arc(greenX, greenY, 1.2, 0, Math.PI * 2);
        ctx.fillStyle   = `rgba(60, 255, 120, ${greenAlpha})`;
        ctx.shadowColor = `rgba(40, 255, 100, ${greenAlpha * 0.8})`;
        ctx.shadowBlur  = greenBlink ? 6 : 1;
        ctx.fill();

        // ── Strobe white — tail light, fast blink ──
        const strobeBlink = Math.sin(t * 0.18) > 0.6;
        if (strobeBlink) {
          const tailX = satellite.x - satellite.vx / len * 4;
          const tailY = satellite.y - satellite.vy / len * 4;

          ctx.beginPath();
          ctx.arc(tailX, tailY, 1, 0, Math.PI * 2);
          ctx.fillStyle   = `rgba(255, 255, 255, ${satellite.alpha * 0.9})`;
          ctx.shadowColor = `rgba(255, 255, 255, ${satellite.alpha * 0.6})`;
          ctx.shadowBlur  = 5;
          ctx.fill();
        }

        ctx.restore();
      }

      t++;
      satellite.x += satellite.vx;
      satellite.y += satellite.vy;

      if (isOffScreen()) {
        satellite.active = false;
        t = 0;
        schedule();
      }
    }

    requestAnimationFrame(animate);
  }

  animate();

})();