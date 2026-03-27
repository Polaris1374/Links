// ── STARFIELD ──
(function() {
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function initStars() {
    stars = [];
    for (let i = 0; i < 280; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.6 + 0.3,
        base: Math.random(),
        speed: Math.random() * 0.4 + 0.1,
        phase: Math.random() * Math.PI * 2,
        hue: Math.random() < 0.2 ? 'rgba(210,195,255,' : 'rgba(255,255,255,'
      });
    }
  }

  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    t += 0.008;
    for (const s of stars) {
      const alpha = s.base * 0.5 + 0.5 + Math.sin(t * s.speed + s.phase) * 0.4;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.hue + Math.min(1, alpha).toFixed(2) + ')';
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); initStars(); });
  resize();
  initStars();
  draw();
})();

// ── CUSTOM CURSOR ──
const cursor = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');
document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top  = e.clientY + 'px';
  cursorRing.style.left = e.clientX + 'px';
  cursorRing.style.top  = e.clientY + 'px';
});

// ── PLANET DATA ──
const planets = [
  {
    id: 'twitch',
    label: 'Twitch',
    badge: 'Live Streams',
    href: 'https://www.twitch.tv/polaris1374_',
    icon: 'fa-brands fa-twitch',
    size: 45,
    orbitRadius: 0.14,
    orbitAngle: 210,
    color: 'radial-gradient(circle at 38% 32%, #c4a0ff 0%, #9146ff 50%, #4a1da0 100%)',
    glow: 'rgba(145,70,255,0.6)',
    live: true
  },
  {
    id: 'youtube',
    label: 'YouTube',
    badge: 'Main Channel',
    href: 'https://www.youtube.com/@Polaris1374',
    icon: 'fa-brands fa-youtube',
    size: 50,
    orbitRadius: 0.225,
    orbitAngle: 330,
    color: 'radial-gradient(circle at 38% 32%, #ff8080 0%, #ff0000 55%, #7a0000 100%)',
    glow: 'rgba(255,0,0,0.5)',
  },
  {
    id: 'discord',
    label: 'Discord',
    badge: 'VSM Community',
    href: 'https://discord.gg/XZtkTxYx9S',
    icon: 'fa-brands fa-discord',
    size: 40,
    orbitRadius: 0.305,
    orbitAngle: 80,
    color: 'radial-gradient(circle at 38% 32%, #8ea3ff 0%, #5865f2 55%, #2736b0 100%)',
    glow: 'rgba(88,101,242,0.55)',
  },
  {
    id: 'about',
    label: 'About',
    badge: 'About Me',
    href: 'about.html',
    icon: 'fa-solid fa-circle-info',
    size: 30,
    orbitRadius: 0.375,
    orbitAngle: 160,
    color: 'radial-gradient(circle at 38% 32%, #c4b5fd 0%, #a78bfa 55%, #5b21b6 100%)',
    glow: 'rgba(167,139,250,0.5)',
  },
  {
    id: 'merch',
    label: 'Merch',
    badge: 'Coming Soon',
    href: '#',
    icon: 'fa-solid fa-store',
    size: 35,
    orbitRadius: 0.44,
    orbitAngle: 285,
    color: 'radial-gradient(circle at 38% 32%, #888 0%, #555 55%, #222 100%)',
    glow: 'rgba(100,100,100,0.3)',
    disabled: true
  },
  {
    id: 'secrets',
    label: '???',
    badge: '[ classified ]',
    href: 'secrets.html',
    icon: 'fa-solid fa-lock',
    size: 26,
    orbitRadius: 0.515,
    orbitAngle: 42,
    color: 'radial-gradient(circle at 38% 32%, #1a0a2e 0%, #0d0618 55%, #050210 100%)',
    glow: 'rgba(80,30,140,0.35)',
    secret: true
  }
];

// ── BUILD SOLAR SYSTEM ──
const container = document.getElementById('solarContainer');

function buildSystem() {
  const size = Math.min(container.offsetWidth, container.offsetHeight);
  const center = size / 2;

  container.querySelectorAll('.orbit, .planet-orbit').forEach(el => el.remove());

  planets.forEach(p => {
    const r = p.orbitRadius * size;

    const orbit = document.createElement('div');
    orbit.className = 'orbit';
    orbit.style.width = `${r * 2}px`;
    orbit.style.height = `${r * 2}px`;
    if (p.secret) orbit.dataset.secretOrbit = '1';
    container.appendChild(orbit);

    const wrapper = document.createElement('div');
    wrapper.className = 'planet-orbit';
    wrapper.dataset.pid = p.id;
    container.appendChild(wrapper);

    const planetEl = document.createElement('a');
    planetEl.className = 'planet' + (p.disabled ? ' disabled' : '');
    if (p.secret) planetEl.dataset.secret = '1';
    planetEl.href = p.disabled ? '#' : p.href;
    if (!p.disabled) {
      planetEl.target = p.href.startsWith('http') ? '_blank' : '_self';
      planetEl.rel = 'noopener noreferrer';
    }

    planetEl.style.width  = `${p.size}px`;
    planetEl.style.height = `${p.size}px`;

    planetEl.innerHTML = `
      <div class="planet-inner" style="
        background: ${p.color};
        box-shadow: 0 0 10px 3px ${p.glow}, 0 0 25px 8px ${p.glow.replace('0.', '0.2')};
        ${p.secret ? 'width:100%;height:100%;' : ''}
      ">
        ${p.live ? '<div class="live-ring"></div>' : ''}
        ${p.secret
          ? `<i class="${p.icon}" style="font-size:${Math.round(p.size * 0.42)}px; color:rgba(120,60,200,0.5); transition:color 0.4s, text-shadow 0.4s;"></i>`
          : `<i class="${p.icon}" style="font-size:${Math.round(p.size * 0.42)}px; color:rgba(255,255,255,0.92);"></i>`
        }
      </div>
      <span class="planet-label">${p.label}</span>
      <div class="planet-tooltip">${p.badge}</div>
    `;

    wrapper.appendChild(planetEl);
  });
}

// ── ANIMATION ──
const orbitSpeeds = {
  twitch:   0.008,
  youtube:  0.005,
  discord:  0.0035,
  about:    0.002,
  merch:    0.001,
  secrets:  0.0007
};

const angles = {};
planets.forEach(p => { angles[p.id] = p.orbitAngle; });

function animate() {
  const size = Math.min(container.offsetWidth, container.offsetHeight);
  const center = size / 2;

  planets.forEach(p => {
    if (p.disabled) return;

    angles[p.id] += orbitSpeeds[p.id];
    const rad = (angles[p.id] - 90) * Math.PI / 180;
    const r = p.orbitRadius * size;

    const x = center + r * Math.cos(rad);
    const y = center + r * Math.sin(rad);

    const wrapper = container.querySelector(`.planet-orbit[data-pid="${p.id}"]`);
    if (wrapper) {
      wrapper.style.left = `${x}px`;
      wrapper.style.top  = `${y}px`;
    }
  });

  requestAnimationFrame(animate);
}
