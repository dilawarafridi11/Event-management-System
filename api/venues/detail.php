<?php
/**
 * EVENTIFY — Single Venue API: View, Update, Delete
 * Endpoint: GET/PUT/DELETE /api/venues/detail.php?id=VEN-XX
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

$id = $_GET['id'] ?? '';
$input = getJsonInput();
if (empty($id) && !empty($input['id'])) {
    $id = $input['id'];
}

if (empty($id)) {
    sendError('Venue ID is required', 400);
}

if ($method === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM venues WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $v = $stmt->fetch();

    if (!$v) {
        sendError('Venue not found', 404);
    }

    sendResponse([
        'id' => $v['id'],
        'name' => $v['name'],
        'location' => $v['location'],
        'capacity' => (int)$v['capacity'],
        'price' => (float)$v['price'],
        'contact' => $v['contact'],
        'availability' => $v['availability'],
        'amenities' => !empty($v['amenities']) ? (is_array(json_decode($v['amenities'], true)) ? json_decode($v['amenities'], true) : explode(',', $v['amenities'])) : [],
        'image' => $v['image']
    ], 200);

} elseif ($method === 'PUT' || ($method === 'POST' && isset($input['action']) && $input['action'] === 'update')) {
    // Update Venue
    $stmtCheck = $pdo->prepare("SELECT id FROM venues WHERE id = ?");
    $stmtCheck->execute([$id]);
    if (!$stmtCheck->fetch()) {
        sendError('Venue not found', 404);
    }

    $name = trim($input['name'] ?? '');
    $location = trim($input['location'] ?? '');
    $capacity = isset($input['capacity']) ? (int)$input['capacity'] : null;
    $price = isset($input['price']) ? (float)$input['price'] : null;
    $contact = trim($input['contact'] ?? '');
    $availability = trim($input['availability'] ?? '');
    $image = trim($input['image'] ?? '');
    $amenities = isset($input['amenities']) ? (is_array($input['amenities']) ? json_encode($input['amenities']) : json_encode(array_map('trim', explode(',', $input['amenities'])))) : null;

    $fields = [];
    $params = [];

    if (!empty($name)) { $fields[] = "name = ?"; $params[] = $name; }
    if (!empty($location)) { $fields[] = "location = ?"; $params[] = $location; }
    if ($capacity !== null) { $fields[] = "capacity = ?"; $params[] = $capacity; }
    if ($price !== null) { $fields[] = "price = ?"; $params[] = $price; }
    if (!empty($contact)) { $fields[] = "contact = ?"; $params[] = $contact; }
    if (!empty($availability)) { $fields[] = "availability = ?"; $params[] = $availability; }
    if (!empty($image)) { $fields[] = "image = ?"; $params[] = $image; }
    if ($amenities !== null) { $fields[] = "amenities = ?"; $params[] = $amenities; }

    if (empty($fields)) {
        sendError('No fields to update', 400);
    }

    $params[] = $id;
    $sql = "UPDATE venues SET " . implode(", ", $fields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    sendResponse(['id' => $id], 200, 'Venue updated successfully');

} elseif ($method === 'DELETE' || ($method === 'POST' && isset($input['action']) && $input['action'] === 'delete')) {
    $stmt = $pdo->prepare("DELETE FROM venues WHERE id = ?");
    $stmt->execute([$id]);

    sendResponse(['id' => $id], 200, 'Venue deleted successfully');
} else {
    sendError('Method Not Allowed', 405);
}
