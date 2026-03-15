/**
 * preloader/bus.js — шина синхронизации прелоадера и header-intro.
 *
 * Header регистрирует фабрику через registerHeaderIntro(factory).
 * Прелоадер вызывает getHeaderIntro() — получает paused GSAP timeline
 * и сам решает когда сделать .play().
 */

let _factory = null;

export function registerHeaderIntro(factory) {
  _factory = factory;
  if (_debug()) {
    console.log('[Header Intro] registerHeaderIntro: фабрика зарегистрирована');
  }
}

const _debug = () => typeof window !== 'undefined' && (window.__DEBUG_HEADER || /[?&]debug=header/i.test(window.location.search));

export function getHeaderIntro() {
  if (_debug()) {
    console.log('[Header Intro] getHeaderIntro вызван, _factory=', typeof _factory);
  }
  if (typeof _factory === 'function') {
    return _factory();
  }
  if (_debug()) {
    console.warn('[Header Intro] Фабрика не зарегистрирована! Header мог не инициализироваться.');
  }
  return null;
}
