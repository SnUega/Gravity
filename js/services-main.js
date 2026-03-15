/**
 * Services Page Main
 * Точка входа для страниц услуг (cosmetology, injections, massage)
 * Модульная архитектура аналогичная main.js
 */

// Импортируем библиотеки ПЕРВЫМ делом (gsap, ScrollTrigger, Lenis)
import './lib.js';
import { waitForLibrary } from './core/utils.js';

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
    // Header должен стартовать ДО любых await, чтобы _runStandaloneIntro()
    // успел поставить gsap.set(header, {autoAlpha:0}) до того как
    // page-preloader исчезнет и CSS-стили сделают header видимым.
    const { initPagePreloader } = await import('./modules/services-page/page-preloader.js');
    initPagePreloader();

    // Header инициализируется немедленно, не ожидая других модулей
    try {
      const { initHeaderMenu } = await import('./modules/header/index.js');
      initHeaderMenu();
    } catch (error) {
      initSimpleMenu();
    }

    // Этап 1: Ждем загрузки GSAP (нужен для остальных анимаций)
    try {
      // gsap available via import
if (window.gsap && window.ScrollTrigger) {
        window.gsap.registerPlugin(window.ScrollTrigger);
      }
      // console.log('✅ GSAP loaded'); // DEBUG: отключено
    } catch (error) {
      // console.warn('GSAP not available, some animations may not work'); // DEBUG: отключено
    }

    // Этап 2: Инициализируем компоненты страницы услуг
    try {
      const { initServicesPage } = await import('./modules/services-page/index.js');
      await initServicesPage();
      // console.log('✅ Services page modules loaded'); // DEBUG: отключено
    } catch (error) {
      console.error('Services page modules error:', error); // Оставляем для реальных ошибок
    }

    // Этап 3: Инициализируем Lenis для плавного скролла через контроллер (как на главной)
    try {
      const { initScrollController } = await import('./modules/scroll/index.js');
      lenisInstance = await initScrollController();
      // console.log('✅ Lenis smooth scroll initialized'); // DEBUG: отключено
    } catch (error) {
      // console.warn('Lenis not available, using native scroll:', error); // DEBUG: отключено
    }

    // Этап 4: Lenis-интеграция меню (header уже инициализирован на этапе 0)
    try {
      setupMenuLenisIntegration();
    } catch (error) {
      // console.warn('Menu Lenis integration failed:', error); // DEBUG: отключено
    }

    // Этап 5: Кнопки «Записаться» открывают виджет онлайн-записи
    initBookingWidgetButtons();

    // Этап 6: Инициализация мобильной подсказки
    initMobileHint();

    // Этап 7: Инициализация ScrollFlow для эффекта раскрытия футера (как на главной)
    try {
      const { initScrollFlow } = await import('./modules/scroll/flow.js');
      initScrollFlow();
      // console.log('✅ ScrollFlow initialized'); // DEBUG: отключено
    } catch (error) {
      // console.warn('ScrollFlow not available:', error); // DEBUG: отключено
    }

    // Этап 8: Управление скроллом hero при появлении контактов
    initHeroScrollBehavior();

    // Этап 9: Инициализация формы контактов
    try {
      const { initContactForm } = await import('./modules/contacts/index.js');
      initContactForm();
      // console.log('✅ Contact form initialized'); // DEBUG: отключено
    } catch (error) {
      // console.warn('Contact form not available:', error); // DEBUG: отключено
    }

    // Этап 10: Инициализация заглушек ориентации
    try {
      const { initOrientationOverlay } = await import('./modules/orientation-overlay.js');
      initOrientationOverlay();
      // console.log('✅ Orientation overlay initialized'); // DEBUG: отключено
    } catch (error) {
      // console.warn('Orientation overlay not available:', error); // DEBUG: отключено
    }

    // console.log('✅ All services page modules loaded'); // DEBUG: отключено

  } catch (error) {
    console.error('Services page initialization error:', error);
  }
}


/**
 * Интеграция меню с Lenis
 */
function setupMenuLenisIntegration() {
  const menu = document.querySelector('.navc-menu');
  
  if (!menu || !lenisInstance) return;
  
  // Наблюдаем за изменением класса active
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
  
  // Закрытие по клику на ссылки
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
 * Кнопки «Записаться» в аккордеонах открывают виджет онлайн-записи (Sonline)
 */
function initBookingWidgetButtons() {
  const options = typeof window.sonlineWidgetOptions !== 'undefined'
    ? window.sonlineWidgetOptions
    : { placeid: 999968721 };
  document.querySelectorAll('[data-open-modal="contactModal"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof showSonlineWidget === 'function') {
        showSonlineWidget(options);
      }
    });
  });
}

/**
 * Управление поведением hero при скролле
 * Когда секция контактов появляется, hero "шторкой" уезжает влево
 * Оптимизировано для устранения глитчей
 */
