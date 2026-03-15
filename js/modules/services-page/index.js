/**
 * Services Page Module
 * Главный модуль для страниц услуг
 */

export { initAccordions, openAccordion, closeAllAccordions } from './accordion.js';
export { initPagePreloader, showPagePreloader } from './page-preloader.js';

/**
 * Инициализация всех компонентов страницы услуг
 */
export async function initServicesPage() {
  const { initAccordions } = await import('./accordion.js');
  
  // ПРИМЕЧАНИЕ: Прелоадер инициализируется в services-main.js, чтобы избежать двойной инициализации
  // initPagePreloader() вызывается там первым делом
  
  // Инициализируем аккордеоны
  initAccordions();
  
  // console.log('✅ Services page initialized'); // DEBUG: отключено
}
