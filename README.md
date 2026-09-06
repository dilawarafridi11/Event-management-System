# Eventify — Full-Stack Enterprise Event Management & Ticketing System

> **Full-Stack SaaS Platform**: A complete, responsive, premium Event Management & Digital Ticketing Platform built with a **PHP (PDO) + MySQL REST API** backend and modern **HTML5, CSS3, and Vanilla JavaScript (ES6+)** frontend. Zero heavy framework bloat.

---

## 🌟 Architecture & Highlights

* **Classic Full-Stack Architecture**: Modern PHP 7.4+ / 8.x PDO backend connecting to a normalized relational MySQL database (`eventify_db`).
* **Transactional Seat Reservation Engine**: Prevents double-booking and race conditions using row-level locking (`SELECT ... FOR UPDATE`) with atomic rollbacks.
* **Live Gate QR Scanner & Attendee Check-In**: WebRTC back-camera feed with real-time ticket token validation, duplicate scan prevention, and Web Audio API synthesized tones.
* **Multi-Tier Ticketing Engine**: Supports General Admission, Early Bird (15% off), and VIP Access (1.8x rate) with real-time price recalculations.
* **Promo Code Discount Engine**: Real-time validation for `%` and `$` cash discounts with minimum spend limits and expiration date checks.
* **Interactive Event Calendar**: Monthly grid with category-colored event pills, month switcher, and fast modal inspection.
* **High-Res Digital Passes**: 2x canvas-to-PNG ticket pass generator with procedural QR matrix, barcode bands, and print layout (`@media print`).
* **Dual Dashboards**:
  1. **Admin Command Center**: Executive KPI metrics, interactive Canvas charts, event CRUD, venue manager, promo manager, CSV reports, gate scanner, and platform settings.
  2. **Attendee Self-Service Portal**: Discover events, multi-tier checkout, ticket wallet, wishlist favorites, and review submissions.

---

## 🚀 Quick Setup with PHP & MySQL (XAMPP / WAMP / Laragon)

### Method 1: Automated 1-Click Web Installer (Recommended)
1. Copy or clone the project folder into your web server root directory:
   - **XAMPP**: `C:/xampp/htdocs/event-management-system/`
   - **WAMP**: `C:/wamp64/www/event-management-system/`
   - **Laragon**: `C:/laragon/www/event-management-system/`
2. Start **Apache** and **MySQL** from your XAMPP/WAMP control panel.
3. Open your browser and navigate to:
   ```
   http://localhost/event-management-system/database/setup.php
   ```
4. Click **"🚀 Initialize Eventify Database"**. The script automatically creates the `eventify_db` database and seeds all tables with demo records.

