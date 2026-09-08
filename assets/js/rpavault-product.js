/**
 * RPAVault - Product Redirect & Checkout Engine
 * 
 * Standalone, isolated module for rendering product redirect pages
 * and handling official Gumroad checkout overlays.
 * 
 * Safe for iframe embedding (e.g. Explore Vault modal) and top-level visits.
 * Zero dependency on global site layout; easy to remove at any time.
 */

(function () {
  'use strict';

  // Helper to escape HTML characters
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Load official Gumroad library dynamically (only on product pages)
  function loadGumroadScript(callback) {
    if (window.GumroadLoaded || document.querySelector('script[src*="gumroad.js"]')) {
      if (callback) callback();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://gumroad.com/js/gumroad.js';
    script.async = true;
    script.onload = () => {
      window.GumroadLoaded = true;
      if (window.GumroadOverlay && typeof window.GumroadOverlay.init === 'function') {
        try { window.GumroadOverlay.init(); } catch (e) {}
      }
      if (callback) callback();
    };
    script.onerror = () => {
      console.warn('[RPAVault Product] Gumroad overlay script could not be loaded.');
      if (callback) callback();
    };
    document.head.appendChild(script);
  }

  // Inject scoped stylesheet for product pages
  function injectStyles() {
    if (document.getElementById('rpavault-product-styles')) return;

    const style = document.createElement('style');
    style.id = 'rpavault-product-styles';
    style.textContent = `
      /* Scoped product container styling */
      .rpavault-product-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: calc(100vh - 140px);
        padding: 2rem 1.25rem;
        box-sizing: border-box;
        background: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }

      /* Iframe mode: remove site chrome when framed inside Explore Vault modal */
      body.rpavault-in-iframe .site-header,
      body.rpavault-in-iframe .site-footer,
      body.rpavault-in-iframe .whatsapp-btn,
      body.rpavault-in-iframe #global-loader {
        display: none !important;
      }

      body.rpavault-in-iframe .rpavault-product-wrapper {
        min-height: 100vh;
        padding: 1.5rem 1rem;
        background: #ffffff;
      }

      .rpavault-product-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        max-width: 580px;
        width: 100%;
        padding: 2.25rem;
        box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.07);
        text-align: center;
        box-sizing: border-box;
        position: relative;
        transition: transform 0.2s ease;
      }

      .rpavault-product-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #eff6ff;
        color: #0058b0;
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 6px 14px;
        border-radius: 9999px;
        margin-bottom: 1.25rem;
        border: 1px solid #dbeafe;
      }

      .rpavault-product-img-wrap {
        width: 100%;
        max-height: 260px;
        overflow: hidden;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        background: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .rpavault-product-img {
        width: 100%;
        height: 100%;
        max-height: 260px;
        object-fit: cover;
        display: block;
      }

      .rpavault-product-title {
        font-size: 1.6rem;
        font-weight: 800;
        color: #0f172a;
        line-height: 1.25;
        margin: 0 0 0.85rem 0;
      }

      .rpavault-product-desc {
        font-size: 0.96rem;
        color: #475569;
        line-height: 1.6;
        margin: 0 0 1.75rem 0;
      }

      .rpavault-btn-group {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        align-items: center;
      }

      .rpavault-cta-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: #0058b0;
        color: #ffffff !important;
        font-size: 1.05rem;
        font-weight: 700;
        padding: 14px 32px;
        border-radius: 10px;
        text-decoration: none !important;
        width: 100%;
        max-width: 320px;
        box-shadow: 0 4px 14px rgba(0, 88, 176, 0.25);
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
      }

      .rpavault-cta-btn:hover {
        background: #00458a;
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(0, 88, 176, 0.35);
      }

      .rpavault-sublink {
        font-size: 0.82rem;
        color: #64748b;
        text-decoration: underline;
        cursor: pointer;
        margin-top: 0.25rem;
      }

      .rpavault-sublink:hover {
        color: #0058b0;
      }

      @media (max-width: 640px) {
        .rpavault-product-card {
          padding: 1.5rem;
          border-radius: 16px;
        }
        .rpavault-product-title {
          font-size: 1.35rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Main initializer
  function initProduct(config) {
    const root = document.getElementById('rpavault-product-root');
    if (!root) return;

    // Detect if loaded inside an iframe (like Explore Vault modal)
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      document.body.classList.add('rpavault-in-iframe');
    }

    injectStyles();

    const title = config.title || root.getAttribute('data-title') || 'RPAVault Product';
    const desc = config.description || root.getAttribute('data-description') || 'Access this exclusive template and resource from RPAVault.';
    const image = config.image || root.getAttribute('data-image') || '';
    let targetUrl = config.url || root.getAttribute('data-url') || '';
    const slug = config.slug || root.getAttribute('data-slug') || '';

    // Append ?wanted=true to Gumroad URLs if not already present for immediate checkout overlay
    if (targetUrl && targetUrl.includes('gumroad.com') && !targetUrl.includes('wanted=')) {
      targetUrl += (targetUrl.includes('?') ? '&' : '?') + 'wanted=true';
    }

    // Build the clean, isolated DOM
    root.innerHTML = `
      <div class="rpavault-product-wrapper">
        <div class="rpavault-product-card">
          <div class="rpavault-product-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <span>RPAVault Resource</span>
          </div>

          ${image ? `
            <div class="rpavault-product-img-wrap">
              <img class="rpavault-product-img" src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy" />
            </div>
          ` : ''}

          <h1 class="rpavault-product-title">${escapeHtml(title)}</h1>
          <p class="rpavault-product-desc">${escapeHtml(desc)}</p>

          <div class="rpavault-btn-group">
            <a id="rpavault-cta-button"
               class="gumroad-button rpavault-cta-btn"
               href="${escapeHtml(targetUrl)}"
               target="_blank"
               rel="noopener">
              <span>Claim / Get Access</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>

            <a class="rpavault-sublink" href="${escapeHtml(targetUrl)}" target="_blank" rel="noopener">
              Open directly in new tab
            </a>
          </div>
        </div>
      </div>
    `;

    // Load Gumroad overlay script
    loadGumroadScript(() => {
      // Re-initialize Gumroad overlay triggers on newly injected markup
      if (window.GumroadOverlay && typeof window.GumroadOverlay.init === 'function') {
        try { window.GumroadOverlay.init(); } catch (e) {}
      }

      // If standalone (not in iframe), optionally auto-trigger checkout overlay after slight delay
      if (!isInIframe) {
        setTimeout(() => {
          const ctaBtn = document.getElementById('rpavault-cta-button');
          if (ctaBtn && window.GumroadOverlay) {
            // Attempt auto-open
            ctaBtn.click();
          }
        }, 350);
      }
    });
  }

  // Auto-init on DOMContentLoaded if root element exists
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initProduct({}));
  } else {
    initProduct({});
  }

  // Export to window for manual/dynamic invocation (e.g. from go.html fallback)
  window.RPAVaultProduct = {
    init: initProduct
  };
})();
