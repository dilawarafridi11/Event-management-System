<?php
/**
 * EVENTIFY — User Profile & Session Info API
 * Endpoint: GET/POST /api/auth/me.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $userId = $_GET['user_id'] ?? '';
    if (empty($userId)) {
        sendError('User ID is required', 400);
    }

    $stmt = $pdo->prepare("SELECT id, name, email, role, phone, location, avatar, events_booked, status, registered_date FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        sendError('User not found', 404);
    }

    sendResponse($user, 200);
} elseif ($method === 'POST') {
    // Update Profile
    $input = getJsonInput();
    $userId = $input['id'] ?? '';
    $name = trim($input['name'] ?? '');
    $phone = trim($input['phone'] ?? '');
    $location = trim($input['location'] ?? '');
    $avatar = trim($input['avatar'] ?? '');
    $newPassword = trim($input['password'] ?? '');

    if (empty($userId)) {
        sendError('User ID is required', 400);
    }

    if (!empty($newPassword)) {
        $hash = password_hash($newPassword, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("UPDATE users SET name = ?, phone = ?, location = ?, avatar = ?, password = ? WHERE id = ?");
        $stmt->execute([$name, $phone, $location, $avatar, $hash, $userId]);
    } else {
        $stmt = $pdo->prepare("UPDATE users SET name = ?, phone = ?, location = ?, avatar = ? WHERE id = ?");
        $stmt->execute([$name, $phone, $location, $avatar, $userId]);
    }

    $stmtGet = $pdo->prepare("SELECT id, name, email, role, phone, location, avatar, events_booked, status, registered_date FROM users WHERE id = ?");
    $stmtGet->execute([$userId]);
    $updatedUser = $stmtGet->fetch();

    sendResponse($updatedUser, 200, 'Profile updated successfully');
} else {
    sendError('Method Not Allowed', 405);
}
