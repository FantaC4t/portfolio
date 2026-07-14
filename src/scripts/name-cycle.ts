// Typewriter-cycles the hero name between "fantacat" and "Ivan S."

interface NamePart {
  plain: string;
  grad: string;
}

const h1 = document.querySelector<HTMLElement>('.name');

if (h1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const NAMES: NamePart[] = [
    { plain: 'fanta', grad: 'cat' },
    { plain: 'Ivan ', grad: 'S.' },
  ];
  const TYPE_MS = 85;
  const ERASE_MS = 48;
  const MIN_WAIT = 4000;
  const MAX_WAIT = 12000;

  let idx = 0;

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  function render(plain: string, grad: string) {
    h1!.innerHTML =
      plain +
      (grad ? `<span class="accent">${grad}</span>` : '') +
      '<span class="caret" aria-hidden="true"></span>';
  }

  async function erase({ plain, grad }: NamePart) {
    for (let i = grad.length; i > 0; i--) {
      render(plain, grad.slice(0, i - 1));
      await wait(ERASE_MS);
    }
    for (let i = plain.length; i > 0; i--) {
      render(plain.slice(0, i - 1), '');
      await wait(ERASE_MS);
    }
  }

  async function type({ plain, grad }: NamePart) {
    for (let i = 1; i <= plain.length; i++) {
      render(plain.slice(0, i), '');
      await wait(TYPE_MS);
    }
    for (let i = 1; i <= grad.length; i++) {
      render(plain, grad.slice(0, i));
      await wait(TYPE_MS);
    }
  }

  (async function cycle() {
    while (true) {
      await wait(MIN_WAIT + Math.random() * (MAX_WAIT - MIN_WAIT));
      await erase(NAMES[idx]);
      await wait(180);
      idx = (idx + 1) % NAMES.length;
      await type(NAMES[idx]);
    }
  })();
}
