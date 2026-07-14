// Fades/rises .reveal elements into place once, the first time they enter the viewport.

const els = document.querySelectorAll<HTMLElement>('.reveal');

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  els.forEach((el) => el.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  els.forEach((el) => observer.observe(el));
}
