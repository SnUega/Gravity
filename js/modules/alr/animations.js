/**
 * GSAP анимации для desktop версии ALR
 */

import { getErrorHandler, ERROR_SEVERITY } from '../../core/errors.js';
import { gsap } from '../../lib.js';

/**
 * Inject background decoration into an ALR open panel.
 * - Text/back zone (shutter): hero-style pattern bg
 * - Slider/content zone (contentPanel): large centred logo watermark
 * @param {HTMLElement} el - the panel element
 * @param {'shutter'|'content'} zone - which zone this is
 */
function injectPanelDecor(el, zone = 'content') {
  if (zone === 'shutter') {
    // Single full-bleed pattern — not tiled, like service page hero
    el.style.backgroundImage = `url('img/bg-logo-pattern.JPG')`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundBlendMode = 'normal';
    // Dark overlay so text stays legible over the pattern
    const overlay = document.createElement('div');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.cssText = `
      position: absolute;
      inset: 0;
      background: rgba(18,18,22,0.52);
      pointer-events: none;
      z-index: 0;
    `;
    el.appendChild(overlay);
  } else {
    // Зона слайдера без логотипа на фоне
    el.style.background = '#232328';
  }
}

/**
 * Класс для управления анимациями
 */
export class AnimationsManager {
  constructor(context) {
    this.context = context;
  }

  /**
   * Открытие карточки на desktop
   */
  openCardDesktop(card, cardType) {
    if (cardType === 'reviews') {
      this.openCenterCardSimple(card);
    } else {
      this.context.currentTimeline = gsap.timeline({
        onComplete: () => {
          this.context.isAnimating = false;
        }
      });
      this.openSideCard(card, cardType);
    }
  }

