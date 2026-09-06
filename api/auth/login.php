<?php
/**
 * EVENTIFY — Authentication API: Login
 * Endpoint: POST /api/auth/login.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method Not Allowed', 405);
}

$input = getJsonInput();
$email = trim($input['email'] ?? '');
$password = trim($input['password'] ?? '');

if (empty($email) || empty($password)) {
    sendError('Email and password are required', 422);
}

$pdo = Database::getConnection();

$stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    sendError('Invalid email or password', 401);
}

if ($user['status'] !== 'Active') {
    sendError('Your account has been deactivated. Please contact administrator.', 403);
}

// Check password: verify bcrypt hash or fallback to plaintext match (for initial seed data)
$isPasswordValid = password_verify($password, $user['password']) || ($user['password'] === $password);

if (!$isPasswordValid) {
    sendError('Invalid email or password', 401);
}

// Upgrade plaintext password to bcrypt hash if needed
if ($user['password'] === $password) {
    $newHash = password_hash($password, PASSWORD_BCRYPT);
    $upStmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
    $upStmt->execute([$newHash, $user['id']]);
}

// Strip password from response payload
unset($user['password']);

// Create session token
$token = 'evtify_' . bin2hex(random_bytes(24));

sendResponse([
    'user' => [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role'],
        'phone' => $user['phone'],
        'location' => $user['location'],
        'avatar' => $user['avatar'],
        'eventsBooked' => (int)$user['events_booked'],
        'status' => $user['status'],
        'registeredDate' => $user['registered_date']
    ],
    'token' => $token
], 200, 'Authentication successful');
