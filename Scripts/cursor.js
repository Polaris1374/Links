// ── cursor.js — Polaris Custom Cursor ──
// Self-contained. Injects its own styles + replaces #cursor / #cursorRing visuals.
// Requires #cursor and #cursorRing divs in the DOM.

(function () {

  const cursor = document.getElementById('cursor');
  const ring   = document.getElementById('cursorRing');
  if (!cursor || !ring) return;

  // ── Inject styles ──
  const style = document.createElement('style');
  style.textContent = `
    /* Hide system cursor site-wide */
    *, *::before, *::after { cursor: none !important; }

    /* ── 4-point star dot ── */
    #cursor {
      position: fixed;
      width: 18px;
      height: 18px;
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%) rotate(0deg);
      transition: transform 0.12s ease, opacity 0.2s ease;
      mix-blend-mode: screen;
      /* clear any old bg/shadow from inline CSS */
      background: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }

    /* The star is drawn via clip-path on a pseudo */
    #cursor::before {
      content: '';
      position: absolute;
      inset: 0;
      background: #ffffff;
      clip-path: polygon(
        50% 0%,
        54% 42%,
        100% 50%,
        54% 58%,
        50% 100%,
        46% 58%,
        0% 50%,
        46% 42%
      );
      filter: drop-shadow(0 0 4px rgba(255,255,255,0.9))
              drop-shadow(0 0 10px rgba(196,181,253,0.95))
              drop-shadow(0 0 20px rgba(167,139,250,0.7));
      transition: filter 0.2s ease, transform 0.2s ease;
    }

    /* Slow idle spin */
    #cursor::after {
      content: '';
      position: absolute;
      inset: 0;
      clip-path: polygon(
        50% 0%,
        54% 42%,
        100% 50%,
        54% 58%,
        50% 100%,
        46% 58%,
        0% 50%,
        46% 42%
      );
      background: rgba(167,139,250,0.18);
      transform: scale(1.6) rotate(45deg);
      animation: starGhostSpin 8s linear infinite;
    }

    @keyframes starGhostSpin {
      from { transform: scale(1.6) rotate(0deg);   opacity: 0.18; }
      50%  { transform: scale(2.0) rotate(180deg); opacity: 0.06; }
      to   { transform: scale(1.6) rotate(360deg); opacity: 0.18; }
    }

    /* Hover state — blooms */
    #cursor.hovered::before {
      filter: drop-shadow(0 0 6px rgba(255,255,255,1))
              drop-shadow(0 0 14px rgba(196,181,253,1))
              drop-shadow(0 0 28px rgba(167,139,250,0.9))
              drop-shadow(0 0 48px rgba(124,58,237,0.55));
      transform: scale(1.3);
    }
    #cursor.hovered::after {
      animation: starGhostSpinFast 3s linear infinite;
    }
    @keyframes starGhostSpinFast {
      from { transform: scale(2.0) rotate(0deg);   opacity: 0.25; }
      to   { transform: scale(2.0) rotate(360deg); opacity: 0.25; }
    }

    /* Click squish */
    #cursor.clicking::before {
      transform: scale(0.5) rotate(45deg);
      filter: drop-shadow(0 0 8px rgba(255,255,255,1))
              drop-shadow(0 0 24px rgba(196,181,253,1));
    }

    /* ── Rotating dashed orbital ring ── */
    #cursorRing {
      position: fixed;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      pointer-events: none;
      z-index: 9998;
      transform: translate(-50%, -50%);
      transition: width 0.25s ease, height 0.25s ease, opacity 0.2s ease;
      /* clear old border from inline/CSS */
      border: none !important;
    }

    /* Dashed orbit */
    #cursorRing::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 1px dashed rgba(167,139,250,0.45);
      box-shadow: 0 0 8px rgba(167,139,250,0.15);
      animation: ringRotate 6s linear infinite;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    /* Second ring offset — creates a double-orbit feel */
    #cursorRing::after {
      content: '';
      position: absolute;
      inset: 5px;
      border-radius: 50%;
      border: 1px solid rgba(124,58,237,0.2);
      animation: ringRotate 6s linear infinite reverse;
      transition: border-color 0.2s ease;
    }

    /* Hover */
    #cursorRing.hovered { width: 58px; height: 58px; }
    #cursorRing.hovered::before {
      border-color: rgba(196,181,253,0.7);
      border-style: dashed;
      box-shadow: 0 0 16px rgba(167,139,250,0.35), 0 0 30px rgba(124,58,237,0.15);
      animation: ringRotateFast 2.2s linear infinite;
    }
    #cursorRing.hovered::after {
      border-color: rgba(167,139,250,0.3);
      animation: ringRotateFast 2.2s linear infinite reverse;
    }

    /* Click */
    #cursorRing.clicking { width: 30px; height: 30px; }
    #cursorRing.clicking::before {
      border-color: rgba(196,181,253,0.9);
      box-shadow: 0 0 22px rgba(167,139,250,0.65);
      animation: ringRotateFast 1s linear infinite;
    }

    @keyframes ringRotate {
      to { transform: rotate(360deg); }
    }
    @keyframes ringRotateFast {
      to { transform: rotate(360deg); }
    }

    /* ── Click burst particles ── */
    .cursor-burst {
      position: fixed;
      pointer-events: none;
      z-index: 9997;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
      transition: transform 0.5s cubic-bezier(0.15, 0, 0, 1), opacity 0.5s ease;
    }
  `;
  document.head.appendChild(style);

  // ── State ──
  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;
  let ready  = false;

  // Hide until first move
  cursor.style.opacity = '0';
  ring.style.opacity   = '0';

  // ── Mouse tracking ──
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!ready) {
      ringX = mouseX;
      ringY = mouseY;
      ready = true;
      cursor.style.opacity = '1';
      ring.style.opacity   = '1';
    }

    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    ring.style.opacity   = '0';
  });
  document.addEventListener('mouseenter', () => {
    if (!ready) return;
    cursor.style.opacity = '1';
    ring.style.opacity   = '1';
  });

  // ── Click feedback ──
  document.addEventListener('mousedown', () => {
    cursor.classList.add('clicking');
    ring.classList.add('clicking');
    spawnBurst(mouseX, mouseY);
  });
  document.addEventListener('mouseup', () => {
    cursor.classList.remove('clicking');
    ring.classList.remove('clicking');
  });

  // ── Hover on interactive elements ──
  function attach(el) {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('hovered');
      ring.classList.add('hovered');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('hovered');
      ring.classList.remove('hovered');
    });
  }

  document.querySelectorAll('a, button, .planet, .link-item, .featured-card, .live-badge, [role="button"]')
    .forEach(attach);

  // Auto-attach to dynamically added elements (planets built by main.js)
  new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.matches?.('a, button, .planet, [role="button"]')) attach(node);
        node.querySelectorAll?.('a, button, .planet, [role="button"]').forEach(attach);
      });
    });
  }).observe(document.body, { childList: true, subtree: true });

  // ── Trailing ring lerp ──
  (function animateRing() {
    ringX += (mouseX - ringX) * 0.1;
    ringY += (mouseY - ringY) * 0.1;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    requestAnimationFrame(animateRing);
  })();

  // ── Star particle burst on click ──
  function spawnBurst(cx, cy) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const p     = document.createElement('div');
      p.className = 'cursor-burst';

      const angle  = (i / count) * Math.PI * 2;
      const dist   = 26 + Math.random() * 14;
      const dx     = Math.cos(angle) * dist;
      const dy     = Math.sin(angle) * dist;
      const size   = 3 + Math.random() * 2.5;
      const isStar = i % 2 === 0;
      const hue    = Math.random() > 0.5 ? '#c4b5fd' : '#a78bfa';

      Object.assign(p.style, {
        left:       cx + 'px',
        top:        cy + 'px',
        width:      size + 'px',
        height:     size + 'px',
        background: hue,
        boxShadow:  `0 0 6px ${hue}, 0 0 14px ${hue}`,
        clipPath: isStar
          ? 'polygon(50% 0%,54% 42%,100% 50%,54% 58%,50% 100%,46% 58%,0% 50%,46% 42%)'
          : 'none',
        borderRadius: isStar ? '0' : '50%',
        opacity: '1',
      });

      document.body.appendChild(p);

      requestAnimationFrame(() => {
        p.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`;
        p.style.opacity   = '0';
      });

      setTimeout(() => p.remove(), 540);
    }
  }

})();