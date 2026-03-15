/**
 * Blog UI — клики по мини-статьям блога + toast «Скоро»
 * Вынесено из main.js.
 */

export function showComingSoonToast() {
  const existing = document.querySelector('.coming-soon-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'coming-soon-toast';
  toast.textContent = '📝 Статья скоро будет доступна';
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: linear-gradient(135deg, #7a00c7 0%, #45c4f9 100%);
    color: #fff;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-weight: 500;
    box-shadow: 0 10px 30px rgba(122, 0, 199, 0.3);
    z-index: 1000;
    opacity: 0;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
  `;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.opacity = '1';
  });

  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(100px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

export function initBlogArticleClicks() {
  const articles = document.querySelectorAll('.blog-article, .blog-stub');
  if (!articles.length) return;

  articles.forEach(article => {
    article.addEventListener('click', (e) => {
      e.preventDefault();
      const slug   = article.dataset.slug;
      const isStub = article.classList.contains('blog-stub')
        || article.querySelector('.stub-placeholder-icon')
        || !slug
        || slug.startsWith('coming-soon');
      if (isStub) {
        showComingSoonToast();
      } else {
        // TODO: window.location.href = `html/article-${slug}.html`;
        showComingSoonToast();
      }
    });
  });
}
