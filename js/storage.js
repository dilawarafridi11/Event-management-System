/**
 * EVENTIFY - LocalStorage Database & Seed Manager
 * Provides complete client-side data persistence with realistic initial seed data.
 */

const STORAGE_KEYS = {
  EVENTS: 'eventify_events',
  USERS: 'eventify_users',
  BOOKINGS: 'eventify_bookings',
  VENUES: 'eventify_venues',
  FAVORITES: 'eventify_favorites',
  NOTIFICATIONS: 'eventify_notifications',
  SETTINGS: 'eventify_settings',
  PROMOS: 'eventify_promos',
  REVIEWS: 'eventify_reviews',
  THEME: 'eventify_theme',
  ADMIN_SESSION: 'eventify_admin_session',
  USER_SESSION: 'eventify_user_session',
  SIDEBAR_COLLAPSED: 'eventify_sidebar_collapsed'
};

// Seed Data Definition
const INITIAL_SEED_DATA = {
  events: [],
  venues: [],
  users: [
    {
      id: 'USR-101',
      name: 'Alexander Wright',
      email: 'admin@eventify.com',
      password: 'admin123',
      role: 'SuperAdmin',
      phone: '+1 (555) 019-2834',
      location: 'San Francisco, CA',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      registeredDate: '2025-11-15',
      eventsBooked: 0,
      status: 'Active'
    }
  ],
  bookings: [],
  notifications: [],
  favorites: [],
  promos: [],
  reviews: [],
  settings: {
    siteTitle: 'Eventify Platform',
    currency: 'PKR ',
    taxRate: 8.5,
    emailNotifications: true,
    smsAlerts: false,
    autoConfirmBookings: true,
    stripeEnabled: true,
    paypalEnabled: true
  }
};

/**
 * Storage Service Controller
 */
