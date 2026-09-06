/**
 * EVENTIFY - Reusable UI Engine
 * Controls toasts, modals, shimmer skeleton loaders, dropdowns, and counter animations.
 */

const UI = {
  // Toast Notification System
  showToast(message, type = 'info', title = null, duration = 4000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
      success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
      error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
      warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
      info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
    };

    const defaultTitles = {
      success: 'Success',
      error: 'Error',
      warning: 'Attention',
      info: 'Notification'
    };

    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        <div class="toast-title">${title || defaultTitles[type]}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close">&times;</button>
      <div class="toast-progress" style="animation-duration: ${duration}ms;"></div>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    const removeToast = () => {
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(() => {
        if (toast.parentElement) toast.remove();
      }, 350);
    };

    const autoTimer = setTimeout(removeToast, duration);

    toast.querySelector('.toast-close').addEventListener('click', () => {
      clearTimeout(autoTimer);
      removeToast();
    });
  },

  // Modal Manager
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const firstInput = modal.querySelector('input, select, textarea');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
  },

  closeModal(modalId) {
    const modal = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';
  },

  closeAllModals() {
    document.querySelectorAll('.modal-overlay.active').forEach(m => this.closeModal(m));
  },

  // Confirmation Dialog Modal
  confirm(title, message, onConfirm, confirmBtnText = 'Confirm', confirmBtnClass = 'btn-danger') {
    let confirmModal = document.getElementById('global-confirm-modal');
    if (!confirmModal) {
      confirmModal = document.createElement('div');
      confirmModal.id = 'global-confirm-modal';
      confirmModal.className = 'modal-overlay';
      confirmModal.innerHTML = `
        <div class="modal-container modal-sm">
          <div class="modal-header">
            <h3 class="modal-title" id="confirm-modal-title">Confirm Action</h3>
            <button class="modal-close" onclick="UI.closeModal('global-confirm-modal')">&times;</button>
          </div>
          <div class="modal-body">
            <p id="confirm-modal-message" class="text-secondary"></p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="UI.closeModal('global-confirm-modal')">Cancel</button>
            <button type="button" id="confirm-modal-btn" class="btn">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmModal);
    }

    document.getElementById('confirm-modal-title').textContent = title;
    document.getElementById('confirm-modal-message').textContent = message;
    
    const confirmBtn = document.getElementById('confirm-modal-btn');
    confirmBtn.className = `btn ${confirmBtnClass}`;
    confirmBtn.textContent = confirmBtnText;

    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

    newBtn.addEventListener('click', () => {
      UI.closeModal('global-confirm-modal');
      if (typeof onConfirm === 'function') onConfirm();
    });

    this.openModal('global-confirm-modal');
  },

  // Animated Number Counter
  animateCounter(element, target, prefix = '', suffix = '', duration = 1200) {
    if (!element) return;
    const start = 0;
    const startTime = performance.now();
    const isDecimal = target.toString().includes('.');

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * easeProgress;

      if (isDecimal) {
        element.textContent = `${prefix}${current.toFixed(1)}${suffix}`;
      } else {
        element.textContent = `${prefix}${Math.floor(current).toLocaleString()}${suffix}`;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        if (isDecimal) {
          element.textContent = `${prefix}${target.toFixed(1)}${suffix}`;
        } else {
          element.textContent = `${prefix}${target.toLocaleString()}${suffix}`;
        }
      }
    }

    requestAnimationFrame(update);
  },

  // =========================================================================
  // Shimmer Skeleton Loader System
  // =========================================================================

  createStatsSkeleton(count = 5) {
    return Array(count).fill(0).map(() => `
      <div class="stat-card skeleton-stat-card skeleton-box">
        <div style="display: flex; gap: 1rem; align-items: center; width: 100%; padding: 1.25rem;">
          <div class="skeleton-circle" style="width: 48px; height: 48px; background: rgba(255,255,255,0.08);"></div>
          <div style="flex: 1;">
            <div class="skeleton-text sm" style="margin-bottom: 6px;"></div>
            <div class="skeleton-text lg"></div>
          </div>
        </div>
      </div>
    `).join('');
  },

  createEventCardsSkeleton(count = 4) {
    return Array(count).fill(0).map(() => `
      <div class="event-card skeleton-event-card skeleton-box">
        <div style="height: 180px; width: 100%; background: rgba(255,255,255,0.06);"></div>
        <div style="padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem;">
          <div class="skeleton-text sm"></div>
          <div class="skeleton-text md" style="height: 20px;"></div>
          <div class="skeleton-text sm" style="width: 70%;"></div>
          <div style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
            <div class="skeleton-text sm" style="width: 35%;"></div>
            <div class="skeleton-box" style="width: 80px; height: 32px; border-radius: 6px;"></div>
          </div>
        </div>
      </div>
    `).join('');
  },

  createTableSkeleton(rowCount = 5) {
    return Array(rowCount).fill(0).map(() => `
      <tr>
        <td colspan="8" style="padding: 0.65rem 1.25rem;">
          <div class="skeleton-box skeleton-table-row" style="width: 100%;"></div>
        </td>
      </tr>
    `).join('');
  },

  createChartSkeleton() {
    return `<div class="skeleton-box skeleton-chart" style="width: 100%;"></div>`;
  },

  createProfileSkeleton() {
    return `<div class="skeleton-box skeleton-profile" style="width: 100%;"></div>`;
  },

  // Show Skeleton in a container
  showSkeleton(container, type = 'events', count = 4) {
    if (!container) return;
    container.classList.add('is-loading');

    if (type === 'stats') {
      container.innerHTML = this.createStatsSkeleton(count);
    } else if (type === 'events') {
      container.innerHTML = this.createEventCardsSkeleton(count);
    } else if (type === 'table') {
      container.innerHTML = this.createTableSkeleton(count);
    } else if (type === 'chart') {
      container.innerHTML = this.createChartSkeleton();
    } else if (type === 'profile') {
      container.innerHTML = this.createProfileSkeleton();
    }
  },

  // Simulate loading state with animated shimmer before rendering real content
  simulateLoading(container, renderCallback, type = 'events', count = 4, delay = 400) {
    if (!container) {
      if (typeof renderCallback === 'function') renderCallback();
      return;
    }

    this.showSkeleton(container, type, count);

    setTimeout(() => {
      container.classList.remove('is-loading');
      if (typeof renderCallback === 'function') {
        renderCallback();
      }
    }, delay);
  },

  // HTML Entity Escaper for XSS Protection
  escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // Star Rating HTML Generator
  renderStarRating(rating = 5, maxStars = 5) {
    const num = Math.min(maxStars, Math.max(0, Number(rating) || 5));
    const fullStars = Math.floor(num);
    const hasHalf = (num - fullStars) >= 0.3;
    let starsHtml = '';
    
    for (let i = 1; i <= maxStars; i++) {
      if (i <= fullStars) {
        starsHtml += `<span class="star filled" style="color: #f59e0b;">★</span>`;
      } else if (i === fullStars + 1 && hasHalf) {
        starsHtml += `<span class="star half" style="color: #f59e0b;">★</span>`;
      } else {
        starsHtml += `<span class="star empty" style="color: rgba(255,255,255,0.2);">★</span>`;
      }
    }
    return `<span class="star-rating-display" title="${num.toFixed(1)} out of ${maxStars}">${starsHtml} <span class="rating-num text-xs font-bold" style="margin-left: 2px;">${num.toFixed(1)}</span></span>`;
  },

  // Audio Feedback for Scanner / Actions using Web Audio API
  playBeep(type = 'success') {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08); // E6
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'warning') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(330, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        // Error
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // Audio context might be restricted before interaction
    }
  }
};

// Global Event Listeners initialization
document.addEventListener('DOMContentLoaded', () => {
  // Close Modals on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      UI.closeAllModals();
      document.querySelectorAll('.dropdown-menu.active').forEach(d => d.classList.remove('active'));
    }
  });

  // Close Modals on overlay click
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      UI.closeModal(e.target);
    }
    
    // Close dropdowns if clicked outside
    if (!e.target.closest('.dropdown-wrapper')) {
      document.querySelectorAll('.dropdown-menu.active').forEach(d => d.classList.remove('active'));
    }
  });

  // Toggle Dropdowns
  document.querySelectorAll('[data-toggle="dropdown"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const parent = btn.closest('.dropdown-wrapper');
      if (parent) {
        const menu = parent.querySelector('.dropdown-menu');
        if (menu) {
          document.querySelectorAll('.dropdown-menu.active').forEach(d => {
            if (d !== menu) d.classList.remove('active');
          });
          menu.classList.toggle('active');
        }
      }
    });
  });
});
