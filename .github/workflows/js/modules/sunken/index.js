/**
 * Sunken sections — parallax pattern scroll
 * Вынесено из main.js. Подключается к Lenis если доступен.
 */

import { EVENTS } from '../../core/constants.js';

export function initSunkenParallax() {
  const layers = Array.from(
    document.querySelectorAll('.sunken-pattern-layer[data-parallax-speed]')
  );
  if (!layers.length) return;

  const items = layers.map(layer => ({
    el:      layer,
    speed:   parseFloat(layer.dataset.parallaxSpeed) || 0.3,
    section: layer.closest('.sunken-section'),
  })).filter(item => item.section);

  if (!items.length) return;

  let ticking = false;

  function updateParallax() {
    const scrollY  = window.scrollY;
    const vhHalf   = window.innerHeight * 0.5;
    const vhBuffer = window.innerHeight + 200;
    items.forEach(({ el, speed, section }) => {
      const rect = section.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vhBuffer) return;
      const offset = (scrollY - (scrollY + rect.top - vhHalf)) * speed * 0.4;
      el.style.transform = `translateY(${offset}px)`;
    });
    ticking = false;
  }

  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  };

  if (window.lenis) {
    window.lenis.on('scroll', onScroll);
  } else {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener(EVENTS.PRELOADER_COMPLETE, () => {
      if (window.lenis) {
        window.removeEventListener('scroll', onScroll);
        window.lenis.on('scroll', onScroll);
      }
    }, { once: true });
  }

  updateParallax();
}
