/* Mohammad Jowkari · portfolio interactions (no third-party runtime) */
(function () {
  'use strict';

  var root = document.documentElement;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Theme preference: dark is the editorial default; remember user choice. */
  var themeButton = document.querySelector('[data-theme-toggle]');
  var themeGlyph = document.querySelector('[data-theme-glyph]');
  var savedTheme = null;
  try { savedTheme = localStorage.getItem('mj-portfolio-theme'); } catch (_) {}
  var theme = savedTheme === 'light' ? 'light' : 'dark';
  function applyTheme(next) {
    theme = next;
    root.setAttribute('data-theme', next);
    if (themeButton) {
      var name = next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
      themeButton.setAttribute('aria-label', name);
      themeButton.setAttribute('title', name);
    }
    if (themeGlyph) themeGlyph.textContent = next === 'dark' ? '☀' : '☾';
    try { localStorage.setItem('mj-portfolio-theme', next); } catch (_) {}
  }
  applyTheme(theme);
  if (themeButton) themeButton.addEventListener('click', function () {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  });

  /* Mobile navigation is keyboard-friendly and closes on route selection. */
  var menuButton = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-mobile-menu]');
  var menuGlyph = document.querySelector('[data-menu-glyph]');
  function setMenu(open) {
    if (!menu || !menuButton) return;
    menu.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    menu.setAttribute('aria-hidden', String(!open));
    if (menuGlyph) menuGlyph.textContent = open ? '×' : '☰';
  }
  if (menuButton) menuButton.addEventListener('click', function () {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });
  if (menu) Array.prototype.forEach.call(menu.querySelectorAll('a'), function (link) {
    link.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') setMenu(false);
  });

  /* Project filter operates on actual projects, never on placeholder cards. */
  var filterButtons = document.querySelectorAll('[data-project-filter]');
  var projectCards = document.querySelectorAll('[data-categories]');
  var count = document.querySelector('[data-visible-count]');
  function filterProjects(category) {
    var shown = 0;
    Array.prototype.forEach.call(projectCards, function (card) {
      var categories = (card.getAttribute('data-categories') || '').split(/\s+/);
      var show = category === 'all' || categories.indexOf(category) !== -1;
      card.hidden = !show;
      if (show) shown += 1;
    });
    Array.prototype.forEach.call(filterButtons, function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-project-filter') === category));
    });
    if (count) count.textContent = String(shown).padStart(2, '0') + ' PROJECTS';
  }
  Array.prototype.forEach.call(filterButtons, function (button) {
    button.addEventListener('click', function () {
      filterProjects(button.getAttribute('data-project-filter'));
    });
  });
  filterProjects('all');

  /* Reveal enters only after IntersectionObserver is ready, so content never
     disappears for users without JavaScript or with reduced motion. */
  if (!reducedMotion && 'IntersectionObserver' in window) {
    root.classList.add('js-motion');
    var elements = document.querySelectorAll('.reveal');
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -35px 0px' });
    Array.prototype.forEach.call(elements, function (el) { revealObserver.observe(el); });
  }

  /* Progress at the top of the page and section-aware desktop links. */
  var progress = document.querySelector('[data-scroll-progress]');
  var navLinks = document.querySelectorAll('[data-nav-link]');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      if (progress) {
        var height = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        var percent = Math.min(100, Math.max(0, (window.scrollY / height) * 100));
        progress.style.width = percent.toFixed(2) + '%';
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  if ('IntersectionObserver' in window) {
    var navSections = document.querySelectorAll('[data-observe-section]');
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var anchor = '#' + entry.target.id;
        Array.prototype.forEach.call(navLinks, function (link) {
          var active = link.getAttribute('href') === anchor;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-30% 0px -58% 0px', threshold: 0 });
    Array.prototype.forEach.call(navSections, function (section) {
      sectionObserver.observe(section);
    });
  }

  /* Local spotlight responds to cursor position; decorative only. */
  var visual = document.querySelector('[data-hero-visual]');
  if (visual && !reducedMotion && window.matchMedia('(pointer: fine)').matches) {
    visual.addEventListener('pointermove', function (event) {
      var rect = visual.getBoundingClientRect();
      visual.style.setProperty('--mx', ((event.clientX - rect.left) / rect.width * 100).toFixed(1) + '%');
      visual.style.setProperty('--my', ((event.clientY - rect.top) / rect.height * 100).toFixed(1) + '%');
    });
    visual.addEventListener('pointerleave', function () {
      visual.style.removeProperty('--mx');
      visual.style.removeProperty('--my');
    });
  }

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
