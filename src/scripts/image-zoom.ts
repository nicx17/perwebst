/**
 * Lightweight, fast image zoom mechanism for project pages.
 * Applies a click-to-zoom glassmorphism overlay on images.
 * Supports Astro View Transitions.
 */
(() => {
  if ((globalThis as any).__persImageZoomInitialized) return;
  (globalThis as any).__persImageZoomInitialized = true;

  const initZoom = () => {
    const images = document.querySelectorAll<HTMLImageElement>(
      '.project-detail-content img, .article-content img'
    );
    if (images.length === 0) return;

    let overlay = document.getElementById('pers-image-zoom-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pers-image-zoom-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
        cursor: zoom-out;
      `;

      const imgEl = document.createElement('img');
      imgEl.style.cssText = `
        max-width: 90vw;
        max-height: 90vh;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        transform: scale(0.95);
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: none;
      `;
      overlay.appendChild(imgEl);
      document.body.appendChild(overlay);

      overlay.addEventListener('click', () => {
        if (overlay) {
          overlay.style.opacity = '0';
          overlay.style.visibility = 'hidden';
          imgEl.style.transform = 'scale(0.95)';
        }
      });
    }

    const overlayImg = overlay.querySelector('img') as HTMLImageElement;

    images.forEach((img) => {
      // Don't bind multiple times
      if (img.dataset.zoomBound) return;
      img.dataset.zoomBound = '1';

      img.style.cursor = 'zoom-in';
      img.style.transition = 'transform 0.2s ease';

      img.addEventListener('mouseenter', () => {
        img.style.transform = 'translateY(-2px) scale(1.01)';
      });
      img.addEventListener('mouseleave', () => {
        img.style.transform = 'none';
      });

      img.addEventListener('click', (e) => {
        e.preventDefault();
        overlayImg.src = img.src;
        overlayImg.alt = img.alt || 'Zoomed image';
        if (overlay) {
          overlay.style.visibility = 'visible';
          overlay.style.opacity = '1';
          overlayImg.style.transform = 'scale(1)';
        }
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initZoom, { once: true });
  } else {
    initZoom();
  }

  document.addEventListener('astro:page-load', initZoom);
})();
