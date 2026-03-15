/**
 * scroll-lock — единый API блокировки скролла.
 * Lenis регистрирует себя через registerLenis() при инициализации.
 * Все модули используют lockScroll() / unlockScroll() отсюда.
 */

let _lenis = null;
let _lockCount = 0;

export function registerLenis(lenisInstance) {
  _lenis = lenisInstance;
}

export function lockScroll() {
  _lockCount++;
  if (_lockCount > 1) return;
  if (_lenis) {
    _lenis.stop();
  } else {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }
}

export function unlockScroll() {
  if (_lockCount <= 0) return;
  _lockCount--;
  if (_lockCount > 0) return;
  if (_lenis) {
    _lenis.start();
  } else {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }
}

export function forceUnlockScroll() {
  _lockCount = 0;
  if (_lenis) { _lenis.start(); }
  else {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }
}

export function isScrollLocked() {
  return _lockCount > 0;
}

// Обратная совместимость для кода который ещё не мигрировал
if (typeof window !== 'undefined') {
  window.lockScroll   = lockScroll;
  window.unlockScroll = unlockScroll;
}
