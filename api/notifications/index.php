<?php
/**
 * EVENTIFY — Notifications API
 * Endpoint: GET/POST /api/notifications/index.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $userId = $_GET['user_id'] ?? null;

    if ($userId) {
        $stmt = $pdo->prepare("SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT 20");
        $stmt->execute([$userId]);
    } else {
        $stmt = $pdo->query("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20");
    }

    $notifications = $stmt->fetchAll();

    $formatted = array_map(function($n) {
        return [
            'id' => $n['id'],
            'userId' => $n['user_id'],
            'title' => $n['title'],
            'message' => $n['message'],
            'time' => $n['time_ago'],
            'read' => (bool)$n['is_read'],
            'type' => $n['type'],
            'icon' => $n['icon']
        ];
    }, $notifications);

    sendResponse($formatted, 200);

} elseif ($method === 'POST') {
    $input = getJsonInput();
    $userId = $input['userId'] ?? $_GET['user_id'] ?? null;

    if ($userId) {
        $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?");
        $stmt->execute([$userId]);
    } else {
        $pdo->exec("UPDATE notifications SET is_read = 1");
    }

    sendResponse(null, 200, 'Notifications marked as read');
} else {
    sendError('Method Not Allowed', 405);
}
