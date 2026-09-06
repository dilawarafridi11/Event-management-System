/**
 * EVENTIFY — REST API Client & Backend Bridge
 * Communicates with the PHP + MySQL backend endpoints with automatic error handling.
 */

const API = {
  // Compute base API URL relative to current location
  getBaseUrl() {
    // If opened from /admin/ or /user/, go up one level to find /api/
    const path = window.location.pathname;
    if (path.includes('/admin/') || path.includes('/user/') || path.includes('/database/')) {
      return '../api';
    }
    return './api';
  },

  isServerMode: false,

  async checkServerHealth() {
    try {
      const res = await fetch(`${this.getBaseUrl()}/stats/dashboard.php`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        this.isServerMode = (data && data.success === true);
        return this.isServerMode;
      }
    } catch (e) {
      this.isServerMode = false;
    }
    return false;
  },

  async request(endpoint, options = {}) {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {})
    };

    try {
      const res = await fetch(url, {
        ...options,
        headers
      });

      const json = await res.json();
      return json;
    } catch (err) {
      console.warn(`[API] Fallback or network error on ${endpoint}:`, err);
      return { success: false, message: err.message };
    }
  },

  // 1. Authentication
  async login(email, password) {
    return this.request('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async register(userData) {
    return this.request('/auth/register.php', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async getUserProfile(userId) {
    return this.request(`/auth/me.php?user_id=${encodeURIComponent(userId)}`);
  },

  async updateProfile(profileData) {
    return this.request('/auth/me.php', {
      method: 'POST',
      body: JSON.stringify(profileData)
    });
  },

  // 2. Events API
  async getEvents(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/events/index.php${query ? '?' + query : ''}`);
  },

  async getEvent(id) {
    return this.request(`/events/detail.php?id=${encodeURIComponent(id)}`);
  },

  async createEvent(eventData) {
    return this.request('/events/index.php', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  },

  async updateEvent(id, eventData) {
    return this.request(`/events/detail.php?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ ...eventData, action: 'update' })
    });
  },

  async deleteEvent(id) {
    return this.request(`/events/detail.php?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      body: JSON.stringify({ action: 'delete' })
    });
  },

  // 3. Bookings & Gate Scanner API
  async getBookings(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/bookings/index.php${query ? '?' + query : ''}`);
  },

  async getBooking(id) {
    return this.request(`/bookings/detail.php?id=${encodeURIComponent(id)}`);
  },

  async createBooking(bookingData) {
    return this.request('/bookings/index.php', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
  },

  async cancelBooking(id) {
    return this.request(`/bookings/detail.php?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ action: 'cancel' })
    });
  },

  async checkInTicket(code) {
    return this.request('/bookings/checkin.php', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  },

  // 4. Venues API
  async getVenues() {
    return this.request('/venues/index.php');
  },

  async getVenue(id) {
    return this.request(`/venues/detail.php?id=${encodeURIComponent(id)}`);
  },

  async createVenue(venueData) {
    return this.request('/venues/index.php', {
      method: 'POST',
      body: JSON.stringify(venueData)
    });
  },

  async updateVenue(id, venueData) {
    return this.request(`/venues/detail.php?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ ...venueData, action: 'update' })
    });
  },

  async deleteVenue(id) {
    return this.request(`/venues/detail.php?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      body: JSON.stringify({ action: 'delete' })
    });
  },

  // 5. Promo Codes API
  async validatePromo(code, subtotal) {
    return this.request(`/promos/index.php?validate=${encodeURIComponent(code)}&subtotal=${encodeURIComponent(subtotal)}`);
  },

  async getPromos() {
    return this.request('/promos/index.php');
  },

  async savePromo(promoData) {
    return this.request('/promos/index.php', {
      method: 'POST',
      body: JSON.stringify(promoData)
    });
  },

  async deletePromo(codeOrId) {
    return this.request(`/promos/index.php?code=${encodeURIComponent(codeOrId)}`, {
      method: 'DELETE',
      body: JSON.stringify({ action: 'delete', code: codeOrId })
    });
  },

  // 6. Reviews API
  async getReviews(eventId = null) {
    const query = eventId ? `?event_id=${encodeURIComponent(eventId)}` : '';
    return this.request(`/reviews/index.php${query}`);
  },

  async submitReview(reviewData) {
    return this.request('/reviews/index.php', {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  },

  // 7. Dashboard Stats & Platform Settings API
  async getDashboardStats() {
    return this.request('/stats/dashboard.php');
  },

  async getSettings() {
    return this.request('/settings/index.php');
  },

  async saveSettings(settingsData) {
    return this.request('/settings/index.php', {
      method: 'POST',
      body: JSON.stringify(settingsData)
    });
  },

  // 8. Users Management API
  async getUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users/index.php${query ? '?' + query : ''}`);
  },

  async toggleUserStatus(userId, status) {
    return this.request('/users/index.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'toggleStatus', id: userId, status })
    });
  },

  async deleteUser(userId) {
    return this.request(`/users/index.php?id=${encodeURIComponent(userId)}`, {
      method: 'DELETE'
    });
  },

  // 9. Notifications API
  async getNotifications(userId = null) {
    const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    return this.request(`/notifications/index.php${query}`);
  },

  async markNotificationsRead(userId = null) {
    return this.request('/notifications/index.php', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }
};
