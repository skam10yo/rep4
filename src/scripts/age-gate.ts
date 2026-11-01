const KEY = 'tu-age-ok';

const read = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
const save = () => { try { localStorage.setItem(KEY, '1'); } catch { /* приватный режим — просто не запоминаем */ } };

/** Резолвится, когда посетитель подтвердил возраст (сразу, если выбор уже сохранён). */
export function initAgeGate(onOpen: () => void, onClose: () => void): Promise<void> {
  return new Promise((resolve) => {
    const dlg = document.getElementById('age-gate') as HTMLDialogElement | null;
    if (read() || !dlg) { dlg?.close(); resolve(); return; }

    dlg.addEventListener('cancel', (e) => e.preventDefault()); // Esc не закрывает: выбор обязателен
    // Окно уже нарисовано сервером (быстрый первый кадр); переводим его в модальный режим —
    // фокус-ловушка и inert для остальной страницы.
    dlg.close();
    dlg.showModal();
    onOpen();

    dlg.querySelector('[data-age-yes]')!.addEventListener('click', () => {
      save();
      document.documentElement.classList.add('age-ok');
      dlg.classList.add('is-closing');
      document.querySelector('.age-backdrop')?.classList.add('is-closing');
      const done = () => { dlg.close(); document.querySelector('.age-backdrop')?.remove(); onClose(); resolve(); };
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) done();
      else setTimeout(done, 380);
    });

    dlg.querySelector('[data-age-no]')!.addEventListener('click', () => {
      // Выбор «нет» не запоминаем — при следующем визите спросим снова.
      dlg.querySelector<HTMLElement>('[data-age-step="ask"]')!.hidden = true;
      const bye = dlg.querySelector<HTMLElement>('[data-age-step="bye"]')!;
      bye.hidden = false;
      bye.querySelector<HTMLElement>('h2')!.focus();
      document.documentElement.classList.add('age-denied');
    });
  });
}
