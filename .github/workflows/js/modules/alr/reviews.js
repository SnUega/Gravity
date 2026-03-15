/**
 * Карусель отзывов
 */

import { attachTooltip } from './tooltip.js';
import { getSliderData } from './data.js';

/**
 * Класс для управления каруселью отзывов
 */
export class ReviewsManager {
  constructor(context) {
    this.context = context;
  }

  /**
   * Создание карусели отзывов
   */
  createReviewsCarousel() {
    const carousel = document.createElement('div');
    carousel.className = 'alr-reviews-carousel';
    const reviews = getSliderData('reviews');
    
    const topReviews = reviews.slice(0, Math.ceil(reviews.length / 2));
    const bottomReviews = reviews.slice(Math.ceil(reviews.length / 2));
    
    const createItemsHTML = (reviewsData) => reviewsData.map((r) => `
      <div class="alr-review-item">
        <div class="alr-review-avatar">👤</div>
        <div class="alr-review-stars">★★★★★</div>
        <div class="alr-review-text">${r.text}</div>
        <div class="alr-review-author">${r.author}</div>
      </div>
    `).join('');

    const backArrowSvg = '<svg class="alr-back-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12H3M12 19l-7-7 7-7"/></svg>';
    const lockIconSvg = '<svg class="alr-leave-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
    carousel.innerHTML = `
      <div class="alr-reviews-content">
        <div class="alr-reviews-rows">
          <div class="alr-reviews-row" data-row="top">
            <div class="alr-reviews-track">${createItemsHTML(topReviews)}</div>
          </div>
          <div class="alr-reviews-row" data-row="bottom">
            <div class="alr-reviews-track">${createItemsHTML(bottomReviews)}</div>
          </div>
        </div>
        <div class="alr-reviews-footer">
          <button type="button" class="alr-btn alr-reviews-back" data-action="close">
            <span class="alr-back-label">${backArrowSvg} Назад</span>
          </button>
          <span class="alr-reviews-leave-wrap" data-tooltip="Эта функция в разработке" tabindex="0" role="button" aria-label="Оставить отзыв — эта функция в разработке">
            <button type="button" class="alr-btn alr-reviews-leave" disabled aria-disabled="true" tabindex="-1">
              <span class="alr-leave-label">${lockIconSvg} Оставить отзыв</span>
            </button>
          </span>
        </div>
      </div>
    `;


    attachTooltip(carousel.querySelector('.alr-reviews-leave-wrap'));
    this.setupReviewsAutoplay(carousel);
    
    return carousel;
  }

  /**
   * Настройка автопрокрутки отзывов
   */
  setupReviewsAutoplay(carousel) {
    const topRow = carousel.querySelector('[data-row="top"]');
    const bottomRow = carousel.querySelector('[data-row="bottom"]');
    const topTrack = topRow.querySelector('.alr-reviews-track');
    const bottomTrack = bottomRow.querySelector('.alr-reviews-track');
    
    const reviews = getSliderData('reviews');
    const topReviews = reviews.slice(0, Math.ceil(reviews.length / 2));
    const bottomReviews = reviews.slice(Math.ceil(reviews.length / 2));
    
    const itemWidth = 400 + 24;
    
    this.createTopCards(topTrack, topReviews, itemWidth);
    this.createBottomCards(bottomTrack, bottomReviews, itemWidth);
    
    setTimeout(() => {
      this.autoScrollTop(topTrack, topReviews, itemWidth);
      this.autoScrollBottom(bottomTrack, bottomReviews, itemWidth);
    }, 100);
    
    topRow.addEventListener('mouseenter', () => {
      if (topTrack._topAnimation) {
        topTrack._topAnimation.timeScale(0.01);
      }
    });
    topRow.addEventListener('mouseleave', () => {
      if (topTrack._topAnimation) {
        topTrack._topAnimation.timeScale(1);
      }
    });
    bottomRow.addEventListener('mouseenter', () => {
      if (bottomTrack._bottomAnimation) {
        bottomTrack._bottomAnimation.timeScale(0.01);
      }
    });
    bottomRow.addEventListener('mouseleave', () => {
      if (bottomTrack._bottomAnimation) {
        bottomTrack._bottomAnimation.timeScale(1);
      }
    });
  }

  /**
   * Создание карточек для верхнего ряда
   */
  createTopCards(track, reviews, itemWidth) {
    track.innerHTML = '';
    
    for (let i = 0; i < 2; i++) {
      reviews.forEach((review, index) => {
        const card = this.createReviewCard(review, index);
        track.appendChild(card);
      });
    }
    
    const totalWidth = reviews.length * 2 * itemWidth;
    track.style.width = `${totalWidth}px`;
  }

  /**
   * Создание карточек для нижнего ряда
   */
  createBottomCards(track, reviews, itemWidth) {
    track.innerHTML = '';
    
    for (let i = 0; i < 2; i++) {
      reviews.forEach((review, index) => {
        const card = this.createReviewCard(review, index);
        track.appendChild(card);
      });
    }
    
    const totalWidth = reviews.length * 2 * itemWidth;
    track.style.width = `${totalWidth}px`;
  }

  /**
   * Создание карточки отзыва
   */
  createReviewCard(review, index) {
    const card = document.createElement('div');
    card.className = 'alr-review-item';
    card.setAttribute('data-index', index);
    card.innerHTML = `
      <div class="alr-review-avatar">👤</div>
      <div class="alr-review-stars">★★★★★</div>
      <div class="alr-review-text">${review.text}</div>
      <div class="alr-review-author">${review.author}</div>
    `;
    return card;
  }

  /**
   * Автопрокрутка верхнего ряда
   */
  autoScrollTop(track, reviews, itemWidth) {
    const segmentWidth = reviews.length * itemWidth;
    
    gsap.set(track, { x: 0 });
    
    const animation = gsap.to(track, {
      x: -segmentWidth,
      duration: 22.5,
      ease: "none",
      repeat: -1,
      modifiers: {
        x: function(x) {
          return (parseFloat(x) % segmentWidth) + 'px';
        }
      }
    });
    
    track._topAnimation = animation;
  }

  /**
   * Автопрокрутка нижнего ряда
   */
  autoScrollBottom(track, reviews, itemWidth) {
    const segmentWidth = reviews.length * itemWidth;
    
    gsap.set(track, { x: -segmentWidth });
    
    const animation = gsap.to(track, {
      x: 0,
      duration: 22.5,
      ease: "none",
      repeat: -1,
      modifiers: {
        x: function(x) {
          let value = parseFloat(x);
          if (value >= 0) {
            value = value - segmentWidth;
          }
          return (value % segmentWidth) + 'px';
        }
      }
    });
    
    track._bottomAnimation = animation;
  }

}