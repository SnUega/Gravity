/**
 * Tooltip для кнопок «в разработке».
 * Вешается на элемент с [data-tooltip="текст"].
 * Создаёт fixed-элемент в body при hover/tap — не обрезается никаким overflow:hidden.
 */

let tipEl = null;
let hideTimer = null;

function showTip(text, anchorEl) {
  clearTimeout(hideTimer);
  if (tipEl) tipEl.remove();

  const rect = anchorEl.getBoundingClientRect();
  tipEl = document.createElement('div');
  tipEl.className = 'alr-tip';
  tipEl.textContent = text;
  document.body.appendChild(tipEl);

  // После рендера — вычисляем размер и ставим позицию
  const tw = tipEl.offsetWidth;
  const th = tipEl.offsetHeight;
  let left = rect.left + rect.width / 2 - tw / 2;
  let top  = rect.top - th - 10;

  // Если вылетает за экран — переносим вниз
  if (top < 8) top = rect.bottom + 10;
  // Не вылетать за правый/левый край
  left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));

  tipEl.style.left = left + 'px';
  tipEl.style.top  = top  + 'px';

  // Принудительный reflow → transition
  tipEl.offsetHeight;
  tipEl.classList.add('alr-tip--visible');
}

function hideTip(delay = 0) {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (tipEl) {
      tipEl.classList.remove('alr-tip--visible');
      const t = tipEl; tipEl = null;
      setTimeout(() => t.remove(), 160);
    }
  }, delay);
}

/**
 * Вешает tooltip на элемент wrap с атрибутом data-tooltip.
 * Работает и на десктопе (hover) и на мобильном (tap).
 */
export function attachTooltip(el) {
  if (!el) return;
  const text = el.dataset.tooltip;
  if (!text) return;

  // Десктоп — hover
  el.addEventListener('mouseenter', () => showTip(text, el));
  el.addEventListener('mouseleave', () => hideTip(200));

  // Мобильный — tap
  el.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (tipEl) { hideTip(); return; }
    showTip(text, el);
    hideTip(2500);
  });

  // Клавиатура
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showTip(text, el);
      hideTip(2500);
    }
  });
}
