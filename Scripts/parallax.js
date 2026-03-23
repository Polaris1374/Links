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

  // ── Generate a field of stars ──
  function generateStars(count, sizeMin, sizeMax, opacityMin, opacityMax) {
    return Array.from({ length: count }, () => ({
      x:       Math.random(),        // 0–1 normalized
      y:       Math.random(),
      size:    sizeMin + Math.random() * (sizeMax - sizeMin),
      opacity: opacityMin + Math.random() * (opacityMax - opacityMin),
      // Slight individual twinkle phase
      phase:   Math.random() * Math.PI * 2,
      speed:   0.0004 + Math.random() * 0.0003,
    }));
  }

  // Three layers: far (slow), mid, near (fast)
  const layers = [
    {
      stars:      generateStars(60, 0.5, 1.0, 0.25, 0.5),
      parallax:   0.012,   // barely moves — distant
      color:      [200, 190, 255],
    },
    {
      stars:      generateStars(35, 1.0, 1.8, 0.45, 0.75),
      parallax:   0.035,   // mid distance
      color:      [220, 215, 255],
    },
    {
      stars:      generateStars(18, 1.8, 2.8, 0.65, 1.0),
      parallax:   0.07,    // closest — moves most
      color:      [255, 255, 255],
    },
  ];

  // ── Scroll tracking — smooth lerp so it feels floaty ──
  let scrollY      = window.scrollY;
  let smoothScroll = scrollY;

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  }, { passive: true });

  // ── Mouse tracking for subtle horizontal parallax ──
  let mouseX      = 0.5;   // normalised 0–1
  let smoothMouseX = 0.5;

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX / window.innerWidth;
  }, { passive: true });

  let t = 0;

  function drawLayer(layer) {
    const W = canvas.width;
    const H = canvas.height;
    const [r, g, b] = layer.color;

    // How far this layer has shifted
    const offsetY =  smoothScroll * layer.parallax;
    const offsetX = (smoothMouseX - 0.5) * layer.parallax * W * 1.5;

    layer.stars.forEach(star => {
      // Individual twinkle
      const twinkle = 0.75 + Math.sin(t * star.speed + star.phase) * 0.25;
      const alpha   = star.opacity * twinkle;

      // Position with parallax offset, wrapped so stars tile seamlessly
      const px = ((star.x * W + offsetX) % (W + 20) + W + 20) % (W + 20);
      const py = ((star.y * H + offsetY) % (H + 20) + H + 20) % (H + 20);

      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, star.size, 0, Math.PI * 2);
      ctx.fillStyle   = `rgba(${r},${g},${b},${alpha})`;
      ctx.shadowColor = `rgba(${r},${g},${b},${alpha * 0.6})`;
      ctx.shadowBlur  = star.size * 3;
      ctx.fill();
      ctx.restore();
    });
  }

  function animate() {
    t++;

    // Smooth lerp toward real scroll / mouse values
    smoothScroll  += (scrollY  - smoothScroll)  * 0.06;
    smoothMouseX  += (mouseX   - smoothMouseX)  * 0.04;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    layers.forEach(drawLayer);

    requestAnimationFrame(animate);
  }

  animate();

})();