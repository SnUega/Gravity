/**
 * Контроллер плавного скролла с Lenis
 * Инициализирует и настраивает Lenis для плавной прокрутки
 */

import { waitForLibrary, isMobileDevice} from '../../core/utils.js';
import { CONFIG } from '../../core/config.js';
import { getErrorHandler, ERROR_SEVERITY } from '../../core/errors.js';
import { registerLenis, lockScroll, unlockScroll } from '../../core/scroll-lock.js';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Класс контроллера скролла
 */
export class ScrollController {
  constructor(options = {}) {
    const isMobile = isMobileDevice({ excludeTablet: true });
    this.options = {
      duration: options.duration || 1.9,
      easing: options.easing || ((t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))),
      direction: options.direction || 'vertical',
      gestureDirection: options.gestureDirection || 'vertical',
      smooth: options.smooth !== false,
      mouseMultiplier: options.mouseMultiplier || 0.75,
      // Отключаем smoothTouch для мобильных устройств, чтобы избежать конфликтов с нативным скроллом
      smoothTouch: isMobile ? false : (options.smoothTouch !== false),
      touchMultiplier: isMobile ? 1.0 : (options.touchMultiplier || 1.6),
      infinite: options.infinite || false,
      ...options
    };
    
    this.lenis = null;
    this.isInitialized = false;
  }

  /**
   * Инициализация контроллера скролла
   */
  async init() {
    if (this.isInitialized) {
      return this.lenis;
    }

    const isMobile = isMobileDevice({ excludeTablet: true });
    // Для мобильных устройств полностью отключаем Lenis, используем нативный скролл
    if (isMobile) {
      // console.log('Mobile device detected, using native scroll instead of Lenis'); // DEBUG: отключено
      this.isInitialized = true;
      window.lenis = null; // Убеждаемся, что lenis не установлен
      
      // Для мобильных устройств синхронизируем ScrollTrigger с нативным скроллом
      if (true) { // ScrollTrigger imported
        // Отключаем авто-рефреш ScrollTrigger на resize для мобильных устройств
        // чтобы предотвратить множественные вызовы refresh() при изменении размера окна
        ScrollTrigger.config({ 
          autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load' 
        });
        
        // Обработчик нативного скролла для обновления ScrollTrigger
        const nativeScrollHandler = () => {
          ScrollTrigger.update();
        };
        
        // Используем throttling для производительности
        let ticking = false;
        const optimizedScrollHandler = () => {
          if (!ticking) {
            window.requestAnimationFrame(() => {
              nativeScrollHandler();
              ticking = false;
            });
            ticking = true;
          }
        };
        
        window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
        
        // Для мобильных устройств НЕ вызываем ScrollTrigger.refresh() при resize
        // потому что:
        // 1. ScrollTrigger уже обновляется через ScrollTrigger.update() в scroll handler
        // 2. На мобильных viewport изменяется при скролле (скрытие/появление адресной строки)
        // 3. Это вызывает множественные refresh(), которые создают дергания и остановки скролла
        // ScrollTrigger.refresh() будет вызываться только при реальных изменениях размера окна
        // через другие модули (например, при смене ориентации в flow.js)
        // 
        // НЕ добавляем resize handler для мобильных устройств - это предотвращает
        // множественные вызовы refresh() при изменении viewport во время скролла
        
        // Сохраняем обработчик для возможного удаления в будущем
        this._nativeScrollHandler = optimizedScrollHandler;
      }
      
      return null;
    }

    try {
      // Создаем экземпляр Lenis напрямую (импортирован из npm)
      this.lenis = new Lenis(this.options);

      // Регистрируем в scroll-lock для централизованного управления
      registerLenis(this.lenis);

      // Экспортируем Lenis глобально для использования в других модулях
      window.lenis = this.lenis;

      // Обратная совместимость — старый код использует window.lockScroll/unlockScroll
      window.lockScroll   = lockScroll;
      window.unlockScroll = unlockScroll;

      // Синхронизация с GSAP ScrollTrigger
      if (true) { // ScrollTrigger imported
        this.lenis.on('scroll', ScrollTrigger.update);
        
        // ВАЖНО: Дополнительная синхронизация при остановке скролла
        // Это предотвращает соскакивание секций и появление артефактов
        // когда инерция плавной прокрутки Lenis останавливается
        let scrollTimeout = null;
        this.lenis.on('scroll', () => {
          // Очищаем предыдущий таймер
          if (scrollTimeout) {
            clearTimeout(scrollTimeout);
          }
          
          // Устанавливаем новый таймер для обновления после остановки скролла
          scrollTimeout = setTimeout(() => {
            // Финальное обновление ScrollTrigger после остановки скролла
            ScrollTrigger.update();
            // Дополнительное обновление для гарантии синхронизации
            requestAnimationFrame(() => {
              ScrollTrigger.update();
            });
          }, 100); // Небольшая задержка для определения остановки скролла
        });
      }

      // Синхронизация с GSAP ticker
      if (true) { // gsap imported
        gsap.ticker.add((time) => {
          this.lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
      }

      this.isInitialized = true;
      
      // ScrollController initialized
      
      return this.lenis;
    } catch (error) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(error, {
        module: 'scroll-controller',
        severity: ERROR_SEVERITY.MEDIUM,
        context: { action: 'init', library: 'Lenis' },
        fallback: () => {
          this.isInitialized = false;
        },
        userMessage: null
      });
      this.isInitialized = false;
      return null;
    }
  }

  /**
   * Получить экземпляр Lenis
   * @returns {Object|null} - Экземпляр Lenis или null
   */
  getLenis() {
    return this.lenis;
  }

  /**
   * Прокрутка к элементу
   * @param {Element|string} target - Целевой элемент или селектор
   * @param {Object} options - Опции прокрутки
   */
  scrollTo(target, options = {}) {
    if (!this.lenis) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error('Lenis not initialized'), {
        module: 'scroll-controller',
        severity: ERROR_SEVERITY.LOW,
        context: { action: 'scrollTo' },
        userMessage: null
      });
      return;
    }

    try {
      this.lenis.scrollTo(target, options);
    } catch (error) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(error, {
        module: 'scroll-controller',
        severity: ERROR_SEVERITY.LOW,
        context: { action: 'scrollTo', target },
        userMessage: null
      });
    }
  }

  /**
   * Прокрутка на определенное значение
   * @param {number} value - Значение прокрутки
   * @param {Object} options - Опции прокрутки
   */
  scrollToValue(value, options = {}) {
    if (!this.lenis) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error('Lenis not initialized'), {
        module: 'scroll-controller',
        severity: ERROR_SEVERITY.LOW,
        context: { action: 'scrollToValue' },
        userMessage: null
      });
      return;
    }

    try {
      this.lenis.scrollTo(value, options);
    } catch (error) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(error, {
        module: 'scroll-controller',
        severity: ERROR_SEVERITY.LOW,
        context: { action: 'scrollToValue', value },
        userMessage: null
      });
    }
  }

  /**
   * Остановка прокрутки
   */
  stop() {
    if (this.lenis) {
      this.lenis.stop();
    }
  }

  /**
   * Возобновление прокрутки
   */
  start() {
    if (this.lenis) {
      this.lenis.start();
    }
  }

  /**
   * Уничтожение контроллера
   */
  destroy() {
    if (this.lenis) {
      try {
        this.lenis.destroy();
      } catch (error) {
        const errorHandler = getErrorHandler();
        errorHandler.handle(error, {
          module: 'scroll-controller',
          severity: ERROR_SEVERITY.LOW,
          context: { action: 'destroy' },
          userMessage: null
        });
      }
      this.lenis = null;
    }
    
    window.lenis = null;
    window.lockScroll = null;
    window.unlockScroll = null;
    
    this.isInitialized = false;
  }
}

/**
 * Инициализация контроллера скролла при загрузке DOM
 */
let scrollControllerInstance = null;

export async function initScrollController(options) {
  if (scrollControllerInstance) {
    return scrollControllerInstance;
  }

  scrollControllerInstance = new ScrollController(options);
  
  // Ждем загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      scrollControllerInstance.init();
    });
  } else {
    await scrollControllerInstance.init();
  }

  return scrollControllerInstance;
}

// Автоматическая инициализация если модуль загружен напрямую
if (typeof window !== 'undefined') {
  // Проверяем, нужно ли автоматически инициализировать
  const shouldAutoInit = document.querySelector('[data-uses-lenis]') !== null || 
                         document.querySelector('script[src*="lenis"]') !== null;
  
  if (shouldAutoInit) {
    initScrollController();
  }
}

