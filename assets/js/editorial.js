/* Progressive enhancement. Native scrolling, keyboard access, no dependencies. */
(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* Private browsing is fine. */ } } };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let motion = !reduced.matches && store.get('mj-motion') !== 'off';
  let theme = store.get('mj-portfolio-theme') === 'light' ? 'light' : 'dark';
  const motionButton = $('[data-motion-toggle]');
  const themeButton = $('[data-theme-toggle]');
  let canvasVisible = false, frame = 0, lastPaint = 0, ticks = 0;
  let cursorActive = false, cursorX = 0, cursorY = 0, targetX = 0, targetY = 0;
  let tiltTarget = null;
  const cursor = $('.cursor-label');
  const canvas = $('#signal-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let cw = 290, ch = 230, fieldX = 0, fieldY = 0;
  function paintField(time) {
    if (!ctx) return;
    ctx.clearRect(0, 0, cw, ch);
    const radius = Math.min(cw, ch) * .39;
    ctx.strokeStyle = theme === 'dark' ? 'rgba(239,148,115,.48)' : 'rgba(165,71,43,.48)';
    ctx.lineWidth = .7;
    // A slowly turning ribbon, drawn as 24 individual contours.
    for (let i = 0; i < 24; i++) {
      const slice = i / 23, angle = slice * Math.PI * 2;
      ctx.beginPath();
      for (let j = 0; j <= 64; j++) {
        const a = j / 64 * Math.PI * 2;
        const wave = 1 + .20 * Math.sin(a * 3 + time * .25);
        const x = Math.cos(a) * (radius * .69 + Math.cos(angle) * radius * .22) * wave;
        const y = Math.sin(a) * (radius * .69 + Math.cos(angle) * radius * .22) * wave;
        const z = Math.sin(angle) * radius * .23;
        const rot = .62 + time * .13 + fieldX * .16;
        const px = x * Math.cos(rot) + z * Math.sin(rot);
        const pz = -x * Math.sin(rot) + z * Math.cos(rot);
        const py = y * .86 + pz * .4 + fieldY * 8;
        const xx = cw / 2 + px, yy = ch / 2 + py;
        if (j === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.closePath(); ctx.stroke();
    }
  }
  function sizeCanvas() {
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    cw = Math.max(1, rect.width); ch = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); paintField(ticks);
  }
  function animate(now) {
    frame = 0;
    if (!motion || document.hidden) return;
    if (canvasVisible && ctx && now - lastPaint > 33) {
      ticks += Math.min((now - (lastPaint || now)) / 1000, .05);
      lastPaint = now; paintField(ticks);
    }
    if (cursorActive && finePointer.matches) {
      cursorX += (targetX - cursorX) * .2; cursorY += (targetY - cursorY) * .2;
      cursor.style.transform = `translate3d(${cursorX - 39}px,${cursorY - 39}px,0)`;
    }
    if (canvasVisible || cursorActive) frame = requestAnimationFrame(animate);
  }
  function wake() { if (!frame && motion && !document.hidden && (canvasVisible || cursorActive)) frame = requestAnimationFrame(animate); }
  function applyMotion() {
    root.dataset.motion = motion ? 'on' : 'off';
    if (motionButton) {
      motionButton.setAttribute('aria-pressed', String(motion));
      motionButton.setAttribute('aria-label', motion ? 'Pause animations' : 'Enable animations');
      $('[data-motion-label]').textContent = motion ? 'Motion on' : 'Motion off';
    }
    if (!motion) {
      cancelAnimationFrame(frame); frame = 0; cursorActive = false;
      cursor?.classList.remove('visible');
      $$('.reveal').forEach(el => el.classList.add('visible'));
      $$('[data-tilt]').forEach(el => { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); });
      $$('[data-magnetic]').forEach(el => el.style.removeProperty('transform'));
      $$('[data-count]').forEach(el => { el.textContent = el.dataset.count; });
      paintField(ticks);
    } else { wake(); }
  }
  function applyTheme() {
    root.dataset.theme = theme;
    themeButton?.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    $('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#171816' : '#f4f2e9');
    paintField(ticks);
  }
  applyTheme(); applyMotion(); sizeCanvas();
  if (motion) root.classList.add('animate-intro');
  motionButton?.addEventListener('click', () => { motion = !motion; store.set('mj-motion', motion ? 'on' : 'off'); applyMotion(); });
  themeButton?.addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; store.set('mj-portfolio-theme', theme); applyTheme(); });
  reduced.addEventListener('change', () => { motion = !reduced.matches && store.get('mj-motion') !== 'off'; applyMotion(); });
  window.addEventListener('resize', sizeCanvas, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else { lastPaint = 0; wake(); } });
  if ('IntersectionObserver' in window) {
    if (motion) root.classList.add('motion-ready');
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
    }), { threshold: .06 });
    $$('.reveal').forEach(el => revealObserver.observe(el));
    if (canvas) new IntersectionObserver(entries => { canvasVisible = entries[0].isIntersecting; wake(); }, { threshold: 0 }).observe(canvas);
    const counterObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target, value = Number(el.dataset.count), started = performance.now();
      counterObserver.unobserve(el);
      if (!motion) { el.textContent = String(value); return; }
      function count(now) {
        const p = Math.min(1, (now - started) / 900);
        el.textContent = String(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1 && motion && !document.hidden) requestAnimationFrame(count); else el.textContent = String(value);
      }
      requestAnimationFrame(count);
    }), { threshold: .6 });
    $$('[data-count]').forEach(el => counterObserver.observe(el));
  } else { $$('.reveal').forEach(el => el.classList.add('visible')); paintField(0); }
  // Do not replace native scrolling or focus behavior.
  const mobileMenu = $('.mobile-menu');
  $$('a', mobileMenu).forEach(link => link.addEventListener('click', () => { mobileMenu.open = false; }));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && mobileMenu?.open) { mobileMenu.open = false; $('summary', mobileMenu).focus(); } });
  document.addEventListener('click', event => { if (mobileMenu?.open && !mobileMenu.contains(event.target)) mobileMenu.open = false; });
  const filters = $$('[data-filter]'), projects = $$('.project'), grid = $('.projects');
  filters.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    filters.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    let count = 0;
    grid.classList.toggle('is-filtered', category !== 'all');
    projects.forEach(project => {
      const show = category === 'all' || project.dataset.categories.split(' ').includes(category);
      project.hidden = !show;
      if (show) {
        count++; project.classList.add('visible');
        if (motion && project.animate) project.animate([{ opacity: .25, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 350, delay: count * 35, easing: 'ease-out' });
      }
    });
    $('.project-count').textContent = `${count} project${count === 1 ? '' : 's'}`;
  }));
  const navLinks = $$('.nav a');
  const sections = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
  let scrollQueued = false;
  function updateScroll() {
    scrollQueued = false;
    const y = window.scrollY, length = document.documentElement.scrollHeight - window.innerHeight;
    $('.reading-progress').style.width = `${length > 0 ? Math.min(100, y / length * 100) : 0}%`;
    let active = '';
    sections.forEach(section => { if (section.getBoundingClientRect().top <= window.innerHeight * .4) active = '#' + section.id; });
    navLinks.forEach(link => { if (link.getAttribute('href') === active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
  }
  window.addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); } }, { passive: true });
  updateScroll();
  $$('[data-cursor]').forEach(el => {
    el.addEventListener('pointerenter', event => {
      if (!motion || !finePointer.matches) return;
      cursorActive = true; cursor.textContent = el.dataset.cursor;
      cursorX = targetX = event.clientX; cursorY = targetY = event.clientY;
      cursor.style.transform = `translate3d(${cursorX - 39}px,${cursorY - 39}px,0)`;
      cursor.classList.add('visible'); wake();
    });
    el.addEventListener('pointermove', event => {
      if (!motion || !finePointer.matches) return;
      targetX = event.clientX; targetY = event.clientY;
      if (el.hasAttribute('data-tilt')) {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--rx', `${-(event.clientY - r.top - r.height / 2) / r.height * 4}deg`);
        el.style.setProperty('--ry', `${(event.clientX - r.left - r.width / 2) / r.width * 4}deg`);
        tiltTarget = el;
      }
    });
    el.addEventListener('pointerleave', () => { cursorActive = false; cursor.classList.remove('visible'); el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); tiltTarget = null; });
  });
  $('.hero')?.addEventListener('pointermove', event => {
    if (!motion || !finePointer.matches) return;
    const r = $('.hero').getBoundingClientRect();
    fieldX = (event.clientX - r.left) / r.width - .5; fieldY = (event.clientY - r.top) / r.height - .5;
  });
  const magnet = $('[data-magnetic]'), contactLink = $('.contact-main');
  contactLink?.addEventListener('pointermove', event => {
    if (!motion || !finePointer.matches) return;
    const r = contactLink.getBoundingClientRect();
    magnet.style.transform = `translate(${((event.clientX - r.left) / r.width - .5) * 24}px,${((event.clientY - r.top) / r.height - .5) * 20}px)`;
  });
  contactLink?.addEventListener('pointerleave', () => magnet.style.removeProperty('transform'));
  $('[data-copy-email]')?.addEventListener('click', async () => {
    const feedback = $('.copy-feedback');
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText('jowkari.1mh@gmail.com'); feedback.textContent = 'Email copied.';
    } catch { feedback.textContent = 'Select the email to copy it.'; }
  });
  if ($('[data-year]')) $('[data-year]').textContent = String(new Date().getFullYear());
})();
