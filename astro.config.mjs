import { defineConfig } from 'astro/config';

// Замените на боевой домен после деплоя — используется в OG-тегах и canonical.
const site = process.env.SITE_URL || 'https://tleyushchiy-ugol.netlify.app';

export default defineConfig({
  site,
  compressHTML: true,
  build: { inlineStylesheets: 'always' },
  image: {
    // Оригиналы лежат в src/assets/photos, на сборке sharp делает AVIF/WebP нужных ширин.
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
});
