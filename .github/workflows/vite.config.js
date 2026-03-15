import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Корень проекта — папка с index.html
  root: '.',

  // Базовый путь при деплое на хостинг (корень домена)
  base: '/',

  build: {
    outDir: 'dist',
    emptyOutDir: true,

    rollupOptions: {
      // Несколько точек входа — по одной на каждый HTML
      input: {
        main:     resolve(__dirname, 'index.html'),
        cosmetology: resolve(__dirname, 'html/cosmetology.html'),
        injections:  resolve(__dirname, 'html/injections.html'),
        massage:     resolve(__dirname, 'html/massage.html'),
        blog:        resolve(__dirname, 'html/blog.html'),
        article:     resolve(__dirname, 'html/article-template.html'),
        policy:      resolve(__dirname, 'html/policy.html'),
      },

      output: {
        // JS: именованные чанки в assets/
        chunkFileNames:  'assets/[name]-[hash].js',
        entryFileNames:  'assets/[name]-[hash].js',
        // CSS: в assets/
        assetFileNames:  'assets/[name]-[hash][extname]',

        // Выносим gsap и lenis в отдельный vendor-чанк
        // чтобы браузер кэшировал их независимо от кода проекта
        manualChunks(id) {
          if (id.includes('node_modules/gsap')) return 'vendor-gsap';
          if (id.includes('node_modules/lenis')) return 'vendor-lenis';
        }
      }
    },

    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger'],
    },

    // sourcemap только для разработки — в продакшене не нужен
    sourcemap: false,

    // Предупреждение о больших чанках — порог 500KB
    chunkSizeWarningLimit: 500,
  },

  // Vite dev server — для разработки
  server: {
    port: 3000,
    open: true,
    // Следим за изменениями CSS без перезагрузки страницы
    hmr: true,
  },

  // CSS — обрабатывается автоматически, @import разворачиваются
  css: {
    devSourcemap: true,
  },

  // Алиасы путей (опционально, удобно для импортов)
  resolve: {
    alias: {
      '@': resolve(__dirname, 'js'),
      '@core': resolve(__dirname, 'js/core'),
      '@modules': resolve(__dirname, 'js/modules'),
    }
  }
});
