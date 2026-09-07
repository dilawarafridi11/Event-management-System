<?php
/**
 * EVENTIFY — Bookings API: Index & Transactional Checkout Engine
 * Endpoint: GET/POST /api/bookings/index.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $userId = $_GET['user_id'] ?? null;
    $userEmail = $_GET['user_email'] ?? null;
    $status = $_GET['status'] ?? null;
    $eventId = $_GET['event_id'] ?? null;

    $sql = "SELECT * FROM bookings WHERE 1=1";
    $params = [];

    if (!empty($userId)) {
        $sql .= " AND user_id = ?";
        $params[] = $userId;
    } elseif (!empty($userEmail)) {
        $sql .= " AND user_email = ?";
        $params[] = $userEmail;
    }

    if (!empty($status) && $status !== 'All') {
        $sql .= " AND booking_status = ?";
        $params[] = $status;
    }

    if (!empty($eventId)) {
        $sql .= " AND event_id = ?";
        $params[] = $eventId;
    }

    $sql .= " ORDER BY booking_date DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $bookings = $stmt->fetchAll();

    $formatted = array_map(function($b) {
        return [
            'id' => $b['id'],
            'userId' => $b['user_id'],
            'userName' => $b['user_name'],
            'userEmail' => $b['user_email'],
            'eventId' => $b['event_id'],
            'eventTitle' => $b['event_title'],
            'eventDate' => $b['event_date'],
            'eventTime' => $b['event_time'],
            'venue' => $b['venue'],
            'tickets' => (int)$b['tickets'],
            'tierName' => $b['tier_name'] ?? 'General Admission',
            'ticketPrice' => (float)$b['ticket_price'],
            'discountAmount' => (float)$b['discount_amount'],
            'promoCode' => $b['promo_code'],
            'totalAmount' => (float)$b['total_amount'],
            'paymentStatus' => $b['payment_status'],
            'bookingStatus' => $b['booking_status'],
            'paymentMethod' => $b['payment_method'],
            'checkInStatus' => $b['check_in_status'],
            'checkedInAt' => $b['checked_in_at'],
            'bookingDate' => $b['booking_date'],
            'qrCodeData' => $b['qr_code_data'],
            'attendeeImage' => $b['attendee_image'] ?? '',
            'guests' => !empty($b['guests_json']) ? json_decode($b['guests_json'], true) : null
        ];
    }, $bookings);

    sendResponse($formatted, 200);

} elseif ($method === 'POST') {
    // Transactional Booking Checkout
    $input = getJsonInput();

    $userId = trim($input['userId'] ?? 'USR-102');
    $userName = trim($input['userName'] ?? 'Sophia Martinez');
    $userEmail = trim($input['userEmail'] ?? 'user@eventify.com');
    $attendeeImage = trim($input['attendeeImage'] ?? '');
    $eventId = trim($input['eventId'] ?? '');
    $tickets = max(1, (int)($input['tickets'] ?? 1));
    $tierName = trim($input['tierName'] ?? 'General Admission');
    $unitPrice = (float)($input['ticketPrice'] ?? 0.0);
    $discountAmount = (float)($input['discountAmount'] ?? 0.0);
    $promoCode = !empty($input['promoCode']) ? trim($input['promoCode']) : null;
    $paymentMethod = trim($input['paymentMethod'] ?? 'Credit Card');

    if (empty($eventId)) {
        sendError('Event ID is required', 422);
    }

    // If no custom image provided, fallback to attendee user avatar
    if (empty($attendeeImage) && !empty($userId)) {
        $uStmt = $pdo->prepare("SELECT avatar FROM users WHERE id = ? LIMIT 1");
        $uStmt->execute([$userId]);
        $uRow = $uStmt->fetch();
        if ($uRow && !empty($uRow['avatar'])) {
            $attendeeImage = $uRow['avatar'];
        }
    }

    try {
        $pdo->beginTransaction();

        // 1. Lock event row to prevent race conditions & overselling
        $lockStmt = $pdo->prepare("SELECT * FROM events WHERE id = ? FOR UPDATE");
        $lockStmt->execute([$eventId]);
        $event = $lockStmt->fetch();

        if (!$event) {
            $pdo->rollBack();
            sendError('Event not found', 404);
        }

        $availableSeats = (int)$event['capacity'] - (int)$event['booked_seats'];
        if ($availableSeats < $tickets) {
            $pdo->rollBack();
            sendError("Only {$availableSeats} seat(s) remaining for this event.", 409);
        }

        // 2. Validate & calculate pricing
        if ($unitPrice <= 0) {
            $unitPrice = (float)$event['ticket_price'];
        }
        $subtotal = $unitPrice * $tickets;
        $totalAmount = max(0, $subtotal - $discountAmount);

        // 3. Generate Booking ID & QR Token
        $bookingId = 'BKG-' . rand(8000, 9999);
        $qrCodeData = 'EVTIFY-' . $bookingId . '-' . strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $userName)) . '-' . $eventId . '-' . $tickets . 'TIX';
        $bookingDate = date('Y-m-d H:i:s');

        $guests = $input['guests'] ?? null;
        $guestsJson = !empty($guests) ? (is_string($guests) ? $guests : json_encode($guests)) : null;

        // 4. Insert Booking
        $insStmt = $pdo->prepare("INSERT INTO bookings (id, user_id, user_name, user_email, attendee_image, guests_json, event_id, event_title, event_date, event_time, venue, tickets, tier_name, ticket_price, discount_amount, promo_code, total_amount, payment_status, booking_status, payment_method, check_in_status, booking_date, qr_code_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Paid', 'Confirmed', ?, 'Pending', ?, ?)");
        $insStmt->execute([
            $bookingId,
            $userId,
            $userName,
            $userEmail,
            $attendeeImage,
            $guestsJson,
            $event['id'],
            $event['title'],
            $event['date'],
            $event['start_time'] . ' - ' . $event['end_time'],
            $event['venue'],
            $tickets,
            $tierName,
            $unitPrice,
            $discountAmount,
            $promoCode,
            $totalAmount,
            $paymentMethod,
            $bookingDate,
            $qrCodeData
        ]);

        // 5. Increment booked seats in Event
        $upEvent = $pdo->prepare("UPDATE events SET booked_seats = booked_seats + ? WHERE id = ?");
        $upEvent->execute([$tickets, $eventId]);

        // 6. Increment user events_booked count
        $upUser = $pdo->prepare("UPDATE users SET events_booked = events_booked + 1 WHERE id = ?");
        $upUser->execute([$userId]);

        // 7. Update promo usage count if promo code was provided
        if (!empty($promoCode)) {
            $upPromo = $pdo->prepare("UPDATE promos SET uses_count = uses_count + 1 WHERE code = ?");
            $upPromo->execute([$promoCode]);
        }

        // 8. Create user confirmation notification
        $notifId = 'NOTIF-' . rand(100, 999);
        $notifStmt = $pdo->prepare("INSERT INTO notifications (id, user_id, title, message, time_ago, is_read, type, icon) VALUES (?, ?, 'Booking Confirmed!', ?, 'Just now', 0, 'success', '<i class=\'fa-solid fa-check\'></i>')");
        $notifStmt->execute([
            $notifId,
            $userId,
            "Your {$tickets} ticket(s) for {$event['title']} have been confirmed. Digital QR pass is ready."
        ]);

        $pdo->commit();

        sendResponse([
            'bookingId' => $bookingId,
            'qrCodeData' => $qrCodeData,
            'totalAmount' => $totalAmount,
            'eventTitle' => $event['title'],
            'eventDate' => $event['date'],
            'eventTime' => $event['start_time'] . ' - ' . $event['end_time'],
            'venue' => $event['venue'],
            'tickets' => $tickets,
            'tierName' => $tierName
        ], 201, 'Booking reserved successfully');

    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        sendError('Transaction failed: ' . $e->getMessage(), 500);
    }

} else {
    sendError('Method Not Allowed', 405);
}
