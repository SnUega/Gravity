/**
 * Анимации меню хедера
 * Intro анимация и desktop анимация открытия
 *
 * createOpenAnimation — полностью из рабочего бэкапа v0.8.1.1.0
 * runHeaderIntro      — из бэкапа, адаптировано: bookingBtn, событие preloaderHideStart
 */

import { MENU_CONFIG } from './config.js';
import { gsap } from '../../lib.js';
import { forceUnlockScroll } from '../../core/scroll-lock.js';

export class MenuAnimations {
  constructor(elements, helpers) {
    this.elements = elements;
    this.helpers = helpers;
    this.openTl = null;
  }

  /* ═══════════════════════════════════════════════════════════
     createOpenAnimation — 1-в-1 из бэкапа + bookingBtn
     ═══════════════════════════════════════════════════════════ */
  createOpenAnimation() {
    const leftItems = this.elements.menuInner
      ? Array.from(this.elements.menuInner.querySelectorAll('.menu-left h2, .menu-left li'))
      : [];
    const rightItems = this.elements.menuInner
      ? Array.from(this.elements.menuInner.querySelectorAll('.menu-right h2, .blog-container'))
      : [];
    const contactItems = this.elements.menuInner
      ? Array.from(this.elements.menuInner.querySelectorAll('.menu-contacts-section .contact-btn'))
      : [];

    const panelW = this.helpers.getCachedPanelWidth();
    const startW = 64;
    const startInset = ((panelW - startW) / 2 / panelW) * 100;
    const startScale = startW / panelW;

    const contentEls = [
      this.elements.headerLogo,
      this.elements.headerContact,
      this.elements.bookingBtn
    ].filter(Boolean);

    this.openTl = gsap.timeline({
      paused: true,
      defaults: { ease: 'power2.out' },
      onReverseComplete: () => {
        this.elements.menuContainer.classList.remove('active');
        this.elements.burger.classList.remove('active');
        this.elements.menuStem.style.top = '';
        this.elements.menuStem.style.width = '64px';
        this.elements.menuStem.style.height = '0px';
        this.elements.menuContainer.style.top = 'calc(var(--index) * 4)';
        this.elements.menuContainer.style.left = '';
        this.elements.menuContainer.style.transform = '';
        this.elements.menuStem.style.left = '';
        this.elements.menuStem.style.transform = 'translateX(-50%)';
        this.elements.menuPanel.style.clipPath = '';

        this.elements.body.classList.remove('menu-open');
        forceUnlockScroll();
        this.helpers.hideMenuBackdrop();

        // Убираем inline-стили с header — CSS снова управляет размерами
        gsap.set(this.elements.header, {
          clearProps: 'width,height,padding,borderRadius'
        });

        const html = document.documentElement;
        const isIntroActive =
          html.classList.contains('intro-start') ||
          html.classList.contains('intro-animating');

        if (!isIntroActive && contentEls.length) {
          setTimeout(() => {
            gsap.to(contentEls, {
              autoAlpha: 1, y: 0, duration: 0.3, overwrite: true
            });
          }, 100);
        }

        if (this.helpers.onReverseComplete) {
          this.helpers.onReverseComplete();
        }
      }
    });

    this.openTl.eventCallback('onReverseStart', () => {
      gsap.set(this.elements.menuStem, { willChange: 'auto' });
      gsap.set(this.elements.menuPanel, { willChange: 'auto' });
      const currentW = this.helpers.getCurrentStemWidth();
      this.helpers.setPanelClipPath(panelW, currentW);
    });

    this.openTl.eventCallback('onComplete', () => {
      gsap.set(this.elements.menuStem, { willChange: 'auto' });
      gsap.set(this.elements.menuPanel, { willChange: 'auto' });
      if (leftItems.length) gsap.set(leftItems, { willChange: 'auto' });
      if (rightItems.length) gsap.set(rightItems, { willChange: 'auto' });
      if (contactItems.length) gsap.set(contactItems, { willChange: 'auto' });
    });

    const html = document.documentElement;
    const isIntroActive =
      html.classList.contains('intro-animating') ||
      html.classList.contains('intro-start');

    this.openTl
      /* ── t=0  скрываем контент, ставим header в полный размер ── */
      .add(() => {
        if (window.lockScroll) window.lockScroll();
        this.elements.body.classList.add('menu-open');
        if (this.helpers.showMenuBackdrop) this.helpers.showMenuBackdrop();

        if (contentEls.length) {
          gsap.killTweensOf(contentEls);
          gsap.set(contentEls, { autoAlpha: 0, y: -10, immediateRender: true });
        }

        // Убираем intro-классы (tweens убьёт overwrite на .to() при 0.05)
        html.classList.remove('intro-start', 'intro-animating', 'intro-complete');

        // Принудительно ставим header в полный размер (как в бэкапе).
        // getComputedStyle возвращает 64px — обходим вычислением из viewport.
        const vw = window.innerWidth;
        const narrow = vw <= 768;
        const fullW = Math.round(vw * (narrow ? 0.92 : 0.80));
        const row = this.elements.header.querySelector('.navc-row');
        const fullH = row ? row.offsetHeight : 64;
        gsap.set(this.elements.header, {
          width: fullW,
          height: fullH,
          borderRadius: 50,
          padding: 0,
          y: 0,
          autoAlpha: 1,
          clearProps: 'transform'
        });
      }, 0)

      .to(contentEls.length ? contentEls : [{}], {
        autoAlpha: 0, y: -10, duration: 0.2, overwrite: true
      }, 0)

      .add(() => {
        this.elements.burger.classList.add('active');
      }, 0)

      /* ── header → pill (на 0.05 — после gsap.set в callback) ── */
      .to(this.elements.header, {
        width: 64, height: 64, padding: 0, borderRadius: 32,
        duration: 0.5, ease: 'none', overwrite: true
      }, 0.05)

      /* ── menuContainer position ── */
      .add(() => {
        const headerRect = this.elements.header.getBoundingClientRect();
        const circleCenterY = headerRect.top + headerRect.height / 2;
        this.elements.menuContainer.style.top = (circleCenterY - 1) + 'px';
        this.elements.menuContainer.classList.add('active');
        this.elements.menuStem.style.top = '0px';
        this.elements.menuStem.style.left = '50%';
        this.elements.menuStem.style.transform = 'translateX(-50%)';
      }, '>-0.05')

      /* ── stem init ── */
      .add(() => {
        gsap.set(this.elements.menuStem, {
          willChange: 'height, width',
          backgroundColor: '#6b6b73',
          borderWidth: 0, borderStyle: 'none',
          borderRadius: '0 0 32px 32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
        });
        gsap.set(this.elements.menuPanel, { willChange: 'clip-path, transform' });
        gsap.set(this.elements.menuPanel, {
          clipPath: `inset(0 ${startInset}% 0 ${startInset}% round 50px)`,
          '--panelScale': startScale
        });
      }, '>-0.05')

      /* ── stem drop ── */
      .to(this.elements.menuStem, {
        height: '85vh',
        duration: MENU_CONFIG.ANIMATIONS.DURATION.STEM_DROP,
        ease: 'power1.inOut',
        onUpdate: (() => {
          let last = 0;
          return () => {
            const now = performance.now();
            if (now - last < 16) return;
            last = now;
            const currentW = this.helpers.getCurrentStemWidth();
            this.helpers.setPanelClipPath(panelW, currentW);
            gsap.set(this.elements.menuPanel, { '--panelScale': currentW / panelW });
          };
        })()
      }, '>-0.02')

      .add('expandStart')

      .add(() => {
        this.elements.menuStem.style.width = startW + 'px';
        this.elements.menuStem.style.transformOrigin = '50% 0%';
        gsap.set(this.elements.menuPanel, {
          clipPath: `inset(0 ${startInset}% 0 ${startInset}% round 50px)`
        });
        gsap.set(this.elements.menuPanel, { '--panelScale': 1 });
      }, 'expandStart')

      .add(() => {
        const widthTween = gsap.to(this.elements.menuStem, {
          width: panelW,
          duration: MENU_CONFIG.ANIMATIONS.DURATION.STEM_EXPAND,
          ease: 'power1.inOut',
          onUpdate: (() => {
            let last = 0;
            return () => {
              const now = performance.now();
              if (now - last < 16) return;
              last = now;
              const currentW = this.helpers.getCurrentStemWidth();
              this.helpers.setPanelClipPath(panelW, currentW);
              gsap.set(this.elements.menuPanel, { '--panelScale': currentW / panelW });
            };
          })()
        });
        this.openTl.add(widthTween, 'expandStart');
      })

      .add('expandEnd', `expandStart+=${MENU_CONFIG.ANIMATIONS.DURATION.STEM_EXPAND}`)

      .to(this.elements.menuInner, {
        opacity: 1, duration: 0.35, ease: 'power2.out'
      }, 'expandEnd-=0.05')

      .to(this.elements.menuStem, {
        borderWidth: 0, backgroundColor: 'transparent', duration: 0
      }, 'expandStart')

      .add(() => {
        if (leftItems.length) {
          gsap.set(leftItems, { opacity: 0, y: 6, willChange: 'opacity, transform' });
          gsap.to(leftItems, {
            opacity: 1, y: 0, stagger: 0.06, duration: 0.5,
            ease: 'power3.out', overwrite: true
          });
        }
        if (rightItems.length) {
          gsap.set(rightItems, { opacity: 0, y: 6, willChange: 'opacity, transform' });
          gsap.to(rightItems, {
            opacity: 1, y: 0, stagger: 0.06, duration: 0.5,
            ease: 'power3.out', overwrite: true
          });
        }
        if (contactItems.length) {
          gsap.set(contactItems, { opacity: 0, y: 6, willChange: 'opacity, transform' });
          gsap.to(contactItems, {
            opacity: 1, y: 0, stagger: 0.08, duration: 0.5,
            ease: 'power3.out', overwrite: true, delay: 0.1
          });
        }
      }, 'expandEnd-0.04');
  }

