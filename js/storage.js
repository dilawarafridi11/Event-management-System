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
      title: 'Global Tech & AI Innovators Summit 2026',
      description: 'Join industry pioneers, AI researchers, and tech founders to explore generative intelligence, quantum computing, and autonomous robotics architecture.',
      category: 'Conference',
      date: '2026-09-18',
      startTime: '09:00',
      endTime: '17:30',
      venue: 'Metropolis Convention Center, Hall A',
      location: 'Downtown Silicon District, CA',
      capacity: 500,
      bookedSeats: 412,
      ticketPrice: 199,
      organizer: 'NextGen Tech Foundation',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80',
      status: 'Upcoming',
      featured: true,
      createdAt: '2026-07-10'
    },
    {
      id: 'EVT-1002',
      title: 'Neon Horizon Music & Visual Arts Festival',
      description: 'An immersive 2-day outdoor electronic music festival featuring world-class DJs, interactive laser installations, and artisan food trucks.',
      category: 'Concert',
      date: '2026-09-25',
      startTime: '16:00',
      endTime: '23:30',
      venue: 'AeroPark Amphitheatre',
      location: 'Riverside Park, Austin, TX',
      capacity: 1200,
      bookedSeats: 1140,
      ticketPrice: 85,
      organizer: 'Lumina Soundworks',
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1000&q=80',
      status: 'Upcoming',
      featured: true,
      createdAt: '2026-07-14'
    },
    {
      id: 'EVT-1003',
      title: 'Masterclass: Advanced Full-Stack Systems Design',
      description: 'Hands-on architectural masterclass on building microservices, distributed cache consistency, and real-time event streaming systems.',
      category: 'Workshop',
      date: '2026-08-30',
      startTime: '10:00',
      endTime: '15:00',
      venue: 'CodeCraft Innovation Hub',
      location: 'Tech Hub Building 4, Seattle, WA',
      capacity: 60,
      bookedSeats: 58,
      ticketPrice: 149,
      organizer: 'Engineering Excellence Academy',
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80',
      status: 'Ongoing',
      featured: true,
      createdAt: '2026-07-20'
    },
    {
      id: 'EVT-1004',
      title: 'Annual Luxury Bridal & Wedding Expo',
      description: 'Experience stunning runway shows, connect with elite wedding planners, gourmet caterers, and discover bespoke floral designs.',
      category: 'Wedding',
      date: '2026-10-05',
      startTime: '11:00',
      endTime: '18:00',
      venue: 'Grand Crystal Ballroom & Garden',
      location: 'Grand Plaza Hotel, Chicago, IL',
      capacity: 350,
      bookedSeats: 220,
      ticketPrice: 45,
      organizer: 'Elegance Events Group',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80',
      status: 'Upcoming',
      featured: false,
      createdAt: '2026-08-01'
    },
    {
      id: 'EVT-1005',
      title: 'International Sustainable Energy & Climate Forum',
      description: 'High-level dialogue between green energy policy makers, clean-tech founders, and venture capitalists shaping the carbon-neutral economy.',
      category: 'Seminar',
      date: '2026-10-12',
      startTime: '08:30',
      endTime: '16:00',
      venue: 'EcoSphere Conference Pavilion',
      location: 'Green Valley Center, Denver, CO',
      capacity: 300,
      bookedSeats: 195,
      ticketPrice: 120,
      organizer: 'Global Climate Alliance',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80',
      status: 'Upcoming',
      featured: false,
      createdAt: '2026-08-05'
    },
    {
      id: 'EVT-1006',
      title: 'CyberClash Esports Pro Championship Finals',
      description: 'Top international teams compete in the grand championship finals. Live stadium commentary, cosplay showcase, and gaming gear giveaways.',
      category: 'Sports',
      date: '2026-10-20',
      startTime: '13:00',
      endTime: '21:00',
      venue: 'CyberArena Stadium',
      location: 'Olympic Park Complex, Los Angeles, CA',
      capacity: 1500,
      bookedSeats: 1420,
      ticketPrice: 65,
      organizer: 'CyberClash Esports League',
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80',
      status: 'Upcoming',
      featured: true,
      createdAt: '2026-08-08'
    },
    {
      id: 'EVT-1007',
      title: 'Modern Abstract Art & Sculpture Exhibition',
      description: 'Curated gallery showcase of contemporary abstract paintings, light sculptures, and interactive audiovisual experiential spaces.',
      category: 'Exhibition',
      date: '2026-07-15',
      startTime: '10:00',
      endTime: '20:00',
      venue: 'Lumina Contemporary Art Gallery',
      location: 'SoHo Arts Quarter, New York, NY',
      capacity: 250,
      bookedSeats: 250,
      ticketPrice: 25,
      organizer: 'Curators Guild',
      image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=80',
      status: 'Completed',
      featured: false,
      createdAt: '2026-06-15'
    },
    {
      id: 'EVT-1008',
      title: 'Exclusive Midnight Rooftop Masquerade Party',
      description: 'An elegant evening with signature cocktails, panoramic city skyline views, live jazz quartet, and mystery masquerade entertainment.',
      category: 'Party',
      date: '2026-10-31',
      startTime: '20:00',
      endTime: '02:00',
      venue: 'Skyline Terrace & Lounge',
      location: 'Tower 42, Miami, FL',
      capacity: 180,
      bookedSeats: 150,
      ticketPrice: 110,
      organizer: 'Velvet Noir Entertainment',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80',
      status: 'Upcoming',
      featured: true,
      createdAt: '2026-08-12'
    }
  ],
  venues: [
    {
      id: 'VEN-01',
      name: 'Metropolis Convention Center, Hall A',
      location: 'Downtown Silicon District, CA',
      capacity: 500,
      price: 2500,
      contact: '+1 (555) 234-8900',
      availability: 'Available',
      amenities: ['Gigabit WiFi', '4K Projection', 'Audio Matrix', 'Valet Parking', 'Catering Kitchen'],
      image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'VEN-02',
      name: 'AeroPark Amphitheatre',
      location: 'Riverside Park, Austin, TX',
      capacity: 1200,
      price: 4800,
      contact: '+1 (555) 345-6789',
      availability: 'Available',
      amenities: ['Outdoor Stage', 'Concert Lighting', 'Security Gates', 'VIP Lounge'],
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'VEN-03',
      name: 'CodeCraft Innovation Hub',
      location: 'Tech Hub Building 4, Seattle, WA',
      capacity: 60,
      price: 800,
      contact: '+1 (555) 456-7890',
      availability: 'Booked',
      amenities: ['Dual Monitors', 'Whiteboard Walls', 'Fiber Optic', 'Coffee Bar'],
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'VEN-04',
      name: 'Grand Crystal Ballroom & Garden',
      location: 'Grand Plaza Hotel, Chicago, IL',
      capacity: 350,
      price: 3200,
      contact: '+1 (555) 567-8901',
      availability: 'Available',
      amenities: ['Crystal Chandeliers', 'Bridal Suite', 'Landscaped Courtyard', 'Banquet Tables'],
      image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'VEN-05',
      name: 'EcoSphere Conference Pavilion',
      location: 'Green Valley Center, Denver, CO',
      capacity: 300,
      price: 1800,
      contact: '+1 (555) 678-9012',
      availability: 'Available',
      amenities: ['Solar Powered', 'Acoustic Panels', 'Hybrid Video Rig', 'Natural Lighting'],
      image: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'VEN-06',
      name: 'Skyline Terrace & Lounge',
      location: 'Tower 42, Miami, FL',
      capacity: 180,
      price: 2200,
      contact: '+1 (555) 789-0123',
      availability: 'Available',
      amenities: ['Rooftop Pool Deck', 'Cocktail Bar', 'Surround Sound', 'City Views'],
      image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80'
    }
  ],
  users: [
    {
      id: 'USR-101',
      name: 'Alexander Wright',
      email: 'admin@eventify.com',
      password: 'admin123',
      role: 'Admin',
      phone: '+1 (555) 019-2834',
      location: 'San Francisco, CA',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      registeredDate: '2025-11-15',
      eventsBooked: 14,
      status: 'Active'
    },
    {
      id: 'USR-102',
      name: 'Sophia Martinez',
      email: 'user@eventify.com',
      password: 'user123',
      role: 'User',
      phone: '+1 (555) 732-9011',
      location: 'Austin, TX',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      registeredDate: '2026-02-10',
      eventsBooked: 5,
      status: 'Active'
    },
    {
      id: 'USR-103',
      name: 'Marcus Chen',
      email: 'marcus.chen@innovate.io',
      password: 'user123',
      role: 'User',
      phone: '+1 (555) 884-1290',
      location: 'Seattle, WA',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      registeredDate: '2026-03-01',
      eventsBooked: 3,
      status: 'Active'
    },
    {
      id: 'USR-104',
      name: 'Elena Rostova',
      email: 'elena.rostova@design.com',
      password: 'user123',
      role: 'User',
      phone: '+1 (555) 612-4439',
      location: 'New York, NY',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
      registeredDate: '2026-04-18',
      eventsBooked: 2,
      status: 'Active'
    },
    {
      id: 'USR-105',
      name: 'David O\'Connor',
      email: 'david.oc@fintech.co',
      password: 'user123',
      role: 'User',
      phone: '+1 (555) 902-8871',
      location: 'Chicago, IL',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      registeredDate: '2026-05-22',
      eventsBooked: 1,
      status: 'Inactive'
    }
  ],
  bookings: [
    {
      id: 'BKG-8801',
      userId: 'USR-102',
      userName: 'Sophia Martinez',
      userEmail: 'user@eventify.com',
      eventId: 'EVT-1001',
      eventTitle: 'Global Tech & AI Innovators Summit 2026',
      eventDate: '2026-09-18',
      eventTime: '09:00 - 17:30',
      venue: 'Metropolis Convention Center, Hall A',
      tickets: 2,
      ticketPrice: 199,
      totalAmount: 398,
      paymentStatus: 'Paid',
      bookingStatus: 'Confirmed',
      bookingDate: '2026-08-15 14:22',
      qrCodeData: 'EVTIFY-BKG-8801-SOPHIA-EVT-1001-2TIX'
    },
    {
      id: 'BKG-8802',
      userId: 'USR-102',
      userName: 'Sophia Martinez',
      userEmail: 'user@eventify.com',
      eventId: 'EVT-1002',
      eventTitle: 'Neon Horizon Music & Visual Arts Festival',
      eventDate: '2026-09-25',
      eventTime: '16:00 - 23:30',
      venue: 'AeroPark Amphitheatre',
      tickets: 3,
      ticketPrice: 85,
      totalAmount: 255,
      paymentStatus: 'Paid',
      bookingStatus: 'Confirmed',
      bookingDate: '2026-08-20 18:40',
      qrCodeData: 'EVTIFY-BKG-8802-SOPHIA-EVT-1002-3TIX'
    },
    {
      id: 'BKG-8803',
      userId: 'USR-103',
      userName: 'Marcus Chen',
      userEmail: 'marcus.chen@innovate.io',
      eventId: 'EVT-1003',
      eventTitle: 'Masterclass: Advanced Full-Stack Systems Design',
      eventDate: '2026-08-30',
      eventTime: '10:00 - 15:00',
      venue: 'CodeCraft Innovation Hub',
      tickets: 1,
      ticketPrice: 149,
      totalAmount: 149,
      paymentStatus: 'Paid',
      bookingStatus: 'Confirmed',
      bookingDate: '2026-08-21 09:15',
      qrCodeData: 'EVTIFY-BKG-8803-MARCUS-EVT-1003-1TIX'
    },
    {
      id: 'BKG-8804',
      userId: 'USR-104',
      userName: 'Elena Rostova',
      userEmail: 'elena.rostova@design.com',
      eventId: 'EVT-1008',
      eventTitle: 'Exclusive Midnight Rooftop Masquerade Party',
      eventDate: '2026-10-31',
      eventTime: '20:00 - 02:00',
      venue: 'Skyline Terrace & Lounge',
      tickets: 2,
      ticketPrice: 110,
      totalAmount: 220,
      paymentStatus: 'Pending',
      bookingStatus: 'Pending',
      bookingDate: '2026-08-27 21:05',
      qrCodeData: 'EVTIFY-BKG-8804-ELENA-EVT-1008-2TIX'
    }
  ],
  notifications: [
    {
      id: 'NOTIF-1',
      title: 'Booking Confirmed!',
      message: 'Your 2 tickets for Global Tech & AI Innovators Summit are confirmed. Digital passes ready.',
      time: '10 minutes ago',
      read: false,
      type: 'success',
      icon: '✓'
    },
    {
      id: 'NOTIF-2',
      title: 'New VIP Event Added',
      message: 'Exclusive Midnight Rooftop Masquerade Party just opened registrations.',
      time: '2 hours ago',
      read: false,
      type: 'info',
      icon: '🎉'
    },
    {
      id: 'NOTIF-3',
      title: 'Payment Received',
      message: 'Payment of $255.00 for Neon Horizon Festival processed successfully.',
      time: '1 day ago',
      read: true,
      type: 'success',
      icon: '💳'
    },
    {
      id: 'NOTIF-4',
      title: 'Event Reminder',
      message: 'Masterclass: Advanced Full-Stack Systems Design is scheduled for tomorrow.',
      time: '2 days ago',
      read: true,
      type: 'warning',
      icon: '⏰'
    }
  ],
  favorites: ['EVT-1001', 'EVT-1002', 'EVT-1006'],
  settings: {
    siteTitle: 'Eventify Platform',
    currency: '$',
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
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_SEED_DATA.notifications));
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(INITIAL_SEED_DATA.favorites));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SEED_DATA.settings));
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
    const bookings = this.getBookings();
    bookingData.id = 'BKG-' + Math.floor(1000 + Math.random() * 9000);
    bookingData.bookingDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
    bookingData.qrCodeData = `EVTIFY-${bookingData.id}-${bookingData.userName.toUpperCase()}-${bookingData.eventId}`;
    bookingData.bookingStatus = bookingData.bookingStatus || 'Confirmed';
    bookingData.paymentStatus = bookingData.paymentStatus || 'Paid';
    
    // Update seat count on event
    const event = this.getEventById(bookingData.eventId);
    if (event) {
      event.bookedSeats = (event.bookedSeats || 0) + Number(bookingData.tickets);
      this.saveEvent(event);
    }

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
      icon: '🎟️'
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
