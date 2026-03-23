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

  // ── Nebula cloud definition ──
  const nebulae = [
    {
      // Top-left — deep indigo/violet
      x: 0.12, y: 0.18,
      rx: 0.38, ry: 0.28,
      colors: [
        [88,  28, 220, 0.07],
        [124, 58, 237, 0.045],
        [167,139, 250, 0.025],
      ],
      drift: { x: 0.00006, y: 0.000035 },
      pulse: { speed: 0.00018, amp: 0.012 },
      phase: 0,
    },
    {
      // Right side — blue-purple
      x: 0.78, y: 0.35,
      rx: 0.32, ry: 0.40,
      colors: [
        [76,  29, 149, 0.065],
        [109, 40, 217, 0.04],
        [196,181, 253, 0.02],
      ],
      drift: { x: -0.00005, y: 0.00004 },
      pulse: { speed: 0.00022, amp: 0.015 },
      phase: 1.8,
    },
    {
      // Bottom-centre — dusty rose/violet
      x: 0.48, y: 0.82,
      rx: 0.44, ry: 0.26,
      colors: [
        [91,  33, 182, 0.055],
        [139, 92, 246, 0.035],
        [221,214, 254, 0.018],
      ],
      drift: { x: 0.00004, y: -0.00003 },
      pulse: { speed: 0.00015, amp: 0.01 },
      phase: 3.4,
    },
    {
      // Top-right — cooler teal-purple
      x: 0.88, y: 0.08,
      rx: 0.25, ry: 0.22,
      colors: [
        [67,  56, 202, 0.05],
        [99,  102,241, 0.03],
        [165,180, 252, 0.018],
      ],
      drift: { x: -0.00007, y: 0.00005 },
      pulse: { speed: 0.0002, amp: 0.013 },
      phase: 0.9,
    },
  ];

  let t = 0;

  function drawNebula(n) {
    const W = canvas.width;
    const H = canvas.height;

    // Current centre position (slowly drifting)
    const cx = (n.x + n.drift.x * t) % 1.1;
    const cy = (n.y + n.drift.y * t) % 1.1;

    // Pulsing scale
    const scale = 1 + Math.sin(t * n.pulse.speed + n.phase) * n.pulse.amp;

    const px = cx * W;
    const py = cy * H;
    const rx = n.rx * W * scale;
    const ry = n.ry * H * scale;

    // Draw each colour layer as a radial gradient ellipse
    n.colors.forEach(([r, g, b, a], i) => {
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(rx, ry);

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      grad.addColorStop(0,    `rgba(${r},${g},${b},${a})`);
      grad.addColorStop(0.45, `rgba(${r},${g},${b},${a * 0.5})`);
      grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);

      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    });
  }

  function animate() {
    t++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nebulae.forEach(drawNebula);
    requestAnimationFrame(animate);
  }

  animate();

})();