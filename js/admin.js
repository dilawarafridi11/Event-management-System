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
      const events = Storage.getEvents();
      const bookings = Storage.getBookings();
      const users = Storage.getUsers();

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

    let events = Storage.getEvents();
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

  handleSaveEvent(e) {
    e.preventDefault();
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
      status: document.getElementById('event-input-status').value,
      image: document.getElementById('event-input-image').value
    };

    Storage.saveEvent(newEvent);
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
  initUsersPage() {
    Auth.requireAuth('Admin');
    const tbody = document.getElementById('admin-users-tbody');
    if (tbody) UI.showSkeleton(tbody, 'table', 5);

    setTimeout(() => {
      this.renderUsersTable();

      const searchInput = document.getElementById('admin-users-search');
      const roleFilter = document.getElementById('admin-users-role-filter');

      const triggerFilter = () => {
        if (tbody) UI.simulateLoading(tbody, () => this.renderUsersTable(), 'table', 4, 250);
        else this.renderUsersTable();
      };

      if (searchInput) searchInput.addEventListener('input', triggerFilter);
      if (roleFilter) roleFilter.addEventListener('change', triggerFilter);
    }, 400);
  },

  renderUsersTable() {
    const tbody = document.getElementById('admin-users-tbody');
    if (!tbody) return;

    let users = Storage.getUsers();
    const search = (document.getElementById('admin-users-search')?.value || '').toLowerCase();
    const role = document.getElementById('admin-users-role-filter')?.value || 'All';

    users = users.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search) || (u.phone && u.phone.includes(search));
      const matchRole = role === 'All' || u.role === role;
      return matchSearch && matchRole;
    });

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 2rem;">No users found.</td></tr>`;
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div class="flex items-center gap-3">
            <div class="avatar" style="width:36px; height:36px;">
              <img src="${u.avatar}" alt="${u.name}">
            </div>
            <div>
              <div class="font-bold text-primary">${u.name}</div>
              <div class="text-xs text-muted">${u.id}</div>
            </div>
          </div>
        </td>
        <td>${u.email}</td>
        <td>${u.phone || 'N/A'}</td>
        <td><span class="badge ${u.role === 'Admin' ? 'badge-confirmed' : 'badge-info'}">${u.role}</span></td>
        <td>${u.registeredDate || '2026-01-01'}</td>
        <td><strong>${u.eventsBooked || 0}</strong> events</td>
        <td>
          <span class="badge ${u.status === 'Active' ? 'badge-success' : 'badge-danger'}">
            ${u.status || 'Active'}
          </span>
        </td>
        <td>
          <div class="action-btns">
            <button class="btn btn-icon btn-sm" onclick="Admin.toggleUserStatus('${u.id}')" title="Toggle Active/Inactive">
              ${u.status === 'Active' ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>'}
            </button>
            <button class="btn btn-icon btn-sm text-danger" onclick="Admin.deleteUserAction('${u.id}')" title="Delete User">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  toggleUserStatus(userId) {
    const user = Storage.getUserById(userId);
    if (!user) return;
    if (user.role === 'Admin') {
      UI.showToast('Super Admin account status cannot be toggled.', 'warning');
      return;
    }
    user.status = user.status === 'Active' ? 'Inactive' : 'Active';
    Storage.saveUser(user);
    UI.showToast(`User marked as ${user.status}.`, 'info');
    this.renderUsersTable();
  },

  deleteUserAction(userId) {
    const user = Storage.getUserById(userId);
    if (user && user.role === 'Admin') {
      UI.showToast('Super Admin account cannot be deleted.', 'error');
      return;
    }

    UI.confirm(
      'Delete User',
      `Are you sure you want to delete user "${user.name}"? This action cannot be undone.`,
      () => {
        Storage.deleteUser(userId);
        UI.showToast('User account deleted.', 'info');
        Admin.renderUsersTable();
      },
      'Yes, Delete User',
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

    let bookings = Storage.getBookings();
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
          <div class="font-semibold text-primary">${b.userName}</div>
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
