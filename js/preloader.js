/* ==========================================================================
   FORM 1 — THE PRELOADER: PERSPECTIVE TUNNEL GRID
   Canvas-based 3D vanishing-point wireframe tunnel with ascending 3-digit counter
   ========================================================================== */

(function() {
  const canvas = document.getElementById('preloader-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const counterEl = document.getElementById('preloader-counter');
  const preloader = document.getElementById('preloader');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    if (!preloader.classList.contains('gone')) {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
  });

  let progress = 40; // Starts around 040
  const targetProgress = 100;
  const duration = 2200; // ms
  const startTime = performance.now();

  function drawPerspectiveTunnel(p) {
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    // Normalised factor 0 -> 1
    const factor = (p - 40) / 60; // 0 to 1
    const spread = 0.2 + factor * 1.35; // Expands outward to screen edges

    // Accent line color
    ctx.strokeStyle = 'rgba(200, 180, 154, ' + (0.15 + factor * 0.25) + ')';
    ctx.lineWidth = 1;

    const cols = 12;
    const rows = 8;

    // Vertical perspective lines converging to center
    for (let i = 0; i <= cols; i++) {
      const xBase = (i / cols) * width;
      const xNear = cx + (xBase - cx) * spread;

      ctx.beginPath();
      ctx.moveTo(xNear, (cy > height / 2 ? 0 : 0));
      ctx.lineTo(cx, cy);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xNear, height);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    }

    // Horizontal perspective lines
    for (let j = 0; j <= rows; j++) {
      const yBase = (j / rows) * height;
      const yNear = cy + (yBase - cy) * spread;

      ctx.beginPath();
      ctx.moveTo(0, yNear);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(width, yNear);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    }

    // Nested perspective rectangles / depth rings
    const rings = 7;
    for (let r = 1; r <= rings; r++) {
      const ringDepth = (r / rings) * spread;
      const rx = (width / 2) * ringDepth;
      const ry = (height / 2) * ringDepth;

      ctx.beginPath();
      ctx.strokeRect(cx - rx, cy - ry, rx * 2, ry * 2);
    }
  }

  function loop(now) {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);
    // Smooth easeOutQuad
    const eased = 1 - (1 - t) * (1 - t);
    progress = 40 + eased * 60;

    if (counterEl) {
      counterEl.textContent = String(Math.floor(progress)).padStart(3, '0');
    }

    drawPerspectiveTunnel(progress);

    if (t < 1) {
      requestAnimationFrame(loop);
    } else {
      if (counterEl) counterEl.textContent = '100';
      setTimeout(() => {
        preloader.classList.add('gone');
        document.body.classList.add('loaded');
      }, 300);
    }
  }

  requestAnimationFrame(loop);
})();
