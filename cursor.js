(function () {
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const dot  = document.createElement('div');
  const ring = document.createElement('div');
  dot.className  = 'cursor-dot';
  ring.className = 'cursor-ring';
  document.body.append(dot, ring);

  let mx = -200, my = -200;
  let rx = -200, ry = -200;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate3d(calc(${mx}px - 50%), calc(${my}px - 50%), 0)`;
  });

  document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });

  function setHover(on) {
    dot.classList.toggle('is-hover', on);
    ring.classList.toggle('is-hover', on);
  }

  document.querySelectorAll('a, button, .btn, .chip, .social-btn, .game-card').forEach(el => {
    el.addEventListener('mouseenter', () => setHover(true));
    el.addEventListener('mouseleave', () => setHover(false));
  });

  let last = performance.now();
  (function loop(now) {
    const dt     = Math.min((now - last) / 16.667, 4);
    last         = now;
    const factor = 1 - Math.pow(0.87, dt);
    rx += (mx - rx) * factor;
    ry += (my - ry) * factor;
    ring.style.transform = `translate3d(calc(${rx}px - 50%), calc(${ry}px - 50%), 0)`;
    requestAnimationFrame(loop);
  })(performance.now());
})();
