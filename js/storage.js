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
  events: [
    {
      id: 'EVT-1001',
      title: 'Global AI & Tech Summit 2026',
      description: 'Premier annual gathering of artificial intelligence pioneers, enterprise architects, and venture builders.',
      category: 'Technology',
      date: '2026-10-15',
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      venue: 'Silicon Valley Convention Center',
      venueId: 'VEN-101',
      location: 'San Jose, CA',
      capacity: 500,
      bookedSeats: 2,
      ticketPrice: 1200,
      organizerId: 'USR-205',
      organizer: 'Elena Rostova',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
      status: 'Upcoming',
      featured: true,
      rating: 4.9,
      reviewCount: 18,
      tiers: [
        { name: 'General Admission', price: 1200, benefits: ['Keynote Access', 'Expo Floor', 'Lunch Buffet'] },
        { name: 'VIP All-Access', price: 2160, benefits: ['Front Row Seating', 'VIP Lounge', 'Speaker Meet & Greet'] }
      ]
    },
    {
      id: 'EVT-1002',
      title: 'Sufi & Classical Music Night',
      description: 'An enchanting musical evening featuring celebrated Sufi maestros, spiritual Qawwali, and acoustic performances.',
      category: 'Concert',
      date: '2026-10-22',
      startTime: '07:00 PM',
      endTime: '11:00 PM',
      venue: 'Alhamra Arts Council',
      venueId: 'VEN-102',
      location: 'Lahore, PK',
      capacity: 400,
      bookedSeats: 85,
      ticketPrice: 2500,
      organizerId: 'USR-354',
      organizer: 'Farman',
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
      status: 'Upcoming',
      featured: true,
      rating: 4.95,
      reviewCount: 32,
      tiers: [
        { name: 'Standard Hall', price: 2500, benefits: ['Concert Admission', 'Welcome Drink'] },
        { name: 'Front-Row VIP', price: 5000, benefits: ['Front-Row Sofa Seating', 'VIP Lounge Access', 'Artist Meet & Greet'] }
      ]
    },
    {
      id: 'EVT-1003',
      title: 'Full-Stack Web & AI Masterclass',
      description: 'Intensive hands-on training covering modern full-stack development, microservices, REST APIs, and generative AI agents.',
      category: 'Workshop',
      date: '2026-11-05',
      startTime: '10:00 AM',
      endTime: '04:00 PM',
      venue: 'National Incubation Center',
      venueId: 'VEN-103',
      location: 'Islamabad, PK',
      capacity: 150,
      bookedSeats: 40,
      ticketPrice: 1500,
      organizerId: 'USR-205',
      organizer: 'Elena Rostova',
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
      status: 'Upcoming',
      featured: true,
      rating: 4.88,
      reviewCount: 15,
      tiers: [
        { name: 'Student Pass', price: 1500, benefits: ['Full Day Workshop', 'Certificate of Completion', 'Course Materials'] },
        { name: 'Professional Pass', price: 3000, benefits: ['Full Workshop', '1-on-1 Code Review', 'Priority Q&A', 'Certificate'] }
      ]
    },
    {
      id: 'EVT-1004',
      title: 'Pakistan Business Leadership Summit',
      description: 'Connecting leading enterprise executives, investors, and startup founders to discuss market leadership and economic growth.',
      category: 'Conference',
      date: '2026-11-18',
      startTime: '08:30 AM',
      endTime: '06:00 PM',
      venue: 'Pearl Continental Grand Ballroom',
      venueId: 'VEN-104',
      location: 'Karachi, PK',
      capacity: 600,
      bookedSeats: 120,
      ticketPrice: 4000,
      organizerId: 'USR-101',
      organizer: 'Alexander Wright',
      image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
      status: 'Upcoming',
      featured: true,
      rating: 4.92,
      reviewCount: 24,
      tiers: [
        { name: 'Delegate Access', price: 4000, benefits: ['Keynote Sessions', 'Buffet Lunch', 'Networking Lounge'] },
        { name: 'Executive VIP Table', price: 10000, benefits: ['Reserved Front Table', 'Private Executive Lunch', 'Full Access Pass'] }
      ]
    },
    {
      id: 'EVT-1005',
      title: 'National Startup & Innovation Expo',
      description: 'Over 100 high-growth tech startups showcase prototypes, live pitches to venture capitalists, and product demo stations.',
      category: 'Exhibition',
      date: '2026-12-02',
      startTime: '10:00 AM',
      endTime: '07:00 PM',
      venue: 'Pak-China Friendship Centre',
      venueId: 'VEN-105',
      location: 'Islamabad, PK',
      capacity: 800,
      bookedSeats: 210,
      ticketPrice: 800,
      organizerId: 'USR-354',
      organizer: 'Farman',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
      status: 'Upcoming',
      featured: true,
      rating: 4.85,
      reviewCount: 19,
      tiers: [
        { name: 'Visitor Expo Pass', price: 800, benefits: ['Exhibition Hall Access', 'Demo Stages', 'Event Guide'] },
        { name: 'Investor & Founder Pass', price: 3500, benefits: ['VIP Pitch Stage', 'Investor Lounge', 'Fast-track Entry'] }
      ]
    },
    {
      id: 'EVT-1006',
      title: 'Annual Tech Gala Dinner & Awards',
      description: 'A prestigious black-tie annual gathering celebrating outstanding achievements, innovation milestones, and digital leadership.',
      category: 'Party',
      date: '2026-12-20',
      startTime: '07:30 PM',
      endTime: '11:30 PM',
      venue: 'Serena Hotel Sheesh Mahal',
      venueId: 'VEN-106',
      location: 'Islamabad, PK',
      capacity: 350,
      bookedSeats: 90,
      ticketPrice: 5000,
      organizerId: 'USR-101',
      organizer: 'Alexander Wright',
      image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80',
      status: 'Upcoming',
      featured: true,
      rating: 4.96,
      reviewCount: 28,
      tiers: [
        { name: 'Individual Seat', price: 5000, benefits: ['5-Course Gourmet Dinner', 'Awards Ceremony', 'Live Entertainment'] },
        { name: 'Corporate Table (8 Seats)', price: 35000, benefits: ['Dedicated Table of 8', 'Company Branding', 'Premium Hospitality'] }
      ]
    }
  ],
  venues: [
    {
      id: 'VEN-101',
      name: 'Silicon Valley Convention Center',
      location: '500 Tech Parkway, San Jose, CA',
      capacity: 1200,
      price: 4500,
      contact: '+1 (555) 901-2834',
      availability: 'Available',
      amenities: ['High-Speed Wi-Fi', '4K Projectors', 'VIP Lounge', 'Catering Kitchen', 'Valet Parking'],
      image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80'
    }
  ],
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
      eventsBooked: 14,
      status: 'Active'
    },
    {
      id: 'USR-102',
      name: 'Sarah Jenkins',
      email: 'user@eventify.com',
      password: 'user123',
      role: 'User',
      phone: '+1 (555) 349-8271',
      location: 'New York, NY',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      registeredDate: '2026-01-10',
      eventsBooked: 2,
      status: 'Active'
    },
    {
      id: 'USR-354',
      name: 'Farman',
      email: 'farmann@gmail.com',
      password: 'organizer123',
      role: 'Organizer',
      phone: '03078833943',
      location: 'Islamabad, PK',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      registeredDate: '2026-09-06',
      eventsBooked: 0,
      status: 'Active'
    },
    {
      id: 'USR-205',
      name: 'Elena Rostova',
      email: 'elena@techsummit.io',
      password: 'organizer123',
      role: 'Organizer',
      phone: '+1 (555) 492-1082',
      location: 'San Francisco, CA',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      registeredDate: '2026-08-15',
      eventsBooked: 0,
      status: 'Active'
    }
  ],
  bookings: [
    {
      id: 'BKG-2026-01',
      userId: 'USR-102',
      userName: 'Sarah Jenkins',
      userEmail: 'user@eventify.com',
      eventId: 'EVT-1001',
      attendeeImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      eventTitle: 'Global AI & Tech Summit 2026',
      eventDate: '2026-10-15',
      eventTime: '09:00 AM',
      venue: 'Silicon Valley Convention Center',
      tickets: 2,
      tierName: 'VIP All-Access',
      ticketPrice: 2160,
      discountAmount: 0,
      promoCode: null,
      totalAmount: 4320,
      paymentStatus: 'Paid',
      bookingStatus: 'Confirmed',
      paymentMethod: 'Credit Card',
      checkInStatus: 'Pending',
      bookingDate: '2026-09-01 14:30',
      qrCodeData: 'EVTIFY-BKG-2026-01-SARAH-JENKINS-EVT-1001'
    }
  ],
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

    // Auto-migrate settings currency to PKR if not set or previously '$'
    try {
      const storedSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS));
      if (!storedSettings || storedSettings.currency === '$' || !storedSettings.currency) {
        const updated = storedSettings || { ...INITIAL_SEED_DATA.settings };
        updated.currency = 'PKR ';
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      }
    } catch (e) {}

    // Auto-refresh events in localStorage if only 1 seed event existed
    try {
      const storedEvents = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS));
      if (!storedEvents || storedEvents.length <= 1) {
        localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_SEED_DATA.events));
      }
    } catch (e) {}
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
    if (settings && settings.currency) {
      const c = settings.currency.trim();
      if (c === '$' || !c) return 'PKR ';
      return c.endsWith(' ') ? c : c + ' ';
    }
    return 'PKR ';
  },

  formatPrice(amount) {
    const curr = this.getCurrency();
    const num = Number(amount) || 0;
    if (num === 0) return 'Free';
    const sign = num < 0 ? '-' : '';
    const formatted = Math.abs(num).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return `${sign}${curr.trim()} ${formatted}`;
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
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    } catch (err) {
      console.warn('LocalStorage quota warning for events:', err);
    }
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
    bookingData.attendeeImage = bookingData.attendeeImage || '';
    if (!bookingData.attendeeImage && bookingData.userId) {
      const user = this.getUserById(bookingData.userId);
      if (user && user.avatar) {
        bookingData.attendeeImage = user.avatar;
      }
    }
    if (bookingData.guests && Array.isArray(bookingData.guests)) {
      bookingData.guests.forEach((g, idx) => {
        if (!g.image) g.image = bookingData.attendeeImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
        if (!g.name) g.name = idx === 0 ? bookingData.userName : `${bookingData.userName} (Guest ${idx + 1})`;
      });
    }
    
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
