// Scroll progress indicator — mobile / touch only.

if (!window.matchMedia('(pointer: fine)').matches) {
  const bar = document.createElement('div');
  bar.className = 'scroll-indicator';
  document.body.prepend(bar);
  window.addEventListener(
    'scroll',
    () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    },
    { passive: true }
  );
}