  /**
   * Открытие центральной карточки (Отзывы)
   */
  openCenterCardSimple(card) {
    this.context.cardsManager.resetALRState();
    if (this.context.currentTimeline) {
      this.context.currentTimeline.kill();
    }
    
    this.context.isAnimating = false;
    
    const leftCard  = this.context.cards[0];
    const rightCard = this.context.cards[2];
    const centerCard = this.context.cards[1];
    
    if (this.context.cards && this.context.cards.length > 0) {
      gsap.set(this.context.cards, { xPercent: 0, x: 0, clearProps: 'transform,opacity' });
    }
    if (leftCard)  gsap.set(leftCard,  { xPercent: 0, zIndex: 10 });
    if (rightCard) gsap.set(rightCard, { xPercent: 0, zIndex: 10 });

    // ── Точные координаты через getBoundingClientRect ──
    const wrapRect   = this.context.wrap.getBoundingClientRect();
    const centerRect = centerCard.getBoundingClientRect();

    // Левая половина = левая часть центральной карточки
    const lLeft  = centerRect.left  - wrapRect.left;
    const lWidth = centerRect.width / 2;
    // Правая половина = правая часть центральной карточки
    const rLeft  = lLeft + lWidth;
    const rWidth = lWidth;

    const centerBg = 'linear-gradient(to bottom, #2E2E33 0%, #35353b 100%)';

    const leftHalf = document.createElement('div');
    leftHalf.className = 'alr-center-half-left';
    leftHalf.style.cssText = `
      position: absolute;
      top: 0; height: 100%;
      left: ${lLeft}px; width: ${lWidth}px;
      background: ${centerBg};
      z-index: 3;
      transform-origin: left center;
      overflow: hidden;
      will-change: transform;
    `;

    const rightHalf = document.createElement('div');
    rightHalf.className = 'alr-center-half-right';
    rightHalf.style.cssText = `
      position: absolute;
      top: 0; height: 100%;
      left: ${rLeft}px; width: ${rWidth}px;
      background: ${centerBg};
      z-index: 3;
      transform-origin: right center;
      overflow: hidden;
      will-change: transform;
    `;

    // ── Ракета: в каждой половине показываем свою часть ──
    // Ракета занимает 100% centerCard. Каждая половина = 50% centerCard.
    // Чтобы картинка выглядела непрерывной: width = 200% half = 100% centerCard,
    // leftHalf показывает левую половину (left: 0),
    // rightHalf показывает правую (left: -100%)
    const rocketSrc = centerCard.querySelector('.alr-card-rocket');
    const makeRocket = (isLeft) => {
      if (!rocketSrc) return null;
      const r = document.createElement('img');
      r.src = rocketSrc.src;
      r.setAttribute('aria-hidden', 'true');
      r.style.cssText = `
        position: absolute;
        top: 0; height: 100%;
        left: ${isLeft ? '0' : '-100%'};
        width: 200%;
        object-fit: cover;
        object-position: center top;
        opacity: 0.55;
        pointer-events: none;
        user-select: none;
        mix-blend-mode: luminosity;
      `;
      return r;
    };
    const rLeft2  = makeRocket(true);
    const rRight2 = makeRocket(false);
    if (rLeft2)  leftHalf.appendChild(rLeft2);
    if (rRight2) rightHalf.appendChild(rRight2);

    // ── Тёмный gradient overlay ──
    const makeOverlay = () => {
      const ov = document.createElement('div');
      ov.setAttribute('aria-hidden', 'true');
      ov.style.cssText = `
        position: absolute; inset: 0;
        background: linear-gradient(to top, rgba(30,30,35,0.7) 0%, rgba(30,30,35,0.2) 60%, transparent 100%);
        pointer-events: none; z-index: 1;
      `;
      return ov;
    };
    leftHalf.appendChild(makeOverlay());
    rightHalf.appendChild(makeOverlay());

    const mainContent = centerCard.querySelector('.alr-main-content');
    const titleEl = mainContent && mainContent.querySelector('h3');
    const btnEl = mainContent && mainContent.querySelector('.alr-btn');
    const openSlideTargets = [titleEl, btnEl].filter(Boolean);

    this.context.wrap.appendChild(leftHalf);
    this.context.wrap.appendChild(rightHalf);
    this.context.tempLayers.push(leftHalf, rightHalf);

    this.context.currentTimeline = gsap.timeline({
      onComplete: () => {
        this.context.isAnimating = false;
      }
    });
    
    const panel = document.createElement('div');
    panel.className = 'alr-content-panel alr-reviews-panel';
    panel.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2;
      background: #232328;
      pointer-events: auto;
      overflow: hidden;
      opacity: 1;
      will-change: opacity;
    `;
    injectPanelDecor(panel, 'content');
    
    const carousel = this.context.reviewsManager.createReviewsCarousel();
    panel.appendChild(carousel);
    gsap.set(carousel, { clipPath: 'inset(0 0 0 0)' });
    this.context.wrap.appendChild(panel);
    this.context.tempLayers.push(panel);
    
    this.context.currentTimeline
      .to(openSlideTargets, { y: 14, opacity: 0, duration: 0.25, ease: 'power2.in' }, 0)
      .set(centerCard, { opacity: 0 }, 0.25)
      .to(leftCard, {
        xPercent: -100,
        duration: .7,
        ease: 'power2.out',
        force3D: true
      }, 0)
      .to(rightCard, {
        xPercent: 100,
        duration: .7,
        ease: 'power2.out',
        force3D: true
      }, 0)
      .to(leftHalf, {
        x: '-305%',
        duration: 1.3,
        ease: 'power2.out',
        force3D: true
      }, 0)
      .to(rightHalf, {
        x: '305%',
        duration: 1.3,
        ease: 'power2.out',
        force3D: true
      }, 0)
      .set(this.context.wrap, { gridTemplateColumns: '0fr 1fr 0fr' }, 2.2);

    const backBtn = panel.querySelector('.alr-reviews-back');
    if (backBtn) backBtn.addEventListener('click', () => this.context.cardsManager.closeCard());
  }

  /**
   * Открытие боковой карточки
   */
  openSideCard(card, cardType) {
    const isLeft = cardType === 'awards';
    const otherCards = this.context.cards ? Array.from(this.context.cards).filter(c => c !== card && c != null) : [];
    
    this.context.wrap.classList.add('alr-animating');
    if (otherCards && otherCards.length > 0) {
      gsap.set(otherCards, { zIndex: 6 });
    }
    
    const shutter = document.createElement('div');
    shutter.className = 'alr-shutter';
    shutter.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #232328;
      z-index: 10;
      clip-path: ${isLeft ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)'};
      pointer-events: auto;
      padding: 40px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      text-align: center;
    `;
    injectPanelDecor(shutter, 'shutter');
    
    const detailContent = card.querySelector('.alr-detail-content');
    if (detailContent) {
      shutter.innerHTML = detailContent.innerHTML;
      const contentWrap = document.createElement('div');
      contentWrap.style.cssText = 'position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;width:100%;height:100%;';
      const children = Array.from(shutter.children);
      const backBtn = children.find(el => el.getAttribute('data-action') === 'close');
      const textNodes = children.filter(el => el !== backBtn);
      if (textNodes.length > 0) {
        const textBox = document.createElement('div');
        textBox.className = 'alr-shutter-text-box';
        textNodes.forEach(n => textBox.appendChild(n));
        contentWrap.appendChild(textBox);
      }
      if (backBtn) contentWrap.appendChild(backBtn);
      shutter.appendChild(contentWrap);
      
      if (backBtn) {
        backBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.context.cardsManager.closeCard();
        });
      }
    }
    
    card.appendChild(shutter);
    this.context.tempLayers.push(shutter);
    
    const contentPanel = document.createElement('div');
    contentPanel.className = 'alr-content-panel';
    
    if (isLeft) {
      contentPanel.style.cssText = `
        position: absolute;
        top: 0;
        left: 33.333%;
        height: 100%;
        z-index: 4;
        background: #232328;
        pointer-events: auto;
        width: 66.667%;
        overflow: hidden;
      `;
      contentPanel.classList.add('align-left');
    } else {
      contentPanel.style.cssText = `
        position: absolute;
        top: 0;
        right: 33.333%;
        height: 100%;
        z-index: 4;
        background: #232328;
        pointer-events: auto;
        width: 66.667%;
        overflow: hidden;
      `;
      contentPanel.classList.add('align-right');
    }
    injectPanelDecor(contentPanel, 'content');
    
    const sliderData = this.context.getSliderData(cardType);
    contentPanel.innerHTML = this.context.slidersManager.createSliderHTML(cardType, sliderData);
    this.context.wrap.appendChild(contentPanel);
    this.context.tempLayers.push(contentPanel);

    const panelStart = 0.4;

    if (!shutter || !contentPanel) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error('Failed to create shutter or contentPanel'), {
        module: 'alr-animations',
        severity: ERROR_SEVERITY.MEDIUM,
        context: { action: 'openCardDesktop', cardType },
        userMessage: null
      });
      this.context.isAnimating = false;
      return;
    }
    
    this.context.currentTimeline = gsap.timeline();
    
    this.context.currentTimeline.to(shutter, {
      clipPath: isLeft ? 'inset(0 0% 0 0)' : 'inset(0 0 0 0%)',
      duration: 0.4,
      ease: this.context.EASE,
      force3D: true
    }, 0);
    
    if (otherCards && Array.isArray(otherCards) && otherCards.length > 0) {
      const validCards = otherCards.filter(card => card && card.nodeType === 1);
      if (validCards.length > 0) {
        this.context.currentTimeline.to(validCards, {
          xPercent: isLeft ? 200 : -200,
          duration: 0.8,
          ease: this.context.EASE,
          force3D: true
        }, panelStart);
      }
    }
    
    this.context.slidersManager.setupSliderNavigation(contentPanel, cardType);
    
    this.context.currentTimeline.call(() => {
      if (this.context.wrap) {
        this.context.wrap.classList.remove('alr-animating');
      }
      if (otherCards && otherCards.length > 0) {
        gsap.set(otherCards, { clearProps: 'zIndex' });
      }
      if (contentPanel) {
        const sliderRoot = contentPanel.querySelector('.alr-slider-content');
        if (sliderRoot) {
          const event = new Event('resize');
          window.dispatchEvent(event);
        }
      }
    }, 1.2);
    
    this.context.currentTimeline.call(() => {
      this.context.isAnimating = false;
    }, 1.1);
  }

  /**
   * Закрытие карточки на desktop
   */
  closeCardDesktop() {
    if (this.context.activeCard && this.context.activeCard.dataset.card === 'reviews') {
      const leftCard = this.context.cards[0];
      const rightCard = this.context.cards[2];
      const leftHalf = document.querySelector('.alr-center-half-left');
      const rightHalf = document.querySelector('.alr-center-half-right');
      
      this.context.currentTimeline = gsap.timeline({
        onComplete: () => {
          if (this.context.cards && this.context.cards.length > 0) {
            gsap.set(this.context.cards, {
              xPercent: 0,
              x: 0,
              clearProps: 'transform,zIndex'
            });
          }
          
          this.context.cardsManager.cleanupAfterClose();

          const centerCard = this.context.cards[1];
          const mainContent = centerCard && centerCard.querySelector('.alr-main-content');
          const titleEl = mainContent && mainContent.querySelector('h3');
          const btnEl = mainContent && mainContent.querySelector('.alr-btn');

          gsap.set(centerCard, { opacity: 1 });
          if (titleEl || btnEl) {
            gsap.set([titleEl, btnEl].filter(Boolean), { y: 14, opacity: 1 });
            gsap.to([titleEl, btnEl].filter(Boolean), {
              y: 0,
              duration: 0.35,
              ease: 'power2.out',
              clearProps: 'transform',
              onComplete: () => { this.context.isAnimating = false; }
            });
          } else {
            this.context.isAnimating = false;
          }
        }
      });
      
      this.context.currentTimeline
        .set(this.context.wrap, { gridTemplateColumns: '1fr 1fr 1fr' }, 0)
        .to(leftHalf, {
          x: 0,
          duration: 1.55,
          ease: 'power2.out',
          force3D: true
        }, 0)
        .to(rightHalf, {
          x: 0,
          duration: 1.55,
          ease: 'power2.out',
          force3D: true
        }, 0)
        .to(leftCard, {
          xPercent: 0,
          duration: 1.0,
          ease: 'power2.out',
          force3D: true
        }, 0)
        .to(rightCard, {
          xPercent: 0,
          duration: 1.0,
          ease: 'power2.out',
          force3D: true
        }, 0);
      
      return;
    }

    if (this.context.currentTimeline) {
      this.context.currentTimeline.reverse();
      this.context.currentTimeline.eventCallback('onReverseComplete', () => {
        this.context.cardsManager.cleanupAfterClose();
      });
      this.context.currentTimeline.eventCallback('onReverseStart', () => {
        const card = this.context.activeCard;
        const otherCards = this.context.cards ? Array.from(this.context.cards).filter(c => c !== card && c != null) : [];
        if (this.context.wrap) {
          this.context.wrap.classList.add('alr-animating');
        }
        if (otherCards && otherCards.length > 0) {
          gsap.set(otherCards, { zIndex: 6 });
        }
      });
    } else {
      this.context.cardsManager.cleanupAfterClose();
    }
  }
}