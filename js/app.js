/**
 * EVENTIFY - Global App Controller
 * Manages layout interactions, sidebar collapsing, mobile drawer, active navigation highlighting, and global events.
 */

const App = {
  init() {
    this.setupActiveNav();
    this.setupSidebar();
    this.setupMobileMenu();
    this.setupLogoutButtons();
    this.setupGlobalSearch();
  },

  // Highlight current page in sidebar navigation
  setupActiveNav() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navItems = document.querySelectorAll('.sidebar .nav-item');

    navItems.forEach(item => {
      const href = item.getAttribute('href');
      if (href) {
        const itemFile = href.split('/').pop();
        if (itemFile === currentPath) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      }
    });
  },

  // Desktop sidebar collapse & persistence
  setupSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const collapseBtn = document.querySelector('.sidebar-collapse-btn');

    if (!sidebar || !collapseBtn) return;

    // Restore saved state
    const isCollapsed = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true';
    if (isCollapsed && window.innerWidth > 768) {
      sidebar.classList.add('collapsed');
    }

    collapseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      sidebar.classList.toggle('collapsed');
      const nowCollapsed = sidebar.classList.contains('collapsed');
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, nowCollapsed ? 'true' : 'false');
      
      // Trigger resize for charts to adjust width cleanly
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 300);
    });
  },

  // Mobile drawer off-canvas menu
  setupMobileMenu() {
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');

    if (!mobileBtn || !sidebar) return;

    // Create backdrop if not present
    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
    }

    const openDrawer = () => {
      sidebar.classList.add('mobile-open');
      backdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeDrawer = () => {
      sidebar.classList.remove('mobile-open');
      backdrop.classList.remove('active');
      document.body.style.overflow = '';
    };

    mobileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDrawer();
    });

    backdrop.addEventListener('click', closeDrawer);

    // Close when clicking nav items on mobile
    sidebar.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 768) closeDrawer();
      });
    });
  },

  // Logout buttons handler
  setupLogoutButtons() {
    document.querySelectorAll('[data-action="logout"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        UI.confirm(
          'Sign Out',
          'Are you sure you want to sign out of Eventify?',
          () => { Auth.logout(); },
          'Sign Out',
          'btn-danger'
        );
      });
    });
  },

  // Global search bar
  setupGlobalSearch() {
    const searchInputs = document.querySelectorAll('.header-search input');
    searchInputs.forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const query = input.value.trim();
          if (query) {
            const isAdmin = window.location.pathname.includes('/admin/');
            const targetUrl = isAdmin ? 'events.html?q=' + encodeURIComponent(query) : 'events.html?q=' + encodeURIComponent(query);
            window.location.href = targetUrl;
          }
        }
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
