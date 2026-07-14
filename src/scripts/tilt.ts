// Subtle mousemove-driven 3D tilt on [data-tilt] elements. Desktop/pointer:fine only.

if (window.matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transition = 'transform 0.06s linear';
      el.style.transform = `perspective(700px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-2px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform 0.3s ease';
      el.style.transform = '';
    });
  });
}