  /* ═══════════════════════════════════════════════════════════
     runHeaderIntro — из бэкапа v0.8.1.1.0
     Изменения:
       • bookingBtn в contentEls
       • слушаем preloaderHideStart (ранний, t≈0.3 master-tl)
       • expansion чуть длиннее (1.5s вместо 0.95s)
     ═══════════════════════════════════════════════════════════ */
  runHeaderIntro() {
    try {
      if (
        !this.elements.header || !this.elements.burger ||
        !this.elements.menuContainer || !this.elements.menuStem ||
        !this.elements.menuPanel
      ) return;

      let played = false;
      const html = document.documentElement;

      // Ставим intro-start сразу — pill 64×64 виден пока прелоадер крутится
      html.classList.add('intro-start');

      const contentEls = [
        this.elements.headerLogo,
        this.elements.headerContact,
        this.elements.bookingBtn
      ].filter(Boolean);

      const start = () => {
        if (played) return;
        played = true;

        const hdr = this.elements.header;
        const row = hdr.querySelector('.navc-row');
        const vw  = window.innerWidth;
        const isNarrow = vw <= 768;

        // getComputedStyle для .navc-header возвращает 64px — обходим,
        // вычисляя целевые размеры из CSS-правил и offsetHeight.
        const targetWidthPx = Math.round(vw * (isNarrow ? 0.92 : 0.80));

        // Высота: на мгновение ставим правильную ширину, читаем offsetHeight
        html.classList.remove('intro-start', 'intro-animating', 'intro-complete');
        hdr.style.cssText = 'width:' + targetWidthPx + 'px !important; visibility:hidden';
        void hdr.offsetWidth;
        const targetHeightPx = hdr.offsetHeight;
        hdr.style.cssText = '';

        html.classList.add('intro-start');
        html.classList.add('intro-animating');

        const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

        /* ── Bounce: мячик падает сверху, отскакивает, садится ── */
        gsap.set(hdr, { y: -45, autoAlpha: 1 });

        tl.to(hdr, { y: 4,   duration: 0.35, ease: 'power2.in' })
          .to(hdr, { y: -10,  duration: 0.22, ease: 'sine.out' })
          .to(hdr, { y: 0,    duration: 0.28, ease: 'sine.inOut' });

        /* ── Раскрытие (без padding — у header его нет, он на .navc-row) ── */
        tl.to(hdr, {
          width: targetWidthPx,
          height: targetHeightPx,
          borderRadius: 50,
          duration: 1.1,
          ease: 'power1.inOut'
        });

        /* контент (лого + кнопки) — в конце раскрытия */
        tl.to(contentEls, {
          autoAlpha: 1, y: 0, duration: 0.3
        }, '-=0.2');

        /* cleanup */
        tl.add(() => {
          document.documentElement.classList.add('intro-complete');
          document.documentElement.classList.remove('intro-start', 'intro-animating');
          gsap.set(hdr, { clearProps: 'width,height,borderRadius,y' });

          if (this.elements.body && this.elements.body.classList.contains('menu-open')) {
            gsap.set(contentEls, { autoAlpha: 0, y: -10 });
          }
          setTimeout(() => {
            document.documentElement.classList.remove('intro-complete');
          }, 400);
        });
      };

      /* ── Когда запускать ── */
      const waitForPreloader = () => {
        if (document.getElementById('preloader')) {
          // preloaderHideStart — ранний event (t≈0.3 master-tl).
          // Fallback: preloaderComplete если ранний не придёт.
          let fired = false;
          const go = () => { if (!fired) { fired = true; requestAnimationFrame(start); } };
          window.addEventListener('preloaderHideStart', go, { once: true });
          window.addEventListener('preloaderComplete',  go, { once: true });
        } else if (document.getElementById('page-preloader')) {
          const obs = new MutationObserver(() => {
            if (!document.getElementById('page-preloader')) {
              obs.disconnect();
              requestAnimationFrame(start);
            }
          });
          obs.observe(document.body, { childList: true, subtree: true });
          setTimeout(() => { obs.disconnect(); start(); }, 5000);
        } else {
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(start));
          } else {
            requestAnimationFrame(start);
          }
        }
      };

      waitForPreloader();
    } catch (_) {}
  }

  /**
   * Задаёт стартовые inline-размеры header перед collapse-анимацией.
   * getComputedStyle возвращает 64px — обходим через вычисление из viewport.
   */
  setHeaderFullSize() {
    const hdr = this.elements.header;
    if (!hdr) return;
    const vw = window.innerWidth;
    const narrow = vw <= 768;
    const fullW = Math.round(vw * (narrow ? 0.92 : 0.80));
    const row = hdr.querySelector('.navc-row');
    const fullH = row ? row.offsetHeight : 64;
    hdr.style.width = fullW + 'px';
    hdr.style.height = fullH + 'px';
    hdr.style.borderRadius = '50px';
  }

  getOpenTimeline() {
    return this.openTl;
  }
}
