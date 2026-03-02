'use strict';

/* ═══════════════════════════════════════════════════════════════
   ROYAL VÉLIZY – MAIN SCRIPT
   ═══════════════════════════════════════════════════════════════ */

console.log('%c🍱 Royal Vélizy – Site chargé avec succès !', 'color: #E8B84B; font-size: 1.2rem; font-weight: bold;');

/* ─────────────────────────────────────────────
   UTILS
───────────────────────────────────────────── */
const isDesktop = () => window.matchMedia('(pointer: fine)').matches;
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ─────────────────────────────────────────────
   1. CUSTOM CURSOR (desktop only)
───────────────────────────────────────────── */
(function initCursor() {
  if (!isDesktop()) return;

  const ring = qs('.cursor-ring');
  const dot  = qs('.cursor-dot');
  if (!ring || !dot) return;

  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  const hoverTargets = 'a, button, .menu-tab, .gallery-item, .buffet-card, .price-card, .nav-link, .mobile-link, .social-icon';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) ring.classList.add('hovered');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) ring.classList.remove('hovered');
  });
  document.addEventListener('mouseleave', () => {
    mouseX = -100; mouseY = -100;
  });
})();

/* ─────────────────────────────────────────────
   2. NAVBAR – SCROLL STATE & ACTIVE LINK
───────────────────────────────────────────── */
(function initNavbar() {
  const navbar = qs('#navbar');
  if (!navbar) return;

  function updateNavbarState() {
    navbar.classList.toggle('scrolled', window.scrollY > 80);
  }
  window.addEventListener('scroll', updateNavbarState, { passive: true });
  updateNavbarState();

  const navLinks = qsa('.nav-link');
  const sections = qsa('section[id], footer[id]');

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => navObserver.observe(s));
})();

/* ─────────────────────────────────────────────
   3. MOBILE MENU (burger)
───────────────────────────────────────────── */
(function initMobileMenu() {
  const burger = qs('.burger');
  const mobileMenu = qs('.mobile-menu');
  if (!burger || !mobileMenu) return;

  const overlay = document.createElement('div');
  overlay.className = 'mobile-overlay';
  document.body.appendChild(overlay);

  function openMenu() {
    burger.classList.add('open');
    mobileMenu.classList.add('open');
    overlay.classList.add('visible');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Fermer le menu');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    burger.classList.remove('open');
    mobileMenu.classList.remove('open');
    overlay.classList.remove('visible');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Ouvrir le menu');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', () => {
    burger.classList.contains('open') ? closeMenu() : openMenu();
  });
  overlay.addEventListener('click', closeMenu);
  qsa('.mobile-link, .mobile-menu .btn').forEach(l => l.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
})();

/* ─────────────────────────────────────────────
   4. HERO – ANIMATION D'ENTRÉE
───────────────────────────────────────────── */
(function initHeroEntrance() {
  const heroContent = document.querySelector('.hero-content');
  if (!heroContent) return;

  // Légère animation d'apparition sur les éléments du hero
  const items = heroContent.querySelectorAll('.hero-tag, .hero-title, .hero-subtitle, .hero-ctas');
  items.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(22px)';
    el.style.transition = `opacity 0.7s ease ${i * 0.15 + 0.2}s, transform 0.7s ease ${i * 0.15 + 0.2}s`;
    requestAnimationFrame(() => {
      el.style.opacity = '';
      el.style.transform = '';
    });
  });
})();

