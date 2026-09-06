<?php
/**
 * EVENTIFY — API Response Helpers & Request Parsers
 */

function sendResponse($data = null, $statusCode = 200, $message = 'Success') {
    http_response_code($statusCode);
    echo json_encode([
        'success' => $statusCode >= 200 && $statusCode < 300,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function sendError($message = 'An error occurred', $statusCode = 400, $errors = null) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'message' => $message,
        'errors' => $errors
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function getJsonInput() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function generateId($prefix = 'ID') {
    return $prefix . '-' . rand(1000, 9999);
}
