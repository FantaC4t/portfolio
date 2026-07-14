// Magnetic hover effect for buttons — desktop / pointer:fine only.

if (window.matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll<HTMLElement>('.btn').forEach((btn) => {
    let dx = 0;
    let dy = 0;
    let pressed = false;

    function apply() {
      const scale = pressed ? 0.96 : 1.04;
      btn.style.transform = `translate(${dx}px,${dy}px) scale(${scale})`;
    }

    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      dx = (e.clientX - (r.left + r.width / 2)) * 0.38;
      dy = (e.clientY - (r.top + r.height / 2)) * 0.38;
      apply();
    });
    btn.addEventListener('mousedown', () => {
      pressed = true;
      apply();
    });
    btn.addEventListener('mouseup', () => {
      pressed = false;
      apply();
    });
    btn.addEventListener('mouseleave', () => {
      pressed = false;
      dx = 0;
      dy = 0;
      btn.style.transform = '';
    });
  });
}
