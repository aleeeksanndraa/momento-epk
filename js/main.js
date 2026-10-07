/* MOMENTO — Partnership EPK motion */
(() => {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) window.scrollTo(0, 0);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const format = (n, f) => f === 'comma' ? n.toLocaleString('en-GB') : String(n);

  /* ---------- sound: nav pill / click hero; collage plays the hovered clip ---------- */
  const heroVideo = $('.hero__video');
  const soundBtn = $('.sound');
  let soundOn = false, activeTile = null;
  function applySound() {
    $$('video').forEach(v => v.muted = true);
    const target = activeTile ? $('video', activeTile) : heroVideo;
    if (soundOn) { target.muted = false; target.play().catch(() => {}); }
  }
  function setSound(on) {
    soundOn = on;
    soundBtn.setAttribute('aria-pressed', on);
    $('.sound__label', soundBtn).textContent = on ? 'Sound on' : 'Sound off';
    applySound();
  }
  soundBtn.addEventListener('click', e => { e.stopPropagation(); setSound(!soundOn); });
  $('.hero').addEventListener('click', e => { if (!e.target.closest('a, button')) setSound(!soundOn); });
  $$('.tile').forEach(t => {
    t.addEventListener('mouseenter', () => { activeTile = t; applySound(); });
    t.addEventListener('mouseleave', () => { activeTile = null; applySound(); });
    t.addEventListener('click', () => { activeTile = t; setSound(true); });
  });

  /* ---------- videos only play while on screen (keeps the page light) ---------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      const vids = en.target.tagName === 'VIDEO' ? [en.target] : $$('video', en.target);
      vids.forEach(v => {
        if (v.hasAttribute('data-hoverplay') && !touch) return; // service cards play on hover (desktop)
        en.isIntersecting ? v.play().catch(() => {}) : v.pause();
      });
    }), { threshold: 0.05 });
    $$('.pill video, .partner__bg, .hero__video').forEach(v => io.observe(v));
    io.observe($('.collage'));
    $$('[data-hoverplay]').forEach(v => io.observe(v));
  }
  if (!touch) $$('.scard').forEach(c => {
    const v = $('video', c); if (!v) return;
    c.addEventListener('mouseenter', () => v.play().catch(() => {}));
    c.addEventListener('mouseleave', () => v.pause());
  });

  /* ---------- rail: drag to scroll + arrows ---------- */
  const rail = $('[data-rail]');
  if (rail) {
    const step = () => ($('.scard', rail).offsetWidth + 16);
    $('[data-rail-prev]').addEventListener('click', () => rail.scrollBy({ left: -step() }));
    $('[data-rail-next]').addEventListener('click', () => rail.scrollBy({ left: step() }));
    if (!touch) {
      let down = false, sx = 0, sl = 0, moved = false;
      rail.addEventListener('pointerdown', e => { down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; rail.classList.add('is-dragging'); });
      window.addEventListener('pointermove', e => { if (!down) return; const d = e.clientX - sx; if (Math.abs(d) > 4) moved = true; rail.scrollLeft = sl - d; });
      window.addEventListener('pointerup', () => { if (!down) return; down = false; rail.classList.remove('is-dragging'); });
      rail.addEventListener('click', e => { if (moved) e.preventDefault(); }, true);
    }
  }

  /* ---------- venues: keyboard focus shows the poster too ---------- */
  $$('.venue').forEach(v => { v.setAttribute('tabindex', '0'); v.setAttribute('role', 'button'); });

  /* ---------- touch: venue thumbnails inline ---------- */
  if (touch) {
    $$('.venue').forEach(v => {
      const t = document.createElement('span');
      t.className = 'venue__thumb';
      t.innerHTML = `<img src="${v.dataset.img}" alt="" loading="lazy">`;
      v.appendChild(t);
      v.addEventListener('click', () => {
        const open = !v.classList.contains('is-open');
        $$('.venue').forEach(o => o.classList.remove('is-open'));
        v.classList.toggle('is-open', open);
      });
    });
  }

  let loaderDone = false;
  function finishLoader() {
    if (loaderDone) return;
    loaderDone = true;
    document.body.classList.remove('is-loading');
    const l = $('.loader'); if (l) l.remove();
  }
  // safety net that doesn't depend on animation frames (background tabs, slow devices)
  setTimeout(() => {
    const l = $('.loader');
    if (!l || loaderDone) return;
    l.style.transition = 'opacity .4s'; l.style.opacity = '0';
    setTimeout(finishLoader, 450);
  }, 4500);

  if (!hasGsap || reduce) { finishLoader(); return; }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  if (window.Lenis && !touch) {
    const lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const target = $(a.getAttribute('href'));
      if (target) { e.preventDefault(); lenis.scrollTo(target, { duration: 1.6 }); }
    }));
  }

  /* ---------- loader → intro ---------- */
  const countEl = $('[data-loader-count]');
  const counter = { v: 0 };
  gsap.to(counter, {
    v: 100, duration: 1.6, ease: 'power3.inOut',
    onUpdate: () => countEl.textContent = String(Math.round(counter.v)).padStart(3, '0'),
    onComplete: intro
  });

  function intro() {
    const tl = gsap.timeline({ onComplete: finishLoader });
    if ($('.loader')) tl.to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' });
    tl
      .from('.hero__video', { scale: 1.35, duration: 2.2, ease: 'expo.out' }, '-=0.6')
      .from('.hero__title .ln', { yPercent: 110, opacity: 0, stagger: 0.1, duration: 1.3, ease: 'expo.out' }, '-=1.8')
      .from('.hero__kicker, .hero__sub', { x: -24, opacity: 0, stagger: .1, duration: 1, ease: 'expo.out' }, '-=1.1')
      .from('.chip', { y: 60, opacity: 0, rotate: i => (i ? 6 : -6), stagger: 0.08, duration: 1.2, ease: 'expo.out' }, '-=1')
      .from('.hero__go, .hero__tags span', { scale: .6, opacity: 0, stagger: .05, duration: .8, ease: 'back.out(2)' }, '-=0.9')
      .from('.nav > *', { y: -12, opacity: 0, stagger: 0.06, duration: 0.8, ease: 'power3.out' }, '-=0.8');
    document.body.classList.remove('is-loading');
  }

  /* ---------- hero scroll ---------- */
  const heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('.hero__video', { yPercent: 16, scale: 1.08, ease: 'none', scrollTrigger: heroST });
  gsap.to('.hero__title', { yPercent: -40, ease: 'none', scrollTrigger: heroST });
  gsap.to('.hero__chips, .hero__kicker, .hero__tags', { opacity: 0, y: -40, ease: 'none', scrollTrigger: { ...heroST, end: '55% top' } });

  /* ---------- big headlines: words go from grey to ink while scrolling ---------- */
  $$('.reveal').forEach(el => {
    gsap.from(el, { y: 50, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  $$('.pill').forEach(p => gsap.from(p, { width: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 85%' } }));

  /* ---------- generic reveals ---------- */
  $$('.small-text, .section-head, .link-stack, .rail-nav, .cloud div, .partner__grid > div, .footer__socials a').forEach(el =>
    gsap.from(el, { y: 26, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 94%' } }));
  gsap.from('.pcard', { y: 80, opacity: 0, rotate: i => (i - 1) * 3, stagger: .1, duration: 1.3, ease: 'expo.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.cards3', start: 'top 88%' } });
  gsap.from('.scard', { x: 120, opacity: 0, stagger: .08, duration: 1.3, ease: 'expo.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.rail', start: 'top 85%' } });
  gsap.from('.ccard', { y: 100, opacity: 0, stagger: .1, duration: 1.3, ease: 'expo.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.collabs__grid', start: 'top 88%' } });
  $$('.city').forEach((c, i) => gsap.from(c, { y: 100, rotate: i ? 2 : -2, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 90%' } }));
  $$('.city h3').forEach((h, i) => gsap.from(h, { xPercent: i ? 8 : -8, ease: 'none', scrollTrigger: { trigger: h, start: 'top bottom', end: 'bottom top', scrub: true } }));

  /* ---------- counters ---------- */
  $$('.numbers [data-count]').forEach(el => {
    const end = +el.dataset.count, o = { v: 0 };
    gsap.to(o, { v: end, duration: end > 100 ? 2.4 : 1.6, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' },
      onUpdate: () => el.textContent = format(Math.round(o.v), el.dataset.format) });
  });

  /* ---------- collage: tiles fly in, drift with scroll + mouse at depth ---------- */
  const tiles = $$('.tile');
  gsap.from(tiles, { y: () => gsap.utils.random(120, 260), rotate: () => gsap.utils.random(-8, 8), opacity: 0, stagger: .08, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.collage', start: 'top 70%' } });
  gsap.from('.collage__center', { scale: .5, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.collage', start: 'top 50%' } });
  tiles.forEach((t, k) => gsap.to(t, { yPercent: (k % 2 ? -1 : 1) * (14 + k * 5), ease: 'none', scrollTrigger: { trigger: '.collage', start: 'top bottom', end: 'bottom top', scrub: true } }));
  if (!touch) {
    const movers = tiles.map((t, k) => ({ x: gsap.quickTo(t, 'x', { duration: 1, ease: 'power3' }), y: gsap.quickTo(t, 'y', { duration: 1, ease: 'power3' }), d: 20 + k * 14 }));
    $('.collage').addEventListener('mousemove', e => {
      const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
      movers.forEach(m => { m.x(-x * m.d); m.y(-y * m.d); });
    });
  }

  /* ---------- venues: rows rise + floating poster ---------- */
  gsap.from('.venue__name', { yPercent: 100, opacity: 0, stagger: .07, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.venues__list', start: 'top 82%' } });
  if (!touch) {
    const float = $('.venue-float'), fImg = $('img', float);
    const xTo = gsap.quickTo(float, 'x', { duration: .6, ease: 'power3' });
    const yTo = gsap.quickTo(float, 'y', { duration: .6, ease: 'power3' });
    const rTo = gsap.quickTo(float, 'rotation', { duration: .8, ease: 'power3' });
    let lastX = 0;
    window.addEventListener('mousemove', e => {
      xTo(e.clientX - float.offsetWidth / 2); yTo(e.clientY - float.offsetHeight / 2);
      rTo(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * .6)); lastX = e.clientX;
    });
    $$('.venue').forEach(v => {
      v.addEventListener('mouseenter', () => { fImg.src = v.dataset.img; gsap.to(float, { opacity: 1, scale: 1, duration: .5, ease: 'expo.out' }); });
      v.addEventListener('mouseleave', () => gsap.to(float, { opacity: 0, scale: .6, duration: .4, ease: 'power3.in' }));
      v.addEventListener('focus', () => { const b = v.getBoundingClientRect(); fImg.src = v.dataset.img; xTo(b.right - float.offsetWidth - 40); yTo(b.top - float.offsetHeight / 2); gsap.to(float, { opacity: 1, scale: 1, duration: .5, ease: 'expo.out' }); });
      v.addEventListener('blur', () => gsap.to(float, { opacity: 0, scale: .6, duration: .4 }));
    });
  }

  /* ---------- founders ---------- */
  $$('.founder').forEach((f, i) => {
    gsap.from($('.founder__img', f), { clipPath: 'inset(100% 0 0 0 round 24px)', duration: 1.5, ease: 'expo.inOut', delay: i * .12, scrollTrigger: { trigger: f, start: 'top 85%' } });
    gsap.to($('.founder__img img', f), { yPercent: -10, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---------- footer wordmark ---------- */
  gsap.from('.footer__wordmark', { yPercent: 50, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.footer__wordmark', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  /* ---------- custom cursor ---------- */
  if (!touch) {
    const cur = $('.cursor'), lab = $('.cursor__label', cur);
    const cx = gsap.quickTo(cur, 'x', { duration: .25, ease: 'power3' });
    const cy = gsap.quickTo(cur, 'y', { duration: .25, ease: 'power3' });
    window.addEventListener('mousemove', e => { cx(e.clientX); cy(e.clientY); });
    $$('[data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', () => { lab.textContent = el.dataset.cursor; cur.classList.add('is-label'); });
      el.addEventListener('mouseleave', () => cur.classList.remove('is-label'));
    });
    $$('.rail').forEach(el => {
      el.addEventListener('mouseenter', () => { lab.textContent = 'Drag'; cur.classList.add('is-label'); });
      el.addEventListener('mouseleave', () => cur.classList.remove('is-label'));
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
