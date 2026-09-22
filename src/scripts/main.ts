import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s) as T;
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(s));

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const isDesktop = () => innerWidth > 900;

/* ─────────────────────────── Smooth scroll ─────────────────────────── */
const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();

$$<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href')!;
    if (id.length < 2 && id !== '#') return;
    e.preventDefault();
    lenis.scrollTo(id === '#top' || id === '#' ? 0 : id, { duration: 1.6, easing: (x) => 1 - Math.pow(1 - x, 4) });
  })
);

/* ─────────────────────────── Elements ─────────────────────────── */
const loader = $('#loader');
const heroVideo = $<HTMLVideoElement>('.hero__video');
const nav = $('.nav');

/* ─────────────────────────── Cursor ─────────────────────────── */
function initCursor() {
  if (!finePointer) return;
  const cursor = $('.cursor');
  const label = $('.cursor__label');
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
  addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); });

  $$('[data-cursor]').forEach((el) => {
    el.addEventListener('pointerenter', () => { label.textContent = el.dataset.cursor || ''; cursor.classList.add('is-label'); });
    el.addEventListener('pointerleave', () => cursor.classList.remove('is-label'));
  });
  $$('a, button').forEach((el) => {
    if (el.closest('[data-cursor]')) return;
    el.addEventListener('pointerenter', () => cursor.classList.add(el.hasAttribute('data-cursor-hide') ? 'is-hidden' : 'is-hover'));
    el.addEventListener('pointerleave', () => cursor.classList.remove('is-hover', 'is-hidden'));
  });
}

