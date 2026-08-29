/**
 * EVENTIFY - Theme Engine (Dark / Light Mode Controller)
 * Handles theme persistence, seamless switching, and chart synchronization.
 */

const Theme = {
  THEME_KEY: 'eventify_theme',

  init() {
    const savedTheme = localStorage.getItem(this.THEME_KEY) || 'dark';
    this.setTheme(savedTheme, false);

    // Bind all theme toggle buttons on DOM load
    document.addEventListener('DOMContentLoaded', () => {
      this.bindToggles();
      this.updateIcons();
    });
  },

  getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  },

  setTheme(theme, dispatch = true) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem(this.THEME_KEY, 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem(this.THEME_KEY, 'dark');
    }

    this.updateIcons();

    if (dispatch) {
      // Notify chart components or listeners of theme change
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: this.getTheme() } }));
    }
  },

  toggle() {
    const current = this.getTheme();
    const next = current === 'light' ? 'dark' : 'light';
    this.setTheme(next, true);
    
    if (typeof UI !== 'undefined' && UI.showToast) {
      UI.showToast(`Switched to ${next === 'light' ? 'Light' : 'Dark'} mode`, 'info', 'Theme Updated');
    }
  },

  bindToggles() {
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn, [data-action="toggle-theme"]');
    toggleBtns.forEach(btn => {
      btn.removeEventListener('click', this.handleToggleClick);
      btn.addEventListener('click', this.handleToggleClick);
    });
  },

  handleToggleClick(e) {
    e.preventDefault();
    Theme.toggle();
  },

  updateIcons() {
    const currentTheme = this.getTheme();
    const toggleIcons = document.querySelectorAll('.theme-toggle-icon');
    toggleIcons.forEach(icon => {
      if (currentTheme === 'light') {
        icon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
        icon.setAttribute('title', 'Switch to Dark Mode');
      } else {
        icon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
        icon.setAttribute('title', 'Switch to Light Mode');
      }
    });
  }
};

// Immediate initialization to avoid flash of unstyled content
Theme.init();
