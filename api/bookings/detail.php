<?php
/**
 * EVENTIFY — Single Booking API: View & Cancellation
 * Endpoint: GET/PUT/DELETE /api/bookings/detail.php?id=BKG-XXXX
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
    sendError('Booking ID is required', 400);
}

if ($method === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $b = $stmt->fetch();

    if (!$b) {
        sendError('Booking not found', 404);
    }

    sendResponse([
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
    ], 200);

} elseif ($method === 'PUT' || ($method === 'POST' && isset($input['action']) && $input['action'] === 'cancel')) {
    // Cancel Booking & Restore Available Seats
    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ? FOR UPDATE");
        $stmt->execute([$id]);
        $b = $stmt->fetch();

        if (!$b) {
            $pdo->rollBack();
            sendError('Booking not found', 404);
        }

        if ($b['booking_status'] === 'Cancelled') {
            $pdo->rollBack();
            sendError('This booking is already cancelled', 400);
        }

        // Update booking status
        $upStmt = $pdo->prepare("UPDATE bookings SET booking_status = 'Cancelled', payment_status = 'Refunded' WHERE id = ?");
        $upStmt->execute([$id]);

        // Restore seats in event
        $restoreStmt = $pdo->prepare("UPDATE events SET booked_seats = GREATEST(0, booked_seats - ?) WHERE id = ?");
        $restoreStmt->execute([(int)$b['tickets'], $b['event_id']]);

        // Add cancellation notification
        $notifId = 'NOTIF-' . rand(100, 999);
        $notifStmt = $pdo->prepare("INSERT INTO notifications (id, user_id, title, message, time_ago, is_read, type, icon) VALUES (?, ?, 'Booking Cancelled', ?, 'Just now', 0, 'warning', '❌')");
        $notifStmt->execute([
            $notifId,
            $b['user_id'],
            "Your booking {$b['id']} for {$b['event_title']} has been cancelled and refunded."
        ]);

        $pdo->commit();

        sendResponse(['id' => $id], 200, 'Booking cancelled and seats released');

    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        sendError('Cancellation failed: ' . $e->getMessage(), 500);
    }
} elseif ($method === 'DELETE' || ($method === 'POST' && isset($input['action']) && $input['action'] === 'delete')) {
    // Delete booking
    try {
        $del = $pdo->prepare("DELETE FROM bookings WHERE id = ?");
        $del->execute([$id]);
        sendResponse(['id' => $id], 200, 'Booking deleted successfully');
    } catch (Exception $e) {
        sendError('Delete failed: ' . $e->getMessage(), 500);
    }
} else {
    sendError('Method Not Allowed', 405);
}
