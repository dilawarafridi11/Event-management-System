/**
 * EVENTIFY - Events Controller
 * Handles filtering, search, multi-criteria queries, pagination, and card rendering.
 */

const EventsManager = {
  renderEventCard(event, isUserView = true) {
    const isFav = Storage.isFavorite(event.id);
    const availableSeats = Math.max(0, event.capacity - (event.bookedSeats || 0));
    const isSoldOut = availableSeats <= 0;

    return `
      <div class="event-card" data-id="${event.id}">
        <div class="event-card-img-wrapper">
          <img src="${event.image}" alt="${event.title}" class="event-card-img" loading="lazy">
          <span class="category-tag event-card-category">${event.category}</span>
          ${isUserView ? `
            <button class="event-card-fav-btn ${isFav ? 'active' : ''}" onclick="EventsManager.toggleFav('${event.id}', this)" title="Add to Favorites" aria-label="Favorite">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          ` : ''}
        </div>
        <div class="event-card-body">
          <div class="event-card-date">
            <span>📅 ${EventsManager.formatDate(event.date)} • ⏰ ${event.startTime}</span>
          </div>
          <h3 class="event-card-title">${event.title}</h3>
          <div class="event-card-meta">
            <div class="event-card-meta-item">
              <span>📍</span>
              <span class="text-truncate">${event.venue}</span>
            </div>
            <div class="event-card-meta-item">
              <span>🎟️</span>
              <span>${isSoldOut ? '<strong class="text-danger">Sold Out</strong>' : `<strong>${availableSeats}</strong> seats left`}</span>
            </div>
          </div>
          <div class="event-card-footer">
            <div class="event-price ${event.ticketPrice === 0 ? 'free' : ''}">
              ${event.ticketPrice === 0 ? 'Free' : `$${event.ticketPrice}`}
            </div>
            <div class="flex gap-2">
              <button class="btn btn-secondary btn-sm" onclick="EventsManager.viewEventDetails('${event.id}')">
                Details
              </button>
              ${isUserView ? `
                <button class="btn btn-primary btn-sm ${isSoldOut ? 'disabled' : ''}" 
                        onclick="BookingsManager.openBookingModal('${event.id}')"
                        ${isSoldOut ? 'disabled' : ''}>
                  ${isSoldOut ? 'Sold Out' : 'Book Now'}
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  toggleFav(eventId, btnEl) {
    const isFavNow = Storage.toggleFavorite(eventId);
    if (btnEl) {
      btnEl.classList.toggle('active', isFavNow);
      const svg = btnEl.querySelector('svg');
      if (svg) svg.setAttribute('fill', isFavNow ? 'currentColor' : 'none');
    }
    UI.showToast(
      isFavNow ? 'Event added to favorites' : 'Event removed from favorites',
      isFavNow ? 'success' : 'info',
      'Favorites'
    );

    // If we're on the favorites page, reload the list
    if (window.location.pathname.includes('favorites.html') && typeof loadFavorites === 'function') {
      loadFavorites();
    }
  },

  // Detailed Modal Viewer
  viewEventDetails(eventId) {
    const event = Storage.getEventById(eventId);
    if (!event) {
      UI.showToast('Event details not found', 'error');
      return;
    }

    const availableSeats = Math.max(0, event.capacity - (event.bookedSeats || 0));

    let modal = document.getElementById('event-details-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'event-details-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-container modal-lg">
        <div class="modal-header">
          <div class="flex items-center gap-2">
            <span class="category-tag">${event.category}</span>
            <span class="badge badge-${event.status.toLowerCase()}">${event.status}</span>
          </div>
          <button class="modal-close" onclick="UI.closeModal('event-details-modal')">&times;</button>
        </div>
        <div class="modal-body" style="padding-top: 0.5rem;">
          <div style="height: 260px; border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 1.5rem;">
            <img src="${event.image}" alt="${event.title}" style="width:100%; height:100%; object-fit:cover;">
          </div>
          <h2 style="font-size: 1.6rem; margin-bottom: 0.75rem;">${event.title}</h2>
          <p class="text-secondary" style="margin-bottom: 1.5rem; line-height: 1.6;">${event.description}</p>
          
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; background: var(--bg-tertiary); padding: 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
            <div>
              <div class="text-xs text-muted font-semibold uppercase">Date & Time</div>
              <div class="font-bold text-sm">${this.formatDate(event.date)}</div>
              <div class="text-xs text-secondary">${event.startTime} - ${event.endTime}</div>
            </div>
            <div>
              <div class="text-xs text-muted font-semibold uppercase">Venue</div>
              <div class="font-bold text-sm">${event.venue}</div>
              <div class="text-xs text-secondary">${event.location}</div>
            </div>
            <div>
              <div class="text-xs text-muted font-semibold uppercase">Organizer</div>
              <div class="font-bold text-sm">${event.organizer}</div>
            </div>
            <div>
              <div class="text-xs text-muted font-semibold uppercase">Ticket Price</div>
              <div class="font-bold text-lg text-primary">${event.ticketPrice === 0 ? 'Free' : `$${event.ticketPrice}`}</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="UI.closeModal('event-details-modal')">Close</button>
          <button class="btn btn-primary" onclick="UI.closeModal('event-details-modal'); BookingsManager.openBookingModal('${event.id}')">
            Book Tickets Now
          </button>
        </div>
      </div>
    `;

    UI.openModal('event-details-modal');
  }
};
