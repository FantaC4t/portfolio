/* Interactive wave background — travelling gaussian ripples */
(function () {
  'use strict';

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  /* ── Ripple ────────────────────────────────────────────────────────────
     Each ripple is a gaussian that travels horizontally and decays.
     No spring array → no numerical blow-up.
  ── */
  class Ripple {
    constructor(x, amp, dir) {
      this.x        = x;
      this.amp      = amp;
      this.dir      = dir;           // -1 or +1
      this.sigma    = 55 + Math.abs(amp) * 0.8;
      this.speed    = 110 + Math.random() * 70;
      this.age      = 0;
      this.lifetime = 1.6 + Math.random() * 0.9;
    }
    update(dt) {
      this.age   += dt;
      this.x     += this.dir * this.speed * dt;
      this.sigma += dt * 38;
    }
    alive() { return this.age < this.lifetime; }
    at(px) {
      const decay = Math.pow(1 - this.age / this.lifetime, 1.8);
      const dx    = px - this.x;
      return this.amp * decay * Math.exp(-(dx * dx) / (2 * this.sigma * this.sigma));
    }
  }

  let ripples = [];

  function addSplash(x, amp) {
    ripples.push(new Ripple(x, -amp, -1));
    ripples.push(new Ripple(x,  amp,  1));
  }

  /* ── Wave layers ── */
  const LAYERS = [
    { amp: 38, freq: 0.70, speed:  0.38, baseY: 0.82, sc: 1.00, color: 'rgba(85,32,6,0.26)'    },
    { amp: 30, freq: 1.00, speed: -0.29, baseY: 0.72, sc: 0.88, color: 'rgba(145,60,15,0.20)'  },
    { amp: 22, freq: 1.35, speed:  0.47, baseY: 0.63, sc: 0.74, color: 'rgba(192,90,25,0.14)'  },
    { amp: 14, freq: 1.80, speed: -0.38, baseY: 0.55, sc: 0.58, color: 'rgba(218,120,40,0.09)' },
    { amp:  8, freq: 2.30, speed:  0.55, baseY: 0.48, sc: 0.42, color: 'rgba(232,148,55,0.05)' },
  ];

  let phaseT = 0;

  function totalRipple(x) {
    let s = 0;
    for (const r of ripples) s += r.at(x);
    return s;
  }

  function drawWaves() {
    const W = canvas.width, H = canvas.height;

    LAYERS.forEach((lyr, li) => {
      const baseY = H * lyr.baseY;
      const STEP  = 4;
      const pts   = [];

      for (let x = 0; x <= W; x += STEP) {
        const sine = lyr.amp * Math.sin(x / W * lyr.freq * Math.PI * 2 + phaseT * lyr.speed);
        pts.push([x, baseY + sine + totalRipple(x) * lyr.sc]);
      }

      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        const mx = (pts[i-1][0] + pts[i][0]) / 2;
        const my = (pts[i-1][1] + pts[i][1]) / 2;
        ctx.quadraticCurveTo(pts[i-1][0], pts[i-1][1], mx, my);
      }
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      ctx.fillStyle = lyr.color;
      ctx.fill();

      if (li >= LAYERS.length - 2) {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) {
          const mx = (pts[i-1][0] + pts[i][0]) / 2;
          const my = (pts[i-1][1] + pts[i][1]) / 2;
          ctx.quadraticCurveTo(pts[i-1][0], pts[i-1][1], mx, my);
        }
        ctx.strokeStyle = 'rgba(240,185,120,0.15)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    });
  }

  /* ── Input ── */
  let lastMX = -1, lastMY = -1, cooldown = 0;

  window.addEventListener('mousemove', e => {
    if (cooldown > 0) { lastMX = e.clientX; lastMY = e.clientY; return; }
    if (lastMX >= 0) {
      const dx    = e.clientX - lastMX;
      const dy    = e.clientY - lastMY;
      const speed = Math.sqrt(dx * dx + dy * dy);
      if (speed > 4) {
        const amp = Math.min(speed * 0.35, 18);
        ripples.push(new Ripple(e.clientX, amp * Math.sign(dx), Math.sign(dx)));
        cooldown = 0.07;
      }
    }
    lastMX = e.clientX; lastMY = e.clientY;
  });

  window.addEventListener('click', e => { addSplash(e.clientX, 28 + Math.random() * 16); });
  window.addEventListener('mouseleave', () => { lastMX = -1; lastMY = -1; });

  /* ── Idle splashes ── */
  let idleTimer = 0;

  /* ── Loop ── */
  let last = 0;
  (function loop(ts) {
    const dt = Math.min((ts - last) / 1000, 0.05);
    last      = ts;
    phaseT   += dt;
    cooldown -= dt;
    idleTimer += dt;

    if (idleTimer > 3.2) {
      idleTimer = 0;
      addSplash(Math.random() * canvas.width, 8 + Math.random() * 8);
    }

    ripples = ripples.filter(r => { r.update(dt); return r.alive(); });

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawWaves();
    requestAnimationFrame(loop);
  })(0);
})();
