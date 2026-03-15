/**
 * Preloader — единый мастер-таймлайн.
 *
 * Порядок событий:
 *  1. rAF-loop: fill поднимается снизу (0 → 100%)
 *  2. document.readyState === 'complete' → _hide()
 *  3. Один gsap.timeline — всё происходит внутри него:
 *       t=0      логотип начинает расти в hero, фон гаснет
 *       t=0.2    слово «притяжение» выезжает (GSAP, не CSS)
 *       t=0.7    header-intro встраивается прямо в этот же timeline
 *       t=2.0    логотип на месте, таймлайн завершён
 *  4. PRELOADER_COMPLETE диспатчится из timeline (для остальных модулей)
 *
 * Header передаёт свою timeline-фабрику через preloader/bus.js
 * ДО того как прелоадер до неё доберётся — никакого rAF-разрыва.
 */

import { $, isMobileDevice } from '../../core/utils.js';
import { lockScroll, unlockScroll } from '../../core/scroll-lock.js';
import { EVENTS } from '../../core/constants.js';
import { gsap } from '../../lib.js';
/* bus.js больше не используется — header intro запускается по событию PRELOADER_COMPLETE */

/* ─── Preloader ─────────────────────────────────────────────── */

class Preloader {
  constructor() {
    this.el       = null;
    this.fill     = null;
    this.rafId     = null;
    this.progress  = 0;
    this._startTime = null;
  }

  init() {
    try { window.history.scrollRestoration = 'manual'; } catch (_) {}
    window.scrollTo(0, 0);

    lockScroll();

    this.el   = $('#preloader');
    this.fill = this.el && this.el.querySelector('.preloader-fill');

    if (!this.el || !this.fill) {
      unlockScroll();
      window.dispatchEvent(new CustomEvent(EVENTS.PRELOADER_COMPLETE));
      return;
    }

    this._preloadImages().then(() => {
      this.rafId = requestAnimationFrame(this._tick);
    });
  }

  _preloadImages() {
    const imgs    = Array.from(this.el.querySelectorAll('.preloader-base, .preloader-progress'));
    const logoBox = this.el.querySelector('.preloader-logo');
    const done    = () => { if (logoBox) logoBox.classList.add('images-loaded'); };

    if (!imgs.length || imgs.every(i => i.complete && i.naturalHeight)) {
      done();
      return Promise.resolve();
    }
    return Promise.all(imgs.map(img => new Promise(res => {
      if (img.complete && img.naturalHeight) return res();
      img.onload = img.onerror = res;
    }))).then(done);
  }

  // Time-based: скорость не зависит от fps и от нагрузки при парсинге SVG.
  // При frame-based (+0.5/кадр) тяжёлый SVG во второй половине роняет fps
  // и заполнение резко замедляется. Здесь прогресс = elapsed / duration → всегда линейно.
  _tick = (timestamp) => {
    if (!this._startTime) this._startTime = timestamp;
    const elapsed  = timestamp - this._startTime;
    this.progress  = Math.min(100, (elapsed / 2400) * 100); // 2.4s полного заполнения
    this.fill.style.height = this.progress + '%';
    if (this.progress < 100) {
      this.rafId = requestAnimationFrame(this._tick);
    } else {
      this._waitForReady();
    }
  };

  _waitForReady() {
    const check = () => {
      if (document.readyState === 'complete') {
        this._hide();
      } else {
        setTimeout(check, 80);
      }
    };
    check();
  }

  _hide() {
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }

    const logoEl  = this.el.querySelector('.preloader-logo');
    const wordMask  = this.el.querySelector('.word-mask');
    const wordImg   = this.el.querySelector('.word-image');
    const content = this.el.querySelector('.preloader-content');
    const heroEl  = document.querySelector('#hero, .hero, section:first-of-type');

    /* fallback без GSAP */
    if (!logoEl || typeof gsap === 'undefined') {
      unlockScroll();
      this.el.classList.add('hidden', 'preloader-final');
      window.dispatchEvent(new CustomEvent(EVENTS.PRELOADER_COMPLETE));
      return;
    }

    /* ── Вычисляем центр лого ДО перемещения ── */
    const logoRect   = logoEl.getBoundingClientRect();
    const logoCenterX = logoRect.left + logoRect.width / 2;
    const logoCenterY = logoRect.top  + logoRect.height / 2;
    const maxDist     = Math.max(
      Math.hypot(logoCenterX, logoCenterY),
      Math.hypot(window.innerWidth - logoCenterX, logoCenterY),
      Math.hypot(logoCenterX, window.innerHeight - logoCenterY),
      Math.hypot(window.innerWidth - logoCenterX, window.innerHeight - logoCenterY)
    );

