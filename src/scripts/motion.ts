import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { finePointer } from './env';
import { initSmoke } from './smoke';

export interface Motion {
  scrollTo(target: HTMLElement | number, offset: number): void;
  onFilter(visible: HTMLElement[]): void;
  pause(): void;
  resume(): void;
  refresh(): void;
}

export function initMotion(enabled: boolean): Motion {
  const smoke = document.querySelector<HTMLCanvasElement>('[data-smoke]');
  if (smoke) initSmoke(smoke, enabled);

  if (!enabled) {
    return {
      scrollTo: (t, offset) => window.scrollTo(0, typeof t === 'number' ? t : t.getBoundingClientRect().top + window.scrollY + offset),
      onFilter: () => {}, pause: () => {}, resume: () => {}, refresh: () => {},
    };
  }

  gsap.registerPlugin(ScrollTrigger);

  // ── Плавный скролл ─────────────────────────────────────────
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // ── Hero: параллакс фото и уход контента при скролле ─────────
  gsap.to('[data-hero-media] img, [data-hero-media] .photo-missing', {
    yPercent: 14, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__content', {
    yPercent: -12, autoAlpha: 0.2, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'center center', end: 'bottom top', scrub: true },
  });

  // ── Фирменный момент: при скролле «зажигается» свет ─────────
  gsap.timeline({
    scrollTrigger: { trigger: '#main', start: 'top top', endTrigger: '#booking', end: 'top center', scrub: 0.8 },
  })
    .fromTo('.ambient__warm', { opacity: 0 }, { opacity: 1, ease: 'none' }, 0)
    .fromTo('.ambient__lamp', { opacity: 0.15, scale: 0.7 }, { opacity: 1, scale: 1, ease: 'power1.in', stagger: 0.12 }, 0);

  // ── Reveal секций и каскады карточек (только то, что ниже экрана) ──
  const below = (el: Element) => el.getBoundingClientRect().top > window.innerHeight;
  gsap.utils.toArray<HTMLElement>('[data-reveal]').filter(below).forEach((el) => {
    gsap.from(el, { autoAlpha: 0, y: 36, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });
  const cascade = gsap.utils.toArray<HTMLElement>('[data-cascade]').filter(below);
  gsap.set(cascade, { autoAlpha: 0, y: 28 });
  ScrollTrigger.batch(cascade, {
    start: 'top 90%', once: true,
    onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power2.out', overwrite: true }),
  });

  // Параллакс фото внутри рамок
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
    gsap.fromTo(el, { yPercent: -7 }, {
      yPercent: 7, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  // ── Магнитные кнопки (только мышь) ──────────────────────────
  if (finePointer()) {
    document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
      const x = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
      const y = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.28);
        y((e.clientY - r.top - r.height / 2) * 0.38);
      });
      el.addEventListener('pointerleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)', overwrite: true });
      });
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  return {
    scrollTo: (t, offset) => lenis.scrollTo(t, { offset }),
    onFilter: (visible) => {
      gsap.fromTo(visible, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.04, ease: 'power2.out', overwrite: true });
      ScrollTrigger.refresh();
    },
    pause: () => lenis.stop(),
    resume: () => lenis.start(),
    refresh: () => ScrollTrigger.refresh(),
  };
}
