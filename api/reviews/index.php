<?php
/**
 * EVENTIFY — Reviews API: List & Star Rating Submission
 * Endpoint: GET/POST /api/reviews/index.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $eventId = $_GET['event_id'] ?? null;

    if ($eventId) {
        $stmt = $pdo->prepare("SELECT * FROM reviews WHERE event_id = ? ORDER BY date DESC, created_at DESC");
        $stmt->execute([$eventId]);
    } else {
        $stmt = $pdo->query("SELECT * FROM reviews ORDER BY date DESC, created_at DESC");
    }

    $reviews = $stmt->fetchAll();

    $formatted = array_map(function($r) {
        return [
            'id' => $r['id'],
            'eventId' => $r['event_id'],
            'userId' => $r['user_id'],
            'userName' => $r['user_name'],
            'rating' => (int)$r['rating'],
            'comment' => $r['comment'],
            'date' => $r['date']
        ];
    }, $reviews);

    sendResponse($formatted, 200);

} elseif ($method === 'POST') {
    $input = getJsonInput();

    $eventId = trim($input['eventId'] ?? '');
    $userId = trim($input['userId'] ?? 'USR-102');
    $userName = trim($input['userName'] ?? 'Sophia Martinez');
    $rating = max(1, min(5, (int)($input['rating'] ?? 5)));
    $comment = trim($input['comment'] ?? '');
    $date = trim($input['date'] ?? date('Y-m-d'));

    if (empty($eventId) || empty($comment)) {
        sendError('Event ID and review comment are required', 422);
    }

    $id = 'REV-' . rand(100, 999);

    // 1. Insert Review
    $stmt = $pdo->prepare("INSERT INTO reviews (id, event_id, user_id, user_name, rating, comment, date) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$id, $eventId, $userId, $userName, $rating, $comment, $date]);

    // 2. Recalculate event rating aggregate & count
    $avgStmt = $pdo->prepare("SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews FROM reviews WHERE event_id = ?");
    $avgStmt->execute([$eventId]);
    $stats = $avgStmt->fetch();

    $newRating = round((float)$stats['avg_rating'], 2);
    $reviewCount = (int)$stats['total_reviews'];

    $upEvent = $pdo->prepare("UPDATE events SET rating = ?, review_count = ? WHERE id = ?");
    $upEvent->execute([$newRating, $reviewCount, $eventId]);

    sendResponse([
        'id' => $id,
        'eventId' => $eventId,
        'rating' => $rating,
        'comment' => $comment,
        'newAverageRating' => $newRating,
        'totalReviews' => $reviewCount
    ], 201, 'Thank you! Your review has been published.');

} else {
    sendError('Method Not Allowed', 405);
}