### Method 2: Manual phpMyAdmin Import
1. Open `http://localhost/phpmyadmin/`.
2. Create a new database named `eventify_db` with collation `utf8mb4_unicode_ci`.
3. Click the **Import** tab, choose the [`database/eventify.sql`](file:///c:/Users/Developer/Desktop/Event%20Management%20System/database/eventify.sql) file, and click **Go**.
4. Access the platform at `http://localhost/event-management-system/`.

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Portal |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@eventify.com` | `admin123` | [`admin/dashboard.html`](file:///c:/Users/Developer/Desktop/Event%20Management%20System/admin/dashboard.html) |
| **Event Attendee** | `user@eventify.com` | `user123` | [`user/dashboard.html`](file:///c:/Users/Developer/Desktop/Event%20Management%20System/user/dashboard.html) |

---

## 📡 REST API Documentation

All API endpoints return standard JSON responses with HTTP status codes and CORS headers.

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/login.php` | `POST` | Authenticates user with bcrypt verification; returns token and user payload. |
| `/api/auth/register.php` | `POST` | Registers new account with hashed password and creates welcome notification. |
| `/api/auth/me.php` | `GET`, `POST` | Fetches session profile or updates user contact info and password. |
| `/api/events/index.php` | `GET`, `POST` | List events with category, price slider, search, and sorting; or creates event. |
| `/api/events/detail.php` | `GET`, `PUT`, `DELETE` | Retrieves, updates, or deletes a single event record. |
| `/api/bookings/index.php` | `GET`, `POST` | Fetches bookings; or runs transactional checkout with seat decrement. |
| `/api/bookings/detail.php` | `GET`, `PUT` | Fetches single booking; or cancels booking and restores event seats. |
| `/api/bookings/checkin.php` | `POST` | Gate Scanner verification with duplicate check-in detection. |
| `/api/venues/index.php` | `GET`, `POST` | Lists all venues; or creates a new venue. |
| `/api/venues/detail.php` | `GET`, `PUT`, `DELETE` | Views, edits, or removes venue details. |
| `/api/promos/index.php` | `GET`, `POST`, `DELETE` | Validates promo codes during checkout; or manages promo codes. |
| `/api/reviews/index.php` | `GET`, `POST` | Fetches verified reviews; or submits review with auto rating calculation. |
| `/api/stats/dashboard.php` | `GET` | Aggregates executive KPIs, revenue trends, and gate check-in statistics. |
| `/api/settings/index.php` | `GET`, `POST` | Manages global platform configuration and currency settings. |
| `/api/users/index.php` | `GET`, `POST`, `DELETE` | Admin user directory, status toggle, and account creation. |
| `/api/notifications/index.php` | `GET`, `POST` | Fetches user notifications; or marks notifications as read. |

---

## 📁 Project Directory Structure

```
event-management-system/
├── api/                             # PHP REST API Backend Layer
│   ├── config/
│   │   ├── database.php             # PDO Singleton Database Connection
│   │   └── cors.php                 # CORS headers & OPTIONS preflight
│   ├── helpers/
│   │   └── response.php             # JSON response formatters & input parser
│   ├── auth/                        # login.php, register.php, me.php
│   ├── events/                      # index.php, detail.php
│   ├── bookings/                    # index.php, detail.php, checkin.php
│   ├── venues/                      # index.php, detail.php
│   ├── promos/                      # index.php
│   ├── reviews/                     # index.php
│   ├── stats/                       # dashboard.php
│   ├── settings/                    # index.php
│   ├── users/                       # index.php
│   └── notifications/               # index.php
│
├── database/                        # Database Migrations & Auto-Installer
│   ├── eventify.sql                 # MySQL Schema & Comprehensive Seed Data
│   └── setup.php                    # 1-Click Browser-Based Database Installer
│
├── admin/                           # Admin Command Center
│   ├── dashboard.html               # KPI overview, Canvas charts, recent events
│   ├── events.html                  # Full Event CRUD, search, filter, sort
│   ├── users.html                   # User directory, role filters, status toggle
│   ├── bookings.html                # Booking history, cancellation, digital pass
│   ├── venues.html                  # Venue management & edit modals
│   ├── scanner.html                 # Live Gate WebRTC QR Scanner & check-in portal
│   ├── reports.html                 # Analytics charts & CSV dataset exports
│   └── settings.html                # Promo codes manager & platform settings
│
├── user/                            # Attendee Self-Service Portal
│   ├── dashboard.html               # Attendee KPIs, countdowns, recommendations
│   ├── events.html                  # Discover events, Grid/List/Calendar views
│   ├── bookings.html                # Booking history & digital pass triggers
│   ├── favorites.html               # Wishlist favorites
│   ├── tickets.html                 # Ticket wallet, print & PNG downloads
│   ├── profile.html                 # Attendee profile editor
│   └── settings.html                # Attendee preferences
│
├── css/
│   ├── style.css                    # Design system, glassmorphism, variables
│   ├── dashboard.css                # Sidebar layout, tables, calendar, scanner
│   ├── responsive.css               # Responsive breakpoints & mobile off-canvas
│   └── animations.css               # Shimmer effects, modal animations, toasts
│
├── js/
│   ├── api.js                       # Frontend REST API Client & Backend Bridge
│   ├── storage.js                   # Hybrid storage controller & fallback engine
│   ├── theme.js                     # Dark/Light mode theme manager
│   ├── auth.js                      # Route protection & session manager
│   ├── ui.js                        # Toast alerts, modals, audio beeps, star ratings
│   ├── charts.js                    # Pure Canvas charts engine (Line, Bar, Donut)
│   ├── events.js                    # Event card rendering & review submissions
│   ├── bookings.js                  # Multi-tier checkout & PNG pass generator
│   ├── notifications.js             # Notification dropdowns
│   ├── admin.js                     # Admin dashboard controller
│   ├── user.js                      # Attendee portal controller & calendar view
│   └── app.js                       # Layout initialization
│
├── index.html                       # Public SaaS Landing Page
├── login.html                       # Dual-Role Authentication Page
├── register.html                    # User Registration Page
└── README.md                        # Documentation & Deployment Guide
```
