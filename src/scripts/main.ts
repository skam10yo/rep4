import { reducedMotion } from './env';
import { initAgeGate } from './age-gate';
import { initNav } from './nav';
import { initFilters } from './filters';
import { initBooking } from './booking';
import type { Motion } from './motion';

const motionOk = !reducedMotion();
const root = document.documentElement;
root.classList.toggle('motion', motionOk);

// Анимации (GSAP, ScrollTrigger, Lenis, дым) — отдельным чанком после первой отрисовки,
// чтобы не тормозить первый экран. Пока чанк грузится, сайт полностью работает без них.
let motion: Motion | null = null;
let gateOpen = false;
const loadMotion = () =>
  import('./motion').then((m) => {
    motion = m.initMotion(motionOk);
    if (gateOpen) motion.pause();
  });
if ('requestIdleCallback' in window) requestIdleCallback(() => loadMotion(), { timeout: 1200 });
else setTimeout(loadMotion, 300);

const headerOffset = () => (document.querySelector<HTMLElement>('[data-header]')?.offsetHeight ?? 64) + 8;
function scrollToEl(el: HTMLElement) {
  if (motion) motion.scrollTo(el, -headerOffset());
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - headerOffset(), behavior: motionOk ? 'smooth' : 'auto' });
}

document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!a || a.closest('[data-form-summary]')) return;
  const id = a.getAttribute('href')!;
  if (id === '#top') { e.preventDefault(); motion ? motion.scrollTo(0, 0) : window.scrollTo(0, 0); return; }
  const target = document.querySelector<HTMLElement>(id);
  if (!target) return;
  e.preventDefault();
  scrollToEl(target);
  // Переносим фокус в секцию для клавиатуры и скринридеров
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  history.replaceState(null, '', id);
});

initNav();
initBooking((el) => scrollToEl(el));
initFilters((visible) => motion?.onFilter(visible));

// Подсветка под курсором на основных кнопках
document.addEventListener('pointermove', (e) => {
  const b = (e.target as HTMLElement).closest?.<HTMLElement>('.btn--primary');
  if (!b) return;
  const r = b.getBoundingClientRect();
  b.style.setProperty('--mx', `${e.clientX - r.left}px`);
  b.style.setProperty('--my', `${e.clientY - r.top}px`);
}, { passive: true });

// Окно 18+: пока открыто, скролл стоит; CSS-интро hero ждёт подтверждения
initAgeGate(
  () => { gateOpen = true; motion?.pause(); },
  () => { gateOpen = false; motion?.resume(); },
).then(() => {
  root.classList.add('age-ok');
  motion?.refresh();
});
