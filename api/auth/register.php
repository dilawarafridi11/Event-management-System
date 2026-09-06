<?php
/**
 * EVENTIFY — Authentication API: Register
 * Endpoint: POST /api/auth/register.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method Not Allowed', 405);
}

$input = getJsonInput();
$name = trim($input['name'] ?? '');
$email = trim($input['email'] ?? '');
$password = trim($input['password'] ?? '');
$phone = trim($input['phone'] ?? '+1 (555) 000-0000');
$location = trim($input['location'] ?? 'San Francisco, CA');
$role = in_array($input['role'] ?? '', ['SuperAdmin', 'Organizer', 'User']) ? $input['role'] : 'User';
$status = ($role === 'Organizer') ? 'Pending' : 'Active';

if (empty($name) || empty($email) || empty($password)) {
    sendError('Full name, email address, and password are required', 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendError('Please provide a valid email address', 422);
}

if (strlen($password) < 6) {
    sendError('Password must be at least 6 characters long', 422);
}

$pdo = Database::getConnection();

// Check if email already exists
$checkStmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1");
$checkStmt->execute([$email]);
if ($checkStmt->fetch()) {
    sendError('An account with this email address already exists. Please log in instead.', 409);
}

// Generate new User ID
$userId = 'USR-' . rand(200, 999);
$passwordHash = password_hash($password, PASSWORD_BCRYPT);
$registeredDate = date('Y-m-d');
$inputAvatar = trim($input['avatar'] ?? '');
$avatar = !empty($inputAvatar) ? $inputAvatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

$stmt = $pdo->prepare("INSERT INTO users (id, name, email, password, role, phone, location, avatar, events_booked, status, registered_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->execute([
    $userId,
    $name,
    $email,
    $passwordHash,
    $role,
    $phone,
    $location,
    $avatar,
    0,
    $status,
    $registeredDate
]);

// Create Welcome Notification
$notifId = 'NOTIF-' . rand(100, 999);
$notifStmt = $pdo->prepare("INSERT INTO notifications (id, user_id, title, message, time_ago, is_read, type, icon) VALUES (?, ?, 'Welcome to Eventify! <i class=\'fa-solid fa-party-horn\'></i>', 'Your account has been created. Explore upcoming conferences, concerts, and workshops.', 'Just now', 0, 'info', '<i class=\'fa-solid fa-hand-wave\'></i>')");
$notifStmt->execute([$notifId, $userId]);

$token = 'evtify_' . bin2hex(random_bytes(24));

sendResponse([
    'user' => [
        'id' => $userId,
        'name' => $name,
        'email' => $email,
        'role' => $role,
        'phone' => $phone,
        'location' => $location,
        'avatar' => $avatar,
        'eventsBooked' => 0,
        'status' => $status,
        'registeredDate' => $registeredDate
    ],
    'token' => $token
], 201, 'Account created successfully');