    /* ── Создаём отдельный overlay для фона ── */
    const bgOverlay = document.createElement('div');
    Object.assign(bgOverlay.style, {
      position: 'fixed', top: '0', left: '0',
      width: '100vw', height: '100dvh',
      background: '#2E2E33', zIndex: '9998',
      pointerEvents: 'none'
    });
    document.body.insertBefore(bgOverlay, document.body.firstChild);

    // Начальная маска — всё видимо (radius = 0, вся площадь чёрная = visible)
    const mkMask = r =>
      `radial-gradient(circle ${r}px at ${logoCenterX}px ${logoCenterY}px, transparent 0%, transparent 55%, black 100%)`;
    bgOverlay.style.maskImage = mkMask(0);
    bgOverlay.style.webkitMaskImage = mkMask(0);

    // Убираем собственный фон прелоадера (теперь он в overlay)
    this.el.classList.add('bg-overlay-active');

    /* ── перемещаем в hero, z-index 9999 чтобы контент был НАД overlay ── */
    if (heroEl) {
      heroEl.appendChild(this.el);
      Object.assign(this.el.style, {
        position: 'absolute', top: '50%', left: '50%',
        zIndex: '9999', pointerEvents: 'none', transform: '', margin: '0'
      });
    }

    /* ── целевые значения ── */
    const vw          = window.innerWidth;
    const vh          = window.innerHeight;
    const isTabletPro = vw >= 1025 && vw <= 1366;
    const isMobile_   = isMobileDevice({ excludeTablet: false });
    const finalScale  = isTabletPro ? 1.27 : 1;
    const logoY       = vh * 0.05;
    const contentY    = logoY - vh * 0.08;
    const wordY       = isMobile_ ? -vh * 0.02 : 0;

    /* ── начальное состояние одним батчем ── */
    gsap.set(this.el,   { xPercent: -50, yPercent: -50 });
    gsap.set(logoEl,    { scale: 0.233, y: 0, transformOrigin: 'center center', force3D: true });
    if (content) gsap.set(content, { y: 0, force3D: true });
    if (wordMask) gsap.set(wordMask, { clipPath: 'inset(100% 0 0 0)' });
    if (wordImg)  gsap.set(wordImg,  { y: '100%', force3D: true });

    void this.el.offsetHeight;
    this.el.style.willChange = 'transform, opacity';

    /* ── мастер-таймлайн ── */
    const tl = gsap.timeline({
      defaults: { ease: 'power2.out', force3D: true },
      onComplete: () => {
        this.el.style.willChange = '';
        this.el.classList.add('hidden', 'preloader-final');
      }
    });

    /* unlockScroll — когда маска уже раскрылась и лого встало на место */

    /* Ранний event для header intro — pill появляется пока сцена ещё идёт */
    tl.call(() => {
      window.dispatchEvent(new CustomEvent('preloaderHideStart'));
    }, null, 0.3);

    /* Радиальная маска фона — расширяется от центра лого */
    const maskObj = { radius: 0 };
    tl.to(maskObj, {
      radius: maxDist * 1.2,
      duration: 1.0,
      ease: 'power2.inOut',
      onUpdate: () => {
        const m = mkMask(maskObj.radius);
        bgOverlay.style.maskImage = m;
        bgOverlay.style.webkitMaskImage = m;
      },
      onComplete: () => {
        bgOverlay.remove();
        if (this.el) this.el.style.zIndex = '1';
      }
    }, 0);

    /* Лого растёт в hero */
    tl.to(logoEl, {
      scale: finalScale, y: logoY,
      duration: 2.2, ease: 'power1.inOut'
    }, 0);

    if (content) {
      tl.to(content, {
        y: contentY, duration: 2.2, ease: 'power1.inOut'
      }, 0);
    }

    /* Слово всплывает */
    if (wordMask && wordImg) {
      tl.to(wordMask, {
        clipPath: 'inset(0% 0 0 0)',
        duration: 1.4, ease: 'power2.out'
      }, 0.4);
      tl.to(wordImg, {
        y: wordY, duration: 1.8, ease: 'power2.out'
      }, 0.4);
    }

    /* Разблокируем скролл как только маска раскрылась (~1.2s) */
    tl.call(() => { unlockScroll(); }, null, 1.2);

    tl.call(() => {
      window.dispatchEvent(new CustomEvent(EVENTS.PRELOADER_COMPLETE));
    }, null, 3.2);
  }
}

/* ─── singleton ─────────────────────────────────────────────── */
let _instance = null;

export function initPreloader() {
  if (_instance) return _instance;
  _instance = new Preloader();
  _instance.init();
  return _instance;
}

if (typeof window !== 'undefined') initPreloader();
