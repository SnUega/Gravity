/**
 * Blog Page Main
 * Точка входа для страницы блога
 * Модульная архитектура аналогичная main.js
 */

// Импортируем библиотеки ПЕРВЫМ делом (gsap, ScrollTrigger, Lenis)
import './lib.js';
import { waitForLibrary } from './core/utils.js';
import { initPagePreloader } from './modules/services-page/page-preloader.js';

// Состояние Lenis для доступа из других модулей
let lenisInstance = null;

/**
 * Получить экземпляр Lenis
 */
export function getLenis() {
  return lenisInstance;
}

/**
 * Инициализация страницы
 */
async function init() {
  try {
    // Ждем загрузки DOM
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }

    // Этап 0: Прелоадер + header запускаются первыми и параллельно.
    initPagePreloader();

    // Header инициализируется немедленно, не ожидая других модулей
    try {
      const { initHeaderMenu } = await import('./modules/header/index.js');
      initHeaderMenu();
    } catch (error) {
      initSimpleMenu();
    }

    // Этап 2: Инициализируем компоненты блога
    try {
      const { initBlogPage } = await import('./modules/blog-page/index.js');
      await initBlogPage();
      // console.log('✅ Blog page modules loaded'); // DEBUG: отключено
    } catch (error) {
      console.error('Blog page modules error:', error); // Оставляем для реальных ошибок
    }

    // Этап 3: Инициализируем Lenis для плавного скролла через контроллер (как на главной)
    try {
      const { initScrollController, initScrollProtection } = await import('./modules/scroll/index.js');
      
      // Инициализируем защиту от сброса скролла (для мобильных устройств)
      initScrollProtection();
      
      // Инициализируем контроллер скролла (Lenis)
      lenisInstance = await initScrollController();
      // console.log('✅ Lenis smooth scroll initialized'); // DEBUG: отключено
    } catch (error) {
      // console.warn('Lenis not available, using native scroll:', error); // DEBUG: отключено
    }

    // Этап 4: Ждем GSAP для других анимаций
    try {
      // gsap available via import
if (window.gsap && window.ScrollTrigger) {
        window.gsap.registerPlugin(window.ScrollTrigger);
      }
    } catch (error) {
      // console.warn('GSAP not available'); // DEBUG: отключено
    }

    // Этап 5: Lenis-интеграция меню (header уже инициализирован на этапе 0)
    try {
      setupMenuLenisIntegration();
    } catch (error) {
      // console.warn('Menu Lenis integration failed:', error); // DEBUG: отключено
    }

    // Этап 6: Инициализация мобильной подсказки
    initMobileHint();

    // Этап 7: Инициализация ScrollFlow для эффекта раскрытия футера
    try {
      const { initScrollFlow } = await import('./modules/scroll/flow.js');
      initScrollFlow();
      // console.log('✅ ScrollFlow initialized'); // DEBUG: отключено
    } catch (error) {
      // console.warn('ScrollFlow not available:', error); // DEBUG: отключено
    }

    // Этап 8: Инициализация формы контактов
    try {
      const { initContactForm } = await import('./modules/contacts/index.js');
      initContactForm();
      // console.log('✅ Contact form initialized'); // DEBUG: отключено
    } catch (error) {
      // console.warn('Contact form not available:', error); // DEBUG: отключено
    }

    // Этап 9: Инициализация заглушек ориентации
    try {
      const { initOrientationOverlay } = await import('./modules/orientation-overlay.js');
      initOrientationOverlay();
      // console.log('✅ Orientation overlay initialized'); // DEBUG: отключено
    } catch (error) {
      // console.warn('Orientation overlay not available:', error); // DEBUG: отключено
    }

    // console.log('✅ All blog page modules loaded'); // DEBUG: отключено

    // Обработка якорных ссылок при загрузке страницы (если переходим на главную с hash)
    if (window.location.hash && window.location.pathname.includes('index.html')) {
      const hash = window.location.hash;
      const target = document.querySelector(hash);
      if (target) {
        // Ждем завершения прелоадера и инициализации Lenis
        const scrollToHash = async () => {
          // Ждем события завершения прелоадера если есть
          if (document.getElementById('page-preloader')) {
            await new Promise(resolve => {
              const checkPreloader = () => {
                if (!document.getElementById('page-preloader') || 
                    document.getElementById('page-preloader').classList.contains('loaded')) {
                  resolve();
                } else {
                  setTimeout(checkPreloader, 100);
                }
              };
              checkPreloader();
            });
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          try {
            const { smoothScrollToTarget } = await import('./modules/header/helpers.js');
            if (lenisInstance) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
            smoothScrollToTarget(target, -80);
          } catch (error) {
            const { scrollToElement } = await import('./core/dom.js');
            scrollToElement(target, -80);
          }
        };
        
        scrollToHash();
      }
    }

  } catch (error) {
    console.error('Blog page initialization error:', error);
  }
}

/**
 * Интеграция меню с Lenis
 */
