// Лёгкий дым: ~18 заранее отрисованных «облачков», полупрозрачных, медленно всплывающих.
// Половинное разрешение, ~30 fps, пауза вне экрана и на скрытой вкладке.
export function initSmoke(canvas: HTMLCanvasElement, animate: boolean) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const sprite = document.createElement('canvas');
  const S = 256;
  sprite.width = sprite.height = S;
  const sctx = sprite.getContext('2d')!;
  // Неровное облако из нескольких радиальных пятен
  for (let i = 0; i < 7; i++) {
    const x = S / 2 + (Math.random() - 0.5) * S * 0.35;
    const y = S / 2 + (Math.random() - 0.5) * S * 0.35;
    const r = S * (0.18 + Math.random() * 0.16);
    const g = sctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(236, 214, 196, 0.22)');
    g.addColorStop(1, 'rgba(236, 214, 196, 0)');
    sctx.fillStyle = g;
    sctx.beginPath(); sctx.arc(x, y, r, 0, Math.PI * 2); sctx.fill();
  }

  let w = 0, h = 0;
  const scale = 0.5;
  const resize = () => {
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  const N = w < 700 ? 10 : 18;
  const puffs = Array.from({ length: N }, () => spawn(true));
  function spawn(initial = false) {
    const size = 260 + Math.random() * 420;
    return {
      x: Math.random() * w,
      y: initial ? Math.random() * h : h + size * 0.5,
      size,
      vx: (Math.random() - 0.5) * 0.12,
      vy: -(0.12 + Math.random() * 0.22),
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.0012,
      alpha: 0.15 + Math.random() * 0.3,
      t: Math.random() * 1000,
    };
  }

  function draw(dt: number) {
    ctx!.clearRect(0, 0, w, h);
    for (let i = 0; i < puffs.length; i++) {
      const p = puffs[i];
      p.t += dt;
      p.x += (p.vx + Math.sin(p.t * 0.0004) * 0.08) * dt * 0.06;
      p.y += p.vy * dt * 0.06;
      p.rot += p.vr * dt * 0.06;
      if (p.y < -p.size * 0.6) puffs[i] = spawn();
      const fade = Math.min(1, (h + p.size * 0.5 - p.y) / (h * 0.35)); // плавно проявляем снизу
      ctx!.globalAlpha = p.alpha * Math.max(0, fade);
      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rot);
      ctx!.drawImage(sprite, -p.size / 2, -p.size / 2, p.size, p.size);
      ctx!.restore();
    }
    ctx!.globalAlpha = 1;
  }

  if (!animate) { draw(0); return; }

  let visible = true, last = performance.now(), raf = 0, acc = 0;
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(64, now - last); last = now; acc += dt;
    if (acc < 33) return; // ~30 fps достаточно для дыма
    draw(acc); acc = 0;
  };
  const start = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();
}