function initHeroScrollBehavior() {
  // Определяем, является ли устройство мобильным
  // ВАЖНО: На мобильных hero находится в начале страницы, поэтому триггер должен быть отключен
  const isMobile = window.innerWidth < 768;
  
  // Отключаем анимацию на мобильных
  // На мобильных устройствах flex перестроен, hero находится в начале страницы,
  // и анимация вызывает дергания
  // Для планшетов в вертикальной ориентации показывается заглушка
  if (isMobile) {
    return; // Не инициализируем анимацию на мобильных
  }
  
  const hero = document.querySelector('.services-hero');
  const contactsSection = document.querySelector('#contacts');
  const servicesListWrapper = document.querySelector('.services-list-wrapper');
  const body = document.body;
  
  if (!hero || !contactsSection || !servicesListWrapper) return;

  let isHeroHidden = false;
  let isTransitioning = false;

  // Отслеживаем когда нижняя граница hero и секции услуг совпадает с нижней границей экрана
  const checkHeroVisibility = () => {
    // Не обновляем во время перехода
    if (isTransitioning) return;
    
    const viewportHeight = window.innerHeight;
    const servicesListRect = servicesListWrapper.getBoundingClientRect();
    
    // Общий триггер для скрытия и возвращения - просто сдвигаем его позже
    const triggerOffset = 70; // Отступ для более позднего срабатывания
    const triggerThreshold = viewportHeight - triggerOffset;
    
    // Триггер срабатывания: когда нижняя граница services-list-wrapper (секция с аккордеонами)
    // совпадает со сдвинутым порогом (т.е. верхняя граница контактов начинает появляться)
    const shouldHide = servicesListRect.bottom <= triggerThreshold;
    
    // Триггер обратной анимации: когда нижняя граница services-list-wrapper
    // снова выше сдвинутого порога (т.е. контакты еще не видны)
    const shouldShow = servicesListRect.bottom > triggerThreshold;
    
    if (shouldHide && !isHeroHidden) {
      // Запускаем анимацию скрытия hero
      isTransitioning = true;
      isHeroHidden = true;
      
      requestAnimationFrame(() => {
        hero.classList.add('hero-hiding');
        body.classList.add('contacts-visible');
        
        setTimeout(() => {
          isTransitioning = false;
        }, 500);
      });
    } else if (shouldShow && isHeroHidden) {
      // Запускаем обратную анимацию (показ hero)
      isTransitioning = true;
      isHeroHidden = false;
      
      requestAnimationFrame(() => {
        hero.classList.remove('hero-hiding');
        body.classList.remove('contacts-visible');
        
        setTimeout(() => {
          isTransitioning = false;
        }, 500);
      });
    }
  };

  // Throttled scroll handler для отслеживания позиции services-list-wrapper
  let scrollTicking = false;
  const handleScroll = () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(() => {
        checkHeroVisibility();
        scrollTicking = false;
      });
    }
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Проверяем при загрузке после небольшой задержки
  setTimeout(checkHeroVisibility, 300);
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
      
      // Удаляем после анимации
      setTimeout(() => {
        hint.remove();
      }, 300);
    }
  };

  // Скрываем при скролле
  window.addEventListener('scroll', hideHint, { passive: true, once: true });
  
  // Скрываем при касании (для тач-устройств)
  window.addEventListener('touchstart', hideHint, { passive: true, once: true });
  
  // Автоматически скрываем через 5 секунд
  setTimeout(() => {
    hideHint();
  }, 5000);
}

/**
 * Инициализация кликов по мини-статьям блога в меню
 * Переход на страницу статьи или показ toast для заглушек
 */
function initBlogArticleClicks() {
  const articles = document.querySelectorAll('.blog-article, .blog-stub');
  
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
        // Переход на страницу статьи (когда будут созданы реальные статьи)
        showComingSoonToast();
        // window.location.href = `article-${slug}.html`;
      }
    });
  });
}

/**
 * Показать toast уведомление "Скоро"
 */
function showComingSoonToast() {
  // Удаляем существующий toast
  const existingToast = document.querySelector('.coming-soon-toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Создаем toast
  const toast = document.createElement('div');
  toast.className = 'coming-soon-toast';
  toast.textContent = '📝 Статья скоро будет доступна';
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: linear-gradient(135deg, #7a00c7 0%, #45c4f9 100%);
    color: #fff;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-weight: 500;
    box-shadow: 0 10px 30px rgba(122, 0, 199, 0.3);
    z-index: 1000;
    opacity: 0;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
  `;
  document.body.appendChild(toast);
  
  // Анимация появления
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.opacity = '1';
  });
  
  // Автоматическое скрытие
  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(100px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

// Запускаем инициализацию
init();

// Инициализация кликов по статьям после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initBlogArticleClicks();
  }, 500);
});