/* ─────────────────────────────────────────────
   5. HERO PARTICLES
───────────────────────────────────────────── */
(function initParticles() {
  const container = qs('#particles');
  if (!container) return;

  const colors = [
    'rgba(196,18,48,0.8)', 'rgba(232,184,75,0.8)', 'rgba(255,255,255,0.6)',
    'rgba(155,14,38,0.7)', 'rgba(245,208,128,0.7)'
  ];

  for (let i = 0; i < 50; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 1;
    const tx = (Math.random() - 0.5) * 200;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      left:${Math.random() * 100}%;
      animation-duration:${Math.random() * 15 + 10}s;
      animation-delay:-${Math.random() * 20}s;
      --particle-tx:translateX(${tx}px);
    `;
    container.appendChild(p);
  }
})();

/* ─────────────────────────────────────────────
   6. HERO PARALLAX
───────────────────────────────────────────── */
(function initParallax() {
  const hero = qs('#hero');
  const overlay = qs('.hero-overlay');
  if (!hero || !overlay) return;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight) {
      hero.style.transform = `translateY(${y * 0.3}px)`;
      overlay.style.opacity = 1 - y / window.innerHeight;
    }
  }, { passive: true });
})();

/* ─────────────────────────────────────────────
   7. REVEAL ON SCROLL
───────────────────────────────────────────── */
(function initReveal() {
  const els = qsa('.reveal-up, .reveal-left, .reveal-right, .reveal-scale');
  if (!els.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });

  els.forEach(el => obs.observe(el));
})();

/* ─────────────────────────────────────────────
   8. STATS COUNTER ANIMATION
───────────────────────────────────────────── */
(function initStatsCounter() {
  const nums = qsa('.stat-number');
  if (!nums.length) return;

  function fmt(n) {
    return n > 999 ? (n / 1000).toFixed(1).replace('.', ',') + 'k' : n.toString();
  }

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function animate(el) {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const start = performance.now();
    function update(now) {
      const p = Math.min((now - start) / 2200, 1);
      el.textContent = fmt(Math.round(easeOutExpo(p) * target)) + suffix;
      if (p < 1) requestAnimationFrame(update);
      else el.textContent = fmt(target) + suffix;
    }
    requestAnimationFrame(update);
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { animate(e.target); obs.unobserve(e.target); }
    });
  }, { threshold: 0.5 });

  nums.forEach(el => obs.observe(el));
})();

/* ─────────────────────────────────────────────
   9. MENU TABS
───────────────────────────────────────────── */
(function initMenuTabs() {
  const tabs   = qsa('.menu-tab');
  const panels = qsa('.menu-panel');
  if (!tabs.length) return;

  function showPanel(idx) {
    tabs.forEach((t, i) => {
      t.classList.toggle('active', i === idx);
      t.setAttribute('aria-selected', (i === idx).toString());
    });
    panels.forEach((p, i) => {
      if (i === idx) {
        p.classList.add('active');
        p.removeAttribute('hidden');
        qsa('.menu-item', p).forEach((item, j) => {
          item.classList.remove('show');
          setTimeout(() => item.classList.add('show'), 50 + j * 80);
        });
      } else {
        p.classList.remove('active');
        p.setAttribute('hidden', '');
        qsa('.menu-item', p).forEach(item => item.classList.remove('show'));
      }
    });
  }

  tabs.forEach((t, i) => t.addEventListener('click', () => showPanel(i)));

  // Auto-init first panel when section enters viewport
  const menuSection = qs('#menu');
  if (menuSection) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const fp = qs('.menu-panel.active');
          if (fp) qsa('.menu-item', fp).forEach((item, j) => {
            setTimeout(() => item.classList.add('show'), 50 + j * 80);
          });
          io.disconnect();
        }
      });
    }, { threshold: 0.2 });
    io.observe(menuSection);
  }
})();

/* ─────────────────────────────────────────────
   10. GALERIE – CATEGORY TABS + AUTO-SCROLL + LIGHTBOX
───────────────────────────────────────────── */
(function initGallery() {

  /* ── Category tabs ── */
  const catBtns   = qsa('.gallery-cat-btn');
  const carousels = qsa('.gallery-carousel');

  const catMap = {
    entrees:  'carousel-entrees',
    chauds:   'carousel-chauds',
    froids:   'carousel-froids',
    wok:      'carousel-wok',
    sushis:   'carousel-sushis',
    desserts: 'carousel-desserts'
  };

  function showCategory(cat) {
    catBtns.forEach(b => {
      const isActive = b.dataset.cat === cat;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-selected', isActive.toString());
    });
    carousels.forEach(c => {
      if (c.id === catMap[cat]) {
        c.classList.add('active');
        c.removeAttribute('hidden');
      } else {
        c.classList.remove('active');
        c.setAttribute('hidden', '');
      }
    });
  }

  catBtns.forEach(btn => {
    btn.addEventListener('click', () => showCategory(btn.dataset.cat));
  });

  /* ── Scroll JS par carousel (auto + flèches + swipe) ── */
  carousels.forEach(carousel => {
    const track   = qs('.carousel-track', carousel);
    const slides  = qsa('.carousel-slide', carousel);
    const prevBtn = qs('.gallery-nav-prev', carousel);
    const nextBtn = qs('.gallery-nav-next', carousel);
    if (!track || !slides.length) return;

    // Dupliquer les slides pour la boucle infinie
    slides.forEach(slide => {
      const clone = slide.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.removeAttribute('tabindex');
      track.appendChild(clone);
    });

    const GAP      = 12; // px, correspond au gap CSS 1.2rem ≈ 12px (ajusté dynamiquement)
    const SPEED    = 0.6; // px par frame à ~60fps
    let pos        = 0;   // position courante en px
    let paused     = false;
    let targeting  = false;
    let targetPos  = 0;
    let rafId      = null;

    function halfWidth() {
      // Largeur de la moitié du track (les originaux seulement)
      return slides.length * (slides[0].offsetWidth + GAP);
    }

    function tick() {
      if (!paused && !targeting) {
        pos += SPEED;
        // Boucle : quand on a parcouru la moitié (les clones), on repart à 0
        if (pos >= halfWidth()) pos -= halfWidth();
      }

      if (targeting) {
        const diff = targetPos - pos;
        if (Math.abs(diff) < 1) {
          pos = targetPos;
          // Normaliser si on dépasse la moitié
          if (pos >= halfWidth()) pos -= halfWidth();
          if (pos < 0)           pos += halfWidth();
          targeting = false;
          paused    = false;
        } else {
          pos += diff * 0.12; // easing vers la cible
        }
      }

      track.style.transform = `translateX(${-pos}px)`;
      rafId = requestAnimationFrame(tick);
    }

    function slideWidth() {
      return slides[0].offsetWidth + GAP;
    }

    function nudge(dir) {
      // Cible le slide suivant/précédent
      paused    = true;
      targeting = true;
      targetPos = pos + dir * slideWidth();
      // Empêcher de cibler en dehors des bornes
      const hw = halfWidth();
      if (targetPos >= hw)  targetPos -= hw;
      if (targetPos < 0)    targetPos += hw;
    }

    if (prevBtn) prevBtn.addEventListener('click', () => nudge(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => nudge(1));

    // Pause au survol souris
    carousel.addEventListener('mouseenter', () => { if (!targeting) paused = true;  });
    carousel.addEventListener('mouseleave', () => { if (!targeting) paused = false; });

    // Swipe tactile
    let ts = 0;
    carousel.addEventListener('touchstart', e => { ts = e.touches[0].clientX; paused = true; }, { passive: true });
    carousel.addEventListener('touchend',   e => {
      const dx = e.changedTouches[0].clientX - ts;
      if (Math.abs(dx) > 40) nudge(dx < 0 ? 1 : -1);
      else paused = false;
    }, { passive: true });

    // Démarrer l'animation
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      paused = true;
    }
    rafId = requestAnimationFrame(tick);

    // Clic sur slide → lightbox
    qsa('.carousel-slide:not([aria-hidden])', carousel).forEach((slide, i) => {
      slide.addEventListener('click', () => {
        openModal(qsa('.carousel-slide:not([aria-hidden])', carousel), i);
      });
      slide.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(qsa('.carousel-slide:not([aria-hidden])', carousel), i);
        }
      });
    });
  });

  /* ── Lightbox modal ── */
  const modal      = qs('#gallery-modal');
  if (!modal) return;
  const backdropEl = qs('.gallery-modal-backdrop', modal);
  const closeBtn   = qs('.gallery-modal-close', modal);
  const imgEl      = qs('#gallery-modal-img', modal);
  const placeholder= qs('#gallery-modal-placeholder', modal);
  const emojiEl    = qs('#gallery-modal-emoji', modal);
  const nameEl     = qs('#gallery-modal-name', modal);
  const counterEl  = qs('#gallery-modal-counter', modal);
  const prevBtn    = qs('.gallery-modal-prev', modal);
  const nextBtn    = qs('.gallery-modal-next', modal);
  const imgWrap    = qs('.gallery-modal-img-wrap', modal);

  let modalSlides = [];
  let modalIndex  = 0;

  function openModal(slides, idx) {
    modalSlides = slides;
    modalIndex  = idx;
    renderModalSlide(idx, false);
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => closeBtn.focus(), 80);
  }

  function closeModal() {
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  function renderModalSlide(idx, animate) {
    const slide = modalSlides[idx];
    const name  = slide.dataset.name  || '';
    const img   = slide.dataset.img   || '';
    const emoji = slide.dataset.emoji || slide.querySelector('.slide-emoji')?.textContent || '🍽️';

    function applyContent() {
      nameEl.textContent    = name;
      counterEl.textContent = (idx + 1) + ' / ' + modalSlides.length;
      emojiEl.textContent   = emoji;
      if (img) {
        imgEl.src = img; imgEl.alt = name;
        imgEl.style.display  = 'block';
        placeholder.style.display = 'none';
      } else {
        imgEl.style.display  = 'none';
        imgEl.src = '';
        placeholder.style.display = 'flex';
      }
    }

    if (animate) {
      imgWrap.classList.add('slide-out');
      setTimeout(() => {
        imgWrap.classList.remove('slide-out');
        applyContent();
        imgWrap.classList.add('slide-in');
        setTimeout(() => imgWrap.classList.remove('slide-in'), 300);
      }, 200);
    } else {
      applyContent();
    }
  }

  function navigateModal(dir) {
    modalIndex = (modalIndex + dir + modalSlides.length) % modalSlides.length;
    renderModalSlide(modalIndex, true);
  }

  closeBtn.addEventListener('click', closeModal);
  backdropEl.addEventListener('click', closeModal);
  prevBtn.addEventListener('click', () => navigateModal(-1));
  nextBtn.addEventListener('click', () => navigateModal(1));

  document.addEventListener('keydown', e => {
    if (modal.hasAttribute('hidden')) return;
    if (e.key === 'Escape')     closeModal();
    if (e.key === 'ArrowLeft')  navigateModal(-1);
    if (e.key === 'ArrowRight') navigateModal(1);
  });

  let mts = 0;
  imgWrap.addEventListener('touchstart', e => { mts = e.touches[0].clientX; }, { passive: true });
  imgWrap.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - mts;
    if (Math.abs(dx) > 50) navigateModal(dx < 0 ? 1 : -1);
  }, { passive: true });

})();

/* ─────────────────────────────────────────────
   11. BACK TO TOP BUTTON
───────────────────────────────────────────── */
(function initBackToTop() {
  const btn = qs('.back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ─────────────────────────────────────────────
   12. SMOOTH SCROLL for anchor links
───────────────────────────────────────────── */
(function initSmoothScroll() {
  qsa('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = qs(href);
      if (!target) return;
      e.preventDefault();
      const navH = (qs('#navbar') || {}).offsetHeight || 80;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH, behavior: 'smooth' });
    });
  });
})();

/* ─────────────────────────────────────────────
   13. REVIEWS SLIDER – flèches + dots + auto-play
───────────────────────────────────────────── */
(function initReviewsSlider() {
  const track    = qs('#reviews-track');
  const dotsWrap = qs('#reviews-dots');
  const prevBtn  = qs('.reviews-prev');
  const nextBtn  = qs('.reviews-next');
  if (!track) return;

  const cards    = qsa('.review-card', track);
  const total    = cards.length;
  if (!total) return;

  let current   = 0;
  let autoTimer = null;
  const DELAY   = 5000;

  // Calcul du nombre de cartes visibles selon la largeur
  function visibleCount() {
    const w = track.parentElement.offsetWidth;
    if (w >= 1100) return 3;
    if (w >= 700)  return 2;
    return 1;
  }

  // Largeur d'une carte + gap
  function cardW() {
    return cards[0].offsetWidth + 32; // 32 = gap 2rem
  }

  // Construire les dots
  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    const pages = Math.ceil(total / visibleCount());
    for (let i = 0; i < pages; i++) {
      const dot = document.createElement('button');
      dot.className = 'reviews-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Avis ${i + 1}`);
      dot.addEventListener('click', () => goTo(i * visibleCount()));
      dotsWrap.appendChild(dot);
    }
  }

  function updateDots() {
    if (!dotsWrap) return;
    const page = Math.round(current / visibleCount());
    qsa('.reviews-dot', dotsWrap).forEach((d, i) => {
      d.classList.toggle('active', i === page);
    });
  }

  function goTo(idx) {
    const max = Math.max(0, total - visibleCount());
    current = Math.max(0, Math.min(idx, max));
    track.style.transform = `translateX(-${current * cardW()}px)`;
    updateDots();
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current >= max;
  }

  function next() { goTo(current + visibleCount()); }
  function prev() { goTo(current - visibleCount()); }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(() => {
      const max = Math.max(0, total - visibleCount());
      goTo(current >= max ? 0 : current + 1);
    }, DELAY);
  }

  function stopAuto() {
    clearInterval(autoTimer);
    autoTimer = null;
  }

  // Événements
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); stopAuto(); startAuto(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { next(); stopAuto(); startAuto(); });

  // Swipe tactile
  let ts = 0;
  track.addEventListener('touchstart', e => { ts = e.touches[0].clientX; stopAuto(); }, { passive: true });
  track.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - ts;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
    startAuto();
  }, { passive: true });

  // Pause au survol
  track.parentElement.addEventListener('mouseenter', stopAuto);
  track.parentElement.addEventListener('mouseleave', startAuto);

  // Recalcul au resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      buildDots();
      goTo(0);
      startAuto();
    }, 200);
  });

  // Init
  buildDots();
  goTo(0);
  startAuto();
})();

