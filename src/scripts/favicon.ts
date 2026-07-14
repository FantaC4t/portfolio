// Dynamic favicon — circular profile photo + a small Discord-status dot overlay.
// Ported from the original site's favicon.js, using the pre-optimized /favicon.png
// instead of fetching the full-size source image at runtime.

const S = 32;
const cv = document.createElement('canvas');
cv.width = cv.height = S;
const cx = cv.getContext('2d')!;

let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
if (!link) {
  link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  document.head.appendChild(link);
}

const DOT_COLORS: Record<string, string> = {
  online: '#4ade80',
  idle: '#fbbf24',
  dnd: '#f87171',
};

const img = new Image();
let imgReady = false;
let pendingState = '';

img.onload = () => {
  imgReady = true;
  draw(pendingState);
};
img.onerror = () => {
  imgReady = false;
  draw(pendingState);
};
img.src = '/favicon.png';

function draw(state: string) {
  pendingState = state;
  cx.clearRect(0, 0, S, S);

  cx.save();
  cx.beginPath();
  cx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
  cx.clip();
  if (imgReady) {
    cx.drawImage(img, 0, 0, S, S);
  } else {
    cx.fillStyle = '#110804';
    cx.fillRect(0, 0, S, S);
  }
  cx.restore();

  const color = DOT_COLORS[state];
  if (color) {
    // Dark ring so the dot is visible against any part of the photo
    cx.fillStyle = 'rgba(0,0,0,0.65)';
    cx.beginPath();
    cx.arc(24, 8, 6.5, 0, Math.PI * 2);
    cx.fill();
    cx.fillStyle = color;
    cx.beginPath();
    cx.arc(24, 8, 4.5, 0, Math.PI * 2);
    cx.fill();
  }

  link!.href = cv.toDataURL('image/png');
}

draw('');
(window as any)._faviconState = draw;