function setupMenuLenisIntegration() {
  const menu = document.querySelector('.navc-menu');
  
  if (!menu || !lenisInstance) return;
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        if (menu.classList.contains('active')) {
          lenisInstance.stop();
        } else {
          lenisInstance.start();
        }
      }
    });
  });
  
  observer.observe(menu, { attributes: true });
}

/**
 * Простая инициализация меню (fallback)
 */
function initSimpleMenu() {
  const burger = document.querySelector('.navc-burger');
  const menu = document.querySelector('.navc-menu');
  
  if (!burger || !menu) return;
  
  burger.addEventListener('click', () => {
    const isActive = burger.classList.toggle('active');
    menu.classList.toggle('active');
    document.body.classList.toggle('lock-scroll');
    
    if (lenisInstance) {
      isActive ? lenisInstance.stop() : lenisInstance.start();
    }
  });

  document.querySelectorAll('.navc-links a').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('active');
      menu.classList.remove('active');
      document.body.classList.remove('lock-scroll');
      
      if (lenisInstance) {
        lenisInstance.start();
      }
    });
  });
}

/**
 * Инициализация мобильной подсказки
 */
function initMobileHint() {
  const hint = document.getElementById('mobileHint');
  if (!hint) return;

  let hasScrolled = false;
  
  const hideHint = () => {
    if (!hasScrolled) {
      hasScrolled = true;
      hint.classList.add('hidden');
      
      setTimeout(() => {
        hint.remove();
      }, 300);
    }
  };

  window.addEventListener('scroll', hideHint, { passive: true, once: true });
  window.addEventListener('touchstart', hideHint, { passive: true, once: true });
  
  setTimeout(() => {
    hideHint();
  }, 5000);
}

/**
 * Инициализация поиска и фильтрации статей блога
 * Только один тег может быть активен (как в галерее)
 */
