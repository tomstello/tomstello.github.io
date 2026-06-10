/* ==========================================================================
   main.js — editorial interactions
   Theme toggle (paper/ink), scroll reveal, smooth anchors, active nav
   marking. Note: each page also carries a tiny inline <head> script that
   applies the stored theme before first paint, to avoid a flash.
   ========================================================================== */

(function () {
  'use strict';

  // ==========================================================================
  // Theme toggle — paper by day, ink by night
  // ==========================================================================

  function currentTheme() {
    const set = document.documentElement.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (e) { /* private browsing */ }
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    });
  }

  document.querySelectorAll('.theme-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
    btn.setAttribute('aria-pressed', currentTheme() === 'dark' ? 'true' : 'false');
  });

  // ==========================================================================
  // Scroll reveal — [data-animate] and [data-stagger] gain .is-visible
  // ==========================================================================

  const revealTargets = document.querySelectorAll('[data-animate], [data-stagger]');

  if ('IntersectionObserver' in window && revealTargets.length) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    revealTargets.forEach(function (el) { observer.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // ==========================================================================
  // Smooth scroll for in-page anchors
  // ==========================================================================

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  // ==========================================================================
  // Mark the active nav link (belt to the hardcoded suspenders)
  // ==========================================================================

  (function setActiveNavLink() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.masthead__link').forEach(function (link) {
      if (link.getAttribute('href') === page) {
        link.classList.add('masthead__link--active');
        link.setAttribute('aria-current', 'page');
      }
    });
  })();

  // ==========================================================================
  // Console note for the curious
  // ==========================================================================

  console.log(
    '%c❧ Hello, curious one.',
    'font-family: Georgia, serif; font-size: 14px; font-style: italic;'
  );
  console.log('Questions about the research? thcostello1@gmail.com');
})();
