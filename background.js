/* Interactive wave background — travelling gaussian ripples */
(function () {
  'use strict';

  const isMobile = !window.matchMedia('(pointer: fine)').matches || window.innerWidth <= 900;

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  class Ripple {
    constructor(x, amp, dir) {
      this.x        = x;
      this.amp      = amp;
      this.dir      = dir;
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

  /* ── Wave layers — 3 on mobile, 5 on desktop ── */
  const LAYERS = isMobile ? [
    { amp: 30, freq: 0.70, speed:  0.38, baseY: 0.82, sc: 1.00, color: 'rgba(85,32,6,0.22)'   },
    { amp: 20, freq: 1.00, speed: -0.29, baseY: 0.72, sc: 0.88, color: 'rgba(145,60,15,0.16)' },
    { amp: 13, freq: 1.35, speed:  0.47, baseY: 0.63, sc: 0.74, color: 'rgba(192,90,25,0.10)' },
  ] : [
    { amp: 38, freq: 0.70, speed:  0.38, baseY: 0.82, sc: 1.00, color: 'rgba(85,32,6,0.26)'    },
    { amp: 30, freq: 1.00, speed: -0.29, baseY: 0.72, sc: 0.88, color: 'rgba(145,60,15,0.20)'  },
    { amp: 22, freq: 1.35, speed:  0.47, baseY: 0.63, sc: 0.74, color: 'rgba(192,90,25,0.14)'  },
    { amp: 14, freq: 1.80, speed: -0.38, baseY: 0.55, sc: 0.58, color: 'rgba(218,120,40,0.09)' },
    { amp:  8, freq: 2.30, speed:  0.55, baseY: 0.48, sc: 0.42, color: 'rgba(232,148,55,0.05)' },
  ];

  const STEP = isMobile ? 8 : 4;

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

      if (!isMobile && li >= LAYERS.length - 2) {
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

  /* ── Mouse/touch input — desktop only ── */
  if (!isMobile) {
    let lastMX = -1, lastMY = -1, waveCooldown = 0;

    window.addEventListener('mousemove', e => {
      if (waveCooldown > 0) { lastMX = e.clientX; lastMY = e.clientY; return; }
      if (lastMX >= 0) {
        const dx    = e.clientX - lastMX;
        const dy    = e.clientY - lastMY;
        const speed = Math.sqrt(dx * dx + dy * dy);
        if (speed > 4) {
          ripples.push(new Ripple(e.clientX, Math.min(speed * 0.35, 18) * Math.sign(dx), Math.sign(dx)));
          waveCooldown = 0.07;
        }
      }
      lastMX = e.clientX; lastMY = e.clientY;
    });

    window.addEventListener('click', e => { addSplash(e.clientX, 28 + Math.random() * 16); });
    window.addEventListener('mouseleave', () => { lastMX = -1; lastMY = -1; });
  }

  /* ── Loop — 30 fps cap on mobile ── */
  const MIN_FRAME_MS = isMobile ? 1000 / 30 : 0;
  let last = 0, lastIdle = 0;

  (function loop(ts) {
    requestAnimationFrame(loop);
    if (MIN_FRAME_MS && ts - last < MIN_FRAME_MS) return;

    const dt = Math.min((ts - last) / 1000, 0.05);
    last = ts;
    phaseT += dt;

    if (!isMobile && ts - lastIdle > 3200) {
      lastIdle = ts;
      addSplash(Math.random() * canvas.width, 8 + Math.random() * 8);
    }

    ripples = ripples.filter(r => { r.update(dt); return r.alive(); });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawWaves();
  })(0);
})();
