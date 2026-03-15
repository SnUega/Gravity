/**
 * Слайдеры для наград и лицензий
 */

import { getSliderData } from './data.js';
import { gsap } from '../../lib.js';

/**
 * Класс для управления слайдерами
 */
export class SlidersManager {
  constructor(context) {
    this.context = context;
  }

  /**
   * Создание HTML слайдера
   */
  createSliderHTML(cardType, data) {
    const items = data.map((item, index) => `
      <div class="slider-item ${index === 0 ? 'active' : ''}" data-index="${index}">
        <img src="${item.image}" alt="${item.description}" class="alr-slider-image">
        <div class="alr-slider-description">${item.description}</div>
      </div>
    `).join('');
    
    return `
      <div class="alr-slider-content">
        <div class="slider-container">
          ${items}
        </div>
        <div class="alr-slider-nav">
          <button class="alr-slider-btn prev" aria-label="Назад"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>
          <button class="alr-slider-btn next" aria-label="Вперёд"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>
        </div>
      </div>
    `;
  }

  /**
   * Настройка навигации слайдера
   */
  setupSliderNavigation(slider, cardType) {
    const prevBtn = slider.querySelector('.prev');
    const nextBtn = slider.querySelector('.next');
    const items = Array.from(slider.querySelectorAll('.slider-item'));
    const nav = slider.querySelector('.alr-slider-nav');
    const container = slider.querySelector('.slider-container');
    if (!prevBtn || !nextBtn || items.length === 0 || !container) return;
    
    let currentIndex = items.findIndex(el => el.classList.contains('active'));
    if (currentIndex < 0) currentIndex = 0;
    let isAnimating = false;
    const GAP_PERCENT = 27;
    
    items.forEach((item, i) => {
      const img = item.querySelector('.alr-slider-image');
      const desc = item.querySelector('.alr-slider-description');
      if (img) gsap.set(img, { xPercent: i === currentIndex ? 0 : (100 + GAP_PERCENT) });
      if (desc) {
        gsap.set(desc, { autoAlpha: i === currentIndex ? 1 : 0, y: i === currentIndex ? 0 : -10, z: i === currentIndex ? 0 : 40, transformPerspective: 400 });
      }
      item.classList.toggle('active', i === currentIndex);
    });
    
    const animateTo = (nextIndex, direction) => {
      if (isAnimating || nextIndex === currentIndex) return;
      isAnimating = true;
      const outgoing = items[currentIndex];
      const incoming = items[nextIndex];
      const outImg = outgoing.querySelector('.alr-slider-image');
      const inImg = incoming.querySelector('.alr-slider-image');
      const outDesc = outgoing.querySelector('.alr-slider-description');
      const inDesc = incoming.querySelector('.alr-slider-description');
      
      const toSign = direction === 'next' ? (100 + GAP_PERCENT) : (-100 - GAP_PERCENT);
      const fromSign = direction === 'next' ? (-100 - GAP_PERCENT) : (100 + GAP_PERCENT);
      
      gsap.set(outgoing, { zIndex: 2 });
      gsap.set(incoming, { zIndex: 1 });
      if (inImg) gsap.set(inImg, { xPercent: fromSign });
      if (inDesc) gsap.set(inDesc, { autoAlpha: 0, y: -10, z: 40, transformPerspective: 400 });
      incoming.classList.add('active');
      
      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
      
      if (outImg) tl.to(outImg, { xPercent: toSign, duration: 0.45, force3D: true }, 0);
      if (inImg) tl.to(inImg, { xPercent: 0, duration: 0.45, force3D: true }, 0);
      
      if (outDesc) tl.to(outDesc, { autoAlpha: 0, y: -8, z: 30, duration: 0.28 }, 0);
      if (inDesc) tl.to(inDesc, { autoAlpha: 1, y: 0, z: 0, duration: 0.36, ease: 'power3.out' }, 0.12);
      
      tl.add(() => {
        outgoing.classList.remove('active');
        currentIndex = nextIndex;
        isAnimating = false;
        const elementsToClean = [outgoing, incoming].filter(el => el != null);
        if (elementsToClean.length > 0) {
          gsap.set(elementsToClean, { clearProps: 'zIndex' });
        }
      });
    };
    
    prevBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const nextIndex = (currentIndex - 1 + items.length) % items.length;
      animateTo(nextIndex, 'prev');
    });
    
    nextBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const nextIndex = (currentIndex + 1) % items.length;
      animateTo(nextIndex, 'next');
    });
  }
}

