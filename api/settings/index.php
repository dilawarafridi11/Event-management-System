<?php
/**
 * EVENTIFY — Platform Settings API
 * Endpoint: GET/POST /api/settings/index.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

$pdo = Database::getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings");
    $rawSettings = $stmt->fetchAll();

    $settings = [];
    foreach ($rawSettings as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }

    sendResponse($settings, 200);

} elseif ($method === 'POST') {
    $input = getJsonInput();

    if (empty($input)) {
        sendError('No settings data provided', 400);
    }

    $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");

    foreach ($input as $key => $val) {
        $strVal = is_bool($val) ? ($val ? 'true' : 'false') : (string)$val;
        $stmt->execute([$key, $strVal]);
    }

    sendResponse(null, 200, 'Platform settings saved successfully');

} else {
    sendError('Method Not Allowed', 405);
}
