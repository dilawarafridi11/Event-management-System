<?php
/**
 * EVENTIFY — Gate Scanner API: Attendee Check-In & Verification
 * Endpoint: POST /api/bookings/checkin.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method Not Allowed', 405);
}

$input = getJsonInput();
$code = trim($input['code'] ?? $input['ticketCode'] ?? $input['id'] ?? '');

if (empty($code)) {
    sendError('Ticket code or QR pass data is required', 422);
}

$pdo = Database::getConnection();

// Search booking by ID or QR code data string
$stmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ? OR qr_code_data = ? LIMIT 1");
$stmt->execute([$code, $code]);
$booking = $stmt->fetch();

if (!$booking) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'status' => 'NOT_FOUND',
        'message' => 'Invalid or unrecognized ticket pass. No matching booking record found.',
        'code' => $code
    ]);
    exit;
}

// Check if booking was cancelled
if ($booking['booking_status'] === 'Cancelled') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'status' => 'CANCELLED',
        'message' => 'Admission Denied: This booking has been cancelled and refunded.',
        'booking' => [
            'id' => $booking['id'],
            'userName' => $booking['user_name'],
            'eventTitle' => $booking['event_title'],
            'bookingStatus' => $booking['booking_status']
        ]
    ]);
    exit;
}

// Check if already checked in (Duplicate check-in prevention)
if ($booking['check_in_status'] === 'Checked-In') {
    http_response_code(409);
    echo json_encode([
        'success' => false,
        'status' => 'ALREADY_CHECKED_IN',
        'message' => 'Duplicate Scan! This admission pass was already checked in.',
        'booking' => [
            'id' => $booking['id'],
            'userName' => $booking['user_name'],
            'eventTitle' => $booking['event_title'],
            'tierName' => $booking['tier_name'],
            'tickets' => (int)$booking['tickets'],
            'checkedInAt' => $booking['checked_in_at'] ?? 'Previously'
        ]
    ]);
    exit;
}

// Perform Check-in
$checkInTime = date('Y-m-d H:i:s');
$upStmt = $pdo->prepare("UPDATE bookings SET check_in_status = 'Checked-In', checked_in_at = ? WHERE id = ?");
$upStmt->execute([$checkInTime, $booking['id']]);

sendResponse([
    'status' => 'VALID',
    'booking' => [
        'id' => $booking['id'],
        'userName' => $booking['user_name'],
        'userEmail' => $booking['user_email'],
        'eventId' => $booking['event_id'],
        'eventTitle' => $booking['event_title'],
        'eventDate' => $booking['event_date'],
        'eventTime' => $booking['event_time'],
        'venue' => $booking['venue'],
        'tierName' => $booking['tier_name'] ?? 'General Admission',
        'tickets' => (int)$booking['tickets'],
        'checkInStatus' => 'Checked-In',
        'checkedInAt' => $checkInTime
    ]
], 200, 'Admission Approved — Valid Pass');
