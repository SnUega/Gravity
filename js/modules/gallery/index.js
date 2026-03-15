/**
 * Модуль галереи
 * Экспорт галереи изображений
 */

import { Gallery } from './gallery.js';
import { waitForLibrary } from '../../core/utils.js';

/**
 * Данные категорий по умолчанию
 * По 2 слайда на категорию — плейсхолдер до загрузки реальных фото
 */
const defaultCategories = {
  "Здание": [
    "img/gallery-placeholder.PNG",
    "img/gallery-placeholder.PNG"
  ],
  "Интерьер": [
    "img/gallery-placeholder.PNG",
    "img/gallery-placeholder.PNG"
  ],
  "Инъекционная": [
    "img/gallery-placeholder.PNG",
    "img/gallery-placeholder.PNG"
  ],
  "Косметология": [
    "img/gallery-placeholder.PNG",
    "img/gallery-placeholder.PNG"
  ],
  "Массаж": [
    "img/gallery-placeholder.PNG",
    "img/gallery-placeholder.PNG"
  ],
  "Команда": [
    "img/gallery-placeholder.PNG",
    "img/gallery-placeholder.PNG"
  ],
};

/**
 * Инициализация галереи
 */
let galleryInstance = null;

export function initGallery(options = {}) {
  if (galleryInstance) {
    return galleryInstance;
  }

  // Используем категории по умолчанию, если не указаны
  const finalOptions = {
    categories: defaultCategories,
    defaultCategory: 'Здание',
    ...options
  };

  galleryInstance = new Gallery(finalOptions);

  // Ждем загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      galleryInstance.init();
    });
  } else {
    galleryInstance.init();
  }

  // Экспортируем в window для глобального доступа
  if (typeof window !== 'undefined') {
    window.Gallery = galleryInstance;
  }

  return galleryInstance;
}

