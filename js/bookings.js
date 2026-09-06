/**
 * EVENTIFY - Bookings & Digital Ticket Controller
 * Handles booking creation, seat validation, multi-tier ticket pricing, promo codes,
 * and high-resolution procedural Canvas PNG pass generation & download.
 */

const BookingsManager = {
  activePromoDiscount: 0,
  activePromoCode: null,
  selectedTierPrice: null,
  selectedTierName: 'General Admission',

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

    this.activePromoDiscount = 0;
    this.activePromoCode = null;

    // Determine tiers
    const tiers = event.tiers && event.tiers.length > 0 ? event.tiers : [
      { name: 'General Admission', price: event.ticketPrice || 50, description: 'Standard admission', capacity: event.capacity }
    ];

    this.selectedTierPrice = tiers[0].price;
    this.selectedTierName = tiers[0].name;

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
            <!-- Event Summary -->
            <div style="display:flex; gap:1rem; align-items:center; margin-bottom:1.25rem; background:var(--bg-tertiary); padding:1rem; border-radius:var(--radius-md);">
              <img src="${event.image}" style="width:64px; height:64px; border-radius:var(--radius-sm); object-fit:cover;">
              <div style="flex: 1;">
                <div class="font-bold text-sm text-primary">${event.title}</div>
                <div class="text-xs text-secondary"><i class="fa-solid fa-location-dot"></i> ${event.venue}</div>
                <div class="text-xs text-muted"><i class="fa-solid fa-calendar-days"></i> ${event.date} • ${event.startTime}</div>
              </div>
            </div>

            <!-- Ticket Tier Selector -->
            <div class="form-group" style="margin-bottom: 1.25rem;">
              <label class="form-label font-bold">Select Ticket Tier</label>
              <div class="tier-cards-container">
                ${tiers.map((t, idx) => `
                  <div class="tier-card-option ${idx === 0 ? 'selected' : ''}" onclick="BookingsManager.selectTier('${t.name}', ${t.price}, this)">
                    <div>
                      <div class="font-bold text-sm">${t.name}</div>
                      <div class="text-xs text-muted">${t.description || ''}</div>
                    </div>
                    <div class="tier-price-tag">${Storage.formatPrice(t.price)}</div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Attendee Name</label>
                <input type="text" class="form-control" id="book-attendee-name" value="${session.name}" required>
              </div>

              <div class="form-group">
                <label class="form-label">Attendee Email</label>
                <input type="email" class="form-control" id="book-attendee-email" value="${session.email}" required>
              </div>
            </div>

            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Quantity (Max ${maxQty})</label>
                <select class="form-control" id="book-ticket-qty" onchange="BookingsManager.recalculateTotal()">
                  ${Array.from({ length: maxQty }, (_, i) => i + 1).map(n => `<option value="${n}">${n} Ticket${n > 1 ? 's' : ''}</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Payment Gateway</label>
                <select class="form-control" id="book-payment-method">
                  <option value="Credit/Debit Card">Credit / Debit Card (Stripe)</option>
                  <option value="PayPal">PayPal Instant</option>
                  <option value="Apple Pay">Apple Pay / Google Pay</option>
                </select>
              </div>
            </div>

            <!-- Promo Code Engine -->
            <div class="form-group" style="margin-top: 0.5rem;">
              <label class="form-label">Have a Promo Code?</label>
              <div class="promo-input-group">
                <input type="text" class="form-control" id="book-promo-code" placeholder="e.g. EVENTIFY20, VIP50" style="text-transform: uppercase;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="BookingsManager.applyPromoCode()">Apply</button>
              </div>
              <div id="promo-status-msg"></div>
            </div>

            <!-- Cost Summary Breakdown -->
            <div style="background:var(--bg-elevated); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-top:1.25rem;">
              <div class="flex justify-between text-sm" style="margin-bottom:0.35rem;">
                <span class="text-secondary">Selected Tier:</span>
                <span class="font-semibold text-primary" id="summary-tier-name">${this.selectedTierName}</span>
              </div>
              <div class="flex justify-between text-sm" style="margin-bottom:0.35rem;">
                <span class="text-secondary">Subtotal:</span>
                <span class="font-semibold" id="summary-subtotal">${Storage.formatPrice(this.selectedTierPrice)}</span>
              </div>
              <div class="flex justify-between text-sm" id="discount-row" style="margin-bottom:0.35rem; display: none;">
                <span class="text-success font-semibold">Promo Discount:</span>
                <span class="font-semibold text-success" id="summary-discount">-PKR 0.00</span>
              </div>
              <div class="dropdown-divider"></div>
              <div class="flex justify-between text-base font-bold">
                <span>Total Amount:</span>
                <span class="text-primary text-xl" id="summary-total">${Storage.formatPrice(this.selectedTierPrice)}</span>
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

  selectTier(tierName, tierPrice, cardEl) {
    this.selectedTierName = tierName;
    this.selectedTierPrice = tierPrice;

    document.querySelectorAll('.tier-card-option').forEach(c => c.classList.remove('selected'));
    if (cardEl) cardEl.classList.add('selected');

    document.getElementById('summary-tier-name').textContent = tierName;
    this.recalculateTotal();
  },

  applyPromoCode() {
    const codeInput = document.getElementById('book-promo-code');
    const statusMsg = document.getElementById('promo-status-msg');
    const code = codeInput ? codeInput.value.trim() : '';

    const qty = parseInt(document.getElementById('book-ticket-qty').value, 10) || 1;
    const subtotal = qty * this.selectedTierPrice;

    const res = Storage.validatePromo(code, subtotal);
    if (!res.valid) {
      this.activePromoDiscount = 0;
      this.activePromoCode = null;
      statusMsg.innerHTML = `<span class="text-xs text-danger" style="margin-top: 4px; display: block;"><i class="fa-solid fa-xmark"></i> ${res.message}</span>`;
      UI.showToast(res.message, 'error', 'Promo Error');
    } else {
      this.activePromoDiscount = res.discountAmount;
      this.activePromoCode = res.promo.code;
      statusMsg.innerHTML = `<div class="promo-badge-applied"><i class="fa-solid fa-check"></i> ${res.message}</div>`;
      UI.showToast(res.message, 'success', 'Discount Applied');
    }
    this.recalculateTotal();
  },

  recalculateTotal() {
    const qty = parseInt(document.getElementById('book-ticket-qty').value, 10) || 1;
    const subtotal = qty * this.selectedTierPrice;

    // Recalculate promo if present
    if (this.activePromoCode) {
      const res = Storage.validatePromo(this.activePromoCode, subtotal);
      if (res.valid) {
        this.activePromoDiscount = res.discountAmount;
      }
    }

    const discount = this.activePromoDiscount || 0;
    const total = Math.max(0, subtotal - discount);

    document.getElementById('summary-subtotal').textContent = `${Storage.formatPrice(this.selectedTierPrice)} x ${qty} = ${Storage.formatPrice(subtotal)}`;
    
    const discRow = document.getElementById('discount-row');
    if (discount > 0) {
      discRow.style.display = 'flex';
      document.getElementById('summary-discount').textContent = `-${Storage.formatPrice(discount)}`;
    } else {
      discRow.style.display = 'none';
    }

    document.getElementById('summary-total').textContent = Storage.formatPrice(total);
  },

  handleBookingSubmit(e, eventId) {
    e.preventDefault();
    const session = Auth.getSession();
    const event = Storage.getEventById(eventId);
    if (!event) return;

    const qty = parseInt(document.getElementById('book-ticket-qty').value, 10) || 1;
    const attendeeName = document.getElementById('book-attendee-name').value;
    const attendeeEmail = document.getElementById('book-attendee-email').value;
    const subtotal = qty * this.selectedTierPrice;
    const discount = this.activePromoDiscount || 0;
    const totalAmount = Math.max(0, subtotal - discount);

    const btn = document.getElementById('confirm-booking-btn');
    btn.disabled = true;
    btn.innerHTML = `<span class="spin"><i class="fa-solid fa-rotate-right"></i></span> Processing Payment...`;

    setTimeout(() => {
      try {
        const booking = Storage.createBooking({
          userId: session.id,
          userName: attendeeName,
          userEmail: attendeeEmail,
          eventId: event.id,
          eventTitle: event.title,
          eventDate: event.date,
          eventTime: `${event.startTime} - ${event.endTime}`,
          venue: event.venue,
          tierName: this.selectedTierName,
          tickets: qty,
          ticketPrice: this.selectedTierPrice,
          discountAmount: discount,
          promoCode: this.activePromoCode,
          totalAmount: totalAmount,
          paymentStatus: 'Paid',
          bookingStatus: 'Confirmed'
        });

        UI.closeModal('booking-process-modal');
        UI.showToast('Booking and payment completed successfully!', 'success', 'Confirmed');

        // Open digital ticket view immediately
        BookingsManager.showDigitalTicket(booking.id);

        // If on bookings or dashboard page, refresh data
        if (typeof User !== 'undefined' && typeof User.renderUserBookings === 'function') User.renderUserBookings();
        if (typeof User !== 'undefined' && typeof User.initDashboard === 'function') User.initDashboard();
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Confirm & Pay';
        UI.showToast(err.message || 'Booking failed.', 'error', 'Error');
      }
    }, 850);
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
            <span class="badge ${booking.checkInStatus === 'Checked-In' ? 'badge-success' : 'badge-confirmed'}">
              ${booking.checkInStatus === 'Checked-In' ? '<i class="fa-solid fa-check"></i> Checked-In' : 'Official Digital Pass'}
            </span>
            <span class="text-xs text-muted font-bold">${booking.id}</span>
          </div>
          <button class="modal-close" onclick="UI.closeModal('digital-ticket-modal')">&times;</button>
        </div>
        <div class="modal-body" style="padding: 1.5rem 1rem;">
          <div class="ticket-wrapper" id="printable-ticket-wrapper">
            <div class="ticket-header">
              <div class="ticket-header-brand">EVENTIFY VIP ADMISSION PASS</div>
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
                  <div class="ticket-info-label">Pass Holder</div>
                  <div class="ticket-info-val">${booking.userName}</div>
                </div>
                <div>
                  <div class="ticket-info-label">Ticket Tier & Qty</div>
                  <div class="ticket-info-val">${booking.tierName || 'Standard'} • ${booking.tickets} Person(s)</div>
                </div>
                <div>
                  <div class="ticket-info-label">Event Date</div>
                  <div class="ticket-info-val"><i class="fa-solid fa-calendar-days"></i> ${booking.eventDate}</div>
                </div>
                <div>
                  <div class="ticket-info-label">Event Time</div>
                  <div class="ticket-info-val"><i class="fa-solid fa-clock"></i> ${booking.eventTime}</div>
                </div>
                <div style="grid-column: span 2;">
                  <div class="ticket-info-label">Venue Location</div>
                  <div class="ticket-info-val"><i class="fa-solid fa-location-dot"></i> ${booking.venue}</div>
                </div>
                <div>
                  <div class="ticket-info-label">Total Paid</div>
                  <div class="ticket-info-val text-primary">${Storage.formatPrice(booking.totalAmount)}</div>
                </div>
                <div>
                  <div class="ticket-info-label">Admission Gate Status</div>
                  <div class="ticket-info-val ${booking.checkInStatus === 'Checked-In' ? 'text-success' : 'text-primary'}">
                    ${booking.checkInStatus === 'Checked-In' ? '<i class="fa-solid fa-check"></i> Checked-In at Gate' : '• Valid for Entry'}
                  </div>
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
            <i class="fa-solid fa-print"></i> Print Ticket
          </button>
          <button type="button" class="btn btn-primary" onclick="BookingsManager.downloadTicketImage('${booking.id}')">
            ⬇ Download Pass (PNG)
          </button>
        </div>
      </div>
    `;

    UI.openModal('digital-ticket-modal');
  },

  // High-Resolution Canvas Procedural PNG Pass Generator
  downloadTicketImage(bookingId) {
    const booking = Storage.getBookings().find(b => b.id === bookingId);
    if (!booking) return;

    const width = 640;
    const height = 920;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 1. Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e1b4b');
    bgGrad.addColorStop(1, '#0b0f19');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Decorative Glow Top
    const glow = ctx.createRadialGradient(width / 2, 0, 10, width / 2, 0, 350);
    glow.addColorStop(0, 'rgba(99, 102, 241, 0.45)');
    glow.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, 400);

    // 3. Card Outer Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // 4. Header Badge & Brand
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(40, 45, 160, 32);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EVENTIFY ADMISSION', 120, 66);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`PASS ID: ${booking.id}`, width - 45, 66);

    // 5. Event Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'left';
    
    // Word wrap event title
    const title = booking.eventTitle;
    const words = title.split(' ');
    let line = '';
    let y = 125;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > width - 100 && n > 0) {
        ctx.fillText(line, 45, y);
        line = words[n] + ' ';
        y += 32;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 45, y);

    // 6. Notch Divider Line
    y += 25;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(35, y);
    ctx.lineTo(width - 35, y);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // 7. Grid of Details
    y += 35;
    const drawField = (label, val, xPos, yPos) => {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(label.toUpperCase(), xPos, yPos);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(val, xPos, yPos + 22);
    };

    drawField('Attendee Name', booking.userName, 45, y);
    drawField('Tier & Quantity', `${booking.tierName || 'Standard'} (${booking.tickets}x)`, 340, y);

    y += 65;
    drawField('Date', booking.eventDate, 45, y);
    drawField('Time', booking.eventTime, 340, y);

    y += 65;
    drawField('Venue', booking.venue.length > 32 ? booking.venue.substring(0, 30) + '...' : booking.venue, 45, y);
    drawField('Total Paid', Storage.formatPrice(booking.totalAmount), 340, y);

    // 8. QR Code Container Box
    y += 75;
    const qrBoxSize = 200;
    const qrX = (width - qrBoxSize) / 2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(qrX, y, qrBoxSize, qrBoxSize, 12);
    ctx.fill();

    // 9. Draw QR Code Matrix
    const seedText = booking.qrCodeData || booking.id;
    const size = 15;
    let hash = 0;
    for (let i = 0; i < seedText.length; i++) {
      hash = (hash << 5) - hash + seedText.charCodeAt(i);
      hash |= 0;
    }

    const cellSize = (qrBoxSize - 20) / size;
    ctx.fillStyle = '#0f172a';

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        let isFilled = false;
        if ((col < 4 && row < 4) || (col > size - 5 && row < 4) || (col < 4 && row > size - 5)) {
          if (!((col === 1 && row === 1) || (col === size - 2 && row === 1) || (col === 1 && row === size - 2))) {
            isFilled = true;
          }
        } else {
          const val = Math.sin(col * 12.9898 + row * 78.233 + hash) * 43758.5453;
          isFilled = (val - Math.floor(val)) > 0.45;
        }

        if (isFilled) {
          ctx.fillRect(qrX + 10 + col * cellSize, y + 10 + row * cellSize, cellSize, cellSize);
        }
      }
    }

    // 10. Pass ID & Security Barcode string
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`• ${booking.id} • OFFICIAL VIP ENTRANCE PASS •`, width / 2, y + qrBoxSize + 30);

    // 11. Trigger PNG download
    const link = document.createElement('a');
    link.download = `Eventify_Pass_${booking.id}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    UI.showToast(`Digital pass ${booking.id}.png downloaded!`, 'success', 'Pass Downloaded');
  },

  // SVG QR Code Visual Generator
  generateQrSvg(seedText) {
    const size = 15;
    let rects = '';
    
    let hash = 0;
    for (let i = 0; i < seedText.length; i++) {
      hash = (hash << 5) - hash + seedText.charCodeAt(i);
      hash |= 0;
    }

    const isFilled = (x, y) => {
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
          if (typeof User !== 'undefined' && typeof User.renderUserBookings === 'function') User.renderUserBookings();
          if (typeof Admin !== 'undefined' && typeof Admin.renderBookingsTable === 'function') Admin.renderBookingsTable();
          if (typeof User !== 'undefined' && typeof User.initDashboard === 'function') User.initDashboard();
        }
      },
      'Yes, Cancel Booking',
      'btn-danger'
    );
  }
};
