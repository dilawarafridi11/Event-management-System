<?php
/**
 * EVENTIFY — Users Management API (Admin)
 * Endpoint: GET/POST/DELETE /api/users/index.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $role = $_GET['role'] ?? null;
    $status = $_GET['status'] ?? null;
    $search = trim($_GET['search'] ?? '');

    $sql = "SELECT id, name, email, role, phone, location, avatar, events_booked, status, registered_date FROM users WHERE 1=1";
    $params = [];

    if (!empty($role) && $role !== 'All') {
        $sql .= " AND role = ?";
        $params[] = $role;
    }

    if (!empty($status) && $status !== 'All') {
        $sql .= " AND status = ?";
        $params[] = $status;
    }

    if (!empty($search)) {
        $sql .= " AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(location) LIKE ?)";
        $searchTerm = '%' . strtolower($search) . '%';
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }

    $sql .= " ORDER BY registered_date DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll();

    $formatted = array_map(function($u) {
        return [
            'id' => $u['id'],
            'name' => $u['name'],
            'email' => $u['email'],
            'role' => $u['role'],
            'phone' => $u['phone'],
            'location' => $u['location'],
            'avatar' => $u['avatar'],
            'eventsBooked' => (int)$u['events_booked'],
            'status' => $u['status'],
            'registeredDate' => $u['registered_date']
        ];
    }, $users);

    sendResponse($formatted, 200);

} elseif ($method === 'POST') {
    $input = getJsonInput();

    // Toggle user status action
    if (isset($input['action']) && $input['action'] === 'toggleStatus') {
        $userId = $input['id'] ?? '';
        $newStatus = in_array($input['status'] ?? '', ['Active', 'Inactive']) ? $input['status'] : 'Active';

        $stmt = $pdo->prepare("UPDATE users SET status = ? WHERE id = ?");
        $stmt->execute([$newStatus, $userId]);

        sendResponse(['id' => $userId, 'status' => $newStatus], 200, "User status updated to {$newStatus}");
    }

    // Create User
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = trim($input['password'] ?? 'user123');
    $role = in_array($input['role'] ?? '', ['Admin', 'User']) ? $input['role'] : 'User';
    $phone = trim($input['phone'] ?? '+1 (555) 000-0000');
    $location = trim($input['location'] ?? 'San Francisco, CA');
    $avatar = trim($input['avatar'] ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80');

    if (empty($name) || empty($email)) {
        sendError('Name and email are required', 422);
    }

    $id = 'USR-' . rand(200, 999);
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $regDate = date('Y-m-d');

    $stmt = $pdo->prepare("INSERT INTO users (id, name, email, password, role, phone, location, avatar, events_booked, status, registered_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'Active', ?)");
    $stmt->execute([$id, $name, $email, $hash, $role, $phone, $location, $avatar, $regDate]);

    sendResponse(['id' => $id], 201, 'User created successfully');

} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if (empty($id)) {
        sendError('User ID is required', 400);
    }

    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$id]);

    sendResponse(['id' => $id], 200, 'User deleted successfully');
} else {
    sendError('Method Not Allowed', 405);
}
