const plural = (n: number) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'вкус';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'вкуса';
  return 'вкусов';
};

export function initFilters(onChange?: (visible: HTMLElement[]) => void) {
  const root = document.querySelector<HTMLElement>('[data-filters]');
  const list = document.querySelector<HTMLElement>('[data-flavors]');
  if (!root || !list) return;
  const items = [...list.querySelectorAll<HTMLElement>('[data-category]')];
  const count = root.querySelector<HTMLElement>('[data-filter-count]')!;
  const empty = document.querySelector<HTMLElement>('[data-flavors-empty]')!;
  const state: Record<string, string> = { category: 'all', strength: 'all' };

  root.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-filter]');
    if (!btn) return;
    const key = btn.dataset.filter!;
    state[key] = btn.dataset.value!;
    root.querySelectorAll<HTMLButtonElement>(`[data-filter="${key}"]`).forEach((b) =>
      b.setAttribute('aria-pressed', String(b === btn)),
    );
    const visible: HTMLElement[] = [];
    for (const it of items) {
      const show = (state.category === 'all' || it.dataset.category === state.category)
        && (state.strength === 'all' || it.dataset.strength === state.strength);
      it.hidden = !show;
      if (show) visible.push(it);
    }
    count.textContent = visible.length ? `Показано: ${visible.length} ${plural(visible.length)}` : 'Ничего не найдено';
    empty.hidden = visible.length > 0;
    onChange?.(visible);
  });
}