function initBlogSearch() {
  const searchInput = document.getElementById('blogSearch');
  const searchClear = document.getElementById('searchClear');
  const filterTags = document.getElementById('filterTags');
  const filterTagsInner = document.querySelector('.filter-tags-inner');
  const previewGrid = document.getElementById('previewGrid');
  const noResults = document.getElementById('noResults');
  
  if (!searchInput || !filterTags || !previewGrid || !filterTagsInner) return;
  
  const articles = Array.from(previewGrid.querySelectorAll('.preview-card'));
  const tagButtons = Array.from(filterTags.querySelectorAll('.tag-badge'));

  // ── Expandable search: лупа → инпут ──────────────────────────
  const searchWrapper = searchInput.closest('.search-wrapper');
  const searchIconEl  = searchWrapper?.querySelector('.search-icon');

  function expandSearch() {
    if (!searchWrapper) return;
    searchWrapper.classList.add('is-expanded');
    requestAnimationFrame(() => searchInput.focus());
  }
  function collapseSearch(force = false) {
    if (!searchWrapper) return;
    if (!force && searchInput.value.trim()) return; // не сворачиваем по blur, если есть текст
    searchWrapper.classList.remove('is-expanded');
  }

  if (searchIconEl) {
    searchIconEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (searchWrapper.classList.contains('is-expanded')) {
        collapseSearch(true); // повторное нажатие — скрыть панель
      } else {
        expandSearch();
      }
    });
  }
  searchInput.addEventListener('blur', () => collapseSearch(false));
  // ─────────────────────────────────────────────────────────────
  
  let activeTag = 'all'; // Только один активный тег
  let searchTerm = '';
  let isAnimating = false;
  let scrollEndTimer = null;
  
  // Создаем highlight элемент как в галерее
  let highlight = filterTagsInner.querySelector('.filter-highlight');
  if (!highlight) {
    highlight = document.createElement('div');
    highlight.className = 'filter-highlight';
    filterTagsInner.insertBefore(highlight, filterTagsInner.firstChild);
  }
  
  // Функция обновления highlight как в галерее
  const updateHighlight = (btn, immediate = false) => {
    if (!btn || !highlight) return;
    const offsetLeft = btn.offsetLeft;
    const width = btn.offsetWidth + 2;
    
    if (immediate || filterTags.classList.contains('is-scrolling')) {
      highlight.style.transition = 'none';
    } else {
      highlight.style.transition = '';
    }
    highlight.style.left = (offsetLeft - 1) + 'px';
    highlight.style.width = width + 'px';
  };
  
  // Синхронизация highlight при горизонтальном скролле тегов
  filterTags.addEventListener('scroll', () => {
    const active = tagButtons.find(btn => btn.classList.contains('active'));
    filterTags.classList.add('is-scrolling');
    if (active) updateHighlight(active, true);
    
    if (scrollEndTimer) clearTimeout(scrollEndTimer);
    scrollEndTimer = setTimeout(() => {
      filterTags.classList.remove('is-scrolling');
      if (active) updateHighlight(active, false);
    }, 120);
  }, { passive: true });
  
  // Обновление при resize
  const refreshActive = () => {
    const active = tagButtons.find(btn => btn.classList.contains('active'));
    if (active) updateHighlight(active, true);
  };
  
  const debouncedRefresh = debounce(refreshActive, 250);
  window.addEventListener('resize', debouncedRefresh);
  window.addEventListener('orientationchange', refreshActive);
  
  // ResizeObserver как в галерее
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => refreshActive());
    ro.observe(filterTags);
    ro.observe(filterTagsInner);
    tagButtons.forEach(btn => ro.observe(btn));
  }
  
  // Анимированная фильтрация грида
  const filterArticles = () => {
    if (isAnimating) return;
    isAnimating = true;
    
    const visibleArticles = [];
    const hiddenArticles = [];
    
    articles.forEach(article => {
      const articleTags = (article.dataset.tags || '').split(',');
      const title = article.querySelector('.preview-card-title')?.textContent.toLowerCase() || '';
      const desc = article.querySelector('.preview-card-desc')?.textContent.toLowerCase() || '';
      
      // Один активный тег
      const matchesTag = activeTag === 'all' || articleTags.includes(activeTag);
      
      const matchesSearch = !searchTerm || 
        title.includes(searchTerm.toLowerCase()) || 
        desc.includes(searchTerm.toLowerCase());
      
      if (matchesTag && matchesSearch) {
        visibleArticles.push(article);
      } else {
        hiddenArticles.push(article);
      }
    });
    
    if (window.gsap) {
      if (hiddenArticles.length > 0) {
        gsap.to(hiddenArticles, {
          opacity: 0,
          scale: 0.8,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            hiddenArticles.forEach(el => {
              el.classList.add('hidden');
              el.style.position = 'absolute';
              el.style.visibility = 'hidden';
            });
            showVisible();
          }
        });
      } else {
        showVisible();
      }
      
      function showVisible() {
        visibleArticles.forEach(el => {
          el.classList.remove('hidden');
          el.style.position = '';
          el.style.visibility = '';
        });
        
        if (visibleArticles.length > 0) {
          gsap.fromTo(visibleArticles, 
            { opacity: 0.5, scale: 0.95 },
            { 
              opacity: 1, 
              scale: 1, 
              duration: 0.4, 
              ease: 'power2.out',
              stagger: 0.05,
              onComplete: () => { isAnimating = false; }
            }
          );
        } else {
          isAnimating = false;
        }
      }
    } else {
      hiddenArticles.forEach(el => el.classList.add('hidden'));
      visibleArticles.forEach(el => el.classList.remove('hidden'));
      isAnimating = false;
    }
    
    if (noResults) {
      setTimeout(() => {
        noResults.style.display = visibleArticles.length === 0 ? 'block' : 'none';
      }, 350);
    }
  };
  
  // Клик по тегу - только один активный (как в галерее)
  tagButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (button.classList.contains('active')) return; // Уже активен
      
      // Убираем active со всех
      tagButtons.forEach(b => b.classList.remove('active'));
      // Добавляем active на кликнутый
      button.classList.add('active');
      // Обновляем активный тег
      activeTag = button.dataset.tag;
      
      // Обновляем highlight
      updateHighlight(button);
      filterArticles();
    });
  });
  
  // Поиск с debounce
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim();
    searchClear.style.display = searchTerm ? 'block' : 'none';
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(filterArticles, 200);
  });
  
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchTerm = '';
      searchClear.style.display = 'none';
      filterArticles();
    });
  }
  
  // Инициализация highlight
  const activeBtn = tagButtons.find(b => b.classList.contains('active'));
  if (activeBtn) {
    setTimeout(() => updateHighlight(activeBtn, true), 0);
  }
}

// Простой debounce
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Инициализация кликов по статьям
 * - Статьи с data-slug переходят на страницу статьи
 * - Заглушки показывают toast "Скоро"
 */
function initArticleClicks() {
  const articles = document.querySelectorAll('.preview-card, .blog-article, .blog-stub');
  
  articles.forEach(article => {
    article.addEventListener('click', (e) => {
      e.preventDefault();
      
      const slug = article.dataset.slug;
      const isStub = article.classList.contains('blog-stub') || 
                     article.querySelector('.stub-placeholder-icon') ||
                     !slug || slug.startsWith('coming-soon');
      
      if (isStub) {
        showComingSoonToast();
      } else {
        // Переход на страницу статьи
        // В production здесь будет реальный URL: `article-${slug}.html`
        // Пока показываем toast, т.к. статьи еще не созданы
        showComingSoonToast();
        // Для реальных статей раскомментировать:
        // window.location.href = `article-${slug}.html`;
      }
    });
  });
}

/**
 * Показать toast уведомление "Скоро"
 */
function showComingSoonToast() {
  // Remove existing toast
  const existingToast = document.querySelector('.coming-soon-toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Create new toast
  const toast = document.createElement('div');
  toast.className = 'coming-soon-toast';
  toast.textContent = '📝 Статья скоро будет доступна';
  document.body.appendChild(toast);
  
  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  
  // Auto hide
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

// Запускаем инициализацию
init();

// Инициализация поиска и кликов после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initBlogSearch();
    initArticleClicks();
  }, 500);
});
