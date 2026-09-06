<?php
/**
 * EVENTIFY — Single Event API: View, Update, Delete
 * Endpoint: GET/PUT/DELETE /api/events/detail.php?id=EVT-XXXX
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
    sendError('Event ID is required', 400);
}

if ($method === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM events WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $e = $stmt->fetch();

    if (!$e) {
        sendError('Event not found', 404);
    }

    sendResponse([
        'id' => $e['id'],
        'title' => $e['title'],
        'description' => $e['description'],
        'category' => $e['category'],
        'date' => $e['date'],
        'startTime' => $e['start_time'],
        'endTime' => $e['end_time'],
        'venue' => $e['venue'],
        'venueId' => $e['venue_id'],
        'location' => $e['location'],
        'capacity' => (int)$e['capacity'],
        'bookedSeats' => (int)$e['booked_seats'],
        'availableSeats' => (int)$e['available_seats'],
        'ticketPrice' => (float)$e['ticket_price'],
        'organizer' => $e['organizer'],
        'image' => $e['image'],
        'status' => $e['status'],
        'featured' => (bool)$e['featured'],
        'rating' => (float)$e['rating'],
        'reviewCount' => (int)$e['review_count'],
        'ticketTiers' => !empty($e['tiers_json']) ? json_decode($e['tiers_json'], true) : null,
        'createdAt' => $e['created_at']
    ], 200);

} elseif ($method === 'PUT' || ($method === 'POST' && isset($input['action']) && $input['action'] === 'update')) {
    // Update Event
    $stmtCheck = $pdo->prepare("SELECT id FROM events WHERE id = ?");
    $stmtCheck->execute([$id]);
    if (!$stmtCheck->fetch()) {
        sendError('Event not found', 404);
    }

    $title = trim($input['title'] ?? '');
    $category = trim($input['category'] ?? '');
    $date = trim($input['date'] ?? '');
    $startTime = trim($input['startTime'] ?? '');
    $endTime = trim($input['endTime'] ?? '');
    $venue = trim($input['venue'] ?? '');
    $venueId = trim($input['venueId'] ?? '');
    $location = trim($input['location'] ?? '');
    $capacity = isset($input['capacity']) ? (int)$input['capacity'] : null;
    $ticketPrice = isset($input['ticketPrice']) ? (float)$input['ticketPrice'] : null;
    $organizer = trim($input['organizer'] ?? '');
    $description = trim($input['description'] ?? '');
    $image = trim($input['image'] ?? '');
    $status = trim($input['status'] ?? '');
    $featured = isset($input['featured']) ? ($input['featured'] ? 1 : 0) : null;
    $tiersJson = isset($input['ticketTiers']) ? json_encode($input['ticketTiers']) : null;

    $fields = [];
    $params = [];

    if (!empty($title)) { $fields[] = "title = ?"; $params[] = $title; }
    if (!empty($category)) { $fields[] = "category = ?"; $params[] = $category; }
    if (!empty($date)) { $fields[] = "date = ?"; $params[] = $date; }
    if (!empty($startTime)) { $fields[] = "start_time = ?"; $params[] = $startTime; }
    if (!empty($endTime)) { $fields[] = "end_time = ?"; $params[] = $endTime; }
    if (!empty($venue)) { $fields[] = "venue = ?"; $params[] = $venue; }
    if (!empty($venueId)) { $fields[] = "venue_id = ?"; $params[] = $venueId; }
    if (!empty($location)) { $fields[] = "location = ?"; $params[] = $location; }
    if ($capacity !== null) { $fields[] = "capacity = ?"; $params[] = $capacity; }
    if ($ticketPrice !== null) { $fields[] = "ticket_price = ?"; $params[] = $ticketPrice; }
    if (!empty($organizer)) { $fields[] = "organizer = ?"; $params[] = $organizer; }
    if (!empty($description)) { $fields[] = "description = ?"; $params[] = $description; }
    if (!empty($image)) { $fields[] = "image = ?"; $params[] = $image; }
    if (!empty($status)) { $fields[] = "status = ?"; $params[] = $status; }
    if ($featured !== null) { $fields[] = "featured = ?"; $params[] = $featured; }
    if ($tiersJson !== null) { $fields[] = "tiers_json = ?"; $params[] = $tiersJson; }

    if (empty($fields)) {
        sendError('No fields to update', 400);
    }

    $params[] = $id;
    $sql = "UPDATE events SET " . implode(", ", $fields) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    sendResponse(['id' => $id], 200, 'Event updated successfully');

} elseif ($method === 'DELETE' || ($method === 'POST' && isset($input['action']) && $input['action'] === 'delete')) {
    $stmt = $pdo->prepare("DELETE FROM events WHERE id = ?");
    $stmt->execute([$id]);

    sendResponse(['id' => $id], 200, 'Event deleted successfully');
} else {
    sendError('Method Not Allowed', 405);
}
