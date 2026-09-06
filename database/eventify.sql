-- ==============================================================================
-- EVENTIFY — MySQL Relational Database Schema & Initial Seed Data
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `promos`;
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `venues`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `settings`;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------------------------
-- 1. Table structure for `users`
-- ------------------------------------------------------------------------------
CREATE TABLE `users` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('SuperAdmin', 'Organizer', 'User') NOT NULL DEFAULT 'User',
  `phone` VARCHAR(50) DEFAULT NULL,
  `location` VARCHAR(150) DEFAULT NULL,
  `avatar` VARCHAR(255) DEFAULT NULL,
  `events_booked` INT(11) NOT NULL DEFAULT 0,
  `status` ENUM('Active', 'Inactive', 'Pending') NOT NULL DEFAULT 'Active',
  `registered_date` DATE NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Table structure for `venues`
-- ------------------------------------------------------------------------------
CREATE TABLE `venues` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `capacity` INT(11) NOT NULL DEFAULT 0,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `contact` VARCHAR(100) DEFAULT NULL,
  `availability` ENUM('Available', 'Booked', 'Maintenance') NOT NULL DEFAULT 'Available',
  `amenities` TEXT DEFAULT NULL, -- JSON or comma-separated list
  `image` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Table structure for `events`
-- ------------------------------------------------------------------------------
CREATE TABLE `events` (
  `id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `date` DATE NOT NULL,
  `start_time` VARCHAR(20) NOT NULL,
  `end_time` VARCHAR(20) NOT NULL,
  `venue` VARCHAR(255) NOT NULL,
  `venue_id` VARCHAR(50) DEFAULT NULL,
  `location` VARCHAR(255) NOT NULL,
  `capacity` INT(11) NOT NULL DEFAULT 0,
  `booked_seats` INT(11) NOT NULL DEFAULT 0,
  `available_seats` INT(11) GENERATED ALWAYS AS (`capacity` - `booked_seats`) VIRTUAL,
  `ticket_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `organizer_id` VARCHAR(50) DEFAULT NULL,
  `organizer` VARCHAR(150) NOT NULL,
  `image` VARCHAR(255) NOT NULL,
  `status` ENUM('Upcoming', 'Ongoing', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Upcoming',
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `rating` DECIMAL(3,2) NOT NULL DEFAULT 5.00,
  `review_count` INT(11) NOT NULL DEFAULT 0,
  `tiers_json` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_events_category` (`category`),
  KEY `idx_events_date` (`date`),
  KEY `idx_events_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Table structure for `bookings`
-- ------------------------------------------------------------------------------
CREATE TABLE `bookings` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `user_name` VARCHAR(150) NOT NULL,
  `user_email` VARCHAR(191) NOT NULL,
  `event_id` VARCHAR(50) NOT NULL,
  `event_title` VARCHAR(255) NOT NULL,
  `event_date` DATE NOT NULL,
  `event_time` VARCHAR(50) NOT NULL,
  `venue` VARCHAR(255) NOT NULL,
  `tickets` INT(11) NOT NULL DEFAULT 1,
  `tier_name` VARCHAR(100) DEFAULT 'General Admission',
  `ticket_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `promo_code` VARCHAR(50) DEFAULT NULL,
  `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `payment_status` ENUM('Paid', 'Pending', 'Failed', 'Refunded') NOT NULL DEFAULT 'Paid',
  `booking_status` ENUM('Confirmed', 'Pending', 'Cancelled') NOT NULL DEFAULT 'Confirmed',
  `payment_method` VARCHAR(50) DEFAULT 'Credit Card',
  `check_in_status` ENUM('Pending', 'Checked-In') NOT NULL DEFAULT 'Pending',
  `checked_in_at` DATETIME DEFAULT NULL,
  `booking_date` DATETIME NOT NULL,
  `qr_code_data` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bookings_user_id` (`user_id`),
  KEY `idx_bookings_event_id` (`event_id`),
  KEY `idx_bookings_status` (`booking_status`),
  CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bookings_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Table structure for `promos`
-- ------------------------------------------------------------------------------
CREATE TABLE `promos` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL,
  `discount_type` ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent',
  `discount_value` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `description` VARCHAR(255) DEFAULT NULL,
  `min_purchase` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `expiry_date` DATE DEFAULT NULL,
  `uses_count` INT(11) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_promos_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Table structure for `reviews`
-- ------------------------------------------------------------------------------
CREATE TABLE `reviews` (
  `id` VARCHAR(50) NOT NULL,
  `event_id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) DEFAULT NULL,
  `user_name` VARCHAR(150) NOT NULL,
  `rating` INT(1) NOT NULL DEFAULT 5,
  `comment` TEXT NOT NULL,
  `date` DATE NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reviews_event_id` (`event_id`),
  CONSTRAINT `fk_reviews_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. Table structure for `notifications`
-- ------------------------------------------------------------------------------
CREATE TABLE `notifications` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `time_ago` VARCHAR(100) DEFAULT 'Just now',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `type` ENUM('success', 'info', 'warning', 'danger') NOT NULL DEFAULT 'info',
  `icon` VARCHAR(50) DEFAULT '🔔',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. Table structure for `settings`
-- ------------------------------------------------------------------------------
CREATE TABLE `settings` (
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================

-- Seed Users (Passwords: admin123 / user123)
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `location`, `avatar`, `events_booked`, `status`, `registered_date`) VALUES
('USR-101', 'Alexander Wright', 'admin@eventify.com', '$2y$10$Bg8CCrZizjPCeDHrJPNJdOxfx0KW7unAnm6E6crcZYgpQ/4nkxIpq', 'SuperAdmin', '+1 (555) 019-2834', 'San Francisco, CA', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', 14, 'Active', '2025-11-15'),
('ORG-201', 'Sarah Organizer', 'organizer@eventify.com', '$2y$10$Bg8CCrZizjPCeDHrJPNJdOxfx0KW7unAnm6E6crcZYgpQ/4nkxIpq', 'Organizer', '+1 (555) 555-5555', 'Los Angeles, CA', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', 0, 'Active', '2026-01-01'),
('USR-102', 'Sophia Martinez', 'user@eventify.com', '$2y$10$WsDfjNsYPN32HN6rWNqW/OpTQMp/DDfK9zlvRAbGfpM7Bu2RjTJqy', 'User', '+1 (555) 732-9011', 'Austin, TX', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', 5, 'Active', '2026-02-10'),
('USR-103', 'Marcus Chen', 'marcus.chen@innovate.io', '$2y$10$WsDfjNsYPN32HN6rWNqW/OpTQMp/DDfK9zlvRAbGfpM7Bu2RjTJqy', 'User', '+1 (555) 884-1290', 'Seattle, WA', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', 3, 'Active', '2026-03-01'),
('USR-104', 'Elena Rostova', 'elena.rostova@design.com', '$2y$10$WsDfjNsYPN32HN6rWNqW/OpTQMp/DDfK9zlvRAbGfpM7Bu2RjTJqy', 'User', '+1 (555) 612-4439', 'New York, NY', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80', 2, 'Active', '2026-04-18'),
('USR-105', 'David O\'Connor', 'david.oc@fintech.co', '$2y$10$WsDfjNsYPN32HN6rWNqW/OpTQMp/DDfK9zlvRAbGfpM7Bu2RjTJqy', 'User', '+1 (555) 902-8871', 'Chicago, IL', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', 1, 'Inactive', '2026-05-22');

-- Seed Venues
INSERT INTO `venues` (`id`, `name`, `location`, `capacity`, `price`, `contact`, `availability`, `amenities`, `image`) VALUES
('VEN-01', 'Metropolis Convention Center, Hall A', 'Downtown Silicon District, CA', 500, 2500.00, '+1 (555) 234-8900', 'Available', '["Gigabit WiFi", "4K Projection", "Audio Matrix", "Valet Parking", "Catering Kitchen"]', 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=800&q=80'),
('VEN-02', 'AeroPark Amphitheatre', 'Riverside Park, Austin, TX', 1200, 4800.00, '+1 (555) 345-6789', 'Available', '["Outdoor Stage", "Concert Lighting", "Security Gates", "VIP Lounge"]', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80'),
('VEN-03', 'CodeCraft Innovation Hub', 'Tech Hub Building 4, Seattle, WA', 60, 800.00, '+1 (555) 456-7890', 'Booked', '["Dual Monitors", "Whiteboard Walls", "Fiber Optic", "Coffee Bar"]', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'),
('VEN-04', 'Grand Crystal Ballroom & Garden', 'Grand Plaza Hotel, Chicago, IL', 350, 3200.00, '+1 (555) 567-8901', 'Available', '["Crystal Chandeliers", "Bridal Suite", "Landscaped Courtyard", "Banquet Tables"]', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80'),
('VEN-05', 'EcoSphere Conference Pavilion', 'Green Valley Center, Denver, CO', 300, 1800.00, '+1 (555) 678-9012', 'Available', '["Solar Powered", "Acoustic Panels", "Hybrid Video Rig", "Natural Lighting"]', 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=80'),
('VEN-06', 'Skyline Terrace & Lounge', 'Tower 42, Miami, FL', 180, 2200.00, '+1 (555) 789-0123', 'Available', '["Rooftop Pool Deck", "Cocktail Bar", "Surround Sound", "City Views"]', 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80');

-- Seed Events
INSERT INTO `events` (`id`, `title`, `description`, `category`, `date`, `start_time`, `end_time`, `venue`, `venue_id`, `location`, `capacity`, `booked_seats`, `ticket_price`, `organizer_id`, `organizer`, `image`, `status`, `featured`, `rating`, `review_count`, `tiers_json`, `created_at`) VALUES
('EVT-1001', 'Global Tech & AI Innovators Summit 2026', 'Join industry pioneers, AI researchers, and tech founders to explore generative intelligence, quantum computing, and autonomous robotics architecture.', 'Conference', '2026-09-18', '09:00', '17:30', 'Metropolis Convention Center, Hall A', 'VEN-01', 'Downtown Silicon District, CA', 500, 412, 199.00, 'USR-101', 'NextGen Tech Foundation', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80', 'Upcoming', 1, 4.90, 28, '[{"name":"General Admission","price":199,"badge":"Standard"},{"name":"Early Bird","price":169,"badge":"15% Off"},{"name":"VIP Access","price":359,"badge":"Priority & Lounge"}]', '2026-07-10 10:00:00'),
('EVT-1002', 'Neon Horizon Music & Visual Arts Festival', 'An immersive 2-day outdoor electronic music festival featuring world-class DJs, interactive laser installations, and artisan food trucks.', 'Concert', '2026-09-25', '16:00', '23:30', 'AeroPark Amphitheatre', 'VEN-02', 'Riverside Park, Austin, TX', 1200, 1140, 85.00, 'ORG-201', 'Lumina Soundworks', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1000&q=80', 'Upcoming', 1, 4.80, 45, '[{"name":"General Admission","price":85,"badge":"Standard"},{"name":"Early Bird","price":72,"badge":"15% Off"},{"name":"VIP Access","price":153,"badge":"Front Row"}]', '2026-07-14 12:30:00'),
('EVT-1003', 'Masterclass: Advanced Full-Stack Systems Design', 'Hands-on architectural masterclass on building microservices, distributed cache consistency, and real-time event streaming systems.', 'Workshop', '2026-08-30', '10:00', '15:00', 'CodeCraft Innovation Hub', 'VEN-03', 'Tech Hub Building 4, Seattle, WA', 60, 58, 149.00, 'USR-101', 'Engineering Excellence Academy', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80', 'Ongoing', 1, 4.95, 19, '[{"name":"General Admission","price":149,"badge":"Standard"},{"name":"Early Bird","price":126,"badge":"15% Off"},{"name":"VIP Access","price":268,"badge":"1-on-1 Mentorship"}]', '2026-07-20 09:00:00'),
('EVT-1004', 'Annual Luxury Bridal & Wedding Expo', 'Experience stunning runway shows, connect with elite wedding planners, gourmet caterers, and discover bespoke floral designs.', 'Wedding', '2026-10-05', '11:00', '18:00', 'Grand Crystal Ballroom & Garden', 'VEN-04', 'Grand Plaza Hotel, Chicago, IL', 350, 220, 45.00, 'ORG-201', 'Elegance Events Group', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80', 'Upcoming', 0, 4.70, 12, '[{"name":"General Admission","price":45,"badge":"Standard"},{"name":"Early Bird","price":38,"badge":"15% Off"},{"name":"VIP Access","price":81,"badge":"Gift Bag Included"}]', '2026-08-01 14:00:00'),
('EVT-1005', 'International Sustainable Energy & Climate Forum', 'High-level dialogue between green energy policy makers, clean-tech founders, and venture capitalists shaping the carbon-neutral economy.', 'Seminar', '2026-10-12', '08:30', '16:00', 'EcoSphere Conference Pavilion', 'VEN-05', 'Green Valley Center, Denver, CO', 300, 195, 120.00, 'USR-101', 'Global Climate Alliance', 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80', 'Upcoming', 0, 4.85, 16, '[{"name":"General Admission","price":120,"badge":"Standard"},{"name":"Early Bird","price":102,"badge":"15% Off"},{"name":"VIP Access","price":216,"badge":"VIP Networking"}]', '2026-08-05 11:15:00'),
('EVT-1006', 'CyberClash Esports Pro Championship Finals', 'Top international teams compete in the grand championship finals. Live stadium commentary, cosplay showcase, and gaming gear giveaways.', 'Sports', '2026-10-20', '13:00', '21:00', 'CyberArena Stadium', 'VEN-02', 'Olympic Park Complex, Los Angeles, CA', 1500, 1420, 65.00, 'ORG-201', 'CyberClash Esports League', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80', 'Upcoming', 1, 4.90, 52, '[{"name":"General Admission","price":65,"badge":"Standard"},{"name":"Early Bird","price":55,"badge":"15% Off"},{"name":"VIP Access","price":117,"badge":"Locker Room Pass"}]', '2026-08-08 16:20:00'),
('EVT-1007', 'Modern Abstract Art & Sculpture Exhibition', 'Curated gallery showcase of contemporary abstract paintings, light sculptures, and interactive audiovisual experiential spaces.', 'Exhibition', '2026-07-15', '10:00', '20:00', 'Lumina Contemporary Art Gallery', 'VEN-06', 'SoHo Arts Quarter, New York, NY', 250, 250, 25.00, 'USR-101', 'Curators Guild', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=80', 'Completed', 0, 5.00, 8, '[{"name":"General Admission","price":25,"badge":"Standard"},{"name":"VIP Access","price":45,"badge":"Catalog Included"}]', '2026-06-15 10:00:00'),
('EVT-1008', 'Exclusive Midnight Rooftop Masquerade Party', 'An elegant evening with signature cocktails, panoramic city skyline views, live jazz quartet, and mystery masquerade entertainment.', 'Party', '2026-10-31', '20:00', '02:00', 'Skyline Terrace & Lounge', 'VEN-06', 'Tower 42, Miami, FL', 180, 150, 110.00, 'ORG-201', 'Velvet Noir Entertainment', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80', 'Upcoming', 1, 4.92, 22, '[{"name":"General Admission","price":110,"badge":"Standard"},{"name":"Early Bird","price":93,"badge":"15% Off"},{"name":"VIP Access","price":198,"badge":"Open Bar & Cabana"}]', '2026-08-12 18:00:00');

-- Seed Bookings
INSERT INTO `bookings` (`id`, `user_id`, `user_name`, `user_email`, `event_id`, `event_title`, `event_date`, `event_time`, `venue`, `tickets`, `tier_name`, `ticket_price`, `discount_amount`, `promo_code`, `total_amount`, `payment_status`, `booking_status`, `payment_method`, `check_in_status`, `checked_in_at`, `booking_date`, `qr_code_data`) VALUES
('BKG-8801', 'USR-102', 'Sophia Martinez', 'user@eventify.com', 'EVT-1001', 'Global Tech & AI Innovators Summit 2026', '2026-09-18', '09:00 - 17:30', 'Metropolis Convention Center, Hall A', 2, 'General Admission', 199.00, 0.00, NULL, 398.00, 'Paid', 'Confirmed', 'Credit Card', 'Pending', NULL, '2026-08-15 14:22:00', 'EVTIFY-BKG-8801-SOPHIA-EVT-1001-2TIX'),
('BKG-8802', 'USR-102', 'Sophia Martinez', 'user@eventify.com', 'EVT-1002', 'Neon Horizon Music & Visual Arts Festival', '2026-09-25', '16:00 - 23:30', 'AeroPark Amphitheatre', 3, 'General Admission', 85.00, 0.00, NULL, 255.00, 'Paid', 'Confirmed', 'Credit Card', 'Pending', NULL, '2026-08-20 18:40:00', 'EVTIFY-BKG-8802-SOPHIA-EVT-1002-3TIX'),
('BKG-8803', 'USR-103', 'Marcus Chen', 'marcus.chen@innovate.io', 'EVT-1003', 'Masterclass: Advanced Full-Stack Systems Design', '2026-08-30', '10:00 - 15:00', 'CodeCraft Innovation Hub', 1, 'General Admission', 149.00, 0.00, NULL, 149.00, 'Paid', 'Confirmed', 'Credit Card', 'Pending', NULL, '2026-08-21 09:15:00', 'EVTIFY-BKG-8803-MARCUS-EVT-1003-1TIX'),
('BKG-8804', 'USR-104', 'Elena Rostova', 'elena.rostova@design.com', 'EVT-1008', 'Exclusive Midnight Rooftop Masquerade Party', '2026-10-31', '20:00 - 02:00', 'Skyline Terrace & Lounge', 2, 'General Admission', 110.00, 0.00, NULL, 220.00, 'Pending', 'Pending', 'PayPal', 'Pending', NULL, '2026-08-27 21:05:00', 'EVTIFY-BKG-8804-ELENA-EVT-1008-2TIX');

-- Seed Promos
INSERT INTO `promos` (`code`, `discount_type`, `discount_value`, `description`, `min_purchase`, `active`, `expiry_date`, `uses_count`) VALUES
('EVENTIFY20', 'percent', 20.00, '20% off all event admissions', 0.00, 1, '2026-12-31', 14),
('VIP50', 'fixed', 50.00, '$50 flat discount on orders over $150', 150.00, 1, '2026-12-31', 8),
('SUMMER15', 'percent', 15.00, '15% Seasonal Summer Festival Discount', 50.00, 1, '2026-11-30', 21);

-- Seed Reviews
INSERT INTO `reviews` (`id`, `event_id`, `user_id`, `user_name`, `rating`, `comment`, `date`) VALUES
('REV-1', 'EVT-1007', 'USR-102', 'Sophia Martinez', 5, 'Mind-blowing audiovisual art installation! The venue was gorgeous and the digital pass QR scanned instantly at the gate.', '2026-07-20'),
('REV-2', 'EVT-1007', 'USR-103', 'Marcus Chen', 5, 'Superbly curated contemporary pieces. The acoustic lighting atmosphere was world-class.', '2026-07-22'),
('REV-3', 'EVT-1001', 'USR-104', 'Elena Rostova', 5, 'Incredible speaker lineup and networking opportunities! Cannot wait for the next edition.', '2026-08-10');

-- Seed Notifications
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `time_ago`, `is_read`, `type`, `icon`) VALUES
('NOTIF-1', 'USR-102', 'Booking Confirmed!', 'Your 2 tickets for Global Tech & AI Innovators Summit are confirmed. Digital passes ready.', '10 minutes ago', 0, 'success', '✓'),
('NOTIF-2', 'USR-102', 'New VIP Event Added', 'Exclusive Midnight Rooftop Masquerade Party just opened registrations.', '2 hours ago', 0, 'info', '🎉'),
('NOTIF-3', 'USR-102', 'Payment Received', 'Payment of $255.00 for Neon Horizon Festival processed successfully.', '1 day ago', 1, 'success', '💳'),
('NOTIF-4', 'USR-102', 'Event Reminder', 'Masterclass: Advanced Full-Stack Systems Design is scheduled for tomorrow.', '2 days ago', 1, 'warning', '⏰');

-- Seed Settings
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('site_title', 'Eventify Platform'),
('currency', '$'),
('tax_rate', '8.5'),
('email_notifications', 'true'),
('sms_alerts', 'false'),
('auto_confirm_bookings', 'true'),
('stripe_enabled', 'true'),
('paypal_enabled', 'true')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);
