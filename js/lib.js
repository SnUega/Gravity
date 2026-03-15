/**
 * lib.js — центральная точка импорта внешних библиотек.
 *
 * Раньше GSAP, ScrollTrigger, Lenis грузились как глобальные <script>-теги
 * и были доступны через window.gsap, window.ScrollTrigger, window.Lenis.
 *
 * Теперь они приходят из npm и импортируются здесь один раз.
 * Все модули проекта импортируют нужное из этого файла.
 *
 * ScrollTrigger регистрируется здесь — один раз для всего приложения.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Draggable } from 'gsap/Draggable';
import Lenis from '@studio-freight/lenis';

// Регистрируем плагины один раз
gsap.registerPlugin(ScrollTrigger, Draggable);

// Экспортируем для использования в модулях
export { gsap, ScrollTrigger, Draggable, Lenis };

// Пишем в window для обратной совместимости с inline-скриптами в HTML
// (Яндекс.Карты и Sonline-виджет не затронуты — они внешние)
window.gsap          = gsap;
window.ScrollTrigger = ScrollTrigger;
window.Draggable     = Draggable;
