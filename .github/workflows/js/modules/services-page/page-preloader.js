import { gsap } from '../../lib.js';
/**
 * Page Preloader Module
 * Быстрый прелоадер для внутренних страниц
 */

// Защита от двойной инициализации
let isInitialized = false;
let preloaderInstance = null;

/**
 * Инициализация прелоадера страницы
 */
export function initPagePreloader() {
  const preloader = document.getElementById('page-preloader');
  
  if (!preloader) {
    // console.log('No page preloader found'); // DEBUG: отключено
    return;
  }
  
  // Защита от двойной инициализации
  if (isInitialized || preloader.dataset.initialized === 'true') {
    return;
  }
  isInitialized = true;
  preloader.dataset.initialized = 'true';
  preloaderInstance = { preloader, hidePreloaderCalled: false };
  
  const fill = preloader.querySelector('.page-preloader-fill');
  const logoElement = preloader.querySelector('.page-preloader-logo');
  
  let hidePreloaderCalled = false;
  let fillAnimationId = null;
  let progress = 0;
  let imagesLoaded = false;
  let imagesLoadPromise = null;
  let mutationObserver = null;
  
  // Предзагрузка изображений прелоадера (как на главной странице)
  const preloadImages = () => {
    const images = preloader.querySelectorAll('.page-preloader-base, .page-preloader-progress');
    
    if (!images.length) {
      imagesLoaded = true;
      if (logoElement) logoElement.classList.add('images-loaded');
      return Promise.resolve();
    }
    
    // Проверяем, все ли изображения уже загружены
    const allLoaded = Array.from(images).every(img => img.complete && img.naturalHeight !== 0);
    
    if (allLoaded) {
      // Если все уже загружены, добавляем класс сразу синхронно
      imagesLoaded = true;
      if (logoElement) {
        logoElement.classList.add('images-loaded');
      }
      return Promise.resolve();
    }
    
    // Иначе ждём загрузки
    const promises = Array.from(images).map(img => {
      return new Promise((resolve) => {
        if (img.complete && img.naturalHeight !== 0) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Resolve even on error to not block
        }
      });
    });
    
    return Promise.all(promises).then(() => {
      imagesLoaded = true;
      if (logoElement && !hidePreloaderCalled) {
        logoElement.classList.add('images-loaded');
      }
    });
  };
  
  // Предзагружаем изображения и сохраняем промис для ожидания
  imagesLoadPromise = preloadImages();
  
  // Радиальное исчезновение от центра логотипа до краев экрана
  const hidePreloader = async () => {
    if (hidePreloaderCalled) return;
    hidePreloaderCalled = true;
    preloaderInstance.hidePreloaderCalled = true;
    
    // Отменяем анимацию заполнения если она еще идет
    if (fillAnimationId) {
      cancelAnimationFrame(fillAnimationId);
      fillAnimationId = null;
    }
    
    // КРИТИЧНО: Ждем завершения загрузки изображений перед началом анимации
    // Это предотвращает race condition, когда класс images-loaded добавляется после начала анимации
    if (imagesLoadPromise) {
      await imagesLoadPromise;
    }
    
    // Устанавливаем MutationObserver для предотвращения добавления класса images-loaded во время анимации
    if (logoElement && typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            if (logoElement.classList.contains('images-loaded')) {
              logoElement.classList.remove('images-loaded');
              logoElement.style.setProperty('opacity', '1', 'important');
            }
          }
        });
      });
      
      mutationObserver.observe(logoElement, {
        attributes: true,
        attributeFilter: ['class']
      });
    }
    
    if (true /* gsap imported */ && logoElement) {
      // Используем двойной requestAnimationFrame для гарантии что DOM готов и все стили применены
      // Это особенно важно при жесткой перезагрузке
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Вычисляем позицию логотипа ДО установки стилей
          const logoRect = logoElement.getBoundingClientRect();
          const logoCenterX = logoRect.left + logoRect.width / 2;
          const logoCenterY = logoRect.top + logoRect.height / 2;
        
          // Радиус для покрытия всего экрана (максимальное расстояние от центра логотипа до угла экрана)
          const maxDistance = Math.max(
            Math.sqrt(logoCenterX * logoCenterX + logoCenterY * logoCenterY),
            Math.sqrt((window.innerWidth - logoCenterX) * (window.innerWidth - logoCenterX) + logoCenterY * logoCenterY),
            Math.sqrt(logoCenterX * logoCenterX + (window.innerHeight - logoCenterY) * (window.innerHeight - logoCenterY)),
            Math.sqrt((window.innerWidth - logoCenterX) * (window.innerWidth - logoCenterX) + (window.innerHeight - logoCenterY) * (window.innerHeight - logoCenterY))
          );
          
          // Начальная маска с маленьким радиусом (размытые границы через градиент)
          const initialMask = `radial-gradient(circle 0px at ${logoCenterX}px ${logoCenterY}px, transparent 0%, transparent 60%, black 100%)`;
          
          // Устанавливаем начальное состояние через прямое изменение стиля
          // НЕ используем gsap.set для маски, чтобы избежать конфликта с GSAP анимацией
          preloader.style.opacity = '1';
          preloader.style.maskImage = initialMask;
          preloader.style.webkitMaskImage = initialMask;
          
                // Отключаем CSS transition для логотипа
          logoElement.style.setProperty('transition', 'none', 'important');
          
          // Убираем класс images-loaded если он есть
          logoElement.classList.remove('images-loaded');
          
          // Поднимаем логотип над маской через z-index, чтобы он анимировался поверх маски
          // Находим контейнер логотипа или сам логотип и поднимаем его
          const logoContainer = logoElement.closest('.page-preloader-content') || logoElement.parentElement;
          if (logoContainer) {
            logoContainer.style.position = 'relative';
            logoContainer.style.zIndex = '10';
          }
          logoElement.style.position = 'relative';
          logoElement.style.zIndex = '10';
          
          // Устанавливаем начальное состояние логотипа
          logoElement.style.setProperty('opacity', '1', 'important');
          logoElement.style.setProperty('transform', 'scale(1)', 'important');
          
          // Принудительный reflow после установки стилей
          void preloader.offsetHeight;
          
          // Создаем timeline для синхронизированных анимаций
          const tl = gsap.timeline({
            onComplete: () => {
              // Отключаем MutationObserver после завершения анимации
              if (mutationObserver) {
                mutationObserver.disconnect();
                mutationObserver = null;
              }
              preloader.classList.add('loaded');
              setTimeout(() => {
                preloader.remove();
              }, 100);
            }
          });
          
          // Логотип исчезает с синхронным увеличением и fade
          // Масштабирование и исчезновение происходят одновременно
          const logoDuration = 0.8;
          const logoEase = 'power2.out';
          
          // УБИРАЕМ opacity из clearProps, чтобы анимация fade работала
          tl.fromTo(logoElement, 
            {
              opacity: 1,
              scale: 1,
              clearProps: 'transition,transform' // Не очищаем opacity, чтобы fade работал
            },
            {
              opacity: 0,
              scale: 1.3, // Увеличиваем масштаб синхронно с исчезновением
              duration: logoDuration,
              ease: logoEase,
              immediateRender: false
            }, 0);
          
          // Маска расширяется синхронно с исчезновением логотипа
          // Логотип находится поверх маски благодаря z-index, поэтому маска его не перекрывает
          const maskObj = { radius: 0 };
          tl.to(maskObj, {
            radius: maxDistance,
            duration: logoDuration, // Та же длительность что и у логотипа
            ease: logoEase, // Та же easing функция для синхронизации
            onUpdate: () => {
              const mask = `radial-gradient(circle ${maskObj.radius}px at ${logoCenterX}px ${logoCenterY}px, transparent 0%, transparent 60%, black 100%)`;
              preloader.style.maskImage = mask;
              preloader.style.webkitMaskImage = mask;
            }
          }, 0); // Начинаем одновременно с логотипом
        });
      });
    } else {
      // Fallback без GSAP - просто fade
      preloader.classList.add('loaded');
      setTimeout(() => {
        preloader.remove();
      }, 600);
    }
  };
  
  // Анимация заполнения - используем тот же алгоритм что на главной странице
  // Ждём загрузки изображений перед началом анимации заполнения
  if (fill) {
    // Сбрасываем начальное состояние
    fill.style.height = '0%';
    progress = 0;
    const maxProgress = 100;
    
    // Используем тот же алгоритм что на главной: плавное увеличение по 0.5% за кадр
    // Но чуть быстрее - увеличиваем на 0.7% за кадр для ускорения
    const animateFill = () => {
      // Ждём загрузки изображений перед началом анимации заполнения
      if (!imagesLoaded) {
        fillAnimationId = requestAnimationFrame(animateFill);
        return;
      }
      
      if (hidePreloaderCalled) {
        if (fillAnimationId) {
          cancelAnimationFrame(fillAnimationId);
          fillAnimationId = null;
        }
        return;
      }
      
      progress += 0.7; // Плавное увеличение по 0.7% за кадр (быстрее чем на главной где 0.5%)
      
      if (progress > maxProgress) {
        progress = maxProgress;
      }
      
      // Вычисляем высоту на основе прогресса (снизу вверх) в процентах
      const currentHeightPercent = (progress / maxProgress) * 100;
      fill.style.height = currentHeightPercent + '%';
      
      if (progress >= maxProgress) {
        // Заполнение завершено - останавливаем анимацию заполнения
        fillAnimationId = null;
      } else {
        // Продолжаем анимацию загрузки
        fillAnimationId = requestAnimationFrame(animateFill);
      }
    };
    
    // Запускаем анимацию заполнения
    fillAnimationId = requestAnimationFrame(animateFill);
  }
  
  // Скрываем после загрузки
  const hidePreloaderFunc = () => {
    if (hidePreloaderCalled) return;
    
    // Ждем завершения заполнения перед запуском fade
    const waitForFillComplete = () => {
      if (progress >= 100 && !hidePreloaderCalled) {
        // Заполнение завершено, запускаем fade
        hidePreloader();
      } else if (progress < 100 && !hidePreloaderCalled) {
        setTimeout(waitForFillComplete, 50);
      }
    };
    
    if (progress < 100) {
      waitForFillComplete();
    } else if (!hidePreloaderCalled) {
      // Заполнение уже завершено, запускаем сразу без задержки
      hidePreloader();
    }
  };
  
  if (document.readyState === 'complete') {
    hidePreloaderFunc();
  } else {
    window.addEventListener('load', hidePreloaderFunc, { once: true });
  }
}

/**
 * Сброс состояния инициализации (для тестирования)
 */
export function resetPagePreloaderState() {
  isInitialized = false;
  preloaderInstance = null;
  const preloader = document.getElementById('page-preloader');
  if (preloader) {
    preloader.removeAttribute('data-initialized');
  }
}

/**
 * Показать прелоадер (для программной навигации)
 */
export function showPagePreloader() {
  // Проверяем, есть ли уже прелоадер
  let preloader = document.getElementById('page-preloader');
  
  if (!preloader) {
    preloader = document.createElement('div');
    preloader.id = 'page-preloader';
    preloader.className = 'page-preloader';
    preloader.innerHTML = `
      <div class="page-preloader-inner">
        <div class="page-preloader-spinner"></div>
      </div>
    `;
    document.body.prepend(preloader);
  }
  
  preloader.classList.remove('loaded');
}
