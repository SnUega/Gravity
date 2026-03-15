/**
 * Мобильные модалки и слайдеры
 */

import { attachTooltip } from './tooltip.js';
import { debounce } from '../../core/utils.js';
import { lockScroll, unlockScroll } from '../../core/scroll-lock.js';
import { getSliderData } from './data.js';
import { gsap } from '../../lib.js';

/**
 * Класс для управления мобильными модалками
 */
export class MobileManager {
  constructor(context) {
    this.context = context;
  }

  /**
   * Открытие карточки на mobile
   */
  openCardMobile(cardType) {
    const modal = this.createMobileModal(cardType);
    document.body.appendChild(modal);
    
    lockScroll();
    
    // Анимация появления без modalManager (он смешивает два механизма блокировки)
    const content = modal.querySelector('.modal-content');
    if (content) {
      content.style.clipPath = 'inset(0 0 100% 0)';
      content.style.opacity = '0';
      content.style.transform = 'translateY(-8px) scale(0.985)';
      content.style.transformOrigin = 'top center';
    }
    modal.style.backgroundColor = 'rgba(0,0,0,0)';

    requestAnimationFrame(() => {
      modal.style.transition = 'background-color 350ms ease';
      modal.style.backgroundColor = 'rgba(0,0,0,0.55)';
      if (content) {
        content.style.transition = 'clip-path 380ms ease, transform 380ms ease, opacity 380ms ease';
        content.style.clipPath = 'inset(0 0 0 0)';
        content.style.opacity = '1';
        content.style.transform = 'translateY(0) scale(1)';
      }
      setTimeout(() => { this.context.isAnimating = false; }, 400);
    });
  }

  /**
   * Закрытие карточки на mobile
   */
  closeCardMobile() {
    const modal = document.querySelector('.alr-mobile-modal');
    if (!modal) return;

    const content = modal.querySelector('.modal-content');
    
    // Анимация закрытия
    modal.style.transition = 'background-color 300ms ease';
    modal.style.backgroundColor = 'rgba(0,0,0,0)';
    if (content) {
      content.style.transition = 'clip-path 300ms ease, transform 300ms ease, opacity 300ms ease';
      content.style.clipPath = 'inset(0 0 100% 0)';
      content.style.opacity = '0';
      content.style.transform = 'translateY(-8px) scale(0.985)';
    }

    setTimeout(() => {
      modal.remove();
      unlockScroll();
      this.context.cardsManager.resetALRState();
      this.context.isAnimating = false;
      this.context.activeCard = null;
    }, 320);
  }

