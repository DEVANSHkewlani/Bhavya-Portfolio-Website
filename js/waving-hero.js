/**
 * BHAVYA — Waving Portfolio Hero for Experience Page
 * Interactive Poster Hero with waving inky character, eye-tracking,
 * rollable dice corners, hover letter re-rolls, and letter bursts.
 */
(function () {
  'use strict';

  function initWavingHero() {
    const root = document.getElementById('hero-waving-experience');
    if (!root || root.dataset.wplMounted) return;
    root.dataset.wplMounted = 'true';

    const head = root.querySelector('.wpl-head');
    const charEl = root.querySelector('.wpl-char');
    const bubble = root.querySelector('.wpl-bubble');
    const corners = root.querySelectorAll('.wpl-corner');
    const signBtn = root.querySelector('.wpl-sign');
    const cells = root.querySelectorAll('.wpl-cell');

    let isWaving = false;
    let waveTimer = null;
    let frame = 0;

    // Trigger wave animation
    function triggerWave() {
      if (isWaving) return;
      isWaving = true;
      if (charEl) charEl.classList.add('is-waving');
      if (bubble) bubble.style.display = 'block';

      clearTimeout(waveTimer);
      waveTimer = setTimeout(() => {
        isWaving = false;
        if (charEl) charEl.classList.remove('is-waving');
        if (bubble) bubble.style.display = 'none';
      }, 1500);
    }

    if (charEl) {
      charEl.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'touch') triggerWave();
      });
      charEl.addEventListener('click', triggerWave);
      charEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerWave();
        }
      });
    }

    // Pointer move eye tracking
    root.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const px = e.clientX;
      const py = e.clientY;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = root.getBoundingClientRect();
        const k = (v, d) => Math.max(-1, Math.min(1, v / d));
        root.style.setProperty('--wpl-mx', (((px - r.left) / r.width) * 2 - 1).toFixed(3));
        root.style.setProperty('--wpl-my', (((py - r.top) / r.height) * 2 - 1).toFixed(3));

        if (head) {
          const hr = head.getBoundingClientRect();
          const dx = px - (hr.left + hr.width / 2);
          const dy = py - (hr.top + hr.height / 2);
          root.style.setProperty('--wpl-ex', (k(dx, 260) * 4.5).toFixed(2));
          root.style.setProperty('--wpl-ey', (k(dy, 260) * 3.5).toFixed(2));
          root.style.setProperty('--wpl-hr', (k(dx, 700) * 7).toFixed(2));
        }
      });
    });

    root.addEventListener('pointerleave', () => {
      ['--wpl-mx', '--wpl-my', '--wpl-ex', '--wpl-ey', '--wpl-hr'].forEach((v) => {
        root.style.setProperty(v, '0');
      });
    });

    // Letter Bursts on clicking paper
    let burstCount = 0;
    const alphabet = 'PORTFOLIOEXPERIENCE';
    root.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, .wpl-char, .wpl-cell')) return;
      const r = root.getBoundingClientRect();
      const bx = e.clientX - r.left;
      const by = e.clientY - r.top;

      const burst = document.createElement('div');
      burst.className = 'wpl-burst';
      burst.style.left = bx + 'px';
      burst.style.top = by + 'px';

      for (let i = 0; i < 9; i++) {
        const angle = (i / 9) * Math.PI * 2 + Math.random() * 0.4;
        const dist = 55 + Math.random() * 85;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist - 20;
        const rot = (Math.random() - 0.5) * 240;
        const ch = alphabet[(Math.random() * alphabet.length) | 0];

        const bit = document.createElement('span');
        bit.className = 'wpl-bit';
        bit.textContent = ch;
        bit.style.setProperty('--dx', dx + 'px');
        bit.style.setProperty('--dy', dy + 'px');
        bit.style.setProperty('--rot', rot + 'deg');
        bit.style.fontFamily = 'Plus Jakarta Sans, sans-serif';
        bit.style.fontWeight = '900';
        bit.style.fontSize = '1.3rem';
        bit.style.color = i % 2 ? 'var(--color-blue)' : 'var(--text-primary)';
        burst.appendChild(bit);
      }

      root.appendChild(burst);
      setTimeout(() => burst.remove(), 1100);
    });

    // Dice Roll
    const pipCoords = {
      1: [[0, 0]],
      2: [[-1, -1], [1, 1]],
      3: [[-1, -1], [0, 0], [1, 1]],
      4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
      5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
      6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]
    };

    corners.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        const pipsGroup = btn.querySelector('.wpl-pips');
        if (!pipsGroup) return;

        pipsGroup.classList.remove('is-rolled');
        void pipsGroup.offsetWidth; // reflow
        pipsGroup.classList.add('is-rolled');

        const currentVal = parseInt(btn.dataset.val || (idx === 0 ? '2' : '1'), 10);
        let nextVal = currentVal;
        while (nextVal === currentVal) {
          nextVal = 1 + Math.floor(Math.random() * 6);
        }
        btn.dataset.val = String(nextVal);

        // Re-render pips
        pipsGroup.innerHTML = '';
        const coords = pipCoords[nextVal] || pipCoords[1];
        coords.forEach(([px, py]) => {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', 48 + px * 20);
          circle.setAttribute('cy', 46 + py * 20);
          circle.setAttribute('r', '7.5');
          circle.setAttribute('fill', 'var(--bg-color)');
          pipsGroup.appendChild(circle);
        });
      });
    });

    // Letter Cell Re-rolling on Hover
    cells.forEach((cell) => {
      let lastReel = 0;
      cell.addEventListener('pointerenter', () => {
        const now = performance.now();
        if (now - lastReel < 800) return;
        lastReel = now;

        const reel = cell.querySelector('.wpl-reel');
        if (reel) {
          reel.classList.remove('is-rolling');
          void reel.offsetWidth;
          reel.classList.add('is-rolling');
        }
      });
    });

    // Signature stamp re-plays wave
    if (signBtn) {
      signBtn.addEventListener('click', triggerWave);
    }

    // Trigger initial welcoming wave after poster settles
    setTimeout(triggerWave, 2600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWavingHero);
  } else {
    initWavingHero();
  }
})();
