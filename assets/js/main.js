/**
 * IRONFLOW CLUB - Homepage Script
 */

(function() {
  'use strict';

  // Wait for dependencies
  if (!window.IronflowUtils) {
    console.error('Dependencies not loaded');
    return;
  }

  const Utils = window.IronflowUtils;

  // DOM Elements
  const loader = document.getElementById('page-loader');
  const siteContent = document.getElementById('site-content');
  const header = document.getElementById('site-header');

  // Translation elements
  const kickerEl = document.getElementById('kickerText');
  const heroTitleEl = document.getElementById('heroTitle');
  const heroSubEl = document.getElementById('heroSub');
  const leaderboardBtn = document.getElementById('leaderboardBtn');
  const progressBtn = document.getElementById('progressBtn');
  const chatBtn = document.getElementById('chatBtn');
  const badmintonBtn = document.getElementById('badmintonBtn');
  const quoteTextEl = document.getElementById('quoteText');
  const rightsSpan = document.getElementById('rightsText');

  /**
   * Update all text content with translations
   */
  function updateTranslations() {
    const T = window.IronflowTranslation;
    if (!T) return;
    const t = T.getAll();
    const langToggleBtn = document.getElementById('langToggleBtn');

    if (kickerEl) kickerEl.textContent = t.kicker;
    if (heroTitleEl) heroTitleEl.innerHTML = t.heroTitleHtml;
    if (heroSubEl) heroSubEl.textContent = t.heroSub;
    if (leaderboardBtn) leaderboardBtn.textContent = t.leaderboardBtn;
    if (progressBtn) progressBtn.textContent = t.progressBtn;
    if (badmintonBtn) badmintonBtn.textContent = t.badmintonBtn;
    if (chatBtn) chatBtn.textContent = t.chatBtn;
    if (quoteTextEl) quoteTextEl.innerHTML = t.quote;
    if (rightsSpan) rightsSpan.textContent = t.rights;
    if (langToggleBtn) langToggleBtn.textContent = t.langToggle;

    // Re-trigger accent line animation
    const accentLine = document.querySelector('.accent-line');
    if (accentLine) {
      accentLine.classList.remove('draw');
      setTimeout(() => accentLine.classList.add('draw'), 10);
    }
  }



  /**
   * Launch site after loader
   */
  function launchSite() {
    if (!loader || !siteContent) return;

    loader.classList.add('exit');
    siteContent.classList.add('visible');

    setTimeout(() => {
      if (header) header.classList.add('go');
    }, 80);

    setTimeout(() => {
      document.querySelectorAll('.s-enter').forEach(el => {
        el.classList.add('go');
      });
    }, 220);

    setTimeout(() => {
      const accentLine = document.querySelector('.accent-line');
      if (accentLine) accentLine.classList.add('draw');
    }, 700);

    setTimeout(() => {
      if (loader) loader.remove();
    }, 1000);
  }

  /**
   * Initialize scroll reveal
   */
  function initScrollReveal() {
    if (Utils.prefersReducedMotion()) {
      document.querySelectorAll('.reveal').forEach(el => {
        el.classList.add('visible');
      });
      return;
    }

    const revealElements = document.querySelectorAll('.reveal');
    if (!revealElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -60px 0px'
      }
    );

    revealElements.forEach(el => observer.observe(el));
  }

  /**
   * Initialize button ripples
   */
  function initButtonRipples() {
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        Utils.addRipple(btn, e);
      });
    });
  }

  /**
   * Initialize app
   */
  function init() {
    // Set current year
    const yearEl = document.getElementById('yr');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Check reduced motion
    if (Utils.prefersReducedMotion()) {
      if (loader) loader.remove();
      if (siteContent) siteContent.style.opacity = '1';
      if (header) {
        header.style.transform = 'none';
        header.style.opacity = '1';
      }
    } else {
      setTimeout(launchSite, 1900);
    }

    // Initialize features
    initScrollReveal();
    initButtonRipples();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Service Worker Registration ────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        // Check for updates every time the page loads
        reg.update();
      })
      .catch(err => console.warn('SW registration failed:', err));
  });
}

})();