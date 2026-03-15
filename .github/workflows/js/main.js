/**
 * Главный файл - точка входа для модульной архитектуры
 * Динамически загружает модули после загрузки DOM
 */

// Импортируем библиотеки ПЕРВЫМ делом (gsap, ScrollTrigger, Lenis)
import './lib.js';

// Прелоадер запускается НЕМЕДЛЕННО при загрузке модуля — до init()
// Это критично: он должен стартовать раньше всего остального
import './modules/preloader/index.js';

// Импортируем утилиты для использования в модулях
import { waitForLibrary } from './core/utils.js';
import { initErrorHandler } from './core/errors.js';
import { EVENTS } from './core/constants.js';
import { initBlogArticleClicks } from './modules/blog-ui/index.js';
import { initSunkenParallax } from './modules/sunken/index.js';
import { initHeroBg } from './modules/hero-bg.js';

export { $, $$, debounce, throttle, waitForLibrary, isMobile, isTablet, isDesktop, isMobileDevice } from './core/utils.js';
export { getComputedStyleValue, setStyles, scrollToElement, createElement } from './core/dom.js';
export { CONFIG } from './core/config.js';
export { DIMENSIONS, TIMING, CLASSES, EVENTS } from './core/constants.js';
export { eventManager, delegate } from './core/events.js';

/**
 * Инициализация модулей
 * Загружает модули после готовности DOM и необходимых библиотек
 */
async function init() {
  // Инициализируем обработчик ошибок ПЕРВЫМ
  const errorHandler = initErrorHandler({
    enableConsoleLog: true,
    enableServerLog: false, // Включим при создании админ-панели
    showToUser: false, // Включим для критических ошибок в продакшене
    environment: window.location.hostname === 'localhost' ? 'development' : 'production'
  });

  try {
    // Ждем загрузки DOM
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }

    // gsap, ScrollTrigger, Lenis загружены синхронно через lib.js —
    // регистрация плагинов уже выполнена там, ждать ничего не нужно.

    // ЭТАП 1 — Header инициализируется первым.
    // Header слушает событие PRELOADER_COMPLETE и запускает intro-анимацию после него.
    try {
      const { initHeaderMenu } = await import('./modules/header/index.js');
      initHeaderMenu();
    } catch (error) {
      errorHandler.handle(error, {
        module: 'main',
        severity: 'high',
        context: { stage: 'header-init' },
        userMessage: null
      });
    }

    // Динамически импортируем модули
    // Этап 2: Простые модули скролла и услуг
    try {
      // Импортируем модули скролла
      const { initScrollController, initCustomScrollbar, initScrollFlow, initScrollProtection, initScrollDebug, initScrollDebugVisual } = await import('./modules/scroll/index.js');
      
      // Отладка скролла отключена для продакшена
      // Раскомментируйте для отладки:
      // initScrollDebugVisual();
      // initScrollDebug();
      
      // Инициализируем защиту от сброса скролла (для мобильных устройств)
      initScrollProtection();
      
      // Инициализируем контроллер скролла (Lenis)
      await initScrollController();
      
      // Инициализируем кастомный скроллбар
      initCustomScrollbar();
      
      // Инициализируем анимацию футера (с улучшенной поддержкой параллакса)
      initScrollFlow();
      
      // Импортируем модули услуг
      const { initServicesParallax } = await import('./modules/services/index.js');
      
      // Инициализируем параллакс эффект
      initServicesParallax();
      
      // console.log('✅ Scroll and services modules loaded'); // DEBUG: отключено
    } catch (error) {
      errorHandler.handle(error, {
        module: 'main',
        severity: 'high',
        context: { stage: 'scroll-and-services' },
        userMessage: null
      });
    }

    // Этап 3: Средние модули
    try {
      // Импортируем форму контактов
      const { initContactForm } = await import('./modules/contacts/index.js');
      initContactForm();
      
      // Импортируем менеджер карточек (с исправлениями)
      const { initCardsManager } = await import('./modules/cards/index.js');
      initCardsManager();
      
      // Импортируем менеджер блога (с поддержкой админ-панели)
      const { initBlogManager } = await import('./modules/blog/index.js');
      initBlogManager();
      
      // Импортируем менеджер модальных окон
      const { initModalManager } = await import('./modules/modal/index.js');
      initModalManager();
      
      // Импортируем галерею
      const { initGallery } = await import('./modules/gallery/index.js');
      initGallery();
      
      // Импортируем ALR интерактивные карточки
      const { initALRInteractive } = await import('./modules/alr/index.js');
      initALRInteractive();
      
      // Импортируем заглушки ориентации
      const { initOrientationOverlay } = await import('./modules/orientation-overlay.js');
      initOrientationOverlay();
      
      // console.log('✅ Medium modules loaded'); // DEBUG: отключено
    } catch (error) {
      errorHandler.handle(error, {
        module: 'main',
        severity: 'high',
        context: { stage: 'medium-modules' },
        userMessage: null
      });
    }
    
    // console.log('✅ Core modules loaded'); // DEBUG: отключено
    
    // Инициализация кликов по мини-статьям блога
    initBlogArticleClicks();

    // Параллакс sunken-секций
    initSunkenParallax();
    
    // Фоновая анимация hero
    initHeroBg();
    
    // Обработка якорных ссылок при загрузке страницы
    if (window.location.hash) {
      const hash = window.location.hash;
      const target = document.querySelector(hash);
      if (target) {
        // Ждем завершения прелоадера перед переходом на секцию
        const scrollToHash = async () => {
          // Ждем события завершения прелоадера
          if (document.getElementById('preloader')) {
            await new Promise(resolve => {
              window.addEventListener(EVENTS.PRELOADER_COMPLETE, resolve, { once: true });
            });
            // Дополнительная небольшая задержка для завершения анимации прелоадера
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          try {
            const { smoothScrollToTarget } = await import('./modules/header/helpers.js');
            // Ждем инициализации Lenis если используется
            if (window.lenis) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
            smoothScrollToTarget(target, -80);
          } catch (error) {
            // Fallback: используем scrollToElement
            const { scrollToElement } = await import('./core/dom.js');
            scrollToElement(target, -80);
          }
        };
        
        // Запускаем сразу, но переход произойдет после прелоадера
        scrollToHash();
      }
    }
    
  } catch (error) {
    errorHandler.handle(error, {
      module: 'main',
      severity: 'critical',
      context: { stage: 'initialization' },
      userMessage: 'Произошла ошибка при загрузке сайта. Пожалуйста, обновите страницу.',
      showToUser: true
    });
  }
}

// Запускаем инициализацию
init();
