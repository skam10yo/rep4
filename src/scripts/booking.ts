type Errors = Partial<Record<'name' | 'date' | 'time' | 'guests' | 'hall', string>>;

const pad = (n: number) => String(n).padStart(2, '0');
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const MAX_DAYS = 60;

/** Слот до 16:00 означает «после полуночи» — реальное время на следующие сутки. */
function slotDateTime(date: string, time: string) {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const dt = new Date(y, m - 1, d, hh, mm);
  if (hh < 16) dt.setDate(dt.getDate() + 1);
  return dt;
}

export function initBooking(onScrollTo?: (el: HTMLElement) => void) {
  const form = document.querySelector<HTMLFormElement>('[data-booking-form]');
  const ticket = document.querySelector<HTMLElement>('[data-ticket]');
  if (!form || !ticket) return;
  const summary = form.querySelector<HTMLElement>('[data-form-summary]')!;
  const dateInput = form.elements.namedItem('date') as HTMLInputElement;
  const guestsInput = form.elements.namedItem('guests') as HTMLInputElement;
  let submitted = false;

  const today = new Date();
  const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + MAX_DAYS);
  dateInput.min = isoDate(today);
  dateInput.max = isoDate(maxDate);

  const hallRadio = () => form.querySelector<HTMLInputElement>('input[name="hall"]:checked');
  const syncMax = () => { const r = hallRadio(); if (r) guestsInput.max = r.dataset.max!; };
  syncMax();

  const values = () => {
    const fd = new FormData(form);
    return {
      name: String(fd.get('name') ?? '').trim(),
      date: String(fd.get('date') ?? ''),
      time: String(fd.get('time') ?? ''),
      guests: String(fd.get('guests') ?? '').trim(),
      hall: String(fd.get('hall') ?? ''),
      comment: String(fd.get('comment') ?? '').trim(),
    };
  };

  function validate(): Errors {
    const v = values();
    const e: Errors = {};
    if (!v.name) e.name = 'Укажите имя — по нему мы найдём вашу бронь.';
    else if (v.name.length < 2) e.name = 'Имя слишком короткое.';
    else if (!/^[\p{L}\s'-]+$/u.test(v.name)) e.name = 'Используйте только буквы, пробел или дефис.';

    if (!v.date) e.date = 'Выберите дату.';
    else if (v.date < dateInput.min) e.date = 'Эта дата уже прошла.';
    else if (v.date > dateInput.max) e.date = `Принимаем брони не дальше чем на ${MAX_DAYS} дней вперёд.`;
    else if (v.hall === 'veranda') {
      const month = Number(v.date.slice(5, 7));
      if (month < 5 || month > 9) e.date = 'Веранда открыта с мая по сентябрь — выберите другой зал или дату.';
    }

    if (!v.time) e.time = 'Выберите время.';
    else if (v.date && !e.date) {
      const soon = new Date(Date.now() + 30 * 60 * 1000);
      if (slotDateTime(v.date, v.time) < soon) e.time = 'Это время уже близко или прошло — выберите позже.';
    }

    const r = hallRadio();
    const max = Number(r?.dataset.max ?? 12);
    const g = Number(v.guests);
    if (!v.hall) e.hall = 'Выберите зал.';
    if (!v.guests) e.guests = 'Укажите число гостей.';
    else if (!Number.isInteger(g) || g < 1) e.guests = 'Нужно целое число от 1.';
    else if (g > max) e.guests = `В зале «${r?.dataset.title}» — не больше ${max} гостей за одним столом.`;
    return e;
  }

  function render(e: Errors) {
    for (const key of ['name', 'date', 'time', 'guests', 'hall'] as const) {
      const msg = e[key] ?? '';
      const out = form!.querySelector<HTMLElement>(`[data-error-for="${key}"]`)!;
      out.textContent = msg;
      const fields = key === 'hall'
        ? form!.querySelectorAll<HTMLElement>('input[name="hall"]')
        : [form!.elements.namedItem(key) as HTMLElement];
      fields.forEach((f) => (msg ? f.setAttribute('aria-invalid', 'true') : f.removeAttribute('aria-invalid')));
      out.closest('.field')?.classList.toggle('has-error', Boolean(msg));
    }
  }

  const labels: Record<string, string> = { name: 'Имя', date: 'Дата', time: 'Время', guests: 'Гостей', hall: 'Зал' };

  form.addEventListener('input', (ev) => {
    if ((ev.target as HTMLInputElement).name === 'hall') syncMax();
    if (submitted) { const e = validate(); render(e); if (!Object.keys(e).length) summary.hidden = true; }
  });
  form.addEventListener('change', () => { if (submitted) render(validate()); });

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    submitted = true;
    const e = validate();
    render(e);
    const keys = Object.keys(e);
    if (keys.length) {
      summary.innerHTML = `<p>Проверьте, пожалуйста: ${keys.map((k) => {
        return `<a href="#f-${k}">${labels[k]}</a>`;
      }).join(', ')}.</p>`;
      summary.hidden = false;
      form.querySelector<HTMLElement>(`#f-${keys[0]}`)?.focus();
      return;
    }
    summary.hidden = true;
    showTicket(values());
  });

  summary.addEventListener('click', (ev) => {
    const a = (ev.target as HTMLElement).closest('a');
    if (!a) return;
    ev.preventDefault();
    document.querySelector<HTMLElement>(a.getAttribute('href')!)?.focus();
  });

  function showTicket(v: ReturnType<typeof values>) {
    const dt = slotDateTime(v.date, v.time);
    const [y, m, d] = v.date.split('-').map(Number);
    const day = new Date(y, m - 1, d);
    const fmtDay = (x: Date) => x.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
    const set = (k: string, t: string) => { ticket!.querySelector(`[data-t="${k}"]`)!.textContent = t; };
    set('name', v.name);
    set('date', fmtDay(day));
    set('time', dt.getDate() !== day.getDate() ? `${v.time} — уже после полуночи, ${dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}` : v.time);
    set('guests', v.guests);
    set('hall', hallRadio()?.dataset.title ?? '');
    set('comment', v.comment);
    ticket!.querySelector<HTMLElement>('[data-t-wrap="comment"]')!.hidden = !v.comment;
    form!.hidden = true;
    ticket!.hidden = false;
    ticket!.classList.remove('is-in'); void ticket!.offsetWidth; ticket!.classList.add('is-in');
    ticket!.focus();
    onScrollTo?.(ticket!);
  }

  ticket.querySelector('[data-ticket-edit]')!.addEventListener('click', () => {
    ticket.hidden = true; form.hidden = false;
    (form.elements.namedItem('name') as HTMLElement).focus();
  });
  ticket.querySelector('[data-ticket-new]')!.addEventListener('click', () => {
    form.reset(); submitted = false; render({}); syncMax();
    ticket.hidden = true; form.hidden = false;
    (form.elements.namedItem('name') as HTMLElement).focus();
  });

  // Кнопки «Выбрать этот зал» в секции залов
  document.querySelectorAll<HTMLAnchorElement>('[data-hall-pick]').forEach((a) =>
    a.addEventListener('click', () => {
      const r = form.querySelector<HTMLInputElement>(`input[name="hall"][value="${a.dataset.hallPick}"]`);
      if (r) { r.checked = true; syncMax(); if (submitted) render(validate()); }
      if (!ticket.hidden) { ticket.hidden = true; form.hidden = false; }
    }),
  );
}
