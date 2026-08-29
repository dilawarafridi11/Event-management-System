/**
 * EVENTIFY - Notifications Controller
 * Handles header notification dropdown, unread count badges, and reading actions.
 */

const NotificationManager = {
  init() {
    this.updateNotificationBadge();
    this.renderNotificationList();

    // Event listener for mark all as read
    const markAllBtn = document.getElementById('mark-all-read-btn');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', (e) => {
        e.preventDefault();
        Storage.markAllNotificationsAsRead();
        this.updateNotificationBadge();
        this.renderNotificationList();
        UI.showToast('All notifications marked as read', 'info');
      });
    }
  },

  updateNotificationBadge() {
    const notifs = Storage.getNotifications();
    const unreadCount = notifs.filter(n => !n.read).length;
    const badgeEl = document.querySelector('.notification-badge');

    if (badgeEl) {
      if (unreadCount > 0) {
        badgeEl.textContent = unreadCount > 9 ? '9+' : unreadCount;
        badgeEl.style.display = 'flex';
      } else {
        badgeEl.style.display = 'none';
      }
    }
  },

  renderNotificationList() {
    const listEl = document.querySelector('.notification-list');
    if (!listEl) return;

    const notifs = Storage.getNotifications();

    if (notifs.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.875rem;">
          No notifications yet
        </div>
      `;
      return;
    }

    listEl.innerHTML = notifs.map(n => `
      <div class="notification-item ${!n.read ? 'unread' : ''}" onclick="NotificationManager.handleItemClick('${n.id}')">
        <div class="notification-icon" style="background: ${n.type === 'success' ? 'var(--success-bg)' : (n.type === 'warning' ? 'var(--warning-bg)' : 'var(--accent-gradient-subtle)')};">
          ${n.icon || '🔔'}
        </div>
        <div class="notification-content">
          <div class="notification-title">${n.title}</div>
          <div class="text-xs text-secondary" style="margin-bottom: 2px;">${n.message}</div>
          <div class="notification-time">${n.time}</div>
        </div>
        ${!n.read ? '<span style="width:8px; height:8px; border-radius:50%; background:var(--accent-primary); flex-shrink:0;"></span>' : ''}
      </div>
    `).join('');
  },

  handleItemClick(id) {
    Storage.markNotificationAsRead(id);
    this.updateNotificationBadge();
    this.renderNotificationList();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  NotificationManager.init();
});