  /**
   * Создание мобильного модального окна
   */
  createMobileModal(cardType) {
    const modal = document.createElement('div');
    modal.className = 'alr-mobile-modal';
    const sliderData = getSliderData(cardType);
    const lockIconSvg = '<svg class="alr-leave-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

    // Используем alr-modal-close вместо modal-close — чтобы modalManager не перехватил
    modal.innerHTML = `
      <div class="modal-content">
        <button class="alr-modal-close" aria-label="Закрыть"></button>
        <div class="modal-body">
          <h2>${cardType === 'awards' ? 'Награды' : cardType === 'licenses' ? 'Лицензии' : 'Отзывы'}</h2>
          <div class="mobile-slider">
            ${this.createMobileSliderHTML(cardType, sliderData, lockIconSvg)}
          </div>
        </div>
      </div>
    `;

    // Закрытие по крестику — напрямую, без modalManager
    const closeBtn = modal.querySelector('.alr-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeCardMobile();
      });
    }

    // Закрытие по клику на backdrop
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeCardMobile();
    });

    this.setupMobileImageSlider(modal);
    attachTooltip(modal.querySelector('.alr-reviews-leave-wrap'));


    return modal;
  }
  /**
   * Создание HTML мобильного слайдера
   */
  createMobileSliderHTML(cardType, data, lockIconSvg = '') {
    if (cardType === 'reviews') {
      return `
        <div class="mobile-slider-wrapper" data-alr-slider="reviews">
          ${data.map((review, index) => `
            <div class="mobile-slider-item ${index === 0 ? 'active' : ''}" data-index="${index}">
              <div class="mobile-slider-container mobile-slider-container--review" data-alr-review-scroll aria-label="Отзыв, при длинном тексте доступна прокрутка">
                <div class="mobile-review-card">
                  <div class="mobile-review-header">
                    <div class="mobile-review-info">
                      <div class="mobile-review-avatar">${review.avatar || '👤'}</div>
                      <div class="mobile-review-author">${review.author}</div>
                    </div>
                    <div class="mobile-review-stars">${review.rating || '★★★★★'}</div>
                  </div>
                  <div class="mobile-review-text">${review.text}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="alr-mobile-reviews-panel">
          <button class="mobile-slider-btn prev" aria-label="Назад"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>
          <span class="alr-reviews-leave-wrap" data-tooltip="Эта функция в разработке" tabindex="0" role="button" aria-label="Оставить отзыв — эта функция в разработке">
            <button type="button" class="alr-btn alr-reviews-leave" disabled aria-disabled="true" tabindex="-1">
              <span class="alr-leave-label">${lockIconSvg} Оставить отзыв</span>
            </button>
          </span>
          <button class="mobile-slider-btn next" aria-label="Вперёд"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>
        </div>
      `;
    } else {
      const items = data.map((item, index) => `
        <div class="mobile-slider-item ${index === 0 ? 'active' : ''}" data-index="${index}">
          <div class="mobile-slider-container">
            <img src="${item.image}" alt="${item.description}" class="mobile-slider-image">
          </div>
          <div class="mobile-slider-description">${item.description}</div>
        </div>
      `).join('');
      
      return `
        <div class="mobile-slider-wrapper">
          ${items}
        </div>
        <div class="mobile-slider-nav">
          <button class="mobile-slider-btn prev" aria-label="Назад"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>
          <button class="mobile-slider-btn next" aria-label="Вперёд"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>
        </div>
      `;
    }
  }

  /**
   * Настройка мобильного слайдера изображений
   */
  setupMobileImageSlider(modal) {
    const items = modal.querySelectorAll('.mobile-slider-item');
    const prevBtn = modal.querySelector('.mobile-slider-btn.prev');
    const nextBtn = modal.querySelector('.mobile-slider-btn.next');
    let currentIndex = 0;

    const wrapper = modal.querySelector('.mobile-slider-wrapper');
    // wrapper размер управляется через flex в CSS

    // recalibrateWrapper не нужен — wrapper управляется через flex: 1
    const recalibrateWrapper = () => {};

    const isReviewsSlider = items[0] && items[0].querySelector('.mobile-review-card');
    const REVIEW_SLIDE_MIN_HEIGHT = 353;

    items.forEach((item, i) => {
      const img = item.querySelector('.mobile-slider-image');
      const desc = item.querySelector('.mobile-slider-description');
      const container = item.querySelector('.mobile-slider-container');

      if (isReviewsSlider) {
        if (i === 0) {
          item.style.position = 'relative';
          item.style.height = 'auto';
          item.style.minHeight = REVIEW_SLIDE_MIN_HEIGHT + 'px';
          item.style.visibility = 'visible';
        } else {
          item.style.position = 'absolute';
          item.style.top = '0';
          item.style.left = '0';
          item.style.width = '100%';
          item.style.height = 'auto';
          item.style.minHeight = REVIEW_SLIDE_MIN_HEIGHT + 'px';
          item.style.visibility = 'hidden';
          item.style.pointerEvents = 'none';
        }
      } else {
        item.style.position = 'absolute';
        item.style.top = '0';
        item.style.left = '0';
        item.style.width = '100%';
        item.style.height = '100%';
        item.style.visibility = i === 0 ? 'visible' : 'hidden';
      }
      item.style.display = 'block';

      if (container) {
        container.style.position = 'relative';
        container.style.overflow = 'hidden';
      }

      if (img) {
        Object.assign(img.style, {
          position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', objectFit: 'cover', willChange: 'transform'
        });
      }

      const reviewCard = item.querySelector('.mobile-review-card');
      const slideContent = img || reviewCard;
      if (slideContent) {
        gsap.set(slideContent, { xPercent: i === 0 ? 0 : 120, force3D: true });
      }

      if (desc) {
        gsap.set(desc, { autoAlpha: i === 0 ? 1 : 0, y: i === 0 ? 0 : 8, scale: i === 0 ? 1 : 0.98, transformPerspective: 400 });
      }

      item.classList.toggle('active', i === 0);
    });

    const imgs = modal.querySelectorAll('img');
    imgs.forEach((im) => {
      im.addEventListener('load', recalibrateWrapper, { once: true });
      im.addEventListener('error', recalibrateWrapper, { once: true });
    });
    const debouncedRecalibrate = debounce(recalibrateWrapper, 250);
    window.addEventListener('resize', debouncedRecalibrate);
    setTimeout(recalibrateWrapper, 0);

    // Nav и кнопки управляются CSS, inline стили не нужны

    let isAnimating = false;

    const animateTo = (nextIndex, direction) => {
      if (isAnimating || nextIndex === currentIndex) return;
      isAnimating = true;
      const outgoing = items[currentIndex];
      const incoming = items[nextIndex];
      const outImg = outgoing.querySelector('.mobile-slider-image');
      const inImg = incoming.querySelector('.mobile-slider-image');
      const outReview = outgoing.querySelector('.mobile-review-card');
      const inReview = incoming.querySelector('.mobile-review-card');
      const outDesc = outgoing.querySelector('.mobile-slider-description');
      const inDesc = incoming.querySelector('.mobile-slider-description');

      const toSign = direction === 'next' ? -120 : 120;
      const fromSign = direction === 'next' ? 120 : -120;

      incoming.style.visibility = 'visible';
      incoming.style.zIndex = '2';
      outgoing.style.zIndex = '1';
      
      const outContent = outImg || outReview;
      const inContent = inImg || inReview;
      if (inContent) gsap.set(inContent, { xPercent: fromSign, force3D: true });
      if (inDesc) gsap.set(inDesc, { autoAlpha: 0, y: 8, scale: 0.985 });
      incoming.classList.add('active');

      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
      if (outContent) tl.to(outContent, { xPercent: toSign, duration: 0.38, force3D: true }, 0);
      if (inContent) tl.to(inContent, { xPercent: 0, duration: 0.38, force3D: true }, 0);
      if (outDesc) tl.to(outDesc, { autoAlpha: 0, y: -6, duration: 0.22 }, 0);
      if (inDesc) tl.to(inDesc, { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: 'power3.out' }, 0.08);

      tl.add(() => {
        outgoing.style.visibility = 'hidden';
        outgoing.style.zIndex = '';
        incoming.style.zIndex = '';
        outgoing.classList.remove('active');
        currentIndex = nextIndex;
        isAnimating = false;
        if (isReviewsSlider) {
          items.forEach((it, idx) => {
            if (idx === currentIndex) {
              it.style.position = 'relative';
              it.style.height = 'auto';
              it.style.minHeight = REVIEW_SLIDE_MIN_HEIGHT + 'px';
              it.style.visibility = 'visible';
              it.style.pointerEvents = '';
            } else {
              it.style.position = 'absolute';
              it.style.top = '0';
              it.style.left = '0';
              it.style.width = '100%';
              it.style.height = 'auto';
              it.style.minHeight = REVIEW_SLIDE_MIN_HEIGHT + 'px';
              it.style.visibility = 'hidden';
              it.style.pointerEvents = 'none';
            }
          });
        }
        recalibrateWrapper();
      });
    };

    prevBtn.addEventListener('click', () => {
      const nextIndex = (currentIndex - 1 + items.length) % items.length;
      animateTo(nextIndex, 'prev');
    });
    
    nextBtn.addEventListener('click', () => {
      const nextIndex = (currentIndex + 1) % items.length;
      animateTo(nextIndex, 'next');
    });
  }

}