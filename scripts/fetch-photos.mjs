#!/usr/bin/env node
// Скачивает фото из photos.manifest.json в src/assets/photos/<slot>.jpg,
// уменьшает до 2400px по длинной стороне, удаляет EXIF, собирает public/og-image.jpg
// и перегенерирует CREDITS.md. AVIF/WebP + srcset делает Astro на сборке.
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'src/assets/photos');
const manifest = JSON.parse(await readFile(path.join(root, 'photos.manifest.json'), 'utf8'));
await mkdir(outDir, { recursive: true });

const exists = (p) => access(p).then(() => true, () => false);

// Страница фото → прямая ссылка на файл (официальные схемы URL стоков).
function resolveUrl({ url, source }) {
  if (!url) return null;
  const pexels = url.match(/pexels\.com\/photo\/(?:[^/]*-)?(\d+)\/?$/);
  if (pexels) return `https://images.pexels.com/photos/${pexels[1]}/pexels-photo-${pexels[1]}.jpeg?auto=compress&cs=tinysrgb&w=2400`;
  const unsplash = url.match(/unsplash\.com\/photos\/(?:[^/]*-)?([A-Za-z0-9_-]{11})\/?$/);
  if (unsplash) return `https://unsplash.com/photos/${unsplash[1]}/download?force=true&w=2400`;
  if (source === 'pixabay' && /pixabay\.com\/photos\//.test(url)) {
    throw new Error('Для Pixabay укажите прямую ссылку на файл (cdn.pixabay.com/...), страница не подходит.');
  }
  return url;
}

const missing = [];
for (const p of manifest.photos) {
  const file = path.join(outDir, `${p.slot}.jpg`);
  const src = resolveUrl(p);
  if (!src) {
    if (!(await exists(file))) missing.push(p.slot);
    continue;
  }
  if (await exists(file) && !process.argv.includes('--force')) {
    console.log(`✓ ${p.slot} — уже есть (перекачать: npm run photos -- --force)`);
    continue;
  }
  process.stdout.write(`↓ ${p.slot} … `);
  const res = await fetch(src, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 photo-fetch' } });
  if (!res.ok) throw new Error(`${p.slot}: HTTP ${res.status} для ${src}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await sharp(buf).rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true }).toFile(file);
  console.log('ok');
}

// OG-картинка 1200×630 из hero
const hero = path.join(outDir, 'hero.jpg');
if (await exists(hero)) {
  await sharp(hero).resize(1200, 630, { fit: 'cover' }).modulate({ brightness: 0.9 })
    .jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(root, 'public/og-image.jpg'));
}

// CREDITS.md
const sourceName = { unsplash: 'Unsplash', pexels: 'Pexels', pixabay: 'Pixabay' };
const license = {
  unsplash: '[Unsplash License](https://unsplash.com/license)',
  pexels: '[Pexels License](https://www.pexels.com/license/)',
  pixabay: '[Pixabay Content License](https://pixabay.com/service/license-summary/)',
};
const rows = manifest.photos.map((p) => {
  const author = p.author ? (p.authorUrl ? `[${p.author}](${p.authorUrl})` : p.author) : '—';
  const page = p.pageUrl || p.url;
  const src = p.source ? `[${sourceName[p.source] ?? p.source}](${page})` : '—';
  return `| \`${p.slot}.jpg\` | ${p.alt} | ${author} | ${src} | ${license[p.source] ?? '—'} |`;
});
const credits = `# Фото: источники и авторы

Все фотографии скачаны в проект (\`src/assets/photos/\`), на сайте не хотлинкуются.
На сборке Astro конвертирует их в AVIF/WebP нескольких ширин. Файл генерируется командой \`npm run photos\`
из \`photos.manifest.json\` — правьте манифест, а не этот файл.

| Файл | Что на фото | Автор | Источник | Лицензия |
|---|---|---|---|---|
${rows.join('\n')}
`;
await writeFile(path.join(root, 'CREDITS.md'), credits);
console.log('CREDITS.md обновлён');

if (missing.length) {
  console.error(`\nНе заполнены источники для: ${missing.join(', ')}. Сборка сайта без них не пройдёт.`);
  process.exit(1);
}
