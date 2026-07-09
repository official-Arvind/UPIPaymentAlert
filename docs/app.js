/* ============================================================
   UPI Payment Alert — Product Site · JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* ---- Utility: throttle ---- */
  function throttle(fn, wait) {
    let last = 0;
    return function (...args) {
      const now = Date.now();
      if (now - last >= wait) { last = now; fn.apply(this, args); }
    };
  }

  /* ============================================================
     HEADER — scroll shadow & hamburger menu
     ============================================================ */
  const header    = document.getElementById('site-header');
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');

  // Scroll shadow on header
  const onScroll = throttle(() => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, 60);
  window.addEventListener('scroll', onScroll, { passive: true });

  // Hamburger toggle
  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open);
    mobileNav.classList.toggle('open', open);
    mobileNav.setAttribute('aria-hidden', !open);
  });

  // Close mobile nav when a link is clicked
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileNav.classList.remove('open');
      mobileNav.setAttribute('aria-hidden', 'true');
    });
  });

  // Close mobile nav on outside click
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target) && mobileNav.classList.contains('open')) {
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileNav.classList.remove('open');
      mobileNav.setAttribute('aria-hidden', 'true');
    }
  });

  /* ============================================================
     SMOOTH SCROLL — nav anchors
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const offset = header.offsetHeight + 16;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ============================================================
     SCROLL REVEAL — elements enter on scroll
     ============================================================ */
  const revealItems = [];

  function initReveal() {
    // Section headers
    document.querySelectorAll('.section-header, .hero-eyebrow, .hero-title, .hero-desc, .hero-actions, .hero-stats').forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${i * 60}ms`;
      revealItems.push(el);
    });

    // Feature cards
    document.querySelectorAll('.feature-card').forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${i * 60}ms`;
      revealItems.push(el);
    });

    // Steps
    document.querySelectorAll('.step').forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${i * 80}ms`;
      revealItems.push(el);
    });

    // Doc cards
    document.querySelectorAll('.doc-card').forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${i * 50}ms`;
      revealItems.push(el);
    });

    // FAQ items
    document.querySelectorAll('.faq-item').forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${i * 40}ms`;
      revealItems.push(el);
    });

    // Terminal card + CTA content
    document.querySelectorAll('.terminal-card, .cta-content').forEach(el => {
      el.classList.add('reveal');
      revealItems.push(el);
    });
  }

  function checkReveal() {
    const vh = window.innerHeight;
    revealItems.forEach(el => {
      if (el.classList.contains('in-view')) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < vh - 60) {
        el.classList.add('in-view');
      }
    });
  }

  // Only animate if user hasn't requested reduced motion
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    initReveal();
    window.addEventListener('scroll', throttle(checkReveal, 50), { passive: true });
    requestAnimationFrame(checkReveal);
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
  }

  /* ============================================================
     TERMINAL — UPI Payment Alert Service Log Simulator
     ============================================================ */
  const terminalBody = document.querySelector('.terminal-body');
  
  if (terminalBody) {
    let isTerminalVisible = false;

    function createLine(html, className = '') {
      const el = document.createElement('div');
      el.className = `t-line ${className}`;
      el.innerHTML = html;
      return el;
    }

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function waitTillVisible() {
      while (!isTerminalVisible) {
        await sleep(500);
      }
    }

    async function startSimulation() {
      const scenarios = [
        [
          { text: '[SYSTEM] UPI Payment Alert Service Active', class: 't-cyan' },
          { text: '[SYSTEM] Listening for SMS and Notifications...', class: 't-dim' },
          { text: '[SYSTEM] Battery optimizations bypassed.', class: 't-dim' },
          { text: '[NOTIFICATION] GPay Alert received', class: 't-yellow' },
          { text: '[PARSER] Extracted amount: INR 500.00', class: 't-cyan' },
          { text: '[AUDIO]  Overriding audio stream volume to 80%', class: 't-dim' },
          { text: '[TTS]    Speaking: "Received 500 rupees"', class: 't-green' },
          { text: '[AUDIO]  Original system volume restored', class: 't-dim' }
        ],
        [
          { text: '[SMS]    Incoming transactional SMS from IDFC-BANK', class: 't-yellow' },
          { text: '[PARSER] Extracted amount: INR 1250.00', class: 't-cyan' },
          { text: '[AUDIO]  Overriding audio stream volume to 80%', class: 't-dim' },
          { text: '[TTS]    Speaking: "Received 1250 rupees"', class: 't-green' },
          { text: '[AUDIO]  Original system volume restored', class: 't-dim' }
        ],
        [
          { text: '[NOTIFICATION] PhonePe Alert received', class: 't-yellow' },
          { text: '[PARSER] Extracted amount: INR 75.50', class: 't-cyan' },
          { text: '[AUDIO]  Overriding audio stream volume to 80%', class: 't-dim' },
          { text: '[TTS]    Speaking: "Received 75 rupees and 50 paisa"', class: 't-green' },
          { text: '[AUDIO]  Original system volume restored', class: 't-dim' }
        ]
      ];

      let index = 0;
      while (true) {
        await waitTillVisible();
        terminalBody.innerHTML = '';
        
        terminalBody.appendChild(createLine('[SYSTEM] UPI Payment Alert Service Active', 't-cyan'));
        terminalBody.appendChild(createLine('[SYSTEM] Listening for SMS and Notifications...', 't-dim'));
        await sleep(1000);

        const logs = scenarios[index];
        for (const log of logs) {
          if (log.text.includes('Service Active') || log.text.includes('Listening for SMS')) continue;
          
          await waitTillVisible();
          terminalBody.appendChild(createLine(log.text, log.class));
          terminalBody.scrollTop = terminalBody.scrollHeight;
          
          let delay = 300 + Math.random() * 400;
          if (log.text.includes('Speaking')) {
            delay = 2000;
          }
          await sleep(delay);
        }

        index = (index + 1) % scenarios.length;
        await sleep(3500);
      }
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isTerminalVisible = entry.isIntersecting;
      });
    }, { threshold: 0.1 });

    observer.observe(document.querySelector('.terminal-card'));
    startSimulation();
  }

})();
