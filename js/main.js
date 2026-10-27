/* ==========================================================================
   BHAVYA — CORE JAVASCRIPT
   Cinematic Ticker, Theme Toggle, Half-Screen Drawer, Accordions, Tabs, Lightbox,
   Volna Canvas2D Dither Effect, 3D Cylindrical Carousel, Screenplay Spread Reader
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. THEME SWITCHER (LIGHT/DARK)
  const themeToggle = document.getElementById('theme-toggle');
  const themeText = document.getElementById('theme-text');
  
  const savedTheme = localStorage.getItem('bhavya-theme');
  if (savedTheme) {
    document.documentElement.dataset.theme = savedTheme;
    if (themeText) themeText.textContent = savedTheme === 'dark' ? 'DARK' : 'LIGHT';
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.dataset.theme || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      localStorage.setItem('bhavya-theme', next);
      if (themeText) themeText.textContent = next === 'dark' ? 'DARK' : 'LIGHT';
    });
  }

  // 2. STANDALONE WORDS ANAGRAM SCRAMBLER (ZERO DISPLACEMENT, SAME COLOR, WORD-ONLY LETTERS)
  // EXCLUDED: All headings, buttons, and page links
  class WordAnagramScrambler {
    constructor(el, autoRunDelay = null) {
      if (!el) return;
      const isTarget = el.classList.contains('scramble-target') || el.classList.contains('mph-brace') || el.dataset.scrambleAuto !== undefined;
      // Explicitly ignore top header bar, ticker track, ticker items, and hero top rule UNLESS it's an explicit target
      if (!isTarget && (el.closest('#header') || el.closest('.header-ticker-box') || el.closest('.ticker-track') || el.closest('.ticker-item') || el.closest('.mph-top'))) {
        return;
      }
      this.el = el;
      this.originalText = el.textContent.trim();
      this.originalHtml = el.innerHTML;
      this.frame = 0;
      this.queue = [];
      this.frameReq = null;
      this.isScrambling = false;
      if (this.originalText && this.originalText.length > 1) {
        this.init(autoRunDelay);
      }
    }

    init(autoRunDelay) {
      if (!this.el) return;
      this.el.addEventListener('mouseenter', () => this.scramble());
      if (typeof autoRunDelay === 'number' && autoRunDelay >= 0) {
        setTimeout(() => this.scramble(), autoRunDelay);
      }
    }

    scramble() {
      if (this.isScrambling) return;
      this.isScrambling = true;

      const text = this.originalText;
      const words = text.split(/\s+/);
      this.queue = [];

      words.forEach((word, wIdx) => {
        const cleanLetters = word.replace(/[^a-zA-Z0-9]/g, '').split('');
        const pool = cleanLetters.length > 0 ? cleanLetters : word.split('');

        for (let i = 0; i < word.length; i++) {
          const char = word[i];
          const isPunctuation = /[^a-zA-Z0-9]/.test(char);
          const start = Math.floor(Math.random() * 2);
          const end = start + Math.floor(Math.random() * 6) + 4;
          this.queue.push({
            from: char,
            to: char,
            pool: pool,
            isPunctuation: isPunctuation,
            start: start,
            end: end,
            currentChar: char
          });
        }

        if (wIdx < words.length - 1) {
          this.queue.push({
            from: ' ',
            to: ' ',
            pool: [' '],
            isPunctuation: true,
            start: 0,
            end: 0,
            currentChar: ' '
          });
        }
      });

      cancelAnimationFrame(this.frameReq);
      this.frame = 0;
      this.update();
    }

    update() {
      let output = '';
      let complete = 0;

      for (let i = 0; i < this.queue.length; i++) {
        let item = this.queue[i];
        if (item.to === '' || item.to === ' ' || item.to === '\n') {
          output += item.to;
          complete++;
          continue;
        }

        if (this.frame >= item.end) {
          complete++;
          output += item.to;
        } else if (this.frame >= item.start) {
          if (!item.isPunctuation) {
            item.currentChar = item.pool[Math.floor(Math.random() * item.pool.length)];
          }
          output += `<span class="scramble-char" style="color:inherit!important;display:inline;">${item.currentChar}</span>`;
        } else {
          output += item.from;
        }
      }

      this.el.innerHTML = output;

      if (complete === this.queue.length) {
        this.el.innerHTML = this.originalHtml;
        this.isScrambling = false;
      } else {
        this.frameReq = requestAnimationFrame(() => {
          this.frame++;
          this.update();
        });
      }
    }
  }

  // Register strictly on standalone tags, role titles, and filler items (NO headings, NO buttons, NO page links)
  const standaloneSelectors = [
    '.hero-role-item',
    '.hero-bhavya-title',
    '.drawer-brand',
    '.media-platform-tag',
    '.media-handle-name',
    '.media-handle-desc',
    '.sec-eyebrow',
    '.s-tab-btn',
    '.sp-page-indicator',
    '.footer-subhead',
    '.disc-meta',
    '.pill-tag',
    '.award-badge',
    '.media-pill',
    '.scramble-filler',
    '.scramble-target'
  ];
  // Scramble effect disabled site-wide.

  // 3. HALF-SCREEN MENU DRAWER & HOVER-ONLY FLOATING PREVIEW
  const menuBtn = document.getElementById('menu-btn');
  const navDrawer = document.getElementById('nav-drawer');
  const drawerPreviewStage = document.querySelector('.drawer-preview-stage');
  const previewLayers = document.querySelectorAll('.drawer-preview-layer');
  const achieveSlides = document.querySelectorAll('.drawer-slide-img');
  let achieveInterval = null;
  let currentSlideIdx = 0;

  function startAchieveSlideshow() {
    if (achieveSlides.length === 0 || achieveInterval) return;
    currentSlideIdx = 0;
    achieveInterval = setInterval(() => {
      achieveSlides.forEach(s => s.classList.remove('active'));
      currentSlideIdx = (currentSlideIdx + 1) % achieveSlides.length;
      achieveSlides[currentSlideIdx].classList.add('active');
    }, 1600);
  }

  function stopAchieveSlideshow() {
    if (achieveInterval) {
      clearInterval(achieveInterval);
      achieveInterval = null;
    }
  }

  function setPreview(key) {
    if (!key) {
      if (drawerPreviewStage) drawerPreviewStage.classList.remove('has-preview');
      previewLayers.forEach(layer => layer.classList.remove('active'));
      stopAchieveSlideshow();
      return;
    }

    if (drawerPreviewStage) drawerPreviewStage.classList.add('has-preview');
    previewLayers.forEach(layer => {
      if (layer.dataset.preview === key) {
        layer.classList.add('active');
      } else {
        layer.classList.remove('active');
      }
    });

    if (key === 'achievements') {
      startAchieveSlideshow();
    } else {
      stopAchieveSlideshow();
    }
  }

  function toggleDrawer(open) {
    if (navDrawer) {
      navDrawer.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      // Clear preview state on toggle
      setPreview(null);
      document.querySelectorAll('.drawer-links a').forEach(a => a.classList.remove('active-hover'));
    }
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const isOpen = navDrawer && navDrawer.classList.contains('open');
      toggleDrawer(!isOpen);
    });
  }

  // Close when clicking the backdrop outside the drawer panel
  if (navDrawer) {
    navDrawer.addEventListener('click', (e) => {
      if (e.target === navDrawer || e.target.classList.contains('drawer-preview-backdrop') || e.target.classList.contains('drawer-preview-stage')) {
        toggleDrawer(false);
      }
    });
  }

  // Hover over nav links to dynamically show preview images on left stage
  const drawerLinksList = document.querySelector('.drawer-links');
  if (drawerLinksList) {
    drawerLinksList.addEventListener('mouseleave', () => {
      document.querySelectorAll('.drawer-links a').forEach(l => l.classList.remove('active-hover'));
      setPreview(null);
    });
  }

  document.querySelectorAll('.drawer-links a').forEach(a => {
    a.addEventListener('mouseenter', () => {
      const target = a.dataset.menuTarget;
      if (target) {
        document.querySelectorAll('.drawer-links a').forEach(l => l.classList.remove('active-hover'));
        a.classList.add('active-hover');
        setPreview(target);
      }
    });

    a.addEventListener('click', () => toggleDrawer(false));
  });

  // 4. WHAT I DO / DISCIPLINES ACCORDION
  document.querySelectorAll('.disc-item').forEach(item => {
    const body = item.querySelector('.disc-body');
    const syncBodyHeight = () => {
      if (body) {
        item.style.setProperty('--disc-body-height', `${body.scrollHeight + 40}px`);
      }
    };
    syncBodyHeight();
    window.addEventListener('resize', syncBodyHeight);

    function toggle() {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.disc-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) {
        syncBodyHeight();
        item.classList.add('open');
      }
    }
    item.addEventListener('click', toggle);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });

  // 5. LIGHTBOX MODAL (FOR STILLS & 3D CAROUSEL)
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbCap = document.getElementById('lb-cap');

  function openLightbox(src, cap) {
    if (!lb || !lbImg) return;
    lbImg.src = src;
    if (lbCap) lbCap.textContent = cap || 'Film Still & Archive Frame';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (lb) {
    document.querySelectorAll('#lbc, #lb-close').forEach(btn => btn.addEventListener('click', closeLightbox));
    lb.addEventListener('click', (e) => {
      if (e.target === lb) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
    });
  }


  // 6. 3D CYLINDRICAL PHOTO CAROUSEL (EXPANDED SIZE, WHEEL SCROLL & ARROW CONTROLS)
  //    Now data-driven: reads from data/reels.json (compiled from content/reels/*.md)
  //    Supports type:"image" (opens lightbox) and type:"video" (opens reel modal)

  // ── Reel Video Modal ─────────────────────────────────────────────────────
  const reelModal      = document.getElementById('reel-modal');
  const reelModalVideo = document.getElementById('reel-modal-video');
  const reelModalCap   = document.getElementById('reel-modal-caption');
  const reelModalClose = document.getElementById('reel-modal-close');

  function openReelModal(videoUrl, caption) {
    if (!reelModal || !reelModalVideo) return;
    reelModalVideo.src = videoUrl;
    if (reelModalCap) reelModalCap.textContent = caption || '';
    reelModal.classList.add('open');
    reelModalVideo.play().catch(() => {});
    document.body.style.overflow = 'hidden';
  }

  function closeReelModal() {
    if (!reelModal || !reelModalVideo) return;
    reelModalVideo.pause();
    reelModalVideo.src = '';
    reelModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (reelModalClose) reelModalClose.addEventListener('click', closeReelModal);
  if (reelModal) {
    reelModal.addEventListener('click', (e) => {
      if (e.target === reelModal) closeReelModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && reelModal && reelModal.classList.contains('open')) closeReelModal();
  });

  // ── Fallback carousel data (used if data/reels.json fetch fails) ─────────
  const CAROUSEL_FALLBACK = [
    { src: 'images/still1.jpg', caption: 'Kirdaar — Short Film Production Still', type: 'image' },
    { src: 'images/still2.jpg', caption: 'RED FM India — Studio Broadcast & Editing Suite', type: 'image' },
    { src: 'images/still3.jpg', caption: 'Band Baaja Baaraat — 1,800+ Attendee Mega Event', type: 'image' },
    { src: 'images/still4.jpg', caption: 'Tamasha — First Pop Culture & Entertainment Club MAHE', type: 'image' },
    { src: 'images/still5.jpg', caption: 'The Nation Wants to Know — Studio Parody Shoot', type: 'image' },
    { src: 'images/still6.jpg', caption: 'Life Note — Production Logistics & Performance', type: 'image' },
    { src: 'images/work1.jpg',  caption: 'Kirdaar — Writer, Director & Lead Actor', type: 'image' },
    { src: 'images/work2.jpg',  caption: 'RED FM On-Ground Shoot — KFC, AirAsia & Haldiram\'s', type: 'image' },
    { src: 'images/work3.jpg',  caption: 'Kaksha — Lead Actor / Central Antagonist', type: 'image' },
    { src: 'images/project1_img_1791400184057.jpg', caption: 'Reflekta Media Fest — Live Anchoring & Emceeing', type: 'image' },
    { src: 'images/project2_img_1791400195948.jpg', caption: 'Bharat Samachar — Hindi Satellite News Curation', type: 'image' },
    { src: 'images/project3_img_1791400206396.jpg', caption: 'On-Air-Flair RJ Hunt — 2nd Runner-Up MAHE', type: 'image' },
    { src: 'images/hero_portrait_1791400132911.jpg', caption: 'Film-Review Video Podcast & Digital Production', type: 'image' },
    { src: 'images/about_portrait_1791400145203.jpg', caption: 'Bhavya Shukla — BJMC MAHE Bengaluru', type: 'image' }
  ];

  function init3DPhotoCarousel(cardsData) {
    const cylinder = document.getElementById('carousel-3d-cylinder');
    const viewport = document.getElementById('carousel-3d-viewport');
    const wrapper  = document.getElementById('carousel-3d-wrapper');
    const prevBtn  = document.getElementById('c3d-prev');
    const nextBtn  = document.getElementById('c3d-next');
    if (!cylinder || !viewport) return;

    const faceCount = cardsData.length;
    let cylinderWidth = window.innerWidth <= 600 ? 980 : window.innerWidth <= 900 ? 1350 : 2500;
    let faceWidth = cylinderWidth / faceCount;
    let radius = cylinderWidth / (2 * Math.PI);

    function layoutCards() {
      cylinderWidth = window.innerWidth <= 600 ? 980 : window.innerWidth <= 900 ? 1350 : 2500;
      faceWidth = cylinderWidth / faceCount;
      radius = cylinderWidth / (2 * Math.PI);
      cylinder.style.width = `${cylinderWidth}px`;

      const cards = cylinder.querySelectorAll('.carousel-3d-card');
      cards.forEach((card, i) => {
        card.style.width = `${faceWidth}px`;
        const angle = i * (360 / faceCount);
        card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
      });
    }

    // Build DOM cards — image or video
    cylinder.innerHTML = '';
    cardsData.forEach((item, i) => {
      const isVideo = item.type === 'video';
      const cap = item.caption || item.cap || '';
      const src = item.src || item.thumbnail || '';
      const videoUrl = item.videoUrl || (isVideo ? item.src : null);

      const card = document.createElement('div');
      card.className = 'carousel-3d-card' + (isVideo ? ' is-video' : '');
      card.dataset.index = i;

      // Thumbnail image (always present — for videos it's the poster/thumbnail)
      const img = document.createElement('img');
      img.src = item.thumbnail || src;
      img.alt = cap;
      img.loading = 'lazy';
      card.appendChild(img);

      // Play icon overlay for videos
      if (isVideo) {
        const playIcon = document.createElement('div');
        playIcon.className = 'video-play-icon';
        playIcon.innerHTML = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="30" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.8)" stroke-width="2"/>
          <polygon points="26,20 26,44 46,32" fill="white"/>
        </svg>`;
        card.appendChild(playIcon);
      }

      card.addEventListener('click', () => {
        if (hasDragged) return;
        if (isVideo && videoUrl) {
          openReelModal(videoUrl, cap);
        } else {
          openLightbox(src, cap);
        }
      });

      cylinder.appendChild(card);
    });

    layoutCards();
    window.addEventListener('resize', layoutCards);

    // Physics Engine
    let currentRotation = 0;
    let targetRotation = 0;
    let isDragging = false;
    let startX = 0;
    let startRot = 0;
    let lastX = 0;
    let velocityX = 0;
    let hasDragged = false;

    function updateTransform() {
      cylinder.style.transform = `rotate3d(0, 1, 0, ${currentRotation}deg)`;
    }

    function animate() {
      if (!isDragging) {
        const diff = targetRotation - currentRotation;
        if (Math.abs(diff) > 0.01 || Math.abs(velocityX) > 0.01) {
          velocityX *= 0.92;
          targetRotation += velocityX;
          currentRotation += (targetRotation - currentRotation) * 0.12;
          updateTransform();
        } else {
          currentRotation = targetRotation;
          updateTransform();
        }
      }
      requestAnimationFrame(animate);
    }
    animate();

    function onPointerDown(e) {
      isDragging = true;
      hasDragged = false;
      startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      lastX = startX;
      startRot = targetRotation;
      velocityX = 0;
      viewport.classList.add('is-dragging');
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const delta = x - startX;
      if (Math.abs(delta) > 5) {
        hasDragged = true;
      }
      const moveDelta = x - lastX;
      lastX = x;
      velocityX = moveDelta * 0.08;

      targetRotation = startRot + delta * 0.07;
      currentRotation = targetRotation;
      updateTransform();
    }

    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;
      viewport.classList.remove('is-dragging');
    }

    viewport.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    viewport.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // SCROLLING FEATURE: Mouse wheel / touchpad horizontal & vertical scroll spins the carousel
    if (wrapper) {
      wrapper.addEventListener('wheel', (e) => {
        const isMobileLayout = window.matchMedia('(max-width: 900px)').matches;
        const isVerticalScroll = Math.abs(e.deltaY) >= Math.abs(e.deltaX);
        if (isMobileLayout && isVerticalScroll) return;

        e.preventDefault();
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        targetRotation -= delta * 0.065;
        velocityX = -delta * 0.03;
      }, { passive: false });
    }

    // Navigation buttons
    const stepAngle = 360 / faceCount;
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        targetRotation += stepAngle;
        velocityX = 0.5;
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        targetRotation -= stepAngle;
        velocityX = -0.5;
      });
    }
  }

  // Load reels from window.BHAVYA_CONTENT, data/reels.json (built from content/reels/*.md), or fallback
  if (window.BHAVYA_CONTENT && Array.isArray(window.BHAVYA_CONTENT.reels) && window.BHAVYA_CONTENT.reels.length > 0) {
    init3DPhotoCarousel(window.BHAVYA_CONTENT.reels);
  } else {
    fetch('data/reels.json')
      .then(r => r.ok ? r.json() : Promise.reject('not found'))
      .then(data => init3DPhotoCarousel(data))
      .catch(() => init3DPhotoCarousel(CAROUSEL_FALLBACK));
  }



  // 7. VOLNA ASCII ART CANVAS — true character-based renderer
  // Maps luminance → ASCII character density (dark=space, bright=dense char)
  // renderMode: "characters", animStyle: "shimmer", cellSize: 11
  function initVolnaCanvas() {
    const canvas = document.getElementById('volna-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── ASCII character palette (dark → bright) ───────────────────────
    // Ordered from least to most "filled" visually
    const CHARS = ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';

    // ── Source wave image ─────────────────────────────────────────────
    const sourceImg = new Image();
    sourceImg.crossOrigin = 'anonymous';
    sourceImg.src = 'images/volna_wave.png';

    // Offscreen canvas for pixel sampling
    const smpCanvas = document.createElement('canvas');
    const smpCtx    = smpCanvas.getContext('2d', { willReadFrequently: true });

    let W = 0, H = 0, dpr = 1;
    let imgReady = false;
    let smpData  = null; // cached per resize

    // ── Cell / font sizing ────────────────────────────────────────────
    const CELL_W  = 9;   // px per character column
    const CELL_H  = 16;  // px per character row (taller = classic ASCII look)

    function resize() {
      const rect = canvas.getBoundingClientRect();
      W   = Math.max(100, Math.round(rect.width  || canvas.parentElement?.clientWidth  || 600));
      H   = Math.max(100, Math.round(rect.height || canvas.parentElement?.clientHeight || 320));
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width  = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      smpCanvas.width  = W;
      smpCanvas.height = H;
      smpData = null; // invalidate on resize
    }

    sourceImg.onload = () => { imgReady = true; resize(); };
    if (sourceImg.complete && sourceImg.naturalWidth > 0) { imgReady = true; resize(); }
    window.addEventListener('resize', resize);
    resize();

    // ── Build high-contrast greyscale sample ──────────────────────────
    // Done once per resize; uses manual pixel loop for cross-browser safety
    function buildSampleData() {
      if (!imgReady || !smpCtx || smpData) return;
      try {
        smpCtx.drawImage(sourceImg, 0, 0, W, H);
        const raw = smpCtx.getImageData(0, 0, W, H);
        const d   = raw.data;
        const CF  = 2.5; // contrast boost — makes wave edge crisp
        for (let i = 0; i < d.length; i += 4) {
          let g = 0.2126 * d[i] + 0.7152 * d[i+1] + 0.0722 * d[i+2];
          g = CF * (g - 128) + 128;
          g = Math.max(0, Math.min(255, g));
          d[i] = d[i+1] = d[i+2] = g;
        }
        smpData = d;
      } catch { smpData = null; }
    }

    // ── Animation ─────────────────────────────────────────────────────
    const ANIM_INT   = 0.18; // shimmer wave amplitude (subtle)
    const ANIM_SPEED = 0.018;
    let frameIdx = 0;

    // ── Render ────────────────────────────────────────────────────────
    function render() {
      frameIdx++;
      if (W < 1 || H < 1) { requestAnimationFrame(render); return; }

      buildSampleData();

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Deep black background
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      const cols = Math.ceil(W / CELL_W);
      const rows = Math.ceil(H / CELL_H);
      const time = frameIdx * ANIM_SPEED;

      // Set up monospace font sized to cell
      const fontSize = CELL_H - 1;
      ctx.font         = `${fontSize}px "Courier New", Courier, monospace`;
      ctx.textBaseline = 'top';

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const nx = c / cols;
          const ny = r / rows;

          // Sample centre pixel of cell from wave image
          const px = Math.min(W - 1, Math.round(c * CELL_W + CELL_W * 0.5));
          const py = Math.min(H - 1, Math.round(r * CELL_H + CELL_H * 0.5));

          let lum;
          if (smpData) {
            lum = smpData[(py * W + px) * 4] / 255;
          } else {
            // Fallback animated wave before image loads
            lum = 0.5 + 0.45 * Math.sin(nx * 10 + ny * 6 + time * 2);
          }

          // Shimmer: ripple travels across the wave
          const shimmer = Math.sin(time * 4.0 + nx * 14 + ny * 8) * ANIM_INT;
          lum = Math.max(0, Math.min(1, lum + shimmer));

          // Skip near-black cells — leave pure black background
          if (lum < 0.06) continue;

          // Map luminance → character index
          const charIdx = Math.min(CHARS.length - 1, Math.floor(lum * CHARS.length));
          const ch = CHARS[charIdx];
          if (ch === ' ') continue; // skip space chars too

          // Brightness of the drawn character: dim for mid-tones, bright for highlights
          const v = Math.floor(40 + lum * 215);
          ctx.fillStyle = `rgb(${v},${v},${v})`;
          ctx.fillText(ch, c * CELL_W, r * CELL_H);
        }
      }

      // ── Post: subtle vignette ─────────────────────────────────────
      const grd = ctx.createRadialGradient(W*0.5, H*0.5, W*0.2, W*0.5, H*0.5, W*0.82);
      grd.addColorStop(0,   'rgba(0,0,0,0)');
      grd.addColorStop(0.6, 'rgba(0,0,0,0.18)');
      grd.addColorStop(1,   'rgba(0,0,0,0.65)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
  }
  initVolnaCanvas();



  // 8. SCREENPLAY BOOK — 2-PAGE SPREAD SCRIPT ENGINE (FOR INDEX & WORKS PAGES)
  const spBook        = document.getElementById('screenplay-book');
  const spLeftPage    = document.getElementById('sp-left-page');
  const spRightPage   = document.getElementById('sp-right-page');
  const spContentL    = document.getElementById('sp-content-left');
  const spContentR    = document.getElementById('sp-content-right');
  const spTitleL      = document.getElementById('sp-title-left');
  const spTitleR      = document.getElementById('sp-title-right');
  const spNumL        = document.getElementById('sp-num-left');
  const spNumR        = document.getElementById('sp-num-right');
  const spDraftL      = document.getElementById('sp-draft-left');
  const spDraftR      = document.getElementById('sp-draft-right');
  const spPrevBtn     = document.getElementById('sp-prev');
  const spNextBtn     = document.getElementById('sp-next');
  const spIndicator   = document.getElementById('sp-indicator');

  if (spBook && spContentL && spContentR) {
    let SCRIPTS = [
      {
        title: 'KIRDAAR',
        draft: 'PRODUCTION DRAFT — 2026',
        pages: [
          `<div class="sp-scene">INT. REHEARSAL STUDIO — 11:30 PM</div>
           <div class="sp-action">Single overhead tungsten spotlight. Sound of rain drumming against the tin shed.</div>
           <div class="sp-action">KABIR (played by Bhavya, 21) stands facing the mirror. His script pages are crumpled in his fist. He doesn't look at his reflection; he stares through it.</div>
           <div class="sp-char">KABIR</div>
           <div class="sp-paren">(to himself, adjusting his collar)</div>
           <div class="sp-dialogue">Every actor thinks they choose the role. Until the character starts making your choices for you.</div>
           <div class="sp-action">He steps closer to the glass. Breath fogs the surface. With two fingers, he wipes it clear.</div>`,
          `<div class="sp-action">ANANYA (20) steps into the studio doorway with two cutting chais in a wire rack. She watches him from the shadow.</div>
           <div class="sp-char">ANANYA</div>
           <div class="sp-dialogue">We’ve been rolling since 6 AM, Kabir. You need to drop the accent before you go home.</div>
           <div class="sp-char">KABIR</div>
           <div class="sp-dialogue">Which home? The one in the script, or the one with pending rent?</div>
           <div class="sp-action">She smiles, shaking her head. Hands him the glass.</div>
           <div class="sp-char">ANANYA</div>
           <div class="sp-dialogue">Take 14 tomorrow morning. Make sure the director is satisfied with the actor.</div>
           <div class="sp-trans">CUT TO:</div>`,
          `<div class="sp-scene">EXT. AUDITORIUM ROOFTOP — CONTINUOUS</div>
           <div class="sp-action">City lights spread out below in an endless amber haze. Wind catches the corner of the clapperboard lying on a plastic stool.</div>
           <div class="sp-action">KABIR looks out over the Bengaluru skyline. The silence between takes is where the story actually lives.</div>
           <div class="sp-char">KABIR</div>
           <div class="sp-dialogue">When the red recording light turns on, everyone watches your face. Nobody looks at what your hands are hiding.</div>
           <div class="sp-action">He opens his palm. The faded rehearsal token sits there.</div>`,
          `<div class="sp-action">The assistant director's voice echoes from down the stairwell: "Director Bhavya on floor in two minutes!"</div>
           <div class="sp-action">Kabir takes one slow, deliberate breath. The exhaustion falls away like shedding a jacket.</div>
           <div class="sp-char">KABIR</div>
           <div class="sp-paren">(smiling faintly)</div>
           <div class="sp-dialogue">Camera rolling. Sound speed. Action.</div>
           <div class="sp-trans">FADE TO BLACK.</div>`
        ]
      },
      {
        title: 'THE NATION WANTS TO KNOW',
        draft: 'STUDIO PARODY DRAFT — 2025',
        pages: [
          `<div class="sp-scene">INT. TV NEWS STUDIO — PRIME TIME</div>
           <div class="sp-action">Six neon screens flashing breaking red graphics. Decibel meters vibrating in the red zone. Three panellists speaking simultaneously over each other.</div>
           <div class="sp-action">ANCHOR (played with hyper-intensity by Bhavya) slams both palms onto the glass desk, knocking over a ceramic coffee mug that has no coffee.</div>
           <div class="sp-char">ANCHOR</div>
           <div class="sp-paren">(bellowing into lapel mic)</div>
           <div class="sp-dialogue">Hold on! Do not speak! When I am speaking, you will not speak! The nation demands to know why this panel is not outraged enough!</div>`,
          `<div class="sp-action">PANELLIST 1 gestures wildly with a rolled-up magazine. PANELLIST 2 is muted but screaming silently in a mini picture-in-picture box.</div>
           <div class="sp-char">PANELLIST 1</div>
           <div class="sp-dialogue">If you would allow me thirty seconds without thirty sound effects—!</div>
           <div class="sp-char">ANCHOR</div>
           <div class="sp-dialogue">Thirty seconds?! In thirty seconds, history has already been broken, debated, and forgotten on digital reels!</div>
           <div class="sp-action">Anchor turns directly to Camera 1. Eyebrows knit into dramatic fury.</div>
           <div class="sp-trans">ZOOM IN HARD:</div>`,
          `<div class="sp-scene">INT. STUDIO CONTROL ROOM — SIMULTANEOUS</div>
           <div class="sp-action">THE PRODUCTION MANAGER (also Bhavya, wearing headset and stopwatch) calmly sips juice while watching the chaos on twenty monitors.</div>
           <div class="sp-char">PRODUCTION MANAGER</div>
           <div class="sp-paren">(into headset)</div>
           <div class="sp-dialogue">Cue dramatic sting four. Increase graphics font by twenty percent. Viewership just jumped twelve thousand.</div>
           <div class="sp-action">Assistant tech presses three flashing red buttons. The studio floor shakes with sound effects.</div>`,
          `<div class="sp-action">Back on the studio floor, the Anchor holds a dramatic five-second pause. Total stillness. The music drops to a single menacing heartbeat.</div>
           <div class="sp-char">ANCHOR</div>
           <div class="sp-dialogue">We will return after this commercial break. Don't touch that remote. The truth is scheduled for segment three.</div>
           <div class="sp-action">Commercial graphic slams down with comic precision.</div>
           <div class="sp-trans">FADE OUT.</div>`
        ]
      },
      {
        title: 'LIFE NOTE',
        draft: 'PRODUCTION SCRIPT — 2025',
        pages: [
          `<div class="sp-scene">INT. APARTMENT LIVING ROOM — AFTERNOON SUNLIGHT</div>
           <div class="sp-action">Dust motes drift through warm golden light. A leather-bound notebook lies open on a glass coffee table, pages filled with hurried handwriting.</div>
           <div class="sp-action">SAMAR (22) holds an envelope with an unopened seal. He turns it over three times before looking at MEERA across the room.</div>
           <div class="sp-char">SAMAR</div>
           <div class="sp-dialogue">If you write something down, does that make it more real? Or does it just mean you can’t pretend it never happened?</div>`,
          `<div class="sp-action">MEERA doesn't look away from the window. The sound of distant traffic hums below.</div>
           <div class="sp-char">MEERA</div>
           <div class="sp-dialogue">Ink doesn't lie, Samar. People do when they read it out loud.</div>
           <div class="sp-action">He slides the notebook closer. The handwriting is uneven — some paragraphs crossed out with deliberate, heavy strokes.</div>
           <div class="sp-char">SAMAR</div>
           <div class="sp-dialogue">Then let’s read it together. Page by page.</div>
           <div class="sp-trans">CUT TO:</div>`,
          `<div class="sp-scene">EXT. CAMPUS CORRIDOR — FLASHBACK</div>
           <div class="sp-action">Rushing students, festival posters lining the brick walls. TAMASHA banner hanging from the balcony above.</div>
           <div class="sp-action">SAMAR watches MEERA carry a stack of event registrations. She drops one. He picks it up before it touches the wet ground.</div>
           <div class="sp-char">SAMAR</div>
           <div class="sp-dialogue">You’re running Band Baaja Baaraat on pure caffeine, aren’t you?</div>
           <div class="sp-char">MEERA</div>
           <div class="sp-dialogue">Caffeine and eighteen hundred people expecting the best night of their semester.</div>`,
          `<div class="sp-action">She takes the flyer, smiles, and runs ahead. Samar watches her disappear into the bustling crowd.</div>
           <div class="sp-action">Back in the present, Samar closes the leather notebook. A small smile touches his face.</div>
           <div class="sp-char">SAMAR</div>
           <div class="sp-paren">(softly)</div>
           <div class="sp-dialogue">Some notes stay with you forever.</div>
           <div class="sp-trans">DISSOLVE TO BLACK.</div>`
        ]
      }
    ];

    let activeScript  = 0;
    let currentSpread = 0;
    let isTurning     = false;
    const mobilePageQuery = window.matchMedia('(max-width: 900px)');

    function isSinglePageMode() {
      return mobilePageQuery.matches;
    }

    function totalSpreads() {
      return isSinglePageMode()
        ? SCRIPTS[activeScript].pages.length
        : Math.ceil(SCRIPTS[activeScript].pages.length / 2);
    }

    function updateDOMContent() {
      const script = SCRIPTS[activeScript];
      const leftIdx  = isSinglePageMode() ? currentSpread : currentSpread * 2;
      const rightIdx = leftIdx + 1;

      if (spTitleL) spTitleL.textContent = script.title;
      if (spTitleR) spTitleR.textContent = script.title;
      if (spNumL) spNumL.textContent   = `p. ${leftIdx + 1}`;
      if (spNumR) spNumR.textContent   = `p. ${rightIdx + 1}`;
      if (spDraftL) spDraftL.textContent = script.draft;
      if (spDraftR) spDraftR.textContent = script.draft;

      spContentL.innerHTML = script.pages[leftIdx]  || '';
      if (spContentR) {
        spContentR.innerHTML = script.pages[rightIdx] || '<div class="sp-action" style="color:var(--text-muted);text-align:center;margin-top:2rem;">— end of excerpt —</div>';
      }

      if (spIndicator) {
        spIndicator.innerHTML = isSinglePageMode()
          ? `PAGE ${leftIdx + 1}&nbsp;/&nbsp;${script.pages.length}`
          : `PAGE ${leftIdx + 1}&ndash;${rightIdx + 1}&nbsp;/&nbsp;${script.pages.length}`;
      }
    }

    function updateButtonStates() {
      const ts = totalSpreads();
      if (spPrevBtn) spPrevBtn.disabled = currentSpread === 0;
      if (spNextBtn) spNextBtn.disabled = currentSpread >= ts - 1;
    }

    function renderSpread(direction) {
      if (direction === null) {
        updateDOMContent();
        updateButtonStates();
        return;
      }

      if (isTurning) return;
      isTurning = true;

      if (spPrevBtn) spPrevBtn.disabled = true;
      if (spNextBtn) spNextBtn.disabled = true;

      if (direction === 'next') {
        if (spRightPage) spRightPage.classList.add('flip-out-left');
        setTimeout(() => {
          if (spRightPage) spRightPage.classList.remove('flip-out-left');
          updateDOMContent();
          if (spLeftPage) spLeftPage.classList.add('flip-in-left');
          setTimeout(() => {
            if (spLeftPage) spLeftPage.classList.remove('flip-in-left');
            isTurning = false;
            updateButtonStates();
          }, 350);
        }, 320);
      } else if (direction === 'prev') {
        if (spLeftPage) spLeftPage.classList.add('flip-out-right');
        setTimeout(() => {
          if (spLeftPage) spLeftPage.classList.remove('flip-out-right');
          updateDOMContent();
          if (spRightPage) spRightPage.classList.add('flip-in-right');
          setTimeout(() => {
            if (spRightPage) spRightPage.classList.remove('flip-in-right');
            isTurning = false;
            updateButtonStates();
          }, 350);
        }, 320);
      }
    }

    renderSpread(null);

    mobilePageQuery.addEventListener('change', () => {
      currentSpread = Math.min(currentSpread, totalSpreads() - 1);
      renderSpread(null);
    });

    if (spNextBtn) {
      spNextBtn.addEventListener('click', () => {
        if (isTurning) return;
        if (currentSpread < totalSpreads() - 1) {
          currentSpread++;
          renderSpread('next');
        }
      });
    }

    if (spPrevBtn) {
      spPrevBtn.addEventListener('click', () => {
        if (isTurning) return;
        if (currentSpread > 0) {
          currentSpread--;
          renderSpread('prev');
        }
      });
    }

    function bindTabButtons() {
      document.querySelectorAll('.s-tab-btn').forEach(btn => {
        btn.onclick = () => {
          if (isTurning) return;
          document.querySelectorAll('.s-tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeScript  = parseInt(btn.dataset.tab, 10) || 0;
          currentSpread = 0;
          renderSpread(null);
        };
      });
    }

    bindTabButtons();

    // Dynamically load scripts from window.BHAVYA_CONTENT or data/scripts.json
    function applyLoadedScripts(data) {
      if (Array.isArray(data) && data.length > 0) {
        SCRIPTS = data;
        const tabsBar = document.querySelector('.scripts-tabs-bar');
        if (tabsBar) {
          tabsBar.innerHTML = SCRIPTS.map((s, idx) => 
            `<button class="s-tab-btn ${idx === activeScript ? 'active' : ''}" data-tab="${idx}">${s.tabLabel || s.title}</button>`
          ).join('');
          bindTabButtons();
        }
        currentSpread = 0;
        renderSpread(null);
      }
    }

    if (window.BHAVYA_CONTENT && Array.isArray(window.BHAVYA_CONTENT.scripts) && window.BHAVYA_CONTENT.scripts.length > 0) {
      applyLoadedScripts(window.BHAVYA_CONTENT.scripts);
    } else {
      fetch('data/scripts.json')
        .then(r => r.ok ? r.json() : Promise.reject('not found'))
        .then(data => applyLoadedScripts(data))
        .catch(() => {});
    }
  }

  // 9. SCROLL REVEAL OBSERVER
  const revealTargets = document.querySelectorAll('.h-anim, .sec-h2, .work-card, .disc-item, .script-box, .m-still-item, .table-grid-row, .about-split-grid, .contact-split-grid, .media-card, .rich-entry-card, .contact-honest-title, .hero-roles-box, .hero-media-grid, .carousel-3d-wrapper');
  
  let revealObserver = null;
  if ('IntersectionObserver' in window) {
    const observerOptions = {
      threshold: 0.08,
      rootMargin: '0px 0px -30px 0px'
    };

    revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('iv');
          obs.unobserve(entry.target);
        }
      });
    }, observerOptions);

    revealTargets.forEach(el => {
      el.classList.add('scroll-reveal');
      revealObserver.observe(el);
    });
  } else {
    revealTargets.forEach(el => el.classList.add('iv'));
  }

  // ── DYNAMIC CONTENT ENGINE (RENDERED FROM MARKDOWN CMS) ──────────────────────
  async function loadContentData(key, fallbackFile) {
    if (window.BHAVYA_CONTENT && Array.isArray(window.BHAVYA_CONTENT[key]) && window.BHAVYA_CONTENT[key].length > 0) {
      return window.BHAVYA_CONTENT[key];
    }
    try {
      const res = await fetch(`data/${fallbackFile}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    return null;
  }

  function registerReveal(container) {
    if (!container) return;
    const targets = container.querySelectorAll('.scroll-reveal, .work-card, .rich-entry-card, .table-grid-row');
    targets.forEach(el => {
      el.classList.add('scroll-reveal');
      if (revealObserver) {
        revealObserver.observe(el);
      } else {
        el.classList.add('iv');
      }
    });
  }

  // 1) Works Page (works.html)
  async function renderWorksPage() {
    const container = document.getElementById('works-container') || document.querySelector('.works-showcase-grid[data-dynamic="works"]');
    if (!container) return;
    const items = await loadContentData('works', 'works.json');
    if (!items || !items.length) return;

    container.innerHTML = items.map(item => `
      <article class="work-card scroll-reveal" style="border-bottom: 1px solid var(--border-primary); display: grid; grid-template-columns: 1fr 1fr;">
        <div class="work-card-media" style="aspect-ratio: 16/10; border-right: 1px solid var(--border-primary); border-bottom: none;">
          <img src="${item.image}" alt="${item.imageAlt || item.title}" loading="lazy" />
        </div>
        <div class="work-card-info" style="padding: 2.5rem 2rem;">
          <span class="sec-eyebrow">${item.type} &middot; ${item.role}${item.status ? ` &middot; ${item.status}` : ''}</span>
          <h2 class="work-card-title" style="font-size: 2.2rem;">${item.title}</h2>
          <p class="work-card-desc">${item.description}</p>
          <p style="font-size: 0.78rem; font-family: var(--font-mono); color: var(--color-brand-muted); text-transform: uppercase;">
            Role: ${item.role} &middot; ${item.genre}
          </p>
          ${item.scriptLink ? `
          <div style="display: flex; gap: 1.5rem; margin-top: 1rem;">
            <a href="${item.scriptLink}" class="m-cta-btn">Read Script Excerpt &darr;</a>
          </div>` : ''}
        </div>
      </article>
    `).join('');

    registerReveal(container);
  }

  // 2) Works on Homepage (index.html)
  async function renderHomeWorks() {
    const container = document.getElementById('home-works-container');
    if (!container) return;
    const items = await loadContentData('works', 'works.json');
    if (!items || !items.length) return;

    container.innerHTML = items.slice(0, 2).map(item => `
      <article class="work-card scroll-reveal">
        <div class="work-card-media">
          <img src="${item.image}" alt="${item.imageAlt || item.title}" loading="lazy" />
        </div>
        <div class="work-card-info">
          <span class="sec-eyebrow">${item.type} &middot; ${item.role}</span>
          <h3 class="work-card-title">${item.title}</h3>
          <p class="work-card-desc">${item.description}</p>
          <a href="works.html" class="m-cta-btn" style="margin-top: 0.6rem;">Explore Work &rarr;</a>
        </div>
      </article>
    `).join('');

    registerReveal(container);
  }

  // 3) Achievements Page (achievements.html)
  async function renderAchievementsPage() {
    const container = document.getElementById('achievements-container');
    if (!container) return;
    const items = await loadContentData('achievements', 'achievements.json');
    if (!items || !items.length) return;

    container.innerHTML = items.map(item => `
      <article class="rich-entry-card scroll-reveal">
        <span class="row-year">${item.year}</span>
        <div class="rich-card-thumb">
          <img src="${item.image}" alt="${item.imageAlt || item.title}" loading="lazy" />
        </div>
        <div class="rich-card-details">
          <h2 class="row-title">${item.title}</h2>
          <p class="row-desc">${item.description}</p>
          <p class="rich-card-bio">${item.bio}</p>
        </div>
        <span class="row-tag">${item.tag}</span>
      </article>
    `).join('');

    registerReveal(container);
  }

  // 4) Experience Page (experience.html)
  async function renderExperiencePage() {
    const container = document.getElementById('experience-container');
    if (!container) return;
    const items = await loadContentData('experience', 'experience.json');
    if (!items || !items.length) return;

    container.innerHTML = items.map(item => `
      <article class="rich-entry-card scroll-reveal">
        <span class="row-year">${item.year}</span>
        <div class="rich-card-thumb">
          <img src="${item.image}" alt="${item.imageAlt || item.title}" loading="lazy" />
        </div>
        <div class="rich-card-details">
          <h2 class="row-title">${item.title}</h2>
          <p class="row-desc">${item.organization}${item.subtitle ? ` &middot; ${item.subtitle}` : ''}</p>
          <p class="rich-card-bio">${item.bio}</p>
        </div>
        <span class="row-tag">${item.tag}</span>
      </article>
    `).join('');

    registerReveal(container);
  }

  // 5) Recognition on Homepage (index.html)
  async function renderHomeRecognition() {
    const container = document.getElementById('home-recognition-container');
    if (!container) return;
    const items = await loadContentData('achievements', 'achievements.json');
    if (!items || !items.length) return;

    container.innerHTML = items.slice(0, 4).map(item => `
      <div class="table-grid-row scroll-reveal">
        <span class="row-year">${item.year}</span>
        <div>
          <p class="row-title">${item.title}</p>
          <p class="row-desc">${item.description}</p>
        </div>
        <span class="row-tag">${item.tag}</span>
      </div>
    `).join('');

    registerReveal(container);
  }

  renderWorksPage();
  renderHomeWorks();
  renderAchievementsPage();
  renderExperiencePage();
  renderHomeRecognition();


  // 10. CONTACT FORM — REAL SUBMISSION
  document.querySelectorAll('#contact-form, #cf').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = form.querySelector('button[type="submit"]');
      const origText = btn ? btn.textContent : '';

      // Gather field values
      const name     = form.querySelector('#c-name')?.value.trim() || '';
      const email    = form.querySelector('#c-email')?.value.trim() || '';
      const message  = form.querySelector('#c-msg')?.value.trim() || '';
      const honeypot = form.querySelector('#hp-website')?.value || '';

      // Basic client-side check (server also validates)
      if (!name || !email || !message) return;

      // Loading state
      if (btn) {
        btn.textContent = 'TRANSMITTING...';
        btn.disabled = true;
      }

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message, website: honeypot }),
        });

        const data = await res.json();

        if (res.ok) {
          // Success state — matches the site's cinematic style
          if (btn) {
            btn.textContent = 'TRANSMITTED ✓';
            btn.style.background = 'var(--text-primary)';
            btn.style.color = 'var(--bg-color)';
          }
          form.reset();
          setTimeout(() => {
            if (btn) {
              btn.textContent = origText;
              btn.style.background = '';
              btn.style.color = '';
              btn.disabled = false;
            }
          }, 4000);
        } else {
          // Error state — show the server's message
          if (btn) {
            btn.textContent = data.error || 'ERROR — TRY AGAIN';
            btn.style.background = '#7A1519';
            btn.style.color = '#fff';
          }
          setTimeout(() => {
            if (btn) {
              btn.textContent = origText;
              btn.style.background = '';
              btn.style.color = '';
              btn.disabled = false;
            }
          }, 4000);
        }
      } catch (err) {
        // Network failure
        if (btn) {
          btn.textContent = 'CONNECTION ERROR';
          btn.style.background = '#7A1519';
          btn.style.color = '#fff';
          setTimeout(() => {
            btn.textContent = origText;
            btn.style.background = '';
            btn.style.color = '';
            btn.disabled = false;
          }, 4000);
        }
      }
    });
  });

    // 11. BACK TO TOP
    document.querySelectorAll('#btt, #back-to-top').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

  // 12. CINEMATIC SLOWED SMOOTH SCROLL RIG (GLOBAL FOR ALL PAGES)
  (function initSlowScroll() {
    let currentY = window.scrollY;
    let targetY = window.scrollY;
    let isTicking = false;
    const SPEED_SCALE = 0.42;
    const LERP_FACTOR = 0.075;

    function step() {
      const diff = targetY - currentY;
      if (Math.abs(diff) > 0.3) {
        currentY += diff * LERP_FACTOR;
        window.scrollTo(0, currentY);
        requestAnimationFrame(step);
      } else {
        currentY = targetY;
        window.scrollTo(0, currentY);
        isTicking = false;
      }
    }

    window.addEventListener('wheel', (e) => {
      const path = e.composedPath ? e.composedPath() : [];
      const hasScrollableParent = path.some(el => {
        if (!el || el === document.body || el === document.documentElement) return false;
        if (!el.classList) return false;
        if (el.id === 'nav-drawer' || el.closest && el.closest('.carousel-3d-wrapper')) return true;
        const style = window.getComputedStyle(el);
        return (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
      });
      if (hasScrollableParent) return;

      e.preventDefault();
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (!isTicking) {
        currentY = window.scrollY;
        targetY = window.scrollY;
        isTicking = true;
        requestAnimationFrame(step);
      }
      targetY += e.deltaY * SPEED_SCALE;
      targetY = Math.max(0, Math.min(targetY, maxScroll));
    }, { passive: false });

    window.addEventListener('scroll', () => {
      if (!isTicking) {
        currentY = window.scrollY;
        targetY = window.scrollY;
      }
    }, { passive: true });
  })();

  // 12. 3D SVG MASCOT CHARACTER INTERACTION (TRUE MULTI-LAYER ANATOMICAL PARALLAX)
  (function initComicMaximalistMascot() {
    const charBtn = document.getElementById('mph-char-btn');
    const bubble = document.getElementById('mph-speech-bubble');
    const root = document.getElementById('hero-comic-maximalism');
    if (!charBtn || !root) return;

    const layers = {
      body: document.getElementById('m-layer-body'),
      head: document.getElementById('m-head-rig'),
      hairBack: document.getElementById('m-hair-back'),
      earL: document.getElementById('m-ear-L'),
      earR: document.getElementById('m-ear-R'),
      blush: document.getElementById('m-blush'),
      face: document.getElementById('m-face-features'),
      brows: document.getElementById('m-brows'),
      eyesNormal: document.getElementById('m-eyes-normal'),
      eyesHappy: document.getElementById('m-eyes-happy'),
      pupilLeft: document.getElementById('m-pupil-left'),
      pupilRight: document.getElementById('m-pupil-right'),
      nose: document.getElementById('m-nose'),
      hair: document.getElementById('m-bangs'),
      beanie: document.getElementById('m-beanie'),
      tag: document.getElementById('m-tag'),
      floorShadow: document.getElementById('m-floor-shadow')
    };

    const greetings = [
      "Hi there! I'm Bhavya ✨",
      "Let's direct something bold!",
      "Looking for fresh vision?",
      "Films, frames & stories!",
      "Haha, tickles! Directing is serious work :)",
      "Cinema is memory made visible 🎬"
    ];
    let saidIdx = 0;
    let happyTimer = null;
    let isHappy = false;

    charBtn.addEventListener('click', () => {
      isHappy = true;
      charBtn.classList.add('mph-happy');
      if (layers.eyesNormal) layers.eyesNormal.style.display = 'none';
      if (layers.eyesHappy) layers.eyesHappy.style.display = 'block';

      if (bubble) {
        bubble.textContent = greetings[saidIdx % greetings.length];
        bubble.setAttribute('data-on', 'true');
        saidIdx++;
      }
      clearTimeout(happyTimer);
      happyTimer = setTimeout(() => {
        isHappy = false;
        charBtn.classList.remove('mph-happy');
        if (layers.eyesNormal) layers.eyesNormal.style.display = 'block';
        if (layers.eyesHappy) layers.eyesHappy.style.display = 'none';
        if (bubble) bubble.setAttribute('data-on', 'false');
      }, 2400);
    });

    let px = 0, py = 0, lastMove = -1e9;
    let gx = 0, gy = 0, near = 0;
    let prev = performance.now();
    let nextBlink = prev + 1800;
    let blinkAt = -1e9;
    let visible = true;

    const onMove = (e) => {
      px = e.clientX;
      py = e.clientY;
      lastMove = performance.now();
    };
    const onLeave = () => { lastMove = -1e9; };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);

    function approach(cur, target, dt, rate) {
      return target + (cur - target) * Math.exp(-rate * dt);
    }

    function blink(since) {
      const d = 0.15;
      if (since < 0 || since > d) return 1;
      return 1 - Math.sin((Math.PI * since) / d) * 0.92;
    }

    function aim(px, py, cx, cy, rx, ry) {
      const dx = px - cx;
      const dy = py - cy;
      const norm = (d, r) => {
        const s = Math.max(-1, Math.min(1, d / r));
        return Math.sign(s) * Math.pow(Math.abs(s), 0.85);
      };
      return [norm(dx, rx), norm(dy, ry)];
    }

    function pose(x, y, nearVal) {
      return {
        head: { dx: x * 10, dy: y * 7, rot: x * 4 },
        ears: { dx: -x * 7, dy: -y * 3, lead: 1 + x * 0.16, trail: 1 - x * 0.16 },
        hair: { dx: x * 8, dy: y * 3 },
        beanie: { dx: x * 13, dy: y * 4 },
        tag: { dx: x * 7, dy: 0 },
        blush: { dx: x * 20, dy: y * 14 },
        face: { dx: x * 28, dy: y * (y < 0 ? 11 : 20) },
        nose: { dx: x * 10, dy: y * 7 },
        eyes: { dx: x * 6, dy: y * 5, scale: 1 + nearVal * 0.14 },
        brows: { dx: x * 3, dy: y * 2 + Math.min(0, y) * 3 - nearVal * 9 },
      };
    }

    const tr = (dx, dy) => `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`;

    function loop(now) {
      requestAnimationFrame(loop);
      if (!visible || !layers.head) return;

      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;

      const r = charBtn.getBoundingClientRect();
      const cx = r.left + r.width * 0.5;
      const cy = r.top + r.height * 0.48;

      let tx = 0, ty = 0, tn = 0;
      const idle = now - lastMove > 3500;

      if (!idle) {
        const reach = Math.max(window.innerWidth, window.innerHeight);
        [tx, ty] = aim(px, py, cx, cy, reach * 0.3, reach * 0.26);
        const dist = Math.hypot(px - cx, py - cy);
        tn = Math.max(0, 1 - dist / (r.width * 0.45));
      } else {
        const t = now / 1000;
        tx = Math.sin(t * 0.45) * 0.55 + Math.sin(t * 1.1) * 0.1;
        ty = Math.sin(t * 0.31 + 1) * 0.25;
      }

      gx = approach(gx, tx, dt, 7);
      gy = approach(gy, ty, dt, 7);
      near = approach(near, tn, dt, 8);

      const p = pose(gx, gy, near);
      const breathe = Math.sin(now / 620) * 1.6;

      if (now > nextBlink && !isHappy) {
        blinkAt = now;
        nextBlink = now + (Math.random() < 0.2 ? 260 : 2200 + Math.random() * 3200);
      }
      const open = isHappy ? 0.08 : blink((now - blinkAt) / 1000);

      // The neck belongs to the head rig, so the torso shares its full motion.
      const characterTransform = `${tr(p.head.dx, p.head.dy + breathe)} rotate(${p.head.rot.toFixed(2)} 300 560)`;
      if (layers.body) {
        layers.body.setAttribute('transform', characterTransform);
      }
      if (layers.head) {
        layers.head.setAttribute('transform', characterTransform);
      }

      if (layers.earL) {
        layers.earL.setAttribute(
          'transform',
          `${tr(p.ears.dx, p.ears.dy)} translate(140 382) scale(${p.ears.lead.toFixed(3)} 1) translate(-140 -382)`
        );
      }
      if (layers.earR) {
        layers.earR.setAttribute(
          'transform',
          `${tr(p.ears.dx, p.ears.dy)} translate(460 382) scale(${p.ears.trail.toFixed(3)} 1) translate(-460 -382)`
        );
      }
      if (layers.hair) {
        layers.hair.setAttribute('transform', tr(p.hair.dx, p.hair.dy));
      }
      if (layers.beanie) {
        layers.beanie.setAttribute('transform', tr(p.beanie.dx, p.beanie.dy));
      }
      if (layers.tag) {
        layers.tag.setAttribute('transform', tr(p.tag.dx, p.tag.dy));
      }
      if (layers.blush) {
        layers.blush.setAttribute('transform', tr(p.blush.dx, p.blush.dy));
      }
      if (layers.face) {
        layers.face.setAttribute('transform', tr(p.face.dx, p.face.dy));
      }
      if (layers.nose) {
        layers.nose.setAttribute('transform', tr(p.nose.dx, p.nose.dy));
      }
      if (layers.brows) {
        layers.brows.setAttribute('transform', tr(p.brows.dx, p.brows.dy));
      }
      if (layers.eyesNormal) {
        layers.eyesNormal.setAttribute(
          'transform',
          `${tr(p.eyes.dx, p.eyes.dy)} translate(300 350) scale(${p.eyes.scale.toFixed(3)} ${(p.eyes.scale * open).toFixed(3)}) translate(-300 -350)`
        );
      }
      if (layers.pupilLeft) {
        layers.pupilLeft.setAttribute('transform', tr(gx * 5.5, gy * 4.5));
      }
      if (layers.pupilRight) {
        layers.pupilRight.setAttribute('transform', tr(gx * 5.5, gy * 4.5));
      }
      if (layers.floorShadow) {
        layers.floorShadow.setAttribute(
          'transform',
          `translate(${(-gx * 8).toFixed(1)} 0) scale(${1 + breathe * 0.015} 1)`
        );
        layers.floorShadow.setAttribute('opacity', (0.12 - breathe * 0.008).toFixed(3));
      }
    }
    requestAnimationFrame(loop);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      prev = performance.now();
    });
    io.observe(root);
  })();

});



