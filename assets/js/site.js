// ЯСНА — shared site behaviour
document.addEventListener('DOMContentLoaded', function () {
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav
  var navToggle = document.getElementById('navToggle');
  var mobileNav = document.getElementById('mobileNav');
  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', function () { mobileNav.classList.toggle('hidden-nav'); });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { mobileNav.classList.add('hidden-nav'); });
    });
  }

  // Sticky header shadow
  var header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 8) header.classList.add('shadow-md'); else header.classList.remove('shadow-md');
    });
  }

  // Reveal on scroll
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.05 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  // Cookie consent banner (152-ФЗ / cookie notice)
  (function () {
    try {
      var key = 'yasna_cookie_consent_v1';
      var banner = document.getElementById('cookieBanner');
      if (banner && !localStorage.getItem(key)) { banner.classList.remove('hidden'); }
      var accept = document.getElementById('cookieAccept');
      if (accept) accept.addEventListener('click', function () {
        try { localStorage.setItem(key, 'accepted'); } catch (e) {}
        if (banner) banner.classList.add('hidden');
      });
      var decline = document.getElementById('cookieDecline');
      if (decline) decline.addEventListener('click', function () {
        try { localStorage.setItem(key, 'essential-only'); } catch (e) {}
        if (banner) banner.classList.add('hidden');
      });
    } catch (e) {}
  })();

  // Accessibility toolbar (ГОСТ Р 52872-2019)
  (function () {
    var toggle = document.getElementById('a11y-toggle');
    var panel = document.getElementById('a11y-panel');
    if (!toggle || !panel) return;
    var html = document.documentElement;
    var STORE = 'yasna_a11y_v1';

    function applyState(state) {
      html.classList.toggle('a11y-contrast', !!state.contrast);
      html.classList.toggle('a11y-underline', !!state.underline);
      html.setAttribute('data-a11y-font', state.font || '0');
      panel.querySelectorAll('[data-a11y-font-btn]').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-a11y-font-btn') === String(state.font || '0'));
      });
      var cb = panel.querySelector('#a11y-contrast-cb');
      if (cb) cb.checked = !!state.contrast;
      var ub = panel.querySelector('#a11y-underline-cb');
      if (ub) ub.checked = !!state.underline;
    }
    function load() {
      try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; }
    }
    function save(state) { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {} }

    var state = load();
    applyState(state);

    toggle.addEventListener('click', function () { panel.classList.toggle('open'); });

    panel.querySelectorAll('[data-a11y-font-btn]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.font = b.getAttribute('data-a11y-font-btn');
        save(state); applyState(state);
      });
    });
    var cb = panel.querySelector('#a11y-contrast-cb');
    if (cb) cb.addEventListener('change', function () { state.contrast = cb.checked; save(state); applyState(state); });
    var ub = panel.querySelector('#a11y-underline-cb');
    if (ub) ub.addEventListener('change', function () { state.underline = ub.checked; save(state); applyState(state); });

    var speakBtn = panel.querySelector('#a11y-speak');
    if (speakBtn && 'speechSynthesis' in window) {
      speakBtn.addEventListener('click', function () {
        var main = document.querySelector('main') || document.body;
        var txt = main.innerText.slice(0, 4000);
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(txt);
        u.lang = 'ru-RU';
        window.speechSynthesis.speak(u);
      });
    } else if (speakBtn) {
      speakBtn.style.display = 'none';
    }

    var resetBtn = panel.querySelector('#a11y-reset');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      state = {}; save(state); applyState(state);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    });
  })();

  // Before/after slider (if present on a page)
  document.querySelectorAll('.ba').forEach(function (container) {
    var clip = container.querySelector('.ba-clip');
    var handle = container.querySelector('.ba-handle');
    if (!clip) return;
    var dragging = false;
    var setPos = function (clientX) {
      var rect = container.getBoundingClientRect();
      var x = ((clientX - rect.left) / rect.width) * 100;
      x = Math.max(2, Math.min(98, x));
      clip.style.width = x + '%';
      if (handle) handle.style.left = x + '%';
    };
    var start = function (e) { dragging = true; setPos((e.touches ? e.touches[0].clientX : e.clientX)); };
    var move = function (e) { if (!dragging) return; setPos((e.touches ? e.touches[0].clientX : e.clientX)); };
    var end = function () { dragging = false; };
    container.addEventListener('mousedown', start);
    container.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end);
  });
});
