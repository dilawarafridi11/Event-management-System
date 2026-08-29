# Eventify — Modern Event Management System (FYP Platform)

> **Final Year Project (FYP)**: A complete, responsive, premium SaaS Event Management & Digital Ticketing Platform built exclusively with **HTML5**, **CSS3**, and **Vanilla JavaScript (ES6+)**. Zero external frameworks or libraries.

---

## 🌟 Key Highlights & Architecture

- **100% Framework-Free**: Strictly native HTML5, modern CSS3 (Custom properties, Grid, Flexbox, Glassmorphism, animations), and Vanilla ES6+ JavaScript.
- **Dual Dashboards**:
  1. **Admin Dashboard**: Executive KPI statistics, pure Canvas interactive charts (Line, Bar, Donut), full CRUD for events, users, bookings, venues, financial reports with CSV export, and platform settings.
  2. **User / Attendee Dashboard**: Event discovery with multi-criteria category filter chips, price range slider, real-time search, interactive booking engine with seat decrement, favorites wishlist, and digital ticket wallet with QR passes.
- **Pure JavaScript Canvas Charts**: High-DPI responsive Line, Bar, and Donut charts with interactive hover tooltips, smooth entrance animations, and automatic color adaptation when switching themes.
- **Dark & Light Mode Engine**: Glassmorphic theme system with CSS variables, persistence via `localStorage`, and real-time palette synchronization.
- **Shimmer / Skeleton Loading System**: Animated skeleton placeholders for statistics cards, event grids, data tables, and chart containers.
- **LocalStorage Frontend Database**: Persistent client-side database with complete initial seed data (10+ realistic events, 6 venues, 5 users, bookings, notifications, and settings).
- **Digital Passes & Print Support**: Boarding-pass styled VIP admission passes with procedurally generated QR code matrix visuals, barcodes, and print-ready layout (`@media print`).

---

## 🔑 Demo Credentials

| Role | Email | Password | One-Click Demo |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@eventify.com` | `admin123` | Available on Login Page |
| **Event Attendee** | `user@eventify.com` | `user123` | Available on Login Page |

---

## 📁 Project Structure

```
event-management-system/
├── index.html               # Public SaaS Landing Page (Hero, Stats, Featured Events, Categories)
├── login.html               # Authentication Login (Dual-role portal, 1-click demo filler)
├── register.html            # User Registration (Password strength indicator, validation)
│
├── admin/                   # Admin Command Center
│   ├── dashboard.html       # Overview with 5 KPIs, 3 Canvas charts, and recent events table
│   ├── events.html          # Event Management: Full CRUD, search, filter, sort, pagination
│   ├── users.html           # User Management: Table, search, role filters, active/inactive toggle
│   ├── bookings.html        # Booking Management: Review, confirm, cancel, view digital pass
│   ├── venues.html          # Venue Management: Cards grid, add/edit/delete venues
│   ├── reports.html         # Analytics & Reports: Revenue charts, occupancy rate, CSV export
│   └── settings.html        # Platform settings, payment gateways toggle, database reset
│
├── user/                    # Attendee Self-Service Portal
│   ├── dashboard.html       # User Home: KPIs, countdown to upcoming booked events, recommendations
│   ├── events.html          # Discover Events: Category chips, price slider, instant search & book modal
│   ├── bookings.html        # My Bookings: Card list, view ticket pass, cancel booking action
│   ├── favorites.html       # Favorites Wishlist: Heart toggle, instant book
│   ├── tickets.html         # Digital Ticket Wallet: Boarding-pass tickets with QR code, print & download
│   ├── profile.html         # User Profile: Avatar preview, personal info, password changer
│   └── settings.html        # Attendee settings: Notification preferences, display theme
│
├── css/
│   ├── style.css            # CSS variables (Dark/Light), glassmorphism, reset, typography, buttons, modals, toasts
│   ├── dashboard.css        # Sidebar layout, top sticky header, tables, event cards, digital ticket styles
│   ├── responsive.css       # Breakpoints (1440px, 1200px, 1024px, 768px, 480px), mobile off-canvas drawer, print styles
│   └── animations.css       # Skeleton shimmer effect, modal scale/fade, toast slide-in, counters, micro-interactions
│
├── js/
│   ├── storage.js           # LocalStorage schema, initial seed data, full CRUD methods
│   ├── theme.js             # Dark/Light mode switcher, persistence, chart event dispatcher
│   ├── auth.js              # Session manager, route guards, demo credential filler, logout
│   ├── ui.js                # Toast notifications (4 types), modals, skeleton shimmer generator, number counter animations
│   ├── charts.js            # Pure Canvas Line, Bar, and Donut chart engine with tooltips & animations
│   ├── events.js            # Event card rendering, search, filtering, favorite toggle, details modal
│   ├── bookings.js          # Booking checkout modal, price calculator, seat decrement, QR code SVG generator
│   ├── notifications.js     # Header notification dropdown, unread count badge, mark as read
│   ├── admin.js             # Admin dashboard controller, table rendering, stats counter, report exports
│   ├── user.js              # Attendee dashboard controller, discover page filters, ticket rendering, profile editor
│   └── app.js               # Global application bootstrap, sidebar collapse state, mobile off-canvas drawer
│
└── README.md
```

---

## 🚀 How to Run

1. Simply open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Apple Safari).
2. No installation, server, build process, or internet connection required (except for initial Google Fonts and Unsplash banner photos).

---

## 🧪 Verification & Demonstration Scenarios

1. **Theme Switching**:
   - Click the theme toggle icon in the top header or landing page navbar.
   - Observe instant transitions across dark and light palettes, and verified re-rendering of all Canvas charts.
   - Refresh the browser; theme preference remains active.

2. **Admin Flow**:
   - Navigate to `login.html` -> click "Admin Portal" -> click "1-Click Fill" -> "Sign In".
   - View animated KPI counters and 3 interactive Canvas charts (hover over points/bars/slices to view tooltips).
   - Go to `admin/events.html` -> click "Create New Event" -> fill details -> submit -> see success toast and immediate entry in table.
   - Click "Edit Event" or "Delete Event" to verify full CRUD.
   - Visit `admin/reports.html` -> click "Export CSV Dataset" to download the financial report.

3. **User / Attendee Booking Flow**:
   - Click "Switch to User View" or log in as `user@eventify.com`.
   - Go to `user/events.html` -> filter by category chips (e.g. "Concert") or slide the price filter.
   - Click "Book Now" on an event -> select ticket count -> click "Confirm & Pay".
   - View the generated Digital Pass with the procedural QR code and barcode.
   - Click "Print Ticket" to trigger browser print view (`@media print`).
   - Click the heart icon on any event card to save/remove from `user/favorites.html`.

4. **Responsive Layout**:
   - Resize browser to tablet (< 768px) or mobile (< 480px).
   - Sidebar collapses into an animated off-canvas drawer accessible via the hamburger menu button.
