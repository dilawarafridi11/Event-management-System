<?php
/**
 * EVENTIFY — Venues API: List & Create
 * Endpoint: GET/POST /api/venues/index.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM venues ORDER BY name ASC");
    $venues = $stmt->fetchAll();

    $formatted = array_map(function($v) {
        return [
            'id' => $v['id'],
            'name' => $v['name'],
            'location' => $v['location'],
            'capacity' => (int)$v['capacity'],
            'price' => (float)$v['price'],
            'contact' => $v['contact'],
            'availability' => $v['availability'],
            'amenities' => !empty($v['amenities']) ? (is_array(json_decode($v['amenities'], true)) ? json_decode($v['amenities'], true) : explode(',', $v['amenities'])) : [],
            'image' => $v['image']
        ];
    }, $venues);

    sendResponse($formatted, 200);

} elseif ($method === 'POST') {
    $input = getJsonInput();

    $name = trim($input['name'] ?? '');
    $location = trim($input['location'] ?? '');
    $capacity = (int)($input['capacity'] ?? 100);
    $price = (float)($input['price'] ?? 1000);
    $contact = trim($input['contact'] ?? '+1 (555) 000-0000');
    $availability = in_array($input['availability'] ?? '', ['Available', 'Booked', 'Maintenance']) ? $input['availability'] : 'Available';
    $image = trim($input['image'] ?? 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=800&q=80');
    $amenities = isset($input['amenities']) ? (is_array($input['amenities']) ? json_encode($input['amenities']) : json_encode(array_map('trim', explode(',', $input['amenities'])))) : json_encode(['WiFi', 'Air Conditioning']);

    if (empty($name) || empty($location)) {
        sendError('Venue name and location are required', 422);
    }

    $id = 'VEN-' . str_pad(rand(10, 99), 2, '0', STR_PAD_LEFT);

    $stmt = $pdo->prepare("INSERT INTO venues (id, name, location, capacity, price, contact, availability, amenities, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$id, $name, $location, $capacity, $price, $contact, $availability, $amenities, $image]);

    sendResponse(['id' => $id], 201, 'Venue created successfully');

} else {
    sendError('Method Not Allowed', 405);
}
