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
  guestDataCache: {},

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
    this.guestDataCache = {};

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
        <form id="booking-submit-form" onsubmit="BookingsManager.handleBookingSubmit(event, '${event.id}')" style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
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

            <!-- Quantity and Payment Method -->
            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label font-bold">Quantity (Max ${maxQty})</label>
                <select class="form-control" id="book-ticket-qty" onchange="BookingsManager.recalculateTotal(); BookingsManager.renderGuestInputs();">
                  ${Array.from({ length: maxQty }, (_, i) => i + 1).map(n => `<option value="${n}">${n} Ticket${n > 1 ? 's' : ''}</option>`).join('')}
                </select>
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label font-bold">Payment Gateway</label>
                <select class="form-control" id="book-payment-method">
                  <option value="Credit/Debit Card">Credit / Debit Card (Stripe)</option>
                  <option value="PayPal">PayPal Instant</option>
                  <option value="Apple Pay">Apple Pay / Google Pay</option>
                </select>
              </div>
            </div>

            <!-- Primary Attendee (Pass #1) -->
            <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 0.5rem; margin-bottom: 0.75rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                <label class="form-label font-bold text-primary" style="margin:0;"><i class="fa-solid fa-id-badge"></i> Primary Pass Holder (Pass #1)</label>
                <span class="text-xs text-muted">Pass Verification</span>
              </div>
              <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.85rem;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">Attendee Name</label>
                  <input type="text" class="form-control" id="book-attendee-name" value="${session.name}" required>
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">Attendee Email</label>
                  <input type="email" class="form-control" id="book-attendee-email" value="${session.email}" required>
                </div>
              </div>

              <!-- Attendee Picture Upload -->
              <div class="form-group" style="margin-bottom: 0.5rem;">
                <label class="form-label font-bold" style="display:flex; justify-content:space-between; align-items:center;">
                  <span><i class="fa-solid fa-camera"></i> Attendee Picture <span class="text-danger">*</span></span>
                  <span class="text-xs text-muted">Stored securely on server for digital pass</span>
                </label>
                <div style="display:flex; gap:1rem; align-items:center; background:var(--bg-tertiary); padding:0.85rem; border-radius:var(--radius-md); border:1px solid var(--border-color);">
                  <div class="avatar" style="width: 58px; height: 58px; border-radius: 50%; overflow: hidden; border: 2.5px solid var(--primary); flex-shrink: 0; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25); position: relative; background: var(--bg-secondary);">
                    <img id="book-attendee-image-preview" src="${(session && session.avatar) ? session.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}" alt="Attendee Photo" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';">
                  </div>
                  <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.35rem;">
                      <label for="book-attendee-file-input" class="btn btn-sm btn-outline" style="cursor: pointer; margin: 0; font-size: 0.8rem; white-space: nowrap;">
                        <i class="fa-solid fa-upload"></i> Upload Picture
                      </label>
                      <input type="file" id="book-attendee-file-input" accept="image/*" style="display: none;" onchange="BookingsManager.handleAttendeePhotoUpload(event)">
                      <span id="book-photo-status" class="text-xs text-secondary truncate">Choose image from device</span>
                    </div>
                    <input type="hidden" id="book-attendee-image-data" value="${(session && session.avatar) ? session.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}">
                    <div class="text-xs text-muted">Upload attendee picture for digital ticket verification.</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Dynamic Additional Guest Passes Container -->
            <div id="additional-guests-container" style="display: none; margin-bottom: 1rem;"></div>

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

  cacheGuestInputs() {
    const container = document.getElementById('additional-guests-container');
    if (!container) return;
    const inputs = container.querySelectorAll('[id^="guest-name-"]');
    inputs.forEach(inp => {
      const num = inp.id.replace('guest-name-', '');
      if (!this.guestDataCache) this.guestDataCache = {};
      if (!this.guestDataCache[num]) this.guestDataCache[num] = {};
      this.guestDataCache[num].name = inp.value;
      const imgInp = document.getElementById(`guest-image-${num}`);
      if (imgInp && imgInp.value) {
        this.guestDataCache[num].image = imgInp.value;
      }
    });
  },

  renderGuestInputs() {
    this.cacheGuestInputs();
    const qty = parseInt(document.getElementById('book-ticket-qty')?.value, 10) || 1;
    const container = document.getElementById('additional-guests-container');
    if (!container) return;

    if (qty <= 1) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    container.style.display = 'block';
    let html = `
      <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 0.5rem; margin-bottom: 0.75rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <label class="form-label font-bold text-primary" style="margin: 0;">
            <i class="fa-solid fa-users"></i> Additional Guest Passes (${qty - 1})
          </label>
          <span class="text-xs text-muted">Individual names & digital pass photos</span>
        </div>
    `;

    for (let i = 2; i <= qty; i++) {
      const cached = this.guestDataCache && this.guestDataCache[i];
      const guestName = (cached && cached.name) ? cached.name : '';
      const guestImg = (cached && cached.image) ? cached.image : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

      html += `
        <div class="guest-card-box" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem 0.9rem; margin-bottom: 0.65rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <span class="text-xs font-bold text-primary"><i class="fa-solid fa-id-card"></i> Pass #${i} (Guest)</span>
            <span class="text-xs text-muted">Separate Digital Pass</span>
          </div>
          <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 0.75rem; align-items: center;">
            <div>
              <input type="text" class="form-control form-control-sm" id="guest-name-${i}" placeholder="Guest ${i} Full Name" value="${guestName}">
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <div class="avatar" style="width: 38px; height: 38px; border-radius: 50%; overflow: hidden; border: 2px solid var(--primary); flex-shrink: 0; background: var(--bg-secondary);">
                <img id="guest-preview-${i}" src="${guestImg}" alt="Guest ${i}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';">
              </div>
              <label for="guest-file-${i}" class="btn btn-xs btn-outline" style="cursor: pointer; margin: 0; font-size: 0.75rem; padding: 0.25rem 0.5rem; white-space: nowrap;">
                <i class="fa-solid fa-camera"></i> Photo
              </label>
              <input type="file" id="guest-file-${i}" accept="image/*" style="display: none;" onchange="BookingsManager.handleGuestPhotoUpload(event, ${i})">
              <input type="hidden" id="guest-image-${i}" value="${guestImg}">
              <span id="guest-status-${i}" class="text-xs text-secondary truncate">Optional</span>
            </div>
          </div>
        </div>
      `;
    }
    html += `</div>`;
    container.innerHTML = html;
  },

  async handleGuestPhotoUpload(e, guestNum) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      UI.showToast('Please select a valid image file (JPG, PNG, WebP).', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      UI.showToast('Image size should be less than 5MB.', 'warning');
      return;
    }

    const preview = document.getElementById(`guest-preview-${guestNum}`);
    const hiddenInput = document.getElementById(`guest-image-${guestNum}`);
    const statusText = document.getElementById(`guest-status-${guestNum}`);

    if (statusText) statusText.innerHTML = '<span class="spin"><i class="fa-solid fa-spinner"></i></span>';

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      const dataUrl = loadEvent.target.result;
      if (preview) preview.src = dataUrl;
      if (hiddenInput) hiddenInput.value = dataUrl;

      // Async server upload
      if (typeof API !== 'undefined' && API.uploadImage) {
        try {
          const res = await API.uploadImage(file);
          if (res && res.success && res.url) {
            if (hiddenInput) hiddenInput.value = res.url;
            if (!this.guestDataCache) this.guestDataCache = {};
            if (!this.guestDataCache[guestNum]) this.guestDataCache[guestNum] = {};
            this.guestDataCache[guestNum].image = res.url;
            if (statusText) statusText.innerHTML = '<span class="text-success"><i class="fa-solid fa-check"></i> Saved</span>';
            UI.showToast(`Guest #${guestNum} photo saved to server!`, 'success');
            return;
          }
        } catch (err) {
          console.warn('Guest photo server upload failed, fallback to local dataUrl:', err);
        }
      }
      if (statusText) statusText.innerHTML = '<span class="text-success"><i class="fa-solid fa-check"></i> Ready</span>';
    };
    reader.readAsDataURL(file);
  },

  async handleAttendeePhotoUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      UI.showToast('Please select a valid image file (JPG, PNG, WebP).', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      UI.showToast('Image size should be less than 5MB.', 'warning');
      return;
    }

    const preview = document.getElementById('book-attendee-image-preview');
    const hiddenInput = document.getElementById('book-attendee-image-data');
    const statusText = document.getElementById('book-photo-status');

    if (statusText) statusText.innerHTML = '<span class="spin"><i class="fa-solid fa-spinner"></i></span> Uploading...';

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      const dataUrl = loadEvent.target.result;
      if (preview) preview.src = dataUrl;
      if (hiddenInput) hiddenInput.value = dataUrl;

      // Asynchronous upload to backend engine
      if (typeof API !== 'undefined' && API.uploadImage) {
        try {
          const res = await API.uploadImage(file);
          if (res && res.success && res.url) {
            if (hiddenInput) hiddenInput.value = res.url;
            if (statusText) statusText.innerHTML = '<span class="text-success font-semibold"><i class="fa-solid fa-check"></i> Saved to server</span>';
            UI.showToast('Attendee picture uploaded to server successfully!', 'success');
            return;
          }
        } catch (err) {
          console.warn('Attendee photo server upload fallback:', err);
        }
      }

      if (statusText) statusText.innerHTML = `<span class="text-success font-semibold"><i class="fa-solid fa-check"></i> Ready</span>`;
      UI.showToast('Attendee picture loaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  },

  handleBookingSubmit(e, eventId) {
    e.preventDefault();
    const session = Auth.getSession();
    const event = Storage.getEventById(eventId);
    if (!event) return;

    const qty = parseInt(document.getElementById('book-ticket-qty').value, 10) || 1;
    const attendeeName = document.getElementById('book-attendee-name').value;
    const attendeeEmail = document.getElementById('book-attendee-email').value;
    const attendeeImageInput = document.getElementById('book-attendee-image-data');
    const attendeeImage = (attendeeImageInput && attendeeImageInput.value) 
      ? attendeeImageInput.value 
      : ((session && session.avatar) ? session.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80');

    // Build multi-attendee guests array
    const guests = [{
      passNum: 1,
      name: attendeeName,
      email: attendeeEmail,
      image: attendeeImage,
      token: 'PASS-1'
    }];

    for (let i = 2; i <= qty; i++) {
      const gNameInput = document.getElementById(`guest-name-${i}`);
      const gImgInput = document.getElementById(`guest-image-${i}`);
      const gName = (gNameInput && gNameInput.value.trim()) ? gNameInput.value.trim() : `${attendeeName} (Guest ${i})`;
      const gImg = (gImgInput && gImgInput.value) ? gImgInput.value : attendeeImage;
      guests.push({
        passNum: i,
        name: gName,
        email: attendeeEmail,
        image: gImg,
        token: `PASS-${i}`
      });
    }

    const subtotal = qty * this.selectedTierPrice;
    const discount = this.activePromoDiscount || 0;
    const totalAmount = Math.max(0, subtotal - discount);

    const btn = document.getElementById('confirm-booking-btn');
    btn.disabled = true;
    btn.innerHTML = `<span class="spin"><i class="fa-solid fa-rotate-right"></i></span> Processing Payment...`;

    setTimeout(async () => {
      try {
        const booking = Storage.createBooking({
          userId: session.id,
          userName: attendeeName,
          userEmail: attendeeEmail,
          attendeeImage: attendeeImage,
          guests: guests,
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

        if (typeof API !== 'undefined' && API.createBooking) {
          try {
            await API.createBooking(booking);
          } catch (apiErr) {
            console.warn('Booking sync to backend failed:', apiErr);
          }
        }

        UI.closeModal('booking-process-modal');
        UI.showToast('Booking and payment completed successfully!', 'success', 'Confirmed');

        // Open digital ticket view immediately for the primary pass
        BookingsManager.showDigitalTicket(booking.id, 0);

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
  showDigitalTicket(bookingId, guestIndex = 0) {
    const booking = Storage.getBookings().find(b => b.id === bookingId);
    if (!booking) {
      UI.showToast('Ticket not found', 'error');
      return;
    }

    const guests = (booking.guests && Array.isArray(booking.guests) && booking.guests.length > 0)
      ? booking.guests
      : [{
          passNum: 1,
          name: booking.userName,
          email: booking.userEmail,
          image: booking.attendeeImage || (Storage.getUserById(booking.userId)?.avatar) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
        }];

    guestIndex = Math.max(0, Math.min(guestIndex, guests.length - 1));
    const currentGuest = guests[guestIndex];
    const isMultiGuest = guests.length > 1;

    let modal = document.getElementById('digital-ticket-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'digital-ticket-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    // Generate Procedural QR Matrix SVG for this specific guest pass
    const guestQrData = (booking.qrCodeData || booking.id) + (isMultiGuest ? `-P${currentGuest.passNum || (guestIndex + 1)}` : '');
    const qrSvg = BookingsManager.generateQrSvg(guestQrData);
    const attendeePhoto = currentGuest.image || 
                          booking.attendeeImage || 
                          (Storage.getUserById(booking.userId)?.avatar) || 
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

    modal.innerHTML = `
      <div class="modal-container modal-lg">
        <div class="modal-header">
          <div class="flex items-center gap-2">
            <span class="badge ${booking.checkInStatus === 'Checked-In' ? 'badge-success' : 'badge-confirmed'}">
              ${booking.checkInStatus === 'Checked-In' ? '<i class="fa-solid fa-check"></i> Checked-In' : 'Official Digital Pass'}
            </span>
            <span class="text-xs text-muted font-bold">${booking.id}${isMultiGuest ? ` • Pass #${currentGuest.passNum || (guestIndex + 1)}` : ''}</span>
          </div>
          <button class="modal-close" onclick="UI.closeModal('digital-ticket-modal')">&times;</button>
        </div>
        <div class="modal-body" style="padding: 1.5rem 1rem;">
          ${isMultiGuest ? `
            <!-- Multi-Attendee Pass Switcher -->
            <div style="margin-bottom: 1rem;">
              <div class="text-xs text-muted font-bold uppercase" style="margin-bottom: 0.4rem; letter-spacing: 0.5px;">
                <i class="fa-solid fa-users text-primary"></i> Select Attendee Pass (${guests.length} Tickets in Booking):
              </div>
              <div style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem;">
                ${guests.map((g, idx) => `
                  <button type="button" 
                    class="btn btn-sm ${idx === guestIndex ? 'btn-primary' : 'btn-outline'}" 
                    onclick="BookingsManager.showDigitalTicket('${booking.id}', ${idx})"
                    style="white-space: nowrap; border-radius: 20px; padding: 0.35rem 0.85rem; font-size: 0.8rem;">
                    <i class="fa-solid fa-ticket"></i> Pass #${g.passNum || (idx + 1)}: ${(g.name || 'Guest').split(' ')[0]}
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}

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
                <!-- Attendee Photo & Identity Badge -->
                <div style="grid-column: span 2; display: flex; align-items: center; gap: 1rem; background: var(--bg-tertiary); padding: 0.85rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                  <div class="avatar" style="width: 60px; height: 60px; border-radius: 50%; overflow: hidden; border: 2.5px solid var(--primary); box-shadow: 0 4px 10px rgba(99, 102, 241, 0.25); flex-shrink: 0; background: var(--bg-secondary);">
                    <img src="${attendeePhoto}" alt="${currentGuest.name || booking.userName}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';">
                  </div>
                  <div style="flex: 1; min-width: 0;">
                    <div class="ticket-info-label" style="display: flex; align-items: center; gap: 0.35rem; color: var(--primary);">
                      <i class="fa-solid fa-id-badge"></i> Verified Pass Holder ${isMultiGuest ? `(Pass #${currentGuest.passNum || (guestIndex + 1)} of ${guests.length})` : ''}
                    </div>
                    <div class="ticket-info-val font-bold" style="font-size: 1.15rem; color: var(--text-primary); margin: 0.15rem 0;">${currentGuest.name || booking.userName}</div>
                    <div class="text-xs text-muted truncate">${currentGuest.email || booking.userEmail}</div>
                  </div>
                </div>

                <div>
                  <div class="ticket-info-label">Ticket Tier & Pass</div>
                  <div class="ticket-info-val">${booking.tierName || 'Standard'} • Pass #${currentGuest.passNum || (guestIndex + 1)}</div>
                </div>
                <div>
                  <div class="ticket-info-label">Total Paid</div>
                  <div class="ticket-info-val text-primary font-bold">${Storage.formatPrice(booking.totalAmount)}</div>
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
                <div style="grid-column: span 2;">
                  <div class="ticket-info-label">Admission Gate Status</div>
                  <div class="ticket-info-val ${booking.checkInStatus === 'Checked-In' ? 'text-success' : 'text-primary'}">
                    ${booking.checkInStatus === 'Checked-In' ? '<i class="fa-solid fa-check"></i> Checked-In at Gate' : '• Valid for Individual Admission'}
                  </div>
                </div>
              </div>
              <div class="ticket-qr-section">
                <div class="ticket-qr-placeholder">
                  ${qrSvg}
                </div>
                <div class="ticket-barcode-text">${booking.id}${isMultiGuest ? `-P${currentGuest.passNum || (guestIndex + 1)}` : ''}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer" style="flex-wrap: wrap; gap: 0.5rem;">
          <button type="button" class="btn btn-secondary" onclick="UI.closeModal('digital-ticket-modal')">Close</button>
          <button type="button" class="btn btn-outline" onclick="window.print()">
            <i class="fa-solid fa-print"></i> Print Ticket
          </button>
          <button type="button" class="btn btn-outline" onclick="BookingsManager.downloadCalendarInvite('${booking.id}')">
            <i class="fa-solid fa-calendar-plus text-primary"></i> Add to Calendar
          </button>
          <button type="button" class="btn btn-primary" onclick="BookingsManager.downloadTicketImage('${booking.id}', ${guestIndex})">
            ⬇ Download Pass (PNG)
          </button>
        </div>
      </div>
    `;

    UI.openModal('digital-ticket-modal');
  },

  // High-Resolution Canvas Procedural PNG Pass Generator
  async downloadTicketImage(bookingId, guestIndex = 0) {
    const booking = Storage.getBookings().find(b => b.id === bookingId);
    if (!booking) return;

    const guests = (booking.guests && Array.isArray(booking.guests) && booking.guests.length > 0)
      ? booking.guests
      : [{
          passNum: 1,
          name: booking.userName,
          email: booking.userEmail,
          image: booking.attendeeImage || (Storage.getUserById(booking.userId)?.avatar) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
        }];

    guestIndex = Math.max(0, Math.min(guestIndex, guests.length - 1));
    const currentGuest = guests[guestIndex];
    const isMultiGuest = guests.length > 1;

    UI.showToast(`Rendering high-res digital pass for ${currentGuest.name}...`, 'info', 'Generating Pass', 2000);

    const width = 640;
    const height = 1000;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const attendeeImgUrl = currentGuest.image || 
                           booking.attendeeImage || 
                           (Storage.getUserById(booking.userId)?.avatar) || 
                           'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

    // Preload attendee image safely
    let attendeeImg = null;
    if (attendeeImgUrl) {
      try {
        attendeeImg = await new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = attendeeImgUrl;
          setTimeout(() => resolve(null), 2000);
        });
      } catch (err) {
        attendeeImg = null;
      }
    }

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
    ctx.fillText(`PASS ID: ${booking.id}${isMultiGuest ? ` • #${currentGuest.passNum || (guestIndex + 1)}` : ''}`, width - 45, 66);

    // 5. Event Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'left';
    
    // Word wrap event title
    const title = booking.eventTitle;
    const words = title.split(' ');
    let line = '';
    let y = 120;
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
    y += 20;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(35, y);
    ctx.lineTo(width - 35, y);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // 7. Attendee Picture Profile Box
    y += 20;
    const cardH = 80;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(40, y, width - 80, cardH, 12);
    ctx.fill();
    ctx.stroke();

    // Draw Attendee Circular Picture
    const photoR = 28;
    const photoCenterX = 55 + photoR;
    const photoCenterY = y + cardH / 2;

    if (attendeeImg) {
      try {
        ctx.save();
        ctx.beginPath();
        ctx.arc(photoCenterX, photoCenterY, photoR, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(attendeeImg, photoCenterX - photoR, photoCenterY - photoR, photoR * 2, photoR * 2);
        ctx.restore();

        // Border ring
        ctx.beginPath();
        ctx.arc(photoCenterX, photoCenterY, photoR, 0, Math.PI * 2, true);
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.stroke();
      } catch (drawErr) {
        // Fallback initials if tainted canvas error
        ctx.beginPath();
        ctx.arc(photoCenterX, photoCenterY, photoR, 0, Math.PI * 2, true);
        ctx.fillStyle = '#6366f1';
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((currentGuest.name || booking.userName || 'U').charAt(0).toUpperCase(), photoCenterX, photoCenterY + 8);
      }
    } else {
      // Fallback initials avatar
      ctx.beginPath();
      ctx.arc(photoCenterX, photoCenterY, photoR, 0, Math.PI * 2, true);
      ctx.fillStyle = '#6366f1';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText((currentGuest.name || booking.userName || 'U').charAt(0).toUpperCase(), photoCenterX, photoCenterY + 8);
    }

    // Attendee Identity Text on Card
    ctx.textAlign = 'left';
    ctx.fillStyle = '#818cf8';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`VERIFIED PASS HOLDER${isMultiGuest ? ` (PASS #${currentGuest.passNum || (guestIndex + 1)})` : ''}`, photoCenterX + photoR + 16, y + 26);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText(currentGuest.name || booking.userName, photoCenterX + photoR + 16, y + 49);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText(currentGuest.email || booking.userEmail, photoCenterX + photoR + 16, y + 67);

    // 8. Grid of Details
    y += cardH + 25;
    const drawField = (label, val, xPos, yPos) => {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(label.toUpperCase(), xPos, yPos);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(val, xPos, yPos + 22);
    };

    drawField('Tier & Quantity', `${booking.tierName || 'Standard'} • Pass #${currentGuest.passNum || (guestIndex + 1)}`, 45, y);
    drawField('Total Paid', Storage.formatPrice(booking.totalAmount), 340, y);

    y += 55;
    drawField('Event Date', booking.eventDate, 45, y);
    drawField('Event Time', booking.eventTime, 340, y);

    y += 55;
    drawField('Venue Location', booking.venue.length > 34 ? booking.venue.substring(0, 32) + '...' : booking.venue, 45, y);
    drawField('Gate Status', booking.checkInStatus === 'Checked-In' ? 'Checked-In at Gate' : 'Valid for Admission', 340, y);

    // 9. QR Code Container Box
    y += 65;
    const qrBoxSize = 180;
    const qrX = (width - qrBoxSize) / 2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(qrX, y, qrBoxSize, qrBoxSize, 12);
    ctx.fill();

    // 10. Draw QR Code Matrix
    const seedText = (booking.qrCodeData || booking.id) + (isMultiGuest ? `-P${currentGuest.passNum || (guestIndex + 1)}` : '');
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

    // 11. Pass ID & Security Barcode string
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`• ${booking.id}${isMultiGuest ? `-P${currentGuest.passNum || (guestIndex + 1)}` : ''} • OFFICIAL EVENTIFY ADMISSION PASS •`, width / 2, y + qrBoxSize + 28);

    // 12. Trigger PNG download
    try {
      const link = document.createElement('a');
      const safeGuestName = (currentGuest.name || booking.userName).replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `Eventify_Pass_${booking.id}_Pass${currentGuest.passNum || (guestIndex + 1)}_${safeGuestName}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      UI.showToast(`Digital pass for ${currentGuest.name} downloaded!`, 'success', 'Pass Downloaded');
    } catch (e) {
      console.warn('Canvas export fallback:', e);
      window.print();
    }
  },

  // 1-Click iCalendar (.ics) RFC 5545 Invite Export
  downloadCalendarInvite(bookingId) {
    const booking = Storage.getBookings().find(b => b.id === bookingId);
    if (!booking) {
      UI.showToast('Booking not found', 'error');
      return;
    }

    // Helper to format Date + Time string into iCal RFC 5545 format (YYYYMMDDTHHMMSS)
    const formatIcsDate = (dateStr, timeStr, defaultHour = 10, defaultMin = 0) => {
      let year = '2026', month = '01', day = '01';
      if (dateStr && dateStr.includes('-')) {
        const parts = dateStr.split('-');
        year = parts[0];
        month = parts[1].padStart(2, '0');
        day = parts[2].padStart(2, '0');
      } else {
        const now = new Date();
        year = String(now.getFullYear());
        month = String(now.getMonth() + 1).padStart(2, '0');
        day = String(now.getDate()).padStart(2, '0');
      }

      let hour = defaultHour;
      let minute = defaultMin;

      if (timeStr) {
        const isPM = /pm/i.test(timeStr);
        const isAM = /am/i.test(timeStr);
        const match = timeStr.match(/(\d{1,2}):(\d{2})/);
        if (match) {
          hour = parseInt(match[1], 10);
          minute = parseInt(match[2], 10);
          if (isPM && hour < 12) hour += 12;
          if (isAM && hour === 12) hour = 0;
        }
      }

      const pad = (n) => String(n).padStart(2, '0');
      return `${year}${month}${day}T${pad(hour)}${pad(minute)}00`;
    };

    // Extract start and end times from booking.eventTime (e.g. "18:00 - 22:00")
    let startTimeStr = '10:00';
    let endTimeStr = '13:00';
    if (booking.eventTime && booking.eventTime.includes('-')) {
      const times = booking.eventTime.split('-');
      startTimeStr = times[0].trim();
      endTimeStr = times[1].trim();
    } else if (booking.eventTime) {
      startTimeStr = booking.eventTime.trim();
      endTimeStr = null;
    }

    const dtStart = formatIcsDate(booking.eventDate, startTimeStr, 10, 0);
    const dtEnd = endTimeStr ? formatIcsDate(booking.eventDate, endTimeStr, 13, 0) : formatIcsDate(booking.eventDate, startTimeStr, 13, 0);

    const now = new Date();
    const dtStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const uid = `EVT-${booking.id}-${Date.now()}@eventify.com`;

    const icsEscape = (text) => {
      if (!text) return '';
      return String(text)
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
    };

    const summary = `${booking.eventTitle} - Admission Pass`;
    const location = booking.venue || 'Event Venue';
    const description = [
      `EVENTIFY OFFICIAL DIGITAL ADMISSION PASS`,
      `Booking ID: ${booking.id}`,
      `Primary Attendee: ${booking.userName}`,
      `Tickets: ${booking.tickets} (${booking.tierName || 'Standard'})`,
      `Gate Status: ${booking.checkInStatus || 'Valid for Entry'}`,
      `Venue: ${booking.venue}`,
      `Date & Time: ${booking.eventDate} • ${booking.eventTime}`,
      `QR Pass Token: ${booking.qrCodeData || booking.id}`
    ].join('\n');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Eventify//Event Management System//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${icsEscape(summary)}`,
      `DESCRIPTION:${icsEscape(description)}`,
      `LOCATION:${icsEscape(location)}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    try {
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const safeTitle = booking.eventTitle.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `Eventify_${safeTitle}_${booking.id}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      UI.showToast('Calendar invite (.ics) downloaded! Open to add to Google, Apple, or Outlook Calendar.', 'success', 'Calendar Export', 4000);
    } catch (err) {
      console.warn('ICS export error:', err);
      UI.showToast('Could not generate calendar file', 'error');
    }
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
