/**
 * EVENTIFY - Bookings & Digital Ticket Controller
 * Handles booking creation, seat validation, dynamic price calculation, and digital ticket rendering with QR code visual.
 */

const BookingsManager = {
  // Open Booking Modal for an Event
  openBookingModal(eventId) {
    const session = Auth.getSession();
    const inSubDir = window.location.pathname.includes('/user/') || window.location.pathname.includes('/admin/');
    const loginUrl = inSubDir ? '../login.html' : 'login.html';

    if (!session) {
      UI.confirm(
        'Login Required',
        'You need to be logged in as a User to book tickets. Would you like to log in now?',
        () => { window.location.href = loginUrl; },
        'Go to Login',
        'btn-primary'
      );
      return;
    }

    const event = Storage.getEventById(eventId);
    if (!event) {
      UI.showToast('Event not found', 'error');
      return;
    }

    const availableSeats = Math.max(0, event.capacity - (event.bookedSeats || 0));
    if (availableSeats <= 0) {
      UI.showToast('Sorry, this event is completely sold out!', 'warning', 'Sold Out');
      return;
    }

    let modal = document.getElementById('booking-process-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'booking-process-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    const maxQty = Math.min(8, availableSeats);

    modal.innerHTML = `
      <div class="modal-container modal-md">
        <div class="modal-header">
          <h3 class="modal-title">Book Tickets</h3>
          <button class="modal-close" onclick="UI.closeModal('booking-process-modal')">&times;</button>
        </div>
        <form id="booking-submit-form" onsubmit="BookingsManager.handleBookingSubmit(event, '${event.id}')">
          <div class="modal-body">
            <div style="display:flex; gap:1rem; align-items:center; margin-bottom:1.5rem; background:var(--bg-tertiary); padding:1rem; border-radius:var(--radius-md);">
              <img src="${event.image}" style="width:64px; height:64px; border-radius:var(--radius-sm); object-fit:cover;">
              <div>
                <div class="font-bold text-sm text-primary">${event.title}</div>
                <div class="text-xs text-secondary">📍 ${event.venue}</div>
                <div class="text-xs text-muted">📅 ${event.date} • ${event.startTime}</div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Attendee Name</label>
              <input type="text" class="form-control" id="book-attendee-name" value="${session.name}" required>
            </div>

            <div class="form-group">
              <label class="form-label">Attendee Email</label>
              <input type="email" class="form-control" id="book-attendee-email" value="${session.email}" required>
            </div>

            <div class="form-group">
              <label class="form-label">Number of Tickets (Max ${maxQty})</label>
              <select class="form-control" id="book-ticket-qty" onchange="BookingsManager.recalculateTotal(${event.ticketPrice})">
                ${Array.from({ length: maxQty }, (_, i) => i + 1).map(n => `<option value="${n}">${n} Ticket${n > 1 ? 's' : ''}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Payment Method</label>
              <select class="form-control" id="book-payment-method">
                <option value="Credit/Debit Card">Credit / Debit Card (Stripe)</option>
                <option value="PayPal">PayPal Instant</option>
                <option value="Apple Pay">Apple Pay / Google Pay</option>
              </select>
            </div>

            <div style="background:var(--bg-elevated); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-top:1.25rem;">
              <div class="flex justify-between text-sm" style="margin-bottom:0.35rem;">
                <span class="text-secondary">Ticket Price:</span>
                <span class="font-semibold">$${event.ticketPrice} x <span id="summary-qty">1</span></span>
              </div>
              <div class="flex justify-between text-sm" style="margin-bottom:0.35rem;">
                <span class="text-secondary">Service Fee (0%):</span>
                <span class="font-semibold text-success">$0.00</span>
              </div>
              <div class="dropdown-divider"></div>
              <div class="flex justify-between text-base font-bold">
                <span>Total Amount:</span>
                <span class="text-primary" id="summary-total">$${event.ticketPrice}</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="UI.closeModal('booking-process-modal')">Cancel</button>
            <button type="submit" class="btn btn-primary" id="confirm-booking-btn">
              Confirm & Pay
            </button>
          </div>
        </form>
      </div>
    `;

    UI.openModal('booking-process-modal');
  },

  recalculateTotal(pricePerTicket) {
    const qty = parseInt(document.getElementById('book-ticket-qty').value, 10) || 1;
    const total = qty * pricePerTicket;
    document.getElementById('summary-qty').textContent = qty;
    document.getElementById('summary-total').textContent = `$${total}`;
  },

  handleBookingSubmit(e, eventId) {
    e.preventDefault();
    const session = Auth.getSession();
    const event = Storage.getEventById(eventId);
    if (!event) return;

    const qty = parseInt(document.getElementById('book-ticket-qty').value, 10) || 1;
    const attendeeName = document.getElementById('book-attendee-name').value;
    const attendeeEmail = document.getElementById('book-attendee-email').value;
    const totalAmount = qty * event.ticketPrice;

    const btn = document.getElementById('confirm-booking-btn');
    btn.disabled = true;
    btn.innerHTML = `<span class="spin">↻</span> Processing Payment...`;

    setTimeout(() => {
      const booking = Storage.createBooking({
        userId: session.id,
        userName: attendeeName,
        userEmail: attendeeEmail,
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: `${event.startTime} - ${event.endTime}`,
        venue: event.venue,
        tickets: qty,
        ticketPrice: event.ticketPrice,
        totalAmount: totalAmount,
        paymentStatus: 'Paid',
        bookingStatus: 'Confirmed'
      });

      UI.closeModal('booking-process-modal');
      UI.showToast('Booking and payment completed successfully!', 'success', 'Confirmed');

      // Open digital ticket view immediately
      BookingsManager.showDigitalTicket(booking.id);

      // If on bookings or dashboard page, refresh data
      if (typeof loadUserBookings === 'function') loadUserBookings();
      if (typeof loadUserDashboard === 'function') loadUserDashboard();
    }, 900);
  },

  // View Digital Ticket Modal
  showDigitalTicket(bookingId) {
    const booking = Storage.getBookings().find(b => b.id === bookingId);
    if (!booking) {
      UI.showToast('Ticket not found', 'error');
      return;
    }

    let modal = document.getElementById('digital-ticket-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'digital-ticket-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    // Generate Procedural QR Matrix SVG
    const qrSvg = BookingsManager.generateQrSvg(booking.qrCodeData || booking.id);

    modal.innerHTML = `
      <div class="modal-container modal-lg">
        <div class="modal-header">
          <div class="flex items-center gap-2">
            <span class="badge badge-confirmed">Official Digital Pass</span>
            <span class="text-xs text-muted font-bold">${booking.id}</span>
          </div>
          <button class="modal-close" onclick="UI.closeModal('digital-ticket-modal')">&times;</button>
        </div>
        <div class="modal-body" style="padding: 1.5rem 1rem;">
          <div class="ticket-wrapper">
            <div class="ticket-header">
              <div class="ticket-header-brand">EVENTIFY ADMISSION PASS</div>
              <div class="ticket-header-title">${booking.eventTitle}</div>
            </div>
            <div class="ticket-notch-divider">
              <div class="ticket-notch-left"></div>
              <div class="ticket-dashed-line"></div>
              <div class="ticket-notch-right"></div>
            </div>
            <div class="ticket-body">
              <div class="ticket-info-grid">
                <div>
                  <div class="ticket-info-label">Attendee</div>
                  <div class="ticket-info-val">${booking.userName}</div>
                </div>
                <div>
                  <div class="ticket-info-label">Ticket Qty</div>
                  <div class="ticket-info-val">${booking.tickets} Person(s)</div>
                </div>
                <div>
                  <div class="ticket-info-label">Date</div>
                  <div class="ticket-info-val">${booking.eventDate}</div>
                </div>
                <div>
                  <div class="ticket-info-label">Time</div>
                  <div class="ticket-info-val">${booking.eventTime}</div>
                </div>
                <div style="grid-column: span 2;">
                  <div class="ticket-info-label">Venue Location</div>
                  <div class="ticket-info-val">${booking.venue}</div>
                </div>
                <div>
                  <div class="ticket-info-label">Total Paid</div>
                  <div class="ticket-info-val text-primary">$${booking.totalAmount}</div>
                </div>
                <div>
                  <div class="ticket-info-label">Status</div>
                  <div class="ticket-info-val text-success">✓ ${booking.bookingStatus}</div>
                </div>
              </div>
              <div class="ticket-qr-section">
                <div class="ticket-qr-placeholder">
                  ${qrSvg}
                </div>
                <div class="ticket-barcode-text">${booking.id}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="UI.closeModal('digital-ticket-modal')">Close</button>
          <button type="button" class="btn btn-outline" onclick="window.print()">
            🖨️ Print Ticket
          </button>
          <button type="button" class="btn btn-primary" onclick="UI.showToast('Digital pass downloaded to your device.', 'success');">
            ⬇️ Download PDF
          </button>
        </div>
      </div>
    `;

    UI.openModal('digital-ticket-modal');
  },

  // SVG QR Code Visual Generator
  generateQrSvg(seedText) {
    const size = 15; // 15x15 matrix
    let rects = '';
    
    // Hash string to pseudo random seed
    let hash = 0;
    for (let i = 0; i < seedText.length; i++) {
      hash = (hash << 5) - hash + seedText.charCodeAt(i);
      hash |= 0;
    }

    const isFilled = (x, y) => {
      // Corner alignment boxes (standard QR markers)
      if ((x < 4 && y < 4) || (x > size - 5 && y < 4) || (x < 4 && y > size - 5)) {
        if (x === 1 && y === 1) return false;
        if (x === size - 2 && y === 1) return false;
        if (x === 1 && y === size - 2) return false;
        return true;
      }
      const val = Math.sin(x * 12.9898 + y * 78.233 + hash) * 43758.5453;
      return (val - Math.floor(val)) > 0.45;
    };

    const cellSize = 120 / size;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (isFilled(x, y)) {
          rects += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="#0f172a" />`;
        }
      }
    }

    return `<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style="background:#ffffff; padding:4px;">${rects}</svg>`;
  },

  // Cancel Booking Action
  cancelBooking(bookingId) {
    UI.confirm(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? The reserved seats will be released back to the event.',
      () => {
        const res = Storage.updateBookingStatus(bookingId, 'Cancelled');
        if (res) {
          UI.showToast('Booking cancelled successfully.', 'info', 'Cancelled');
          if (typeof loadUserBookings === 'function') loadUserBookings();
          if (typeof loadAdminBookings === 'function') loadAdminBookings();
          if (typeof loadUserDashboard === 'function') loadUserDashboard();
        }
      },
      'Yes, Cancel Booking',
      'btn-danger'
    );
  }
};
