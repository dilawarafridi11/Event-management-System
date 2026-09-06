<?php
/**
 * EVENTIFY — Promos API: Validation, List, Create, Delete
 * Endpoint: GET/POST/DELETE /api/promos/index.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // 1. Promo Validation Handler
    if (isset($_GET['validate'])) {
        $code = strtoupper(trim($_GET['validate']));
        $subtotal = (float)($_GET['subtotal'] ?? 0);

        $stmt = $pdo->prepare("SELECT * FROM promos WHERE UPPER(code) = ? LIMIT 1");
        $stmt->execute([$code]);
        $promo = $stmt->fetch();

        if (!$promo) {
            http_response_code(404);
            echo json_encode(['success' => false, 'valid' => false, 'message' => "Promo code '{$code}' is invalid or does not exist."]);
            exit;
        }

        if (!$promo['active']) {
            http_response_code(400);
            echo json_encode(['success' => false, 'valid' => false, 'message' => "Promo code '{$code}' has been disabled."]);
            exit;
        }

        if (!empty($promo['expiry_date']) && strtotime($promo['expiry_date']) < strtotime(date('Y-m-d'))) {
            http_response_code(400);
            echo json_encode(['success' => false, 'valid' => false, 'message' => "Promo code '{$code}' has expired."]);
            exit;
        }

        if ($subtotal < (float)$promo['min_purchase']) {
            http_response_code(400);
            echo json_encode(['success' => false, 'valid' => false, 'message' => "Minimum purchase of $" . number_format($promo['min_purchase'], 2) . " required to use this code."]);
            exit;
        }

        // Calculate discount
        $discountAmount = 0;
        if ($promo['discount_type'] === 'percent') {
            $discountAmount = round(($subtotal * (float)$promo['discount_value']) / 100, 2);
        } else {
            $discountAmount = min($subtotal, (float)$promo['discount_value']);
        }

        sendResponse([
            'valid' => true,
            'code' => $promo['code'],
            'discountType' => $promo['discount_type'],
            'discountValue' => (float)$promo['discount_value'],
            'discountAmount' => $discountAmount,
            'description' => $promo['description'],
            'newTotal' => max(0, $subtotal - $discountAmount)
        ], 200, "Promo code applied! You save $" . number_format($discountAmount, 2));
    }

    // 2. List all promos
    $stmt = $pdo->query("SELECT * FROM promos ORDER BY created_at DESC");
    $promos = $stmt->fetchAll();

    $formatted = array_map(function($p) {
        return [
            'id' => (int)$p['id'],
            'code' => $p['code'],
            'discountType' => $p['discount_type'],
            'discountValue' => (float)$p['discount_value'],
            'description' => $p['description'],
            'minPurchase' => (float)$p['min_purchase'],
            'active' => (bool)$p['active'],
            'expiryDate' => $p['expiry_date'],
            'usesCount' => (int)$p['uses_count']
        ];
    }, $promos);

    sendResponse($formatted, 200);

} elseif ($method === 'POST') {
    $input = getJsonInput();

    // Check for delete action via POST
    if (isset($input['action']) && $input['action'] === 'delete') {
        $id = $input['id'] ?? null;
        $code = $input['code'] ?? null;
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM promos WHERE id = ?");
            $stmt->execute([$id]);
        } elseif ($code) {
            $stmt = $pdo->prepare("DELETE FROM promos WHERE UPPER(code) = UPPER(?)");
            $stmt->execute([$code]);
        }
        sendResponse(null, 200, 'Promo code deleted successfully');
    }

    $code = strtoupper(trim($input['code'] ?? ''));
    $discountType = in_array($input['discountType'] ?? '', ['percent', 'fixed']) ? $input['discountType'] : 'percent';
    $discountValue = (float)($input['discountValue'] ?? 0);
    $description = trim($input['description'] ?? '');
    $minPurchase = (float)($input['minPurchase'] ?? 0);
    $expiryDate = !empty($input['expiryDate']) ? $input['expiryDate'] : '2026-12-31';

    if (empty($code) || $discountValue <= 0) {
        sendError('Valid promo code and discount value are required', 422);
    }

    $stmt = $pdo->prepare("INSERT INTO promos (code, discount_type, discount_value, description, min_purchase, active, expiry_date, uses_count) VALUES (?, ?, ?, ?, ?, 1, ?, 0) ON DUPLICATE KEY UPDATE discount_type = VALUES(discount_type), discount_value = VALUES(discount_value), description = VALUES(description), min_purchase = VALUES(min_purchase), active = 1");
    $stmt->execute([$code, $discountType, $discountValue, $description, $minPurchase, $expiryDate]);

    sendResponse(['code' => $code], 201, 'Promo code saved successfully');

} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    $code = $_GET['code'] ?? null;

    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM promos WHERE id = ?");
        $stmt->execute([$id]);
    } elseif ($code) {
        $stmt = $pdo->prepare("DELETE FROM promos WHERE UPPER(code) = UPPER(?)");
        $stmt->execute([$code]);
    } else {
        sendError('ID or Code required', 400);
    }

    sendResponse(null, 200, 'Promo code deleted successfully');
} else {
    sendError('Method Not Allowed', 405);
}
