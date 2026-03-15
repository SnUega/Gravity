/**
 * Конфигурация меню хедера
 * Уникальные значения — общие берутся из core/config.js
 */

import { CONFIG } from '../../core/config.js';

export const MENU_CONFIG = {
  // Брейкпоинты — из core, не дублируем
  BREAKPOINTS: CONFIG.BREAKPOINTS,

  DIMENSIONS: {
    BURGER_SIZE: 64,
    STEM_INITIAL_WIDTH: 64
  },

  ANIMATIONS: {
    DURATION: {
      // Общие — из core, не дублируем
      FAST:   CONFIG.ANIMATIONS.DURATION.FAST,
      NORMAL: CONFIG.ANIMATIONS.DURATION.NORMAL,
      SLOW:   CONFIG.ANIMATIONS.DURATION.SLOW,
      // Уникальные для header — оставляем здесь
      STEM_DROP:        0.65,
      STEM_EXPAND:      0.65,
      INTRO_PAUSE:      0.05,
      RESIZE_DEBOUNCE:  CONFIG.DELAYS.RESIZE,
    }
  },

  CACHE_DURATION: 100
};