const Storage = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_SEED_DATA.events));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_SEED_DATA.users));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(INITIAL_SEED_DATA.bookings));
    }
    if (!localStorage.getItem(STORAGE_KEYS.VENUES)) {
      localStorage.setItem(STORAGE_KEYS.VENUES, JSON.stringify(INITIAL_SEED_DATA.venues));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROMOS)) {
      localStorage.setItem(STORAGE_KEYS.PROMOS, JSON.stringify(INITIAL_SEED_DATA.promos));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(INITIAL_SEED_DATA.reviews));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_SEED_DATA.notifications));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FAVORITES)) {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(INITIAL_SEED_DATA.favorites));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SEED_DATA.settings));
    }
  },

  // Reset to initial seeds
  resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_SEED_DATA.events));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_SEED_DATA.users));
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(INITIAL_SEED_DATA.bookings));
    localStorage.setItem(STORAGE_KEYS.VENUES, JSON.stringify(INITIAL_SEED_DATA.venues));
    localStorage.setItem(STORAGE_KEYS.PROMOS, JSON.stringify(INITIAL_SEED_DATA.promos));
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(INITIAL_SEED_DATA.reviews));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_SEED_DATA.notifications));
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(INITIAL_SEED_DATA.favorites));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SEED_DATA.settings));
  },

  // Currency & Formatting Helpers
  getCurrency() {
    const settings = this.getSettings();
    return settings && settings.currency ? settings.currency : 'PKR ';
  },

  formatPrice(amount) {
    const curr = this.getCurrency();
    const num = Number(amount) || 0;
    if (num === 0) return 'Free';
    return `${curr}${num.toFixed(2).replace(/\.00PKR /, '')}`;
  },

  // Events CRUD
  getEvents() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS)) || [];
    } catch {
      return [];
    }
  },
  getEventById(id) {
    return this.getEvents().find(e => e.id === id) || null;
  },
  saveEvent(eventData) {
    const events = this.getEvents();
    if (eventData.id) {
      const idx = events.findIndex(e => e.id === eventData.id);
      if (idx !== -1) {
        events[idx] = { ...events[idx], ...eventData, updatedAt: new Date().toISOString() };
      } else {
        events.unshift(eventData);
      }
    } else {
      eventData.id = 'EVT-' + Math.floor(1000 + Math.random() * 9000);
      eventData.createdAt = new Date().toISOString().split('T')[0];
      eventData.bookedSeats = 0;
      events.unshift(eventData);
    }
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    return eventData;
  },
  deleteEvent(id) {
    const events = this.getEvents().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    return true;
  },

  // Venues CRUD
  getVenues() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.VENUES)) || [];
    } catch {
      return [];
    }
  },
  getVenueById(id) {
    return this.getVenues().find(v => v.id === id) || null;
  },
  saveVenue(venueData) {
    const venues = this.getVenues();
    if (venueData.id) {
      const idx = venues.findIndex(v => v.id === venueData.id);
      if (idx !== -1) venues[idx] = { ...venues[idx], ...venueData };
      else venues.unshift(venueData);
    } else {
      venueData.id = 'VEN-' + Math.floor(10 + Math.random() * 90);
      venues.unshift(venueData);
    }
    localStorage.setItem(STORAGE_KEYS.VENUES, JSON.stringify(venues));
    return venueData;
  },
  deleteVenue(id) {
    const venues = this.getVenues().filter(v => v.id !== id);
    localStorage.setItem(STORAGE_KEYS.VENUES, JSON.stringify(venues));
    return true;
  },

  // Users CRUD
  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    } catch {
      return [];
    }
  },
  getUserById(id) {
    return this.getUsers().find(u => u.id === id) || null;
  },
  getUserByEmail(email) {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },
  saveUser(userData) {
    const users = this.getUsers();
    if (userData.id) {
      const idx = users.findIndex(u => u.id === userData.id);
      if (idx !== -1) users[idx] = { ...users[idx], ...userData };
      else users.unshift(userData);
    } else {
      userData.id = 'USR-' + Math.floor(100 + Math.random() * 900);
      userData.registeredDate = new Date().toISOString().split('T')[0];
      userData.eventsBooked = 0;
      userData.status = userData.status || 'Active';
      users.unshift(userData);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return userData;
  },
  deleteUser(id) {
    const users = this.getUsers().filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return true;
  },

  // Bookings CRUD
  getBookings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS)) || [];
    } catch {
      return [];
    }
  },
  getUserBookings(userId, userEmail) {
    return this.getBookings().filter(b => b.userId === userId || b.userEmail === userEmail);
  },
  createBooking(bookingData) {
    const event = this.getEventById(bookingData.eventId);
    if (!event) {
      throw new Error('Selected event was not found.');
    }

    const availableSeats = Math.max(0, event.capacity - (event.bookedSeats || 0));
    const requestedTickets = Number(bookingData.tickets) || 1;
    if (requestedTickets > availableSeats) {
      throw new Error(`Only ${availableSeats} seat(s) remain available for this event.`);
    }

    const bookings = this.getBookings();
    bookingData.id = 'BKG-' + Math.floor(1000 + Math.random() * 9000);
    bookingData.bookingDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
    bookingData.qrCodeData = `EVTIFY-${bookingData.id}-${(bookingData.userName || 'GUEST').toUpperCase()}-${bookingData.eventId}`;
    bookingData.bookingStatus = bookingData.bookingStatus || 'Confirmed';
    bookingData.paymentStatus = bookingData.paymentStatus || 'Paid';
    bookingData.checkInStatus = 'Pending';
    bookingData.tierName = bookingData.tierName || 'General Admission';
    bookingData.discountAmount = bookingData.discountAmount || 0;
    
    // Update seat count on event
    event.bookedSeats = (event.bookedSeats || 0) + requestedTickets;
    this.saveEvent(event);

    // Increment user booking count
    if (bookingData.userId) {
      const user = this.getUserById(bookingData.userId);
      if (user) {
        user.eventsBooked = (user.eventsBooked || 0) + 1;
        this.saveUser(user);
      }
    }

    bookings.unshift(bookingData);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

    // Add notification
    this.addNotification({
      title: 'Booking Confirmed!',
      message: `Your booking for ${bookingData.eventTitle} (${bookingData.tickets} ticket(s)) has been confirmed.`,
      type: 'success',
      icon: '<i class="fa-solid fa-ticket"></i>'
    });

    return bookingData;
  },
  updateBookingStatus(bookingId, status) {
    const bookings = this.getBookings();
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx !== -1) {
      bookings[idx].bookingStatus = status;
      if (status === 'Cancelled') {
        // Return seats
        const event = this.getEventById(bookings[idx].eventId);
        if (event && event.bookedSeats >= bookings[idx].tickets) {
          event.bookedSeats -= bookings[idx].tickets;
          this.saveEvent(event);
        }
      }
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
      return bookings[idx];
    }
    return null;
  },
  deleteBooking(id) {
    const bookings = this.getBookings().filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    return true;
  },

  // Gate Check-In Scanner Engine
  checkInTicket(ticketCodeOrId) {
    if (!ticketCodeOrId) {
      return { success: false, status: 'INVALID', message: 'No ticket code provided' };
    }
    const cleanCode = ticketCodeOrId.trim();
    const bookings = this.getBookings();

    const booking = bookings.find(b => 
      b.id.toUpperCase() === cleanCode.toUpperCase() || 
      (b.qrCodeData && b.qrCodeData.toUpperCase() === cleanCode.toUpperCase())
    );

    if (!booking) {
      return {
        success: false,
        status: 'NOT_FOUND',
        message: 'Invalid pass! Ticket not found in database.'
      };
    }

    if (booking.bookingStatus === 'Cancelled') {
      return {
        success: false,
        status: 'CANCELLED',
        message: 'Admission Denied: This booking was cancelled and refunded.',
        booking
      };
    }

    if (booking.checkInStatus === 'Checked-In') {
      return {
        success: false,
        status: 'ALREADY_CHECKED_IN',
        message: `Already Used! Checked in previously at ${booking.checkedInAt || 'Gate'}.`,
        booking
      };
    }

    // Mark checked in
    booking.checkInStatus = 'Checked-In';
    booking.checkedInAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

    return {
      success: true,
      status: 'VALID',
      message: 'Verified Valid Pass! Welcome to the event.',
      booking
    };
  },

  // Promo Codes CRUD & Validation
  getPromos() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROMOS)) || [];
    } catch {
      return [];
    }
  },
  validatePromo(code, subtotal) {
    if (!code) return { valid: false, message: 'Please enter a promo code.' };
    const promos = this.getPromos();
    const promo = promos.find(p => p.code.toUpperCase() === code.trim().toUpperCase() && p.active);

    if (!promo) {
      return { valid: false, message: 'Invalid or expired promo code.' };
    }

    if (promo.minPurchase && subtotal < promo.minPurchase) {
      return { valid: false, message: `Minimum purchase of ${this.formatPrice(promo.minPurchase)} required for code ${promo.code}.` };
    }

    let discountAmount = 0;
    if (promo.discountType === 'percent') {
      discountAmount = (subtotal * promo.discountValue) / 100;
    } else {
      discountAmount = Math.min(subtotal, promo.discountValue);
    }
    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalTotal = Math.max(0, subtotal - discountAmount);

    return {
      valid: true,
      promo,
      discountAmount,
      finalTotal,
      message: `Promo code ${promo.code} applied! Saved ${this.formatPrice(discountAmount)}.`
    };
  },
  savePromo(promoData) {
    const promos = this.getPromos();
    promoData.code = promoData.code.trim().toUpperCase();
    const idx = promos.findIndex(p => p.code === promoData.code);
    if (idx !== -1) promos[idx] = { ...promos[idx], ...promoData };
    else promos.unshift(promoData);
    localStorage.setItem(STORAGE_KEYS.PROMOS, JSON.stringify(promos));
    return promoData;
  },
  deletePromo(code) {
    const promos = this.getPromos().filter(p => p.code !== code.toUpperCase());
    localStorage.setItem(STORAGE_KEYS.PROMOS, JSON.stringify(promos));
    return true;
  },

  // Reviews & Rating Engine
  getReviews() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.REVIEWS)) || [];
    } catch {
      return [];
    }
  },
  getEventReviews(eventId) {
    return this.getReviews().filter(r => r.eventId === eventId);
  },
  addEventReview(reviewData) {
    const reviews = this.getReviews();
    reviewData.id = 'REV-' + Date.now();
    reviewData.date = new Date().toISOString().split('T')[0];
    reviews.unshift(reviewData);
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));

    // Recalculate event rating
    const event = this.getEventById(reviewData.eventId);
    if (event) {
      const eventRevs = reviews.filter(r => r.eventId === reviewData.eventId);
      const avg = eventRevs.reduce((sum, r) => sum + Number(r.rating), 0) / eventRevs.length;
      event.rating = Math.round(avg * 10) / 10;
      event.reviewCount = eventRevs.length;
      this.saveEvent(event);
    }

    return reviewData;
  },

  // Favorites
  getFavorites() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES)) || [];
    } catch {
      return [];
    }
  },
  toggleFavorite(eventId) {
    let favs = this.getFavorites();
    if (favs.includes(eventId)) {
      favs = favs.filter(id => id !== eventId);
    } else {
      favs.push(eventId);
    }
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favs));
    return favs.includes(eventId);
  },
  isFavorite(eventId) {
    return this.getFavorites().includes(eventId);
  },

  // Notifications
  getNotifications() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) || [];
    } catch {
      return [];
    }
  },
  addNotification(notif) {
    const notifs = this.getNotifications();
    notif.id = 'NOTIF-' + Date.now();
    notif.time = 'Just now';
    notif.read = false;
    notifs.unshift(notif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    return notif;
  },
  markNotificationAsRead(id) {
    const notifs = this.getNotifications();
    const notif = notifs.find(n => n.id === id);
    if (notif) notif.read = true;
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  },
  markAllNotificationsAsRead() {
    const notifs = this.getNotifications().map(n => ({ ...n, read: true }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  },

  // Settings
  getSettings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || INITIAL_SEED_DATA.settings;
    } catch {
      return INITIAL_SEED_DATA.settings;
    }
  },
  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return settings;
  }
};

// Auto initialize on load
Storage.init();
