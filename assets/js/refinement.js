/* Small, optional interactions. Reading and navigation never depend on JS. */
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js-enhanced');
  const $ = (s, parent = document) => parent?.querySelector(s);
  const $$ = (s, parent = document) => Array.from(parent?.querySelectorAll(s) || []);
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* Storage is optional. */ } }
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let motion = !reduced.matches && storage.get('mj-motion') !== 'off';
  let theme = storage.get('mj-portfolio-theme') === 'light' ? 'light' : 'dark';
  const motionButton = $('[data-motion-toggle]');
  const themeButton = $('[data-theme-toggle]');
  const reveals = $$('.reveal');
  let revealObserver;
  function applyMotion() {
    root.dataset.motion = motion ? 'on' : 'off';
    motionButton?.setAttribute('aria-pressed', String(motion));
    motionButton?.setAttribute('aria-label', motion ? 'Pause animations' : 'Enable animations');
    const label = $('[data-motion-label]');
    if (label) label.textContent = motion ? 'Motion on' : 'Motion off';
    if (!motion) {
      root.classList.remove('animate-intro');
      reveals.forEach(el => el.classList.add('visible'));
      document.getAnimations().forEach(animation => {
        try { animation.finish(); } catch { animation.cancel(); }
      });
    }
  }
  function applyTheme() {
    root.dataset.theme = theme;
    themeButton?.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    $('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#171816' : '#f4f2e9');
  }
  applyMotion();
  applyTheme();
  if (motion) root.classList.add('animate-intro');
  motionButton?.addEventListener('click', () => {
    motion = !motion && !reduced.matches;
    storage.set('mj-motion', motion ? 'on' : 'off');
    applyMotion();
  });
  themeButton?.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    storage.set('mj-portfolio-theme', theme);
    applyTheme();
  });
  reduced.addEventListener('change', () => {
    motion = !reduced.matches && storage.get('mj-motion') !== 'off';
    applyMotion();
  });
  if ('IntersectionObserver' in window && motion) {
    root.classList.add('motion-ready');
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.04 });
    reveals.forEach(el => revealObserver.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('visible'));
  }
  const menu = $('.mobile-menu');
  $$('a', menu).forEach(link => link.addEventListener('click', () => { menu.open = false; }));
  menu?.addEventListener('toggle', () => {
    $('summary', menu)?.setAttribute('aria-label', menu.open ? 'Close navigation' : 'Open navigation');
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.open) {
      menu.open = false;
      $('summary', menu)?.focus();
    }
  });
  document.addEventListener('click', event => {
    if (menu?.open && !menu.contains(event.target)) menu.open = false;
  });
  const filters = $$('[data-filter]');
  const projects = $$('.project');
  const grid = $('.projects');
  filters.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    filters.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    grid?.classList.toggle('is-filtered', category !== 'all');
    let count = 0;
    projects.forEach(project => {
      const show = category === 'all' || project.dataset.categories.split(' ').includes(category);
      project.hidden = !show;
      if (show) { count++; project.classList.add('visible'); }
    });
    const countLabel = $('.project-count');
    if (countLabel) countLabel.textContent = `${count} project${count === 1 ? '' : 's'}`;
  }));
  // Following a research link always exposes its destination, even after filtering.
  $$('a[href="#promptshield"]').forEach(link => link.addEventListener('click', () => {
    $('[data-filter="all"]')?.click();
  }));
  $$('a[href="#promptshield-notes"]').forEach(link => link.addEventListener('click', () => {
    const notes = $('#promptshield-notes');
    if (notes) notes.open = true;
  }));
  const navLinks = $$('.nav a');
  const sections = navLinks.map(link => $(link.getAttribute('href'))).filter(Boolean);
  const progress = $('.reading-progress');
  let queued = false;
  function updateScroll() {
    queued = false;
    const range = root.scrollHeight - innerHeight;
    if (progress) progress.style.width = `${range > 0 ? Math.min(100, scrollY / range * 100) : 0}%`;
    let active = '';
    sections.forEach(section => {
      if (section.getBoundingClientRect().top <= innerHeight * 0.35) active = '#' + section.id;
    });
    navLinks.forEach(link => {
      if (link.getAttribute('href') === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function queueScroll() {
    if (!queued) { queued = true; requestAnimationFrame(updateScroll); }
  }
  addEventListener('scroll', queueScroll, { passive: true });
  addEventListener('resize', queueScroll, { passive: true });
  updateScroll();
  $('[data-copy-email]')?.addEventListener('click', async () => {
    const feedback = $('.copy-feedback');
    if (!feedback) return;
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText('jowkari.1mh@gmail.com');
      feedback.textContent = 'Email copied.';
    } catch {
      feedback.textContent = 'Select the email address to copy it.';
    }
  });
  const year = $('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
