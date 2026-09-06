/**
 * EVENTIFY - Events Controller
 * Handles filtering, search, multi-criteria queries, pagination, card & list rendering,
 * star ratings, attendee reviews, and rich modal inspection.
 */

const EventsManager = {
  renderEventCard(event, isUserView = true) {
    const isFav = Storage.isFavorite(event.id);
    const availableSeats = Math.max(0, event.capacity - (event.bookedSeats || 0));
    const isSoldOut = availableSeats <= 0;
    const ratingHtml = UI.renderStarRating(event.rating || 5.0);

    // Price display (single or multi-tier)
    let priceLabel = Storage.formatPrice(event.ticketPrice);
    if (event.tiers && event.tiers.length > 1) {
      const minPrice = Math.min(...event.tiers.map(t => t.price));
      priceLabel = `From ${Storage.formatPrice(minPrice)}`;
    }

    return `
      <div class="event-card" data-id="${event.id}">
        <div class="event-card-img-wrapper">
          <img src="${event.image}" alt="${UI.escapeHtml(event.title)}" class="event-card-img" loading="lazy">
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
          <div class="flex justify-between items-center" style="margin-bottom: 0.35rem;">
            <div class="event-card-date">
              <span><i class="fa-solid fa-calendar-days"></i> ${EventsManager.formatDate(event.date)} • <i class="fa-solid fa-clock"></i> ${event.startTime}</span>
            </div>
            ${ratingHtml}
          </div>
          <h3 class="event-card-title">${UI.escapeHtml(event.title)}</h3>
          <div class="event-card-meta">
            <div class="event-card-meta-item">
              <span><i class="fa-solid fa-location-dot"></i></span>
              <span class="text-truncate">${UI.escapeHtml(event.venue)}</span>
            </div>
            <div class="event-card-meta-item">
              <span><i class="fa-solid fa-ticket"></i></span>
              <span>${isSoldOut ? '<strong class="text-danger">Sold Out</strong>' : `<strong>${availableSeats}</strong> seats left`}</span>
            </div>
          </div>
          <div class="event-card-footer">
            <div class="event-price">
              ${priceLabel}
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

  renderEventListItem(event, isUserView = true) {
    const isFav = Storage.isFavorite(event.id);
    const availableSeats = Math.max(0, event.capacity - (event.bookedSeats || 0));
    const isSoldOut = availableSeats <= 0;
    const ratingHtml = UI.renderStarRating(event.rating || 5.0);

    let priceLabel = Storage.formatPrice(event.ticketPrice);
    if (event.tiers && event.tiers.length > 1) {
      const minPrice = Math.min(...event.tiers.map(t => t.price));
      priceLabel = `From ${Storage.formatPrice(minPrice)}`;
    }

    return `
      <div class="event-list-item">
        <div class="event-list-img-wrapper">
          <img src="${event.image}" alt="${UI.escapeHtml(event.title)}" class="event-list-img">
          <span class="category-tag event-card-category" style="top: 8px; left: 8px;">${event.category}</span>
        </div>
        <div class="event-list-content">
          <div>
            <div class="flex justify-between items-center flex-wrap gap-2" style="margin-bottom: 0.25rem;">
              <span class="text-xs text-muted font-semibold"><i class="fa-solid fa-calendar-days"></i> ${EventsManager.formatDate(event.date)} • <i class="fa-solid fa-clock"></i> ${event.startTime} - ${event.endTime}</span>
              ${ratingHtml}
            </div>
            <h3 class="font-bold text-base text-primary" style="margin-bottom: 0.35rem;">${UI.escapeHtml(event.title)}</h3>
            <p class="text-xs text-secondary text-truncate-2" style="margin-bottom: 0.75rem;">${UI.escapeHtml(event.description)}</p>
            <div class="flex gap-4 text-xs text-muted">
              <span><i class="fa-solid fa-location-dot"></i> ${UI.escapeHtml(event.venue)}</span>
              <span><i class="fa-solid fa-ticket"></i> ${isSoldOut ? '<strong class="text-danger">Sold Out</strong>' : `<strong>${availableSeats}</strong> seats left`}</span>
              <span><i class="fa-solid fa-users"></i> ${event.organizer}</span>
            </div>
          </div>
          <div class="flex justify-between items-center" style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
            <div class="font-bold text-lg text-primary">${priceLabel}</div>
            <div class="flex gap-2">
              <button class="btn btn-secondary btn-sm" onclick="EventsManager.viewEventDetails('${event.id}')">Details</button>
              ${isUserView ? `
                <button class="btn btn-primary btn-sm ${isSoldOut ? 'disabled' : ''}" onclick="BookingsManager.openBookingModal('${event.id}')" ${isSoldOut ? 'disabled' : ''}>
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

    if (window.location.pathname.includes('favorites.html') && typeof User !== 'undefined' && typeof User.renderFavorites === 'function') {
      User.renderFavorites();
    }
  },

  // Detailed Modal Viewer with Reviews & Ticket Tiers
  viewEventDetails(eventId) {
    const event = Storage.getEventById(eventId);
    if (!event) {
      UI.showToast('Event details not found', 'error');
      return;
    }

    const availableSeats = Math.max(0, event.capacity - (event.bookedSeats || 0));
    const reviews = Storage.getEventReviews(eventId);
    const tiers = event.tiers && event.tiers.length > 0 ? event.tiers : [
      { name: 'General Admission', price: event.ticketPrice || 50, description: 'Standard admission', capacity: event.capacity }
    ];

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
            ${UI.renderStarRating(event.rating || 5.0)}
            <span class="text-xs text-muted">(${event.reviewCount || reviews.length} reviews)</span>
          </div>
          <button class="modal-close" onclick="UI.closeModal('event-details-modal')">&times;</button>
        </div>
        <div class="modal-body" style="padding-top: 0.5rem; max-height: 75vh; overflow-y: auto;">
          <div style="height: 240px; border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 1.25rem;">
            <img src="${event.image}" alt="${UI.escapeHtml(event.title)}" style="width:100%; height:100%; object-fit:cover;">
          </div>
          <h2 style="font-size: 1.5rem; margin-bottom: 0.75rem;">${UI.escapeHtml(event.title)}</h2>
          <p class="text-secondary" style="margin-bottom: 1.25rem; line-height: 1.6; font-size: 0.95rem;">${UI.escapeHtml(event.description)}</p>
          
          <!-- Event Core Meta Grid -->
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
            <div>
              <div class="text-xs text-muted font-semibold uppercase">Date & Time</div>
              <div class="font-bold text-sm">${this.formatDate(event.date)}</div>
              <div class="text-xs text-secondary">${event.startTime} - ${event.endTime}</div>
            </div>
            <div>
              <div class="text-xs text-muted font-semibold uppercase">Venue</div>
              <div class="font-bold text-sm text-truncate">${UI.escapeHtml(event.venue)}</div>
              <div class="text-xs text-secondary">${UI.escapeHtml(event.location)}</div>
            </div>
            <div>
              <div class="text-xs text-muted font-semibold uppercase">Organizer</div>
              <div class="font-bold text-sm">${UI.escapeHtml(event.organizer)}</div>
            </div>
            <div>
              <div class="text-xs text-muted font-semibold uppercase">Capacity Status</div>
              <div class="font-bold text-sm">${event.bookedSeats || 0} / ${event.capacity} seats</div>
            </div>
          </div>

          <!-- Ticket Tiers Overview -->
          <h4 class="font-bold text-sm" style="margin-bottom: 0.75rem;"><i class="fa-solid fa-ticket"></i> Available Ticket Tiers</h4>
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem;">
            ${tiers.map(t => `
              <div style="background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem;">
                <div class="flex justify-between items-center" style="margin-bottom: 0.25rem;">
                  <strong class="text-sm">${t.name}</strong>
                  <span class="font-bold text-primary">${Storage.formatPrice(t.price)}</span>
                </div>
                <div class="text-xs text-muted">${t.description || 'Access pass'}</div>
              </div>
            `).join('')}
          </div>

          <!-- Attendee Reviews Section -->
          <div class="flex justify-between items-center" style="margin-bottom: 0.75rem;">
            <h4 class="font-bold text-sm"><i class="fa-solid fa-star"></i> Attendee Reviews & Ratings (${reviews.length})</h4>
            <button class="btn btn-outline btn-sm" onclick="EventsManager.openAddReviewModal('${event.id}')">
              <i class="fa-solid fa-pen-nib"></i> Write a Review
            </button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem;">
            ${reviews.length === 0 ? `
              <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-sm); text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                No reviews yet. Be the first to share your experience!
              </div>
            ` : reviews.map(r => `
              <div style="background: var(--bg-tertiary); padding: 0.85rem 1rem; border-radius: var(--radius-md);">
                <div class="flex justify-between items-center" style="margin-bottom: 0.35rem;">
                  <span class="font-bold text-sm">${UI.escapeHtml(r.userName)}</span>
                  <div>${UI.renderStarRating(r.rating)}</div>
                </div>
                <p class="text-xs text-secondary" style="margin-bottom: 0.25rem; line-height: 1.5;">${UI.escapeHtml(r.comment)}</p>
                <div class="text-xs text-muted font-semibold">${r.date}</div>
              </div>
            `).join('')}
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
  },

  // Add Review Modal
  openAddReviewModal(eventId) {
    const session = Auth.getSession();
    if (!session) {
      UI.showToast('Please log in as an attendee to write a review.', 'warning');
      return;
    }

    let modal = document.getElementById('add-review-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'add-review-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-container modal-md">
        <div class="modal-header">
          <h3 class="modal-title">Write Attendee Review</h3>
          <button class="modal-close" onclick="UI.closeModal('add-review-modal')">&times;</button>
        </div>
        <form onsubmit="EventsManager.handleReviewSubmit(event, '${eventId}')">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Your Star Rating</label>
              <select class="form-control" id="review-rating-select" required>
                <option value="5"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i> 5 Stars - Exceptional</option>
                <option value="4"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i> 4 Stars - Very Good</option>
                <option value="3"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i> 3 Stars - Average</option>
                <option value="2"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i> 2 Stars - Needs Improvement</option>
                <option value="1"><i class="fa-solid fa-star"></i> 1 Star - Poor</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Review & Feedback</label>
              <textarea class="form-control" id="review-comment" rows="4" placeholder="Share highlights about speakers, venue atmosphere, or gate admission..." required></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="UI.closeModal('add-review-modal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Submit Review</button>
          </div>
        </form>
      </div>
    `;

    UI.openModal('add-review-modal');
  },

  handleReviewSubmit(e, eventId) {
    e.preventDefault();
    const session = Auth.getSession();
    const rating = parseInt(document.getElementById('review-rating-select').value, 10);
    const comment = document.getElementById('review-comment').value.trim();

    Storage.addEventReview({
      eventId: eventId,
      userId: session.id,
      userName: session.name,
      rating: rating,
      comment: comment
    });

    UI.closeModal('add-review-modal');
    UI.showToast('Thank you! Your review has been published.', 'success', 'Review Added');
    
    // Refresh modal
    EventsManager.viewEventDetails(eventId);
    if (typeof User !== 'undefined' && User.renderDiscoverEvents) User.renderDiscoverEvents();
  }
};