/* ═══════════════════════════════════════════════════════════════
   14. FORMULAIRE D'AVIS – Firebase Firestore
   ═══════════════════════════════════════════════════════════════

   INSTRUCTIONS DE CONFIGURATION :
   ────────────────────────────────
   1. Créez un projet sur https://console.firebase.google.com
   2. Activez "Firestore Database" (mode production)
   3. Dans les règles Firestore, ajoutez :
        allow read: if true;
        allow create: if request.resource.data.texte.size() < 400
                       && request.resource.data.prenom.size() < 50;
   4. Remplacez les valeurs FIREBASE_CONFIG ci-dessous par vos vraies clés
      (disponibles dans Paramètres du projet → Vos applications → SDK)

   ═══════════════════════════════════════════════════════════════ */
(function initAvisForm() {

  /* ══ CONFIGURATION FIREBASE ══════════════════════════════════
     Remplacez ces valeurs par vos propres clés Firebase         */
  const FIREBASE_CONFIG = {
    apiKey:            "VOTRE_API_KEY",
    authDomain:        "VOTRE_PROJECT.firebaseapp.com",
    projectId:         "VOTRE_PROJECT_ID",
    storageBucket:     "VOTRE_PROJECT.appspot.com",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId:             "VOTRE_APP_ID"
  };
  /* ══════════════════════════════════════════════════════════ */

  const form      = qs('#avis-form');
  const prenomEl  = qs('#avis-prenom');
  const texteEl   = qs('#avis-texte');
  const charNbEl  = qs('#avis-char-nb');
  const submitBtn = qs('#avis-submit');
  const submitTxt = qs('.avis-submit-text');
  const submitLdr = qs('.avis-submit-loader');
  const msgEl     = qs('#avis-msg');

  if (!form) return;

  // Compteur de caractères en temps réel
  texteEl && texteEl.addEventListener('input', () => {
    if (charNbEl) charNbEl.textContent = texteEl.value.length;
  });

  // Vérification si Firebase est configuré
  const isConfigured = FIREBASE_CONFIG.apiKey !== 'VOTRE_API_KEY';

  /* ── Chargement dynamique du SDK Firebase (CDN) ── */
  function loadFirebase() {
    return new Promise((resolve, reject) => {
      if (window._firebaseDb) { resolve(window._firebaseDb); return; }

      // Charger le SDK Firebase v9 modulaire via CDN
      const scriptApp = document.createElement('script');
      scriptApp.type = 'module';
      scriptApp.textContent = `
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
        import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp }
          from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

        const config = ${JSON.stringify(FIREBASE_CONFIG)};
        const app  = initializeApp(config);
        const db   = getFirestore(app);

        // Exposer les fonctions nécessaires globalement
        window._firebaseDb       = db;
        window._fbCollection     = collection;
        window._fbAddDoc         = addDoc;
        window._fbGetDocs        = getDocs;
        window._fbQuery          = query;
        window._fbOrderBy        = orderBy;
        window._fbLimit          = limit;
        window._fbTimestamp      = serverTimestamp;
        window._firebaseLoaded   = true;

        // Charger et afficher les avis existants
        window.dispatchEvent(new CustomEvent('firebase-ready'));
      `;
      document.head.appendChild(scriptApp);

      window.addEventListener('firebase-ready', () => resolve(window._firebaseDb), { once: true });
      scriptApp.onerror = reject;
    });
  }

  /* ── Afficher un avis dans la section reviews ── */
  function createReviewCard(data) {
    const stars = '★'.repeat(data.note) + '☆'.repeat(5 - data.note);
    const ariaStars = `${data.note} étoile${data.note > 1 ? 's' : ''} sur 5`;

    const card = document.createElement('article');
    card.className = 'review-card review-card--new';
    card.setAttribute('aria-label', `Avis de ${data.prenom}`);
    card.innerHTML = `
      <div class="review-quote" aria-hidden="true">"</div>
      <div class="review-stars" aria-label="${ariaStars}">${stars}</div>
      <p class="review-text">${escapeHtml(data.texte)}</p>
      <footer class="review-author">${escapeHtml(data.prenom)}</footer>
    `;
    return card;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ── Charger les avis depuis Firestore et les injecter dans le bandeau ── */
  async function loadAvis() {
    if (!isConfigured || !window._firebaseLoaded) return;
    try {
      const db  = window._firebaseDb;
      const col = window._fbCollection(db, 'avis');
      const q   = window._fbQuery(col, window._fbOrderBy('date', 'desc'), window._fbLimit(20));
      const snap = await window._fbGetDocs(q);

      const track = qs('#reviews-track');
      if (!track || snap.empty) return;

      // Retirer les doublons hardcodés (ceux avec aria-hidden) pour repartir proprement
      qsa('[aria-hidden="true"]', track).forEach(el => el.remove());

      snap.forEach(doc => {
        const data = doc.data();
        const card = createReviewCard(data);
        track.appendChild(card);
      });

      // Dupliquer pour la boucle infinie
      const allCards = qsa('.review-card', track);
      allCards.forEach(card => {
        const clone = card.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });

    } catch (err) {
      console.warn('Impossible de charger les avis Firebase :', err);
    }
  }

  /* ── Soumission du formulaire ── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const prenom = prenomEl.value.trim();
    const texte  = texteEl.value.trim();
    const noteEl = qs('input[name="note"]:checked');
    const note   = noteEl ? parseInt(noteEl.value, 10) : 0;

    // Validation
    if (!prenom) { showMsg('Veuillez entrer votre prénom.', 'error'); prenomEl.focus(); return; }
    if (!note)   { showMsg('Veuillez choisir une note (1 à 5 étoiles).', 'error'); return; }
    if (!texte || texte.length < 10) { showMsg('Votre avis doit faire au moins 10 caractères.', 'error'); texteEl.focus(); return; }

    if (!isConfigured) {
      // Mode démo : afficher l'avis localement sans sauvegarder
      showMsg('✅ Avis publié ! (mode démo – configurez Firebase pour sauvegarder)', 'success');
      injectNewReview({ prenom, texte, note });
      form.reset();
      if (charNbEl) charNbEl.textContent = '0';
      return;
    }

    // Envoi vers Firebase
    setLoading(true);
    try {
      await loadFirebase();
      const db  = window._firebaseDb;
      await window._fbAddDoc(window._fbCollection(db, 'avis'), {
        prenom,
        texte,
        note,
        date: window._fbTimestamp()
      });

      showMsg('✅ Merci pour votre avis ! Il est maintenant visible par tous.', 'success');
      injectNewReview({ prenom, texte, note });
      form.reset();
      if (charNbEl) charNbEl.textContent = '0';

    } catch (err) {
      console.error('Erreur Firebase :', err);
      showMsg('❌ Une erreur est survenue. Réessayez dans un moment.', 'error');
    } finally {
      setLoading(false);
    }
  });

  /* ── Injecter un nouvel avis directement dans le bandeau reviews ── */
  function injectNewReview(data) {
    const track = qs('#reviews-track');
    if (!track) return;
    const card = createReviewCard(data);
    card.style.animation = 'none'; // désactiver le scroll le temps d'ajouter
    track.insertBefore(card, track.firstChild);

    // Dupliquer aussi le nouveau pour la boucle
    const clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  }

  function setLoading(state) {
    submitBtn.disabled = state;
    submitTxt.hidden   = state;
    submitLdr.hidden   = !state;
  }

  function showMsg(text, type) {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.className   = 'avis-msg avis-msg--' + type;
    msgEl.removeAttribute('hidden');
    setTimeout(() => { if (msgEl) msgEl.setAttribute('hidden', ''); }, 6000);
  }

  // Initialiser Firebase et charger les avis existants au chargement
  if (isConfigured) {
    loadFirebase().then(loadAvis).catch(err => {
      console.warn('Firebase non disponible :', err);
    });
  }

})();
