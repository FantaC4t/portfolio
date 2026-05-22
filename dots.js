(function () {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const SPACING = 28;

  document.querySelectorAll('.cell').forEach(cell => {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = [
      'position:absolute',
      'inset:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'z-index:-1',
      'border-radius:inherit',
    ].join(';');
    cell.insertBefore(canvas, cell.firstChild);

    const ctx = canvas.getContext('2d');

    function draw() {
      canvas.width  = cell.offsetWidth;
      canvas.height = cell.offsetHeight;

      const cols = Math.ceil(canvas.width  / SPACING) + 1;
      const rows = Math.ceil(canvas.height / SPACING) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.beginPath();
          ctx.arc(c * SPACING, r * SPACING, 1, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 200, 160, 0.18)';
          ctx.fill();
        }
      }
    }

    new ResizeObserver(draw).observe(cell);
    draw();
  });
})();