/* ─────────────────────────── Magnetic ─────────────────────────── */
function initMagnetic() {
  if (!finePointer) return;
  $$('[data-magnetic]').forEach((el) => {
    const strength = el.classList.contains('orb') ? 0.45 : 0.3;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ─────────────────────────── Tilt nos cards ─────────────────────────── */
function initTilt() {
  if (!finePointer) return;
  $$('[data-tilt]').forEach((card) => {
    const rx = gsap.quickTo(card, 'rotateX', { duration: 0.6, ease: 'power3' });
    const ry = gsap.quickTo(card, 'rotateY', { duration: 0.6, ease: 'power3' });
    gsap.set(card, { transformPerspective: 900 });
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 12);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 12);
    });
    card.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}

/* ─────────────────────────── Som + filme ─────────────────────────── */
function initMedia() {
  const soundBtn = $('.sound');
  soundBtn.addEventListener('click', () => {
    const on = heroVideo.muted;
    heroVideo.muted = !on;
    if (on) { heroVideo.volume = 0; gsap.to(heroVideo, { volume: 1, duration: 1.2 }); heroVideo.play(); }
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.setAttribute('aria-label', on ? 'Desativar som do vídeo' : 'Ativar som do vídeo');
  });

  const film = $('.film');
  const filmVideo = $<HTMLVideoElement>('.film__video');
  let wasMuted = true;

  const open = () => {
    wasMuted = heroVideo.muted;
    heroVideo.muted = true;
    soundBtn.setAttribute('aria-pressed', 'false');
    film.hidden = false;
    lenis.stop();
    gsap.fromTo(film, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' });
    gsap.fromTo('.film__frame', { scale: 0.9, clipPath: 'inset(10% 10% 10% 10% round 40px)' }, { scale: 1, clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 1, ease: 'expo.out' });
    filmVideo.currentTime = 0;
    filmVideo.play().catch(() => {});
  };
  const close = () => {
    filmVideo.pause();
    gsap.to(film, { autoAlpha: 0, duration: 0.4, onComplete: () => { film.hidden = true; } });
    lenis.start();
    void wasMuted;
  };

  $$('[data-film]').forEach((b) => b.addEventListener('click', open));
  $('.hero__media').addEventListener('click', open);
  $('.film__close').addEventListener('click', close);
  film.addEventListener('click', (e) => { if (e.target === film) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !film.hidden) close(); });

  // timecode do viewfinder
  const tc = $('.vf__tc');
  const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');
  gsap.ticker.add(() => {
    const t = heroVideo.currentTime || 0;
    tc.textContent = `${pad(t / 60)}:${pad(t % 60)}:${pad((t % 1) * 30)}`;
  });
}

/* ─────────────────────────── Preloader + intro ─────────────────────────── */
function intro(): Promise<void> {
  return new Promise((resolve) => {
    const count = $('.loader__count');
    const counter = { v: 0 };

    const heroSplit = $$('[data-split]').map((el) => SplitText.create(el, { type: 'lines,chars', mask: 'lines', linesClass: 'split-line', charsClass: 'split-char' }));
    const heroChars = heroSplit.flatMap((s) => s.chars);

    gsap.set(heroChars, { yPercent: 115 });
    gsap.set(['.hero__eyebrow', '.hero__aside', '.nav'], { autoAlpha: 0 });
    gsap.set('.vf', { scale: 2.2, autoAlpha: 0 });
    gsap.set(['.vf__read', '.vf__focus'], { autoAlpha: 0 });

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

    tl.from('.loader__kicker span', { yPercent: 120, duration: 1, stagger: 0.08 }, 0.1)
      .from('.loader__word', { yPercent: 110, duration: 1.3, stagger: 0.12 }, 0.2)
      .to('.loader__bar i', { scaleX: 1, duration: 2.1, ease: 'power2.inOut' }, 0.3)
      .to(counter, {
        v: 100, duration: 2.1, ease: 'power2.inOut',
        onUpdate: () => { count.textContent = String(Math.round(counter.v)).padStart(3, '0'); },
      }, 0.3)
      // saída: o obturador abre
      .to(['.loader__inner'], { autoAlpha: 0, y: -20, duration: 0.6, ease: 'power2.in' }, '+=0.15')
      .to(loader, { '--r': '100%', duration: 1.6, ease: 'expo.inOut' }, '-=0.15')
      .set(loader, { display: 'none' })
      // o vídeo "entra em foco"
      .to(heroVideo, { filter: 'blur(0px) saturate(1) brightness(1)', scale: 1.04, duration: 2.6, ease: 'power3.out' }, '<-1.3')
      .to('.vf__focus', { autoAlpha: 1, duration: 0.3 }, '<')
      .fromTo('.vf__focus', { scale: 2.4 }, { scale: 1, duration: 1.4, ease: 'expo.out' }, '<')
      .to('.vf__focus', { autoAlpha: 0, duration: 0.6 }, '<1.3')
      .to('.vf', { scale: 1, autoAlpha: 1, duration: 1.4, stagger: 0.05 }, '<-1.2')
      .to(heroChars, { yPercent: 0, duration: 1.4, stagger: 0.025 }, '<0.1')
      .to(['.hero__eyebrow', '.hero__aside', '.nav', '.vf__read'], { autoAlpha: 1, duration: 1, stagger: 0.1, ease: 'power2.out' }, '<0.5')
      .add(() => {
        document.body.classList.remove('is-loading');
        lenis.start();
        resolve();
      }, '<0.3');
  });
}

/* ─────────────────────────── Scroll scenes ─────────────────────────── */
function scenes() {
  const mm = gsap.matchMedia();

  // HERO → janela em arco
  // lado a lado: desktop e celular deitado · empilhado: celular/tablet em pé
  mm.add({ desktop: '(min-width: 901px), (orientation: landscape) and (min-width: 600px)', mobile: '(max-width: 599px), (max-width: 900px) and (orientation: portrait)' }, (ctx) => {
    const d = ctx.conditions!.desktop;
    const stage = $('.hero__stage');
    const afterL = $('.hero__after-l');
    const afterR = $('.hero__after-r');
    const insetTo = () => {
      const w = stage.clientWidth, h = stage.clientHeight;
      if (d) {
        const x = w * 0.31, y = h * 0.12;
        const r = (w - 2 * x) / 2;
        return `inset(${y}px ${x}px ${y}px ${x}px round ${r}px ${r}px 24px 24px)`;
      }
      // mede os textos reais para o arco nunca cobrir nenhum deles
      const gap = 18;
      const x = w * 0.08;
      const top = afterL.offsetTop + afterL.offsetHeight + gap;
      const bottom = h - afterR.offsetTop + gap;
      const r = (w - 2 * x) / 2;
      return `inset(${top}px ${x}px ${bottom}px ${x}px round ${r}px ${r}px 20px 20px)`;
    };

    const tl = gsap.timeline({
      scrollTrigger: { trigger: '#hero', start: 'top top', end: '+=140%', pin: true, scrub: 1, invalidateOnRefresh: true, onUpdate: (s) => nav.classList.toggle('is-ink', s.progress > 0.35) },
      defaults: { ease: 'none' },
    });
    tl.to('.hero__content', { yPercent: -35, autoAlpha: 0, duration: 0.35 }, 0)
      .to('.viewfinder', { autoAlpha: 0, duration: 0.2 }, 0)
      .fromTo('.hero__media', { clipPath: () => `inset(0px 0px 0px 0px round 0px 0px 0px 0px)` }, { clipPath: insetTo, duration: 1, ease: 'power2.inOut' }, 0)
      .fromTo(heroVideo, { scale: 1.04 }, { scale: 1.3, duration: 1, immediateRender: false }, 0)
      .to('.hero__shade', { opacity: 0.35, duration: 1 }, 0)
      .fromTo('.hero__after-l', { autoAlpha: 0, x: d ? -80 : 0, y: d ? 0 : -30 }, { autoAlpha: 1, x: 0, y: 0, duration: 0.45 }, 0.5)
      .fromTo('.hero__after-r', { autoAlpha: 0, x: d ? 80 : 0, y: d ? 0 : 30 }, { autoAlpha: 1, x: 0, y: 0, duration: 0.45 }, 0.55);
  });

  // NAV — cor por seção + esconder ao rolar pra baixo
  ScrollTrigger.create({
    trigger: '#manifesto', start: 'top 80px', endTrigger: 'html', end: 'bottom bottom',
    onToggle: (s) => nav.classList.toggle('is-solid', s.isActive),
  });
  $$('.services, .stage, .podcast, .footer').forEach((sec) =>
    ScrollTrigger.create({ trigger: sec, start: 'top 60px', end: 'bottom 60px', onToggle: (s) => nav.classList.toggle('is-dark', s.isActive) })
  );
  lenis.on('scroll', ({ direction, scroll }: { direction: number; scroll: number }) => {
    nav.classList.toggle('is-hidden', direction === 1 && scroll > innerHeight * 2.6);
  });

  // MANIFESTO — palavras acendem
  gsap.to('.mw', {
    opacity: 1, stagger: 0.08, ease: 'none',
    scrollTrigger: { trigger: '.manifesto__text', start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
  });
  gsap.fromTo('.curve--m', { yPercent: 12, rotate: -6 }, { yPercent: -12, rotate: 4, ease: 'none', scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'bottom top', scrub: true } });

  // Títulos com chars
  $$('[data-split-chars]').forEach((el) => {
    const s = SplitText.create(el, { type: 'lines,chars', mask: 'lines', linesClass: 'split-line', charsClass: 'split-char' });
    gsap.from(s.chars, {
      yPercent: 110, rotate: 6, duration: 1.2, ease: 'expo.out', stagger: 0.018,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  // Reveals genéricos
  $$('[data-reveal]').forEach((el) =>
    gsap.from(el, { y: 50, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
  );

  // ABOUT
  gsap.fromTo('.about__photo', { clipPath: 'inset(100% 0% 0% 0% round 300px 300px 18px 18px)' }, {
    clipPath: 'inset(0% 0% 0% 0% round 300px 300px 18px 18px)', duration: 1.6, ease: 'expo.inOut',
    scrollTrigger: { trigger: '.about__visual', start: 'top 75%', once: true },
  });
  gsap.fromTo('.about__photo img', { yPercent: -12, scale: 1.2 }, { yPercent: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.about__shape', { rotate: -12, yPercent: 8 }, { rotate: 10, yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.badge', { scale: 0, rotate: -120, duration: 1.4, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.about__visual', start: 'top 55%', once: true } });
  $$('[data-count]').forEach((el) => {
    const o = { v: 0 };
    gsap.to(o, { v: Number(el.dataset.count), duration: 2, ease: 'power2.out', onUpdate: () => { el.textContent = String(Math.round(o.v)); }, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  // SERVIÇOS — trilho horizontal
  mm.add('(min-width: 901px)', () => {
    const track = $('.services__track');
    const dist = () => track.scrollWidth - innerWidth;
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.services__pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true },
    });
    gsap.to('.services__progress i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.services__pin', start: 'top top', end: () => '+=' + dist(), scrub: true, invalidateOnRefresh: true } });
    $$('.swatch').forEach((card) => {
      gsap.fromTo(card, { yPercent: 14, rotate: 5 }, {
        yPercent: 0, rotate: 0, ease: 'power2.out',
        scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 100%', end: 'left 55%', scrub: true },
      });
      const surf = $('.swatch__surface', card);
      if (surf) gsap.fromTo(surf, { xPercent: 6 }, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
    });
  });
  mm.add('(max-width: 900px)', () => {
    $$('.swatch').forEach((card) =>
      gsap.from(card, { y: 80, autoAlpha: 0, rotate: 3, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 88%', once: true } })
    );
  });

  // EM CENA — marquee com velocidade da rolagem
  const row = $('.marquee__row');
  const loop = gsap.to(row, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
  let dir = 1;
  ScrollTrigger.create({
    trigger: '.stage', start: 'top bottom', end: 'bottom top',
    onUpdate: (s) => {
      const v = s.getVelocity() / 300;
      if (s.direction !== dir) dir = s.direction;
      gsap.to(loop, { timeScale: gsap.utils.clamp(-6, 6, dir * (1 + Math.abs(v))), duration: 0.4, overwrite: true });
      gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.4 });
    },
  });
  const stageVideo = $<HTMLVideoElement>('.stage__video');
  gsap.fromTo('.stage__window', { scale: 0.72, rotate: -3 }, { scale: 1, rotate: 0, ease: 'none', scrollTrigger: { trigger: '.stage__window', start: 'top bottom', end: 'center center', scrub: true } });
  gsap.fromTo(stageVideo, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.stage__window', start: 'top bottom', end: 'bottom top', scrub: true } });
  ScrollTrigger.create({
    trigger: '.stage__window', start: 'top bottom', end: 'bottom top',
    onToggle: (s) => { if (s.isActive) { stageVideo.currentTime = 22; stageVideo.play().catch(() => {}); } else stageVideo.pause(); },
  });
  // pausa o vídeo do hero fora da tela (desempenho)
  ScrollTrigger.create({
    trigger: '#manifesto', start: 'top top',
    onEnter: () => heroVideo.pause(),
    onLeaveBack: () => heroVideo.play().catch(() => {}),
  });

  // PODCAST — lente focando
  const ptl = gsap.timeline({ scrollTrigger: { trigger: '.podcast', start: 'top 85%', end: 'bottom 30%', scrub: 1 } });
  ptl.fromTo('.pt--1', { xPercent: -30 }, { xPercent: 0, ease: 'none' }, 0)
    .fromTo('.pt--3', { xPercent: 30 }, { xPercent: 0, ease: 'none' }, 0)
    .fromTo('.pt--2', { autoAlpha: 0, filter: 'blur(12px)' }, { autoAlpha: 1, filter: 'blur(0px)', ease: 'none', duration: 0.5 }, 0.1)
    .fromTo('.lens i', { scale: (i) => 1.6 - i * 0.12, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, stagger: 0.06, ease: 'none' }, 0)
    .to('.lens', { rotate: 30, ease: 'none' }, 0);

  // CTA + footer
  gsap.fromTo('.curve--cta', { yPercent: 30 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  gsap.from('.orb', { scale: 0, rotate: -90, duration: 1.4, ease: 'back.out(1.5)', scrollTrigger: { trigger: '.cta__title', start: 'top 60%', once: true } });
  gsap.fromTo('.footer__word span', { yPercent: 60 }, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  addEventListener('load', () => ScrollTrigger.refresh());
}

/* ─────────────────────────── Boot ─────────────────────────── */
async function boot() {
  initCursor();
  initMagnetic();
  initTilt();
  initMedia();

  if (reduce) {
    loader.style.display = 'none';
    document.body.classList.remove('is-loading');
    lenis.start();
    return;
  }

  heroVideo.play().catch(() => {});
  await document.fonts.ready;
  scenes();
  await intro();
  ScrollTrigger.refresh();
}

boot();
