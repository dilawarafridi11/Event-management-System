<?php
/**
 * EVENTIFY — Events API: Index & Collection Handler
 * Endpoint: GET/POST /api/events/index.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $category = $_GET['category'] ?? 'All';
    $search = trim($_GET['search'] ?? '');
    $maxPrice = isset($_GET['max_price']) ? (float)$_GET['max_price'] : null;
    $status = $_GET['status'] ?? null;
    $featured = isset($_GET['featured']) ? (int)$_GET['featured'] : null;
    $sort = $_GET['sort'] ?? 'date-asc';
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

    $sql = "SELECT * FROM events WHERE 1=1";
    $params = [];

    if ($category !== 'All' && !empty($category)) {
        $sql .= " AND category = ?";
        $params[] = $category;
    }

    if (!empty($search)) {
        $sql .= " AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(venue) LIKE ?)";
        $searchTerm = '%' . strtolower($search) . '%';
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }

    if ($maxPrice !== null && $maxPrice >= 0) {
        $sql .= " AND ticket_price <= ?";
        $params[] = $maxPrice;
    }

    if (!empty($status)) {
        $sql .= " AND status = ?";
        $params[] = $status;
    }

    if ($featured !== null) {
        $sql .= " AND featured = ?";
        $params[] = $featured;
    }

    // Sort order
    switch ($sort) {
        case 'date-desc':
            $sql .= " ORDER BY date DESC, start_time DESC";
            break;
        case 'price-low':
            $sql .= " ORDER BY ticket_price ASC";
            break;
        case 'price-high':
            $sql .= " ORDER BY ticket_price DESC";
            break;
        case 'title-asc':
            $sql .= " ORDER BY title ASC";
            break;
        case 'popular':
            $sql .= " ORDER BY booked_seats DESC";
            break;
        case 'date-asc':
        default:
            $sql .= " ORDER BY date ASC, start_time ASC";
            break;
    }

    $sql .= " LIMIT " . (int)$limit . " OFFSET " . (int)$offset;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $events = $stmt->fetchAll();

    // Format event items
    $formatted = array_map(function($e) {
        return [
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
        ];
    }, $events);

    sendResponse($formatted, 200);

} elseif ($method === 'POST') {
    // Create new Event
    $input = getJsonInput();

    $title = trim($input['title'] ?? '');
    $category = trim($input['category'] ?? 'Conference');
    $date = trim($input['date'] ?? date('Y-m-d'));
    $startTime = trim($input['startTime'] ?? '09:00');
    $endTime = trim($input['endTime'] ?? '17:00');
    $venue = trim($input['venue'] ?? 'Metropolis Hall');
    $venueId = trim($input['venueId'] ?? 'VEN-01');
    $location = trim($input['location'] ?? 'San Francisco, CA');
    $capacity = (int)($input['capacity'] ?? 100);
    $ticketPrice = (float)($input['ticketPrice'] ?? 0.0);
    $organizer = trim($input['organizer'] ?? 'Eventify Team');
    $description = trim($input['description'] ?? '');
    $image = trim($input['image'] ?? 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80');
    $status = trim($input['status'] ?? 'Upcoming');
    $featured = !empty($input['featured']) ? 1 : 0;
    $tiersJson = isset($input['ticketTiers']) ? json_encode($input['ticketTiers']) : null;

    if (empty($title) || empty($date)) {
        sendError('Event title and date are required', 422);
    }

    $id = 'EVT-' . rand(1100, 9999);

    $stmt = $pdo->prepare("INSERT INTO events (id, title, description, category, date, start_time, end_time, venue, venue_id, location, capacity, booked_seats, ticket_price, organizer, image, status, featured, rating, review_count, tiers_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 5.0, 0, ?)");
    $stmt->execute([
        $id,
        $title,
        $description,
        $category,
        $date,
        $startTime,
        $endTime,
        $venue,
        $venueId,
        $location,
        $capacity,
        $ticketPrice,
        $organizer,
        $image,
        $status,
        $featured,
        $tiersJson
    ]);

    sendResponse(['id' => $id], 201, 'Event created successfully');

} else {
    sendError('Method Not Allowed', 405);
}
