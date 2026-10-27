/**
 * BHAVYA — Footer crowd canvas
 * Vanilla adaptation of the Skiper39/Open Peeps sprite-sheet crowd prompt.
 */
(function () {
  'use strict';

  const SPRITE_SRC = 'https://cdn.21st.dev/assets/localized/abdb8990a7bef8c2f5af3e45f0a3c969c4b0603fba8be92e81347de4ea4e1ed7.png';
  const ROWS = 15;
  const COLS = 7;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const randomRange = (min, max) => min + Math.random() * (max - min);
  const randomIndex = array => Math.floor(randomRange(0, array.length));
  const removeFromArray = (array, index) => array.splice(index, 1)[0];
  const removeItemFromArray = (array, item) => {
    const index = array.indexOf(item);
    return index >= 0 ? removeFromArray(array, index) : null;
  };
  const removeRandomFromArray = array => removeFromArray(array, randomIndex(array));
  const easePower2In = t => t * t;

  function createPeep(image, rect) {
    return {
      image,
      rect,
      width: rect[2],
      height: rect[3],
      x: 0,
      y: 0,
      anchorY: 0,
      scaleX: 1,
      speed: 1,
      bobSpeed: 1,
      bobPhase: Math.random() * Math.PI * 2,
      startX: 0,
      endX: 0,
      startY: 0,
      progress: Math.random(),
      render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scaleX, 1);
        ctx.drawImage(this.image, this.rect[0], this.rect[1], this.rect[2], this.rect[3], 0, 0, this.width, this.height);
        ctx.restore();
      }
    };
  }

  function resetPeep(stage, peep, randomize) {
    const direction = Math.random() > 0.5 ? 1 : -1;
    const isMobileStage = stage.width < 620;
    const offsetY = isMobileStage
      ? randomRange(-8, 28)
      : 90 - 230 * easePower2In(Math.random());
    const scale = isMobileStage
      ? Math.min(randomRange(0.46, 0.66), (stage.height / peep.rect[3]) * 0.92)
      : randomRange(0.72, 1);

    peep.width = peep.rect[2] * scale;
    peep.height = peep.rect[3] * scale;
    peep.startY = stage.height - peep.height + offsetY;
    if (isMobileStage) {
      peep.startY = Math.max(4, Math.min(peep.startY, stage.height - peep.height - 2));
    }
    peep.anchorY = peep.startY;
    peep.speed = randomRange(0.045, 0.13);
    peep.bobSpeed = randomRange(7, 11);
    peep.bobPhase = Math.random() * Math.PI * 2;
    peep.progress = randomize ? Math.random() : 0;

    if (direction === 1) {
      peep.startX = -peep.width;
      peep.endX = stage.width + peep.width;
      peep.scaleX = 1;
    } else {
      peep.startX = stage.width + peep.width;
      peep.endX = -peep.width;
      peep.scaleX = -1;
    }
  }

  function createPeeps(image) {
    const peeps = [];
    const rectWidth = image.naturalWidth / ROWS;
    const rectHeight = image.naturalHeight / COLS;
    const total = ROWS * COLS;

    for (let i = 0; i < total; i++) {
      peeps.push(createPeep(image, [
        (i % ROWS) * rectWidth,
        Math.floor(i / ROWS) * rectHeight,
        rectWidth,
        rectHeight
      ]));
    }

    return peeps;
  }

  function initFooterCrowd(wrap, image) {
    if (wrap.dataset.footerCrowdMounted === 'true') return;
    wrap.dataset.footerCrowdMounted = 'true';

    const canvas = document.createElement('canvas');
    canvas.className = 'footer-crowd-canvas';
    wrap.replaceChildren(canvas);

    const ctx = canvas.getContext('2d');
    const stage = { width: 0, height: 0 };
    const allPeeps = createPeeps(image);
    const activePeeps = [];
    let raf = 0;
    let lastTime = performance.now();

    function populate(randomize) {
      activePeeps.length = 0;
      const available = allPeeps.slice();

      while (available.length) {
        const peep = removeRandomFromArray(available);
        resetPeep(stage, peep, randomize);
        activePeeps.push(peep);
      }

      activePeeps.sort((a, b) => a.anchorY - b.anchorY);
    }

    function resize() {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      stage.width = Math.max(1, Math.round(rect.width));
      stage.height = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(stage.width * dpr);
      canvas.height = Math.round(stage.height * dpr);
      canvas.style.width = `${stage.width}px`;
      canvas.style.height = `${stage.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      populate(true);
      render(performance.now());
    }

    function render(now) {
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      ctx.clearRect(0, 0, stage.width, stage.height);

      activePeeps.forEach(peep => {
        if (!reducedMotion.matches) {
          peep.progress += peep.speed * delta;
          if (peep.progress >= 1) {
            resetPeep(stage, peep, false);
          }
        }

        const eased = peep.progress;
        peep.x = peep.startX + (peep.endX - peep.startX) * eased;
        peep.y = peep.startY + Math.sin(now * 0.001 * peep.bobSpeed + peep.bobPhase) * 8;
        peep.render(ctx);
      });

      raf = requestAnimationFrame(render);
    }

    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    window.addEventListener('resize', resize, { passive: true });
    resize();
  }

  function init() {
    const mounts = document.querySelectorAll('.footer-crowd-canvas-wrap');
    if (!mounts.length) return;

    const image = new Image();
    image.onload = () => mounts.forEach(wrap => initFooterCrowd(wrap, image));
    image.src = SPRITE_SRC;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
