/**
 * Article Page Main
 * Точка входа для страниц статей
 */

// Импортируем библиотеки ПЕРВЫМ делом (gsap, ScrollTrigger, Lenis)
import './lib.js';
import { waitForLibrary } from './core/utils.js';
import { initPagePreloader } from './modules/services-page/page-preloader.js';

let lenisInstance = null;

export function getLenis() {
  return lenisInstance;
}

async function init() {
  try {
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }

    // Прелоадер
    initPagePreloader();

    // Lenis smooth scroll через контроллер (как на главной)
    // ВАЖНО: Используем initScrollController вместо прямого создания Lenis
    // Это обеспечивает правильную интеграцию с ScrollTrigger и предотвращает артефакты
    try {
      const { initScrollController, initScrollProtection } = await import('./modules/scroll/index.js');
      
      // Инициализируем защиту от сброса скролла (для мобильных устройств)
      initScrollProtection();
      
      // Инициализируем контроллер скролла (Lenis)
      lenisInstance = await initScrollController();
      // console.log('✅ Lenis initialized'); // DEBUG: отключено
    } catch (error) {
      // console.warn('Lenis not available:', error); // DEBUG: отключено
    }

    // GSAP
    try {
      // gsap available via import
if (window.gsap && window.ScrollTrigger) {
        window.gsap.registerPlugin(window.ScrollTrigger);
      }
    } catch (error) {
      // console.warn('GSAP not available'); // DEBUG: отключено
    }

    // Header menu
    try {
      const { initHeaderMenu } = await import('./modules/header/index.js');
      initHeaderMenu();
      setupMenuLenisIntegration();
      // console.log('✅ Header initialized'); // DEBUG: отключено
    } catch (error) {
      initSimpleMenu();
    }

    // ScrollFlow для футера
    try {
      const { initScrollFlow } = await import('./modules/scroll/flow.js');
      initScrollFlow();
    } catch (error) {
      // console.warn('ScrollFlow not available'); // DEBUG: отключено
    }

    // Contact form
    try {
      const { initContactForm } = await import('./modules/contacts/index.js');
      initContactForm();
    } catch (error) {
      // console.warn('Contact form not available'); // DEBUG: отключено
    }

    // Инициализация заглушек ориентации
    try {
      const { initOrientationOverlay } = await import('./modules/orientation-overlay.js');
      initOrientationOverlay();
      // console.log('✅ Orientation overlay initialized'); // DEBUG: отключено
    } catch (error) {
      // console.warn('Orientation overlay not available:', error); // DEBUG: отключено
    }

    // Инициализация статьи
    initArticlePage();
    initBlogArticleClicks();

    // console.log('✅ Article page loaded'); // DEBUG: отключено

  } catch (error) {
    console.error('Article page error:', error);
  }
}

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
}

/**
 * Инициализация функционала страницы статьи
 */
function initArticlePage() {
  // Table of Contents smooth scroll
  initTocNavigation();
  
  // Share buttons
  initShareButtons();
  
  // Reading progress
  initReadingProgress();
  
  // Related articles click
  initRelatedArticles();
}

/**
 * Навигация по содержанию
 */
function initTocNavigation() {
  const tocLinks = document.querySelectorAll('.toc-nav a');
  
  tocLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const target = document.querySelector(targetId);
      
      if (target) {
        if (lenisInstance) {
          lenisInstance.scrollTo(target, { offset: -100 });
        } else {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
}

/**
 * Кнопки шаринга
 */
function initShareButtons() {
  const shareButtons = document.querySelectorAll('.share-btn');
  const pageUrl = encodeURIComponent(window.location.href);
  const pageTitle = encodeURIComponent(document.title);
  
  shareButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const shareType = btn.dataset.share;
      let shareUrl = '';
      
      switch(shareType) {
        case 'vk':
          shareUrl = `https://vk.com/share.php?url=${pageUrl}&title=${pageTitle}`;
          break;
        case 'telegram':
          shareUrl = `https://t.me/share/url?url=${pageUrl}&text=${pageTitle}`;
          break;
        case 'copy':
          navigator.clipboard.writeText(window.location.href).then(() => {
            showToast('Ссылка скопирована!');
          });
          return;
      }
      
      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
      }
    });
  });
}

/**
 * Прогресс чтения
 */
function initReadingProgress() {
  const article = document.querySelector('.article-content-body');
  if (!article) return;
  
  // Создаем прогресс-бар
  const progressBar = document.createElement('div');
  progressBar.className = 'reading-progress';
  progressBar.innerHTML = '<div class="reading-progress-bar"></div>';
  document.body.appendChild(progressBar);
  
  const bar = progressBar.querySelector('.reading-progress-bar');
  
  window.addEventListener('scroll', () => {
    const articleRect = article.getBoundingClientRect();
    const articleTop = window.scrollY + articleRect.top;
    const articleHeight = article.offsetHeight;
    const windowHeight = window.innerHeight;
    const scrolled = window.scrollY - articleTop + windowHeight;
    const progress = Math.min(Math.max(scrolled / articleHeight * 100, 0), 100);
    
    bar.style.width = `${progress}%`;
  }, { passive: true });
}

/**
 * Связанные статьи
 */
function initRelatedArticles() {
  const relatedCards = document.querySelectorAll('.related-card');
  
  relatedCards.forEach(card => {
    card.addEventListener('click', () => {
      showToast('Статья скоро будет доступна');
    });
  });
}

/**
 * Клики по мини-статьям в меню
 */
function initBlogArticleClicks() {
  const articles = document.querySelectorAll('.blog-article, .blog-stub');
  
  articles.forEach(article => {
    article.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('📝 Статья скоро будет доступна');
    });
  });
}

/**
 * Показать toast уведомление
 */
function showToast(message) {
  const existingToast = document.querySelector('.article-toast');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.className = 'article-toast';
  toast.textContent = message;
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
  
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.opacity = '1';
  });
  
  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(100px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

init();
