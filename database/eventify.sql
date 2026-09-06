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
('USR-101', 'Alexander Wright', 'admin@eventify.com', '$2y$10$Bg8CCrZizjPCeDHrJPNJdOxfx0KW7unAnm6E6crcZYgpQ/4nkxIpq', 'SuperAdmin', '+1 (555) 019-2834', 'San Francisco, CA', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', 14, 'Active', '2025-11-15');



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
