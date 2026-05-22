(function () {
  const S  = 32;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const cx = cv.getContext('2d');

  let link = document.querySelector('link[rel~="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel  = 'icon';
    link.type = 'image/png';
    document.head.appendChild(link);
  }

  const headImg = new Image();
  let imgReady  = false;
  let pendingState = 'default';

  headImg.onload  = () => { imgReady = true;  draw(pendingState); };
  headImg.onerror = () => { imgReady = false; draw(pendingState); };
  headImg.src     = '20231007_040528.png';

  function draw(state) {
    pendingState = state;
    cx.clearRect(0, 0, S, S);

    if (imgReady) {
      // Clip to circle then draw photo
      cx.save();
      cx.beginPath();
      cx.arc(S/2, S/2, S/2, 0, Math.PI * 2);
      cx.clip();
      cx.drawImage(headImg, 0, 0, S, S);
      cx.restore();
    } else {
      // Fallback while image loads
      cx.fillStyle = '#110804';
      cx.beginPath();
      cx.arc(S/2, S/2, S/2, 0, Math.PI * 2);
      cx.fill();
      cx.fillStyle = '#ffaa6b';
      cx.font = 'bold 17px system-ui, -apple-system, sans-serif';
      cx.textAlign    = 'center';
      cx.textBaseline = 'middle';
      cx.fillText('f', S/2, S/2 + 1);
    }

    // Status dot (top-right corner)
    if (state === 'live' || state === 'coding') {
      const color = state === 'live' ? '#ff3b3b' : '#f59e0b';
      // Dark ring so dot is visible on any skin color
      cx.fillStyle = 'rgba(0,0,0,0.65)';
      cx.beginPath();
      cx.arc(24, 8, 6.5, 0, Math.PI * 2);
      cx.fill();
      cx.fillStyle = color;
      cx.beginPath();
      cx.arc(24, 8, 4.5, 0, Math.PI * 2);
      cx.fill();
    }

    link.href = cv.toDataURL('image/png');
  }

  draw('default');
  window._faviconState = draw;
})();
