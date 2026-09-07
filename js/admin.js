/**
 * EVENTIFY - Admin Controller
 * Controls Admin Dashboard, Events CRUD, User Management, Bookings, Venues, Analytics Reports, and Settings.
 * Enhanced with functional shimmer skeleton loading states.
 */

const Admin = {
  // 1. Dashboard Overview
  initDashboard() {
    Auth.requireAuth('Admin');
    
    const tbody = document.getElementById('recent-events-tbody');
    if (tbody) {
      UI.showSkeleton(tbody, 'table', 4);
    }

    setTimeout(() => {
      let events = Storage.getEvents();
      let bookings = Storage.getBookings();
      const users = Storage.getUsers();
      
      const session = Auth.getSession();
      if (session && session.role === 'Organizer') {
        events = events.filter(e => e.organizerId === session.id);
        const organizerEventIds = events.map(e => e.id);
        bookings = bookings.filter(b => organizerEventIds.includes(b.eventId));
        
        // Hide UI elements not meant for Organizers
        const usersNav = document.querySelector('a[href="users.html"]');
        if (usersNav) usersNav.style.display = 'none';
        const venuesNav = document.querySelector('a[href="venues.html"]');
        if (venuesNav) venuesNav.style.display = 'none'; // Optional, if they shouldn't manage global venues
        const settingsNav = document.querySelector('a[href="settings.html"]');
        if (settingsNav) settingsNav.style.display = 'none';
      }

      // Calculate KPI Stats
      const totalEvents = events.length;
      const upcomingEvents = events.filter(e => e.status === 'Upcoming').length;
      const totalUsers = users.length;
      const totalBookings = bookings.length;
      const totalRevenue = bookings
        .filter(b => b.paymentStatus === 'Paid')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      // Animate KPI Counters
      UI.animateCounter(document.getElementById('stat-total-events'), totalEvents);
      UI.animateCounter(document.getElementById('stat-upcoming-events'), upcomingEvents);
      UI.animateCounter(document.getElementById('stat-total-users'), totalUsers);
      UI.animateCounter(document.getElementById('stat-total-bookings'), totalBookings);
      UI.animateCounter(document.getElementById('stat-total-revenue'), totalRevenue, 'PKR ');

      // Render Canvas Charts
      this.renderDashboardCharts(events, bookings);

      // Render Recent Events Table
      this.renderRecentEventsTable(events.slice(0, 5));
    }, 450);
  },

  triggerShimmerDemo() {
    UI.showToast('Demonstrating shimmer skeleton effect across dashboard...', 'info', 'Shimmer Demo');
    const tbody = document.getElementById('recent-events-tbody');
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach(card => card.classList.add('skeleton', 'skeleton-stat-card'));
    if (tbody) UI.showSkeleton(tbody, 'table', 5);

    setTimeout(() => {
      statCards.forEach(card => card.classList.remove('skeleton', 'skeleton-stat-card'));
      this.initDashboard();
      UI.showToast('Shimmer loading completed! Content rendered.', 'success');
    }, 1800);
  },

  renderDashboardCharts(events, bookings) {
    // 1. Line Chart: Bookings Overview
    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    const bookingCounts = [14, 22, 35, 48, 52, 68, 85];
    Charts.renderLineChart('event-bookings-chart', months, bookingCounts, { title: 'Bookings' });

    // 2. Bar Chart: Revenue Overview
    const revenueMonths = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const revenueValues = [2400, 3800, 5600, 8200, 9400, 12800];
    Charts.renderBarChart('revenue-chart', revenueMonths, revenueValues, { prefix: 'PKR ' });

    // 3. Donut Chart: Categories Distribution
    const catMap = {};
    events.forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + 1;
    });
    const catLabels = Object.keys(catMap);
    const catValues = Object.values(catMap);
    Charts.renderDonutChart('categories-chart', catLabels, catValues);
  },

  renderRecentEventsTable(eventsList) {
    const tbody = document.getElementById('recent-events-tbody');
    if (!tbody) return;

    if (eventsList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 2rem; color: var(--text-muted);">No events found.</td></tr>`;
      return;
    }

    tbody.innerHTML = eventsList.map(e => `
      <tr>
        <td>
          <div class="flex items-center gap-3">
            <img src="${e.image}" style="width: 42px; height: 42px; border-radius: var(--radius-sm); object-fit: cover;">
            <div>
              <div class="font-bold text-primary">${e.title}</div>
              <div class="text-xs text-muted">${e.id}</div>
            </div>
          </div>
        </td>
        <td>${e.organizer}</td>
        <td><span class="category-tag">${e.category}</span></td>
        <td>${EventsManager.formatDate(e.date)}</td>
        <td class="text-truncate" style="max-width: 150px;">${e.venue}</td>
        <td><strong>${e.bookedSeats || 0}</strong> / ${e.capacity}</td>
        <td><span class="badge badge-${e.status.toLowerCase()}">${e.status}</span></td>
        <td>
          <div class="action-btns">
            <button class="btn btn-icon btn-sm" onclick="EventsManager.viewEventDetails('${e.id}')" title="View Details">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button class="btn btn-icon btn-sm" onclick="Admin.openEditEventModal('${e.id}')" title="Edit Event">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-icon btn-sm text-danger" onclick="Admin.deleteEventAction('${e.id}')" title="Delete Event">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  // 2. Events Management Page
  initEventsPage() {
    Auth.requireAuth('Admin');
    this.currentPage = 1;
    this.pageSize = 6;
    
    const tbody = document.getElementById('admin-events-tbody');
    if (tbody) UI.showSkeleton(tbody, 'table', 6);

    setTimeout(() => {
      this.renderEventsTable();
      this.bindEventFilters();

      const urlParams = new URLSearchParams(window.location.search);
      const q = urlParams.get('q');
      if (q) {
        const searchInput = document.getElementById('admin-events-search');
        if (searchInput) {
          searchInput.value = q;
          this.renderEventsTable();
        }
      }
    }, 400);
  },

  bindEventFilters() {
    const searchInput = document.getElementById('admin-events-search');
    const categorySelect = document.getElementById('admin-events-cat-filter');
    const statusSelect = document.getElementById('admin-events-status-filter');
    const sortSelect = document.getElementById('admin-events-sort');

    const triggerFilter = () => {
      this.currentPage = 1;
      const tbody = document.getElementById('admin-events-tbody');
      if (tbody) {
        UI.simulateLoading(tbody, () => this.renderEventsTable(), 'table', 4, 250);
      } else {
        this.renderEventsTable();
      }
    };

    if (searchInput) searchInput.addEventListener('input', triggerFilter);
    if (categorySelect) categorySelect.addEventListener('change', triggerFilter);
    if (statusSelect) statusSelect.addEventListener('change', triggerFilter);
    if (sortSelect) sortSelect.addEventListener('change', triggerFilter);
  },

  renderEventsTable() {
    const tbody = document.getElementById('admin-events-tbody');
    if (!tbody) return;

    const session = Auth.getSession();
    let events = Storage.getEvents();
    if (session && session.role === 'Organizer') {
      events = events.filter(e => e.organizerId === session.id);
    }

    const search = (document.getElementById('admin-events-search')?.value || '').toLowerCase();
    const category = document.getElementById('admin-events-cat-filter')?.value || 'All';
    const status = document.getElementById('admin-events-status-filter')?.value || 'All';
    const sort = document.getElementById('admin-events-sort')?.value || 'date-desc';

    // Filter
    events = events.filter(e => {
      const matchSearch = e.title.toLowerCase().includes(search) || 
                          e.organizer.toLowerCase().includes(search) || 
                          e.venue.toLowerCase().includes(search);
      const matchCat = category === 'All' || e.category === category;
      const matchStatus = status === 'All' || e.status === status;
      return matchSearch && matchCat && matchStatus;
    });

    // Sort
    if (sort === 'date-desc') events.sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (sort === 'date-asc') events.sort((a, b) => new Date(a.date) - new Date(b.date));
    else if (sort === 'price-high') events.sort((a, b) => b.ticketPrice - a.ticketPrice);
    else if (sort === 'price-low') events.sort((a, b) => a.ticketPrice - b.ticketPrice);
    else if (sort === 'title-asc') events.sort((a, b) => a.title.localeCompare(b.title));

    // Pagination
    const totalItems = events.length;
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;

    const startIdx = (this.currentPage - 1) * this.pageSize;
    const paginatedEvents = events.slice(startIdx, startIdx + this.pageSize);

    if (paginatedEvents.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 3rem;">
            <div class="empty-state-icon" style="margin: 0 auto 1rem;"><i class="fa-solid fa-magnifying-glass"></i></div>
            <div class="font-bold text-base">No matching events found</div>
            <p class="text-secondary text-sm">Try adjusting your search terms or filters.</p>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = paginatedEvents.map(e => `
        <tr>
          <td>
            <div class="flex items-center gap-3">
              <img src="${e.image}" style="width: 44px; height: 44px; border-radius: var(--radius-sm); object-fit: cover;">
              <div>
                <div class="font-bold text-primary">${e.title}</div>
                <div class="text-xs text-muted">${e.id} • ${e.ticketPrice === 0 ? 'Free' : 'PKR ' + e.ticketPrice}</div>
              </div>
            </div>
          </td>
          <td>${e.organizer}</td>
          <td><span class="category-tag">${e.category}</span></td>
          <td>
            <div class="font-semibold text-xs">${e.date}</div>
            <div class="text-xs text-muted">${e.startTime} - ${e.endTime}</div>
          </td>
          <td class="text-truncate" style="max-width: 140px;">${e.venue}</td>
          <td>
            <div class="font-bold text-sm">${e.bookedSeats || 0} / ${e.capacity}</div>
            <div style="width: 100%; background: var(--bg-primary); height: 5px; border-radius: 3px; margin-top: 3px; overflow: hidden;">
              <div style="width: ${Math.min(100, Math.round(((e.bookedSeats || 0)/e.capacity)*100))}%; height: 100%; background: var(--accent-gradient);"></div>
            </div>
          </td>
          <td><span class="badge badge-${e.status.toLowerCase()}">${e.status}</span></td>
          <td>
            <div class="action-btns">
              <button class="btn btn-icon btn-sm" onclick="EventsManager.viewEventDetails('${e.id}')" title="View Details"><i class="fa-solid fa-eye"></i></button>
              <button class="btn btn-icon btn-sm" onclick="Admin.openEditEventModal('${e.id}')" title="Edit Event"><i class="fa-solid fa-pen"></i></button>
              <button class="btn btn-icon btn-sm text-danger" onclick="Admin.deleteEventAction('${e.id}')" title="Delete Event"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    this.renderPaginationUI(totalItems, totalPages, 'admin-events-pagination');
  },

  renderPaginationUI(totalItems, totalPages, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div>Showing <strong>${totalItems > 0 ? (this.currentPage - 1) * this.pageSize + 1 : 0}</strong> to <strong>${Math.min(this.currentPage * this.pageSize, totalItems)}</strong> of <strong>${totalItems}</strong> entries</div>
      <div class="pagination-controls">
        <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="Admin.setPage(${this.currentPage - 1})">‹</button>
        ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
          <button class="pagination-btn ${p === this.currentPage ? 'active' : ''}" onclick="Admin.setPage(${p})">${p}</button>
        `).join('')}
        <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="Admin.setPage(${this.currentPage + 1})">›</button>
      </div>
    `;
  },

  setPage(page) {
    this.currentPage = page;
    const tbody = document.getElementById('admin-events-tbody');
    UI.simulateLoading(tbody, () => this.renderEventsTable(), 'table', 4, 200);
  },

  // Add / Edit Event Modals
  openCreateEventModal() {
    let modal = document.getElementById('event-form-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'event-form-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-container modal-lg">
        <div class="modal-header">
          <h3 class="modal-title">Create New Event</h3>
          <button class="modal-close" onclick="UI.closeModal('event-form-modal')">&times;</button>
        </div>
        <form id="create-event-form" onsubmit="Admin.handleSaveEvent(event)" style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
          <div class="modal-body">
            <div class="grid" style="grid-template-columns: 2fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Event Title <span class="required">*</span></label>
                <input type="text" class="form-control" id="event-input-title" placeholder="e.g. NextGen Web Summit" required>
              </div>
              <div class="form-group">
                <label class="form-label">Category <span class="required">*</span></label>
                <select class="form-control" id="event-input-category" required>
                  <option value="Conference">Conference</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Concert">Concert</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Sports">Sports</option>
                  <option value="Exhibition">Exhibition</option>
                  <option value="Party">Party</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Event Description <span class="required">*</span></label>
              <textarea class="form-control" id="event-input-desc" placeholder="Describe the agenda, highlights, and audience..." required></textarea>
            </div>

            <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Event Date <span class="required">*</span></label>
                <input type="date" class="form-control" id="event-input-date" required>
              </div>
              <div class="form-group">
                <label class="form-label">Start Time <span class="required">*</span></label>
                <input type="time" class="form-control" id="event-input-start" value="09:00" required>
              </div>
              <div class="form-group">
                <label class="form-label">End Time <span class="required">*</span></label>
                <input type="time" class="form-control" id="event-input-end" value="17:00" required>
              </div>
            </div>

            <div class="grid" style="grid-template-columns: 2fr 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Venue Location <span class="required">*</span></label>
                <input type="text" class="form-control" id="event-input-venue" placeholder="e.g. Metropolis Hall A, Silicon Valley" required>
              </div>
              <div class="form-group">
                <label class="form-label">Capacity <span class="required">*</span></label>
                <input type="number" class="form-control" id="event-input-capacity" min="10" max="10000" value="200" required>
              </div>
              <div class="form-group">
                <label class="form-label">Price (PKR ) <span class="required">*</span></label>
                <input type="number" class="form-control" id="event-input-price" min="0" value="99" required>
              </div>
            </div>

            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Organizer <span class="required">*</span></label>
                <input type="text" class="form-control" id="event-input-organizer" placeholder="Organization name" value="Eventify Productions" required>
              </div>
              <div class="form-group">
                <label class="form-label">Status <span class="required">*</span></label>
                <select class="form-control" id="event-input-status">
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Event Banner Image URL</label>
              <input type="url" class="form-control" id="event-input-image" value="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="UI.closeModal('event-form-modal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Create Event</button>
          </div>
        </form>
      </div>
    `;

    const d = new Date();
    d.setDate(d.getDate() + 14);
    document.getElementById('event-input-date').value = d.toISOString().split('T')[0];

    UI.openModal('event-form-modal');
  },

  openEditEventModal(eventId) {
    const event = Storage.getEventById(eventId);
    if (!event) return;

    this.openCreateEventModal();
    document.querySelector('#event-form-modal .modal-title').textContent = 'Edit Event: ' + event.title;
    
    document.getElementById('event-input-title').value = event.title;
    document.getElementById('event-input-category').value = event.category;
    document.getElementById('event-input-desc').value = event.description;
    document.getElementById('event-input-date').value = event.date;
    document.getElementById('event-input-start').value = event.startTime;
    document.getElementById('event-input-end').value = event.endTime;
    document.getElementById('event-input-venue').value = event.venue;
    document.getElementById('event-input-capacity').value = event.capacity;
    document.getElementById('event-input-price').value = event.ticketPrice;
    document.getElementById('event-input-organizer').value = event.organizer;
    document.getElementById('event-input-status').value = event.status;
    document.getElementById('event-input-image').value = event.image;

    const form = document.getElementById('create-event-form');
    form.onsubmit = (e) => {
      e.preventDefault();
      Storage.saveEvent({
        id: event.id,
        title: document.getElementById('event-input-title').value,
        category: document.getElementById('event-input-category').value,
        description: document.getElementById('event-input-desc').value,
        date: document.getElementById('event-input-date').value,
        startTime: document.getElementById('event-input-start').value,
        endTime: document.getElementById('event-input-end').value,
        venue: document.getElementById('event-input-venue').value,
        capacity: parseInt(document.getElementById('event-input-capacity').value, 10),
        ticketPrice: parseFloat(document.getElementById('event-input-price').value),
        organizer: document.getElementById('event-input-organizer').value,
        status: document.getElementById('event-input-status').value,
        image: document.getElementById('event-input-image').value
      });
      UI.closeModal('event-form-modal');
      UI.showToast('Event updated successfully!', 'success', 'Updated');
      if (typeof Admin.renderEventsTable === 'function') Admin.renderEventsTable();
      if (typeof Admin.initDashboard === 'function') Admin.initDashboard();
    };
  },

  async handleSaveEvent(e) {
    e.preventDefault();
    const session = Auth.getSession();
    const newEvent = {
      title: document.getElementById('event-input-title').value,
      category: document.getElementById('event-input-category').value,
      description: document.getElementById('event-input-desc').value,
      date: document.getElementById('event-input-date').value,
      startTime: document.getElementById('event-input-start').value,
      endTime: document.getElementById('event-input-end').value,
      venue: document.getElementById('event-input-venue').value,
      capacity: parseInt(document.getElementById('event-input-capacity').value, 10),
      ticketPrice: parseFloat(document.getElementById('event-input-price').value),
      organizer: document.getElementById('event-input-organizer').value,
      organizerId: session ? session.id : null,
      status: document.getElementById('event-input-status').value,
      image: document.getElementById('event-input-image').value
    };

    const savedEvent = Storage.saveEvent(newEvent);
    
    // Sync with backend API
    if (typeof API !== 'undefined' && API.createEvent) {
      try {
        await API.createEvent(savedEvent);
      } catch (err) {
        console.warn('API sync failed:', err);
      }
    }

    UI.closeModal('event-form-modal');
    UI.showToast('New event created successfully!', 'success', 'Created');
    this.renderEventsTable();
  },

  deleteEventAction(eventId) {
    UI.confirm(
      'Delete Event',
      'Are you sure you want to permanently delete this event? All associated bookings will remain for financial records.',
      () => {
        Storage.deleteEvent(eventId);
        UI.showToast('Event deleted successfully.', 'info', 'Deleted');
        if (typeof Admin.renderEventsTable === 'function') Admin.renderEventsTable();
        if (typeof Admin.initDashboard === 'function') Admin.initDashboard();
      },
      'Yes, Delete',
      'btn-danger'
    );
  },

  // 3. User Management Page
  // 3. User Management Page (Organizers Only)
  async initUsersPage() {
    Auth.requireAuth('Admin');
    const tbody = document.getElementById('admin-users-tbody');
    if (tbody) UI.showSkeleton(tbody, 'table', 5);

    // Sync from API if available to ensure MySQL and local storage match
    if (typeof API !== 'undefined') {
      try {
        const res = await API.getUsers();
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          res.data.forEach(u => Storage.saveUser(u));
        }
      } catch (err) {}
      try {
        const evtRes = await API.getEvents();
        if (evtRes && evtRes.success && Array.isArray(evtRes.data)) {
          evtRes.data.forEach(e => Storage.saveEvent(e));
        }
      } catch (err) {}
      try {
        const bkgRes = await API.getBookings();
        if (bkgRes && bkgRes.success && Array.isArray(bkgRes.data)) {
          bkgRes.data.forEach(b => {
            const bookings = Storage.getBookings();
            if (!bookings.some(existing => existing.id === b.id)) {
              bookings.unshift(b);
              localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
            }
          });
        }
      } catch (err) {}
    }

    setTimeout(() => {
      this.renderUsersTable();

      const searchInput = document.getElementById('admin-users-search');
      const statusFilter = document.getElementById('admin-users-status-filter');

      const triggerFilter = () => {
        if (tbody) UI.simulateLoading(tbody, () => this.renderUsersTable(), 'table', 4, 250);
        else this.renderUsersTable();
      };

      if (searchInput) searchInput.addEventListener('input', triggerFilter);
      if (statusFilter) statusFilter.addEventListener('change', triggerFilter);
    }, 400);
  },

  renderUsersTable() {
    const tbody = document.getElementById('admin-users-tbody');
    if (!tbody) return;

    let users = Storage.getUsers();
    const search = (document.getElementById('admin-users-search')?.value || '').toLowerCase();
    const status = document.getElementById('admin-users-status-filter')?.value || 'All';

    // CRITICAL REQUIREMENT: Only show Organizers; do not display regular users or SuperAdmins
    users = users.filter(u => u.role === 'Organizer');

    users = users.filter(u => {
      const matchSearch = (u.name || '').toLowerCase().includes(search) || 
                          (u.email || '').toLowerCase().includes(search) || 
                          (u.phone && u.phone.includes(search)) || 
                          (u.id && u.id.toLowerCase().includes(search));
      const matchStatus = status === 'All' || u.status === status;
      return matchSearch && matchStatus;
    });

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" class="text-center" style="padding: 2.5rem; color: var(--text-muted);"><i class="fa-solid fa-users" style="font-size: 2rem; margin-bottom: 0.5rem; display:block;"></i>No organizers found matching your criteria.</td></tr>`;
      return;
    }

    const events = Storage.getEvents();

    tbody.innerHTML = users.map(u => {
      const organizerEvents = events.filter(e => 
        e.organizerId === u.id || 
        (e.organizer && e.organizer.toLowerCase() === (u.name || '').toLowerCase())
      );
      const eventsCount = organizerEvents.length;
      const eventsText = `${eventsCount} Event${eventsCount === 1 ? '' : 's'}`;
      const avatarUrl = u.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80';

      return `
        <tr class="organizer-row" style="cursor: pointer;" onclick="Admin.viewOrganizerBookings('${u.id}')" title="Click to view users who booked events through ${u.name}">
          <td>
            <div class="avatar" style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.12); flex-shrink: 0;">
              <img src="${avatarUrl}" alt="${u.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80';">
            </div>
          </td>
          <td>
            <div class="font-bold text-primary hover-underline" style="font-size: 0.95rem;">${u.name}</div>
          </td>
          <td>
            <span class="badge" style="background: var(--bg-tertiary); color: var(--text-secondary); font-family: var(--font-mono); font-size: 0.8rem; border: 1px solid var(--border-color);">${u.id}</span>
          </td>
          <td>
            <a href="mailto:${u.email}" class="text-secondary" onclick="event.stopPropagation()">${u.email}</a>
          </td>
          <td>
            <span>${u.phone || 'N/A'}</span>
          </td>
          <td>
            <span class="badge badge-warning">Organizer</span>
          </td>
          <td>
            <span>${u.registeredDate || u.createdAt || '2026-09-06'}</span>
          </td>
          <td>
            <strong>${eventsText}</strong>
          </td>
          <td>
            <span class="badge ${u.status === 'Active' ? 'badge-success' : (u.status === 'Pending' ? 'badge-warning' : 'badge-danger')}">
              ${u.status || 'Active'}
            </span>
          </td>
          <td onclick="event.stopPropagation()">
            <div class="action-btns">
              <button class="btn btn-sm btn-primary" onclick="Admin.viewOrganizerBookings('${u.id}')" title="View Booked Users">
                <i class="fa-solid fa-users"></i> Booked Users
              </button>
              <button class="btn btn-icon btn-sm" onclick="Admin.toggleUserStatus('${u.id}')" title="${u.status === 'Pending' ? 'Approve Organizer' : 'Toggle Active/Inactive'}">
                ${u.status === 'Pending' ? '<i class="fa-solid fa-check"></i>' : (u.status === 'Active' ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>')}
              </button>
              <button class="btn btn-icon btn-sm text-danger" onclick="Admin.deleteUserAction('${u.id}')" title="Delete Organizer">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  async viewOrganizerBookings(organizerId) {
    let organizer = Storage.getUserById(organizerId);
    if (!organizer && typeof API !== 'undefined' && API.getUserProfile) {
      try {
        const res = await API.getUserProfile(organizerId);
        if (res && res.success && res.data) organizer = res.data;
      } catch (e) {}
    }
    if (!organizer) {
      UI.showToast('Organizer not found.', 'error');
      return;
    }

    // Sync latest bookings and events from API if available
    if (typeof API !== 'undefined') {
      try {
        const bkgRes = await API.getBookings();
        if (bkgRes && bkgRes.success && Array.isArray(bkgRes.data)) {
          bkgRes.data.forEach(b => {
            const bookings = Storage.getBookings();
            if (!bookings.some(x => x.id === b.id)) {
              bookings.unshift(b);
              localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
            }
          });
        }
      } catch (e) {}
    }

    const allEvents = Storage.getEvents();
    const orgEvents = allEvents.filter(e => 
      e.organizerId === organizer.id || 
      (e.organizer && e.organizer.toLowerCase() === organizer.name.toLowerCase())
    );
    const orgEventIds = orgEvents.map(e => e.id);

    const allBookings = Storage.getBookings();
    const orgBookings = allBookings.filter(b => orgEventIds.includes(b.eventId));

    const modalTitle = document.getElementById('organizer-bookings-modal-title');
    const modalSubtitle = document.getElementById('organizer-bookings-modal-subtitle');
    const modalBody = document.getElementById('organizer-bookings-modal-body');

    if (modalTitle) {
      modalTitle.innerHTML = `<i class="fa-solid fa-users" style="color: var(--primary); margin-right: 0.5rem;"></i> Attendees Booked via ${organizer.name}`;
    }
    if (modalSubtitle) {
      modalSubtitle.innerText = `Organizer: ${organizer.name} (${organizer.id}) • Email: ${organizer.email} • Phone: ${organizer.phone || 'N/A'}`;
    }

    const totalTickets = orgBookings.reduce((sum, b) => sum + (Number(b.tickets) || 1), 0);
    const totalRevenue = orgBookings
      .filter(b => b.paymentStatus === 'Paid')
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    const summaryCardsHtml = `
      <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div class="card" style="padding: 1rem; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
          <div class="text-xs text-muted">Total Events</div>
          <div class="font-bold text-xl" style="color: var(--primary);">${orgEvents.length}</div>
        </div>
        <div class="card" style="padding: 1rem; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
          <div class="text-xs text-muted">Total Bookings</div>
          <div class="font-bold text-xl" style="color: var(--info);">${orgBookings.length}</div>
        </div>
        <div class="card" style="padding: 1rem; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
          <div class="text-xs text-muted">Tickets Sold</div>
          <div class="font-bold text-xl" style="color: var(--warning);">${totalTickets}</div>
        </div>
        <div class="card" style="padding: 1rem; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
          <div class="text-xs text-muted">Total Revenue</div>
          <div class="font-bold text-xl" style="color: var(--success);">${Storage.formatPrice(totalRevenue)}</div>
        </div>
      </div>
    `;

    if (orgBookings.length === 0) {
      if (modalBody) {
        modalBody.innerHTML = `
          ${summaryCardsHtml}
          <div class="text-center" style="padding: 3rem 1.5rem; background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
            <div style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;">
              <i class="fa-solid fa-user-slash"></i>
            </div>
            <h3 class="font-bold text-lg" style="margin-bottom: 0.5rem;">No Bookings Found</h3>
            <p class="text-secondary text-sm" style="max-width: 450px; margin: 0 auto 1.5rem auto;">
              No users have booked tickets for any events organized by <strong>${organizer.name}</strong> yet.
              ${orgEvents.length === 0 ? 'This organizer currently has 0 published events.' : 'Events are currently open for attendee registration.'}
            </p>
          </div>
        `;
      }
    } else {
      const allUsers = Storage.getUsers();
      const bookingsTableHtml = `
        ${summaryCardsHtml}
        <div class="table-card" style="border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden;">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Booked User / Attendee</th>
                  <th>Contact Info</th>
                  <th>Event Booked</th>
                  <th>Tickets & Tier</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Booking Date</th>
                </tr>
              </thead>
              <tbody>
                ${orgBookings.map(b => {
                  const attendeeUser = allUsers.find(u => u.id === b.userId || (u.email && u.email.toLowerCase() === (b.userEmail || '').toLowerCase()));
                  const attendeeAvatar = (attendeeUser && attendeeUser.avatar) ? attendeeUser.avatar : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80';
                  const attendeePhone = (attendeeUser && attendeeUser.phone) ? attendeeUser.phone : (b.phone || 'N/A');

                  return `
                    <tr>
                      <td>
                        <div class="flex items-center gap-3">
                          <div class="avatar" style="width: 36px; height: 36px; border-radius: 50%; overflow: hidden;">
                            <img src="${attendeeAvatar}" alt="${b.userName || 'Attendee'}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80';">
                          </div>
                          <div>
                            <div class="font-bold text-primary">${b.userName || 'Unknown User'}</div>
                            <div class="text-xs text-muted font-mono">${b.userId || 'Guest'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div><a href="mailto:${b.userEmail}" class="text-secondary text-sm">${b.userEmail}</a></div>
                        <div class="text-xs text-muted">${attendeePhone}</div>
                      </td>
                      <td>
                        <div class="font-semibold text-sm">${b.eventTitle || 'Event'}</div>
                        <div class="text-xs text-muted"><i class="fa-solid fa-calendar-day"></i> ${b.eventDate || ''} ${b.eventTime || ''}</div>
                      </td>
                      <td>
                        <div><strong>${b.tickets || 1}x</strong> Ticket${(b.tickets || 1) > 1 ? 's' : ''}</div>
                        <div class="text-xs text-secondary">${b.tierName || 'General Admission'}</div>
                      </td>
                      <td>
                        <strong class="text-success">${Storage.formatPrice(b.totalAmount || 0)}</strong>
                      </td>
                      <td>
                        <span class="badge ${b.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'}">
                          ${b.paymentStatus || 'Paid'}
                        </span>
                      </td>
                      <td>
                        <span class="badge ${b.checkInStatus === 'Checked-In' ? 'badge-confirmed' : 'badge-light'}">
                          ${b.checkInStatus || 'Pending'}
                        </span>
                      </td>
                      <td>
                        <span class="text-xs text-muted">${b.bookingDate || 'N/A'}</span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
      if (modalBody) {
        modalBody.innerHTML = bookingsTableHtml;
      }
    }

    UI.openModal('organizer-bookings-modal');
  },

  async toggleUserStatus(userId) {
    const user = Storage.getUserById(userId);
    if (!user) return;
    if (user.role === 'SuperAdmin') {
      UI.showToast('Super Admin account status cannot be toggled.', 'warning');
      return;
    }
    if (user.status === 'Pending') {
      user.status = 'Active';
      UI.showToast(`Organizer approved and marked as Active.`, 'success');
    } else {
      user.status = user.status === 'Active' ? 'Inactive' : 'Active';
      UI.showToast(`Organizer marked as ${user.status}.`, 'info');
    }
    Storage.saveUser(user);
    
    // Sync with backend API if available
    if (typeof API !== 'undefined' && API.toggleUserStatus) {
      await API.toggleUserStatus(user.id, user.status);
    }
    
    this.renderUsersTable();
  },

  async openUserModal(userId) {
    let user = Storage.getUserById(userId);
    if (typeof API !== 'undefined' && API.getUserProfile) {
      try {
        const res = await API.getUserProfile(userId);
        if (res && res.success && res.data) user = res.data;
      } catch(e) {}
    }

    if (!user) {
      UI.showToast('User not found.', 'error');
      return;
    }

    let modal = document.getElementById('user-details-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'user-details-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-container" style="max-width: 450px;">
        <div class="modal-header">
          <h3 class="modal-title">Attendee Profile</h3>
          <button class="modal-close" onclick="UI.closeModal('user-details-modal')">&times;</button>
        </div>
        <div class="modal-body text-center">
          <div class="avatar" style="width: 100px; height: 100px; margin: 0 auto 1.5rem auto; background-image: url('${user.avatar || '../images/placeholder.jpg'}'); background-size: cover; background-position: center; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></div>
          <h2 class="font-bold text-xl" style="margin-bottom: 0.25rem;">${user.name}</h2>
          <p class="text-muted text-sm" style="margin-bottom: 1.5rem;">${user.role}</p>
          
          <div class="grid" style="grid-template-columns: 1fr; gap: 0.75rem; text-align: left;">
            <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md);">
              <div class="text-xs text-muted" style="margin-bottom: 0.25rem;">Email Address</div>
              <div class="font-semibold">${user.email}</div>
            </div>
            <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md);">
              <div class="text-xs text-muted" style="margin-bottom: 0.25rem;">Phone Number</div>
              <div class="font-semibold">${user.phone || 'Not provided'}</div>
            </div>
            <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md);">
              <div class="text-xs text-muted" style="margin-bottom: 0.25rem;">Location</div>
              <div class="font-semibold">${user.location || 'Not provided'}</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-full" onclick="UI.closeModal('user-details-modal')">Close</button>
        </div>
      </div>
    `;

    UI.openModal('user-details-modal');
  },

  deleteUserAction(userId) {
    const user = Storage.getUserById(userId);
    if (user && user.role === 'SuperAdmin') {
      UI.showToast('Super Admin account cannot be deleted.', 'error');
      return;
    }

    UI.confirm(
      'Delete Organizer',
      `Are you sure you want to delete organizer "${user.name}"? This action cannot be undone.`,
      async () => {
        Storage.deleteUser(userId);
        if (typeof API !== 'undefined' && API.deleteUser) {
          try {
            await API.deleteUser(userId);
          } catch(e) {}
        }
        UI.showToast('Organizer account deleted.', 'info');
        Admin.renderUsersTable();
      },
      'Yes, Delete Organizer',
      'btn-danger'
    );
  },

  // 4. Bookings Management Page
  initBookingsPage() {
    Auth.requireAuth('Admin');
    const tbody = document.getElementById('admin-bookings-tbody');
    if (tbody) UI.showSkeleton(tbody, 'table', 5);

    setTimeout(() => {
      this.renderBookingsTable();

      const searchInput = document.getElementById('admin-bookings-search');
      const statusFilter = document.getElementById('admin-bookings-status-filter');

      const triggerFilter = () => {
        if (tbody) UI.simulateLoading(tbody, () => this.renderBookingsTable(), 'table', 4, 250);
        else this.renderBookingsTable();
      };

      if (searchInput) searchInput.addEventListener('input', triggerFilter);
      if (statusFilter) statusFilter.addEventListener('change', triggerFilter);
    }, 400);
  },

  renderBookingsTable() {
    const tbody = document.getElementById('admin-bookings-tbody');
    if (!tbody) return;

    const session = Auth.getSession();
    let bookings = Storage.getBookings();
    if (session && session.role === 'Organizer') {
      const orgEventIds = Storage.getEvents().filter(e => e.organizerId === session.id).map(e => e.id);
      bookings = bookings.filter(b => orgEventIds.includes(b.eventId));
    }
    const search = (document.getElementById('admin-bookings-search')?.value || '').toLowerCase();
    const status = document.getElementById('admin-bookings-status-filter')?.value || 'All';

    bookings = bookings.filter(b => {
      const matchSearch = b.id.toLowerCase().includes(search) || 
                          b.userName.toLowerCase().includes(search) || 
                          b.eventTitle.toLowerCase().includes(search);
      const matchStatus = status === 'All' || b.bookingStatus === status;
      return matchSearch && matchStatus;
    });

    if (bookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center" style="padding: 2.5rem;">No bookings found.</td></tr>`;
      return;
    }

    tbody.innerHTML = bookings.map(b => `
      <tr>
        <td><strong>${b.id}</strong></td>
        <td>
          <div class="font-semibold text-primary" style="cursor: pointer; text-decoration: underline; text-underline-offset: 2px;" onclick="Admin.openUserModal('${b.userId}')" title="View Attendee Profile">${b.userName}</div>
          <div class="text-xs text-muted">${b.userEmail}</div>
        </td>
        <td>
          <div class="font-semibold">${b.eventTitle}</div>
          <div class="text-xs text-muted">${b.eventDate}</div>
        </td>
        <td><strong>${b.tickets}</strong> ticket(s)</td>
        <td><strong>PKR ${b.totalAmount}</strong></td>
        <td><span class="badge ${b.paymentStatus === 'Paid' ? 'badge-success' : 'badge-warning'}">${b.paymentStatus}</span></td>
        <td><span class="badge badge-${b.bookingStatus.toLowerCase()}">${b.bookingStatus}</span></td>
        <td>
          <div class="action-btns">
            <button class="btn btn-icon btn-sm" onclick="BookingsManager.showDigitalTicket('${b.id}')" title="View Ticket">
              <i class="fa-solid fa-ticket"></i>
            </button>
            ${b.bookingStatus === 'Pending' ? `
              <button class="btn btn-icon btn-sm text-success" onclick="Admin.updateBookingStatusAction('${b.id}', 'Confirmed')" title="Confirm">
                <i class="fa-solid fa-check"></i>
              </button>
            ` : ''}
            ${b.bookingStatus !== 'Cancelled' ? `
              <button class="btn btn-icon btn-sm text-danger" onclick="BookingsManager.cancelBooking('${b.id}')" title="Cancel Booking">
                <i class="fa-solid fa-xmark"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  },

  updateBookingStatusAction(bookingId, status) {
    Storage.updateBookingStatus(bookingId, status);
    UI.showToast(`Booking ${bookingId} status updated to ${status}.`, 'success');
    this.renderBookingsTable();
  },

  // 5. Venues Management Page
  initVenuesPage() {
    Auth.requireAuth('Admin');
    const container = document.getElementById('admin-venues-grid');
    if (container) UI.showSkeleton(container, 'events', 4);

    setTimeout(() => {
      this.renderVenuesGrid();
    }, 400);
  },

  renderVenuesGrid() {
    const container = document.getElementById('admin-venues-grid');
    if (!container) return;

    const venues = Storage.getVenues();
    container.innerHTML = venues.map(v => `
      <div class="card card-interactive">
        <div style="height: 160px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 1rem; position: relative;">
          <img src="${v.image}" alt="${v.name}" style="width:100%; height:100%; object-fit: cover;">
          <span class="badge ${v.availability === 'Available' ? 'badge-success' : 'badge-warning'}" style="position: absolute; top: 0.75rem; right: 0.75rem;">
            ${v.availability}
          </span>
        </div>
        <h3 class="card-title text-base" style="margin-bottom: 0.35rem;">${v.name}</h3>
        <p class="text-xs text-secondary" style="margin-bottom: 0.75rem;"><i class="fa-solid fa-location-dot"></i> ${v.location}</p>
        
        <div class="flex justify-between text-xs" style="background: var(--bg-tertiary); padding: 0.6rem; border-radius: var(--radius-sm); margin-bottom: 1rem;">
          <div>Capacity: <strong>${v.capacity}</strong></div>
          <div>Rate: <strong>PKR ${v.price}/day</strong></div>
        </div>

        <div class="flex gap-1 flex-wrap" style="margin-bottom: 1.25rem;">
          ${(v.amenities || []).map(a => `<span class="category-tag text-xs" style="font-size: 0.7rem;">${a}</span>`).join('')}
        </div>

        <div class="flex justify-between items-center" style="border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
          <span class="text-xs text-muted"><i class="fa-solid fa-phone"></i> ${v.contact}</span>
          <div class="flex gap-2">
            <button class="btn btn-icon btn-sm" onclick="Admin.openEditVenueModal('${v.id}')" title="Edit Venue"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-icon btn-sm text-danger" onclick="Admin.deleteVenueAction('${v.id}')" title="Delete Venue"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>
    `).join('');
  },

  openAddVenueModal() {
    let modal = document.getElementById('venue-form-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'venue-form-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-container modal-md">
        <div class="modal-header">
          <h3 class="modal-title">Add New Venue</h3>
          <button class="modal-close" onclick="UI.closeModal('venue-form-modal')">&times;</button>
        </div>
        <form onsubmit="Admin.handleSaveVenue(event)" style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Venue Name</label>
              <input type="text" class="form-control" id="venue-name" required placeholder="e.g. Crystal Grand Auditorium">
            </div>
            <div class="form-group">
              <label class="form-label">Location Address</label>
              <input type="text" class="form-control" id="venue-loc" required placeholder="e.g. 500 Broadway St, NY">
            </div>
            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Capacity</label>
                <input type="number" class="form-control" id="venue-cap" min="20" value="400" required>
              </div>
              <div class="form-group">
                <label class="form-label">Daily Price (PKR )</label>
                <input type="number" class="form-control" id="venue-price" min="100" value="2000" required>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Contact Phone</label>
              <input type="text" class="form-control" id="venue-contact" value="+1 (555) 000-0000" required>
            </div>
            <div class="form-group">
              <label class="form-label">Image URL</label>
              <input type="url" class="form-control" id="venue-image" value="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="UI.closeModal('venue-form-modal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Venue</button>
          </div>
        </form>
      </div>
    `;

    UI.openModal('venue-form-modal');
  },

  handleSaveVenue(e) {
    e.preventDefault();
    Storage.saveVenue({
      name: document.getElementById('venue-name').value,
      location: document.getElementById('venue-loc').value,
      capacity: parseInt(document.getElementById('venue-cap').value, 10),
      price: parseFloat(document.getElementById('venue-price').value),
      contact: document.getElementById('venue-contact').value,
      image: document.getElementById('venue-image').value,
      availability: 'Available',
      amenities: ['WiFi', 'AV System', 'Air Conditioning', 'Parking']
    });
    UI.closeModal('venue-form-modal');
    UI.showToast('Venue saved successfully!', 'success');
    this.renderVenuesGrid();
  },

  openEditVenueModal(venueId) {
    const venue = Storage.getVenueById(venueId);
    if (!venue) {
      UI.showToast('Venue not found', 'error');
      return;
    }

    this.openAddVenueModal();
    document.querySelector('#venue-form-modal .modal-title').textContent = 'Edit Venue: ' + venue.name;
    
    document.getElementById('venue-name').value = venue.name;
    document.getElementById('venue-loc').value = venue.location;
    document.getElementById('venue-cap').value = venue.capacity;
    document.getElementById('venue-price').value = venue.price;
    document.getElementById('venue-contact').value = venue.contact;
    document.getElementById('venue-image').value = venue.image;

    const form = document.querySelector('#venue-form-modal form');
    form.onsubmit = (e) => {
      e.preventDefault();
      Storage.saveVenue({
        id: venue.id,
        name: document.getElementById('venue-name').value,
        location: document.getElementById('venue-loc').value,
        capacity: parseInt(document.getElementById('venue-cap').value, 10),
        price: parseFloat(document.getElementById('venue-price').value),
        contact: document.getElementById('venue-contact').value,
        image: document.getElementById('venue-image').value,
        availability: venue.availability || 'Available',
        amenities: venue.amenities || ['WiFi', 'AV System', 'Air Conditioning', 'Parking']
      });
      UI.closeModal('venue-form-modal');
      UI.showToast('Venue updated successfully!', 'success', 'Venue Saved');
      Admin.renderVenuesGrid();
    };
  },

  deleteVenueAction(venueId) {
    UI.confirm('Delete Venue', 'Are you sure you want to delete this venue record?', () => {
      Storage.deleteVenue(venueId);
      UI.showToast('Venue deleted.', 'info');
      Admin.renderVenuesGrid();
    });
  },

  // 6. Reports & Analytics Page
  initReportsPage() {
    Auth.requireAuth('Admin');
    const bookings = Storage.getBookings();
    const events = Storage.getEvents();

    const curr = Storage.getCurrency();
    const totalRev = bookings.filter(b => b.paymentStatus === 'Paid').reduce((sum, b) => sum + b.totalAmount, 0);
    const avgTicket = bookings.length > 0 ? (totalRev / bookings.length).toFixed(2) : 0;
    const totalSeats = events.reduce((sum, e) => sum + e.capacity, 0);
    const totalBooked = events.reduce((sum, e) => sum + (e.bookedSeats || 0), 0);
    const occupancyRate = totalSeats > 0 ? Math.round((totalBooked / totalSeats) * 100) : 0;

    UI.animateCounter(document.getElementById('report-total-revenue'), totalRev, curr);
    UI.animateCounter(document.getElementById('report-avg-ticket'), avgTicket, curr);
    UI.animateCounter(document.getElementById('report-occupancy'), occupancyRate, '', '%');
    UI.animateCounter(document.getElementById('report-total-attendees'), totalBooked);

    // Render Analytics Chart
    Charts.renderBarChart('report-revenue-bar-chart', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'], [1500, 2800, 4200, 6100, 7800, 9500, 11200, 14800], { prefix: curr });
  },

  exportReportCsv() {
    const bookings = Storage.getBookings();
    let csv = 'Booking ID,Attendee,Email,Event,Date,Tier,Tickets,Total Amount,Payment Status,Booking Status,Check-In Status\n';
    bookings.forEach(b => {
      csv += `"${b.id}","${b.userName}","${b.userEmail}","${b.eventTitle}","${b.eventDate}","${b.tierName || 'Standard'}",${b.tickets},${b.totalAmount},"${b.paymentStatus}","${b.bookingStatus}","${b.checkInStatus || 'Pending'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eventify_financial_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    UI.showToast('CSV Financial report exported successfully!', 'success', 'Export');
  },

  // 7. Settings Page & Promo Codes Management
  initSettingsPage() {
    Auth.requireAuth('Admin');
    const settings = Storage.getSettings();
    
    const titleEl = document.getElementById('setting-site-title');
    const currEl = document.getElementById('setting-currency');
    const taxEl = document.getElementById('setting-tax-rate');
    const autoEl = document.getElementById('setting-auto-confirm');
    const emailEl = document.getElementById('setting-email-notif');

    if (titleEl) titleEl.value = settings.siteTitle || 'Eventify Platform';
    if (currEl) currEl.value = settings.currency || 'PKR ';
    if (taxEl) taxEl.value = settings.taxRate || 8.5;
    if (autoEl) autoEl.checked = !!settings.autoConfirmBookings;
    if (emailEl) emailEl.checked = !!settings.emailNotifications;

    this.renderPromosTable();
  },

  savePlatformSettings(e) {
    e.preventDefault();
    const updated = {
      siteTitle: document.getElementById('setting-site-title').value,
      currency: document.getElementById('setting-currency').value,
      taxRate: parseFloat(document.getElementById('setting-tax-rate').value),
      autoConfirmBookings: document.getElementById('setting-auto-confirm').checked,
      emailNotifications: document.getElementById('setting-email-notif').checked,
      stripeEnabled: true,
      paypalEnabled: true
    };
    Storage.saveSettings(updated);
    UI.showToast('Platform settings saved successfully!', 'success', 'Saved');
  },

  renderPromosTable() {
    const tbody = document.getElementById('admin-promos-tbody');
    if (!tbody) return;

    const promos = Storage.getPromos();
    if (promos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 1.5rem; color: var(--text-muted);">No promo discount codes defined.</td></tr>`;
      return;
    }

    tbody.innerHTML = promos.map(p => `
      <tr>
        <td><strong class="text-primary font-mono">${p.code}</strong></td>
        <td>${p.discountType === 'percent' ? `${p.discountValue}% Off` : `${Storage.formatPrice(p.discountValue)} Fixed`}</td>
        <td>${p.description || '-'}</td>
        <td>${p.minPurchase ? Storage.formatPrice(p.minPurchase) : 'None'}</td>
        <td><span class="badge ${p.active ? 'badge-success' : 'badge-danger'}">${p.active ? 'Active' : 'Disabled'}</span></td>
        <td>
          <button class="btn btn-icon btn-sm text-danger" onclick="Admin.deletePromoAction('${p.code}')" title="Delete Promo"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  },

  openAddPromoModal() {
    let modal = document.getElementById('promo-form-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'promo-form-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-container modal-md">
        <div class="modal-header">
          <h3 class="modal-title">Create Promo Discount Code</h3>
          <button class="modal-close" onclick="UI.closeModal('promo-form-modal')">&times;</button>
        </div>
        <form onsubmit="Admin.handleSavePromo(event)" style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Coupon Code (Uppercase)</label>
              <input type="text" class="form-control" id="promo-code-input" required placeholder="e.g. FLASH30" style="text-transform: uppercase;">
            </div>
            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Discount Type</label>
                <select class="form-control" id="promo-type-select">
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (PKR )</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Discount Value</label>
                <input type="number" class="form-control" id="promo-val-input" min="1" max="1000" value="20" required>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Minimum Order Purchase (PKR )</label>
              <input type="number" class="form-control" id="promo-min-input" min="0" value="0">
            </div>
            <div class="form-group">
              <label class="form-label">Description / Campaign Name</label>
              <input type="text" class="form-control" id="promo-desc-input" placeholder="e.g. 20% Special Weekend Sale">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="UI.closeModal('promo-form-modal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Create Promo Code</button>
          </div>
        </form>
      </div>
    `;

    UI.openModal('promo-form-modal');
  },

  handleSavePromo(e) {
    e.preventDefault();
    const code = document.getElementById('promo-code-input').value.trim().toUpperCase();
    const type = document.getElementById('promo-type-select').value;
    const val = parseFloat(document.getElementById('promo-val-input').value);
    const min = parseFloat(document.getElementById('promo-min-input').value) || 0;
    const desc = document.getElementById('promo-desc-input').value.trim();

    Storage.savePromo({
      code: code,
      discountType: type,
      discountValue: val,
      minPurchase: min,
      description: desc,
      active: true
    });

    UI.closeModal('promo-form-modal');
    UI.showToast(`Promo code ${code} created successfully!`, 'success', 'Promo Created');
    this.renderPromosTable();
  },

  deletePromoAction(code) {
    UI.confirm('Delete Promo Code', `Are you sure you want to delete promo code "${code}"?`, () => {
      Storage.deletePromo(code);
      UI.showToast(`Promo code ${code} deleted.`, 'info');
      Admin.renderPromosTable();
    });
  }
};
