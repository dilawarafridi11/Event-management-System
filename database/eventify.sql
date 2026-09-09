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
  `avatar` LONGTEXT DEFAULT NULL,
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
  `image` LONGTEXT NOT NULL,
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
  `attendee_image` LONGTEXT DEFAULT NULL,
  `guests_json` LONGTEXT DEFAULT NULL,
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
('USR-101', 'Alexander Wright', 'admin@eventify.com', '$2y$10$ganyrLBwhVG6DK6gDfz9COGLjbWVCov0F/YUSMUfFBWzTvrm8aqJi', 'SuperAdmin', '+1 (555) 019-2834', 'San Francisco, CA', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', 14, 'Active', '2025-11-15'),
('USR-102', 'Sarah Jenkins', 'user@eventify.com', '$2y$10$imvSr2qeWoE/1dARUVddh.RN4t322vfvr0htIZTJsbwEmSba4o/Lq', 'User', '+1 (555) 349-8271', 'New York, NY', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', 2, 'Active', '2026-01-10'),
('USR-354', 'Farman', 'farmann@gmail.com', '$2y$10$imvSr2qeWoE/1dARUVddh.RN4t322vfvr0htIZTJsbwEmSba4o/Lq', 'Organizer', '03078833943', 'Islamabad, PK', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', 0, 'Active', '2026-09-06'),
('USR-205', 'Elena Rostova', 'elena@techsummit.io', '$2y$10$imvSr2qeWoE/1dARUVddh.RN4t322vfvr0htIZTJsbwEmSba4o/Lq', 'Organizer', '+1 (555) 492-1082', 'San Francisco, CA', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80', 0, 'Active', '2026-08-15');

-- Seed Venues
INSERT INTO `venues` (`id`, `name`, `location`, `capacity`, `price`, `contact`, `availability`, `amenities`, `image`) VALUES
('VEN-101', 'Silicon Valley Convention Center', '500 Tech Parkway, San Jose, CA', 1200, 4500.00, '+1 (555) 901-2834', 'Available', 'High-Speed Wi-Fi, 4K Projectors, VIP Lounge, Catering Kitchen, Valet Parking', 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80');

-- Seed Events
INSERT INTO `events` (`id`, `title`, `description`, `category`, `date`, `start_time`, `end_time`, `venue`, `venue_id`, `location`, `capacity`, `booked_seats`, `ticket_price`, `organizer_id`, `organizer`, `image`, `status`, `featured`, `rating`, `review_count`, `tiers_json`) VALUES
('EVT-1001', 'Global AI & Tech Summit 2026', 'Premier annual gathering of artificial intelligence pioneers, enterprise architects, and venture builders.', 'Technology', '2026-10-15', '09:00 AM', '05:00 PM', 'Silicon Valley Convention Center', 'VEN-101', 'San Jose, CA', 500, 2, 1200.00, 'USR-205', 'Elena Rostova', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80', 'Upcoming', 1, 4.90, 18, '[{"name":"General Admission","price":1200,"benefits":["Keynote Access","Expo Floor","Lunch Buffet"]},{"name":"VIP All-Access","price":2160,"benefits":["Front Row Seating","VIP Lounge","Speaker Meet & Greet"]}]'),
('EVT-1002', 'Sufi & Classical Music Night', 'An enchanting musical evening featuring celebrated Sufi maestros, spiritual Qawwali, and acoustic performances.', 'Concert', '2026-10-22', '07:00 PM', '11:00 PM', 'Alhamra Arts Council', 'VEN-101', 'Lahore, PK', 400, 85, 2500.00, 'USR-354', 'Farman', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80', 'Upcoming', 1, 4.95, 32, '[{"name":"Standard Hall","price":2500,"benefits":["Concert Admission","Welcome Drink"]},{"name":"Front-Row VIP","price":5000,"benefits":["Front-Row Sofa Seating","VIP Lounge Access","Artist Meet & Greet"]}]'),
('EVT-1003', 'Full-Stack Web & AI Masterclass', 'Intensive hands-on training covering modern full-stack development, microservices, REST APIs, and generative AI agents.', 'Workshop', '2026-11-05', '10:00 AM', '04:00 PM', 'National Incubation Center', 'VEN-101', 'Islamabad, PK', 150, 40, 1500.00, 'USR-205', 'Elena Rostova', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80', 'Upcoming', 1, 4.88, 15, '[{"name":"Student Pass","price":1500,"benefits":["Full Day Workshop","Certificate of Completion","Course Materials"]},{"name":"Professional Pass","price":3000,"benefits":["Full Workshop","1-on-1 Code Review","Priority Q&A","Certificate"]}]'),
('EVT-1004', 'Pakistan Business Leadership Summit', 'Connecting leading enterprise executives, investors, and startup founders to discuss market leadership and economic growth.', 'Conference', '2026-11-18', '08:30 AM', '06:00 PM', 'Pearl Continental Grand Ballroom', 'VEN-101', 'Karachi, PK', 600, 120, 4000.00, 'USR-101', 'Alexander Wright', 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80', 'Upcoming', 1, 4.92, 24, '[{"name":"Delegate Access","price":4000,"benefits":["Keynote Sessions","Buffet Lunch","Networking Lounge"]},{"name":"Executive VIP Table","price":10000,"benefits":["Reserved Front Table","Private Executive Lunch","Full Access Pass"]}]'),
('EVT-1005', 'National Startup & Innovation Expo', 'Over 100 high-growth tech startups showcase prototypes, live pitches to venture capitalists, and product demo stations.', 'Exhibition', '2026-12-02', '10:00 AM', '07:00 PM', 'Pak-China Friendship Centre', 'VEN-101', 'Islamabad, PK', 800, 210, 800.00, 'USR-354', 'Farman', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80', 'Upcoming', 1, 4.85, 19, '[{"name":"Visitor Expo Pass","price":800,"benefits":["Exhibition Hall Access","Demo Stages","Event Guide"]},{"name":"Investor & Founder Pass","price":3500,"benefits":["VIP Pitch Stage","Investor Lounge","Fast-track Entry"]}]'),
('EVT-1006', 'Annual Tech Gala Dinner & Awards', 'A prestigious black-tie annual gathering celebrating outstanding achievements, innovation milestones, and digital leadership.', 'Party', '2026-12-20', '07:30 PM', '11:30 PM', 'Serena Hotel Sheesh Mahal', 'VEN-101', 'Islamabad, PK', 350, 90, 5000.00, 'USR-101', 'Alexander Wright', 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80', 'Upcoming', 1, 4.96, 28, '[{"name":"Individual Seat","price":5000,"benefits":["5-Course Gourmet Dinner","Awards Ceremony","Live Entertainment"]},{"name":"Corporate Table (8 Seats)","price":35000,"benefits":["Dedicated Table of 8","Company Branding","Premium Hospitality"]}]');

-- Seed Bookings
INSERT INTO `bookings` (`id`, `user_id`, `user_name`, `user_email`, `attendee_image`, `event_id`, `event_title`, `event_date`, `event_time`, `venue`, `tickets`, `tier_name`, `ticket_price`, `discount_amount`, `promo_code`, `total_amount`, `payment_status`, `booking_status`, `payment_method`, `check_in_status`, `booking_date`, `qr_code_data`) VALUES
('BKG-2026-01', 'USR-102', 'Sarah Jenkins', 'user@eventify.com', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', 'EVT-1001', 'Global AI & Tech Summit 2026', '2026-10-15', '09:00 AM', 'Silicon Valley Convention Center', 2, 'VIP All-Access', 2160.00, 0.00, NULL, 4320.00, 'Paid', 'Confirmed', 'Credit Card', 'Pending', '2026-09-01 14:30:00', 'EVTIFY-BKG-2026-01-SARAH-JENKINS-EVT-1001');



-- Seed Settings
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('site_title', 'Eventify Platform'),
('currency', 'PKR '),
('tax_rate', '8.5'),
('email_notifications', 'true'),
('sms_alerts', 'false'),
('auto_confirm_bookings', 'true'),
('stripe_enabled', 'true'),
('paypal_enabled', 'true')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);
