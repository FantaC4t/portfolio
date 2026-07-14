// Konami code easter egg — ported from the original site.

const SEQ = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a',
];
let idx = 0;

document.addEventListener('keydown', (e) => {
  if (e.key === SEQ[idx]) {
    idx++;
    if (idx === SEQ.length) {
      idx = 0;
      triggerKonami();
    }
  } else {
    idx = e.key === SEQ[0] ? 1 : 0;
  }
});

function triggerKonami() {
  const toast = document.getElementById('konami-toast');
  toast?.classList.add('show');

  const targets = document.querySelectorAll<HTMLElement>(
    '.card, .stat-panel, .contact, .now-playing.is-active'
  );
  targets.forEach((el, i) => {
    setTimeout(() => {
      el.classList.add('konami-shake');
      setTimeout(() => {
        el.classList.remove('konami-shake');
        el.classList.add('konami-rainbow');
      }, 620);
    }, i * 80);
  });

  setTimeout(() => {
    toast?.classList.remove('show');
    targets.forEach((el) => el.classList.remove('konami-shake', 'konami-rainbow'));
  }, 7500);
}
