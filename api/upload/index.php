<?php
/**
 * EVENTIFY — Image Upload API
 * Endpoint: POST /api/upload/index.php
 * Handles attendee photos and event image uploads with validation and secure local storage.
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method Not Allowed', 405);
}

// Ensure target upload directory exists
$uploadDir = __DIR__ . '/../../uploads/attendees/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
$allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
$maxSizeBytes = 5 * 1024 * 1024; // 5MB

$savedFilename = null;
$fileSizeBytes = 0;

// Case 1: Standard multipart/form-data file upload
if (!empty($_FILES['image']) || !empty($_FILES['file'])) {
    $fileInfo = !empty($_FILES['image']) ? $_FILES['image'] : $_FILES['file'];

    if ($fileInfo['error'] !== UPLOAD_ERR_OK) {
        sendError('Upload failed with error code: ' . $fileInfo['error'], 400);
    }

    if ($fileInfo['size'] > $maxSizeBytes) {
        sendError('File size exceeds the 5MB limit.', 422);
    }

    $ext = strtolower(pathinfo($fileInfo['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $allowedExtensions)) {
        sendError('Invalid file type. Allowed formats: JPG, PNG, WebP.', 422);
    }

    // Verify MIME type using finfo
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $fileInfo['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedMimes)) {
        sendError('Invalid image content detected (' . htmlspecialchars($mimeType) . ').', 422);
    }

    $uniqueName = 'att_' . bin2hex(random_bytes(8)) . '.' . ($ext === 'jpeg' ? 'jpg' : $ext);
    $targetPath = $uploadDir . $uniqueName;

    if (!move_uploaded_file($fileInfo['tmp_name'], $targetPath)) {
        sendError('Failed to save uploaded file to storage directory.', 500);
    }

    $savedFilename = $uniqueName;
    $fileSizeBytes = $fileInfo['size'];

} else {
    // Case 2: JSON payload with base64 Data URL
    $input = getJsonInput();
    $rawImage = $input['image'] ?? ($input['data'] ?? '');

    if (empty($rawImage)) {
        sendError('No image file or base64 data received.', 422);
    }

    // Parse data URL (e.g. data:image/png;base64,iVBORw0KGgo...)
    if (preg_match('/^data:(image\/(jpeg|png|webp));base64,(.+)$/', $rawImage, $matches)) {
        $mimeType = $matches[1];
        $subType = $matches[2];
        $base64Data = $matches[3];
        $binaryData = base64_decode($base64Data);

        if ($binaryData === false) {
            sendError('Failed to decode base64 image data.', 422);
        }

        $fileSizeBytes = strlen($binaryData);
        if ($fileSizeBytes > $maxSizeBytes) {
            sendError('Image size exceeds the 5MB limit.', 422);
        }

        $ext = ($subType === 'jpeg') ? 'jpg' : $subType;
        $uniqueName = 'att_' . bin2hex(random_bytes(8)) . '.' . $ext;
        $targetPath = $uploadDir . $uniqueName;

        if (file_put_contents($targetPath, $binaryData) === false) {
            sendError('Failed to write image data to storage disk.', 500);
        }

        $savedFilename = $uniqueName;
    } else {
        sendError('Invalid image format. Expected multipart upload or base64 data URL.', 422);
    }
}

// Compute relative public path
$relativePath = '../uploads/attendees/' . $savedFilename;

sendResponse([
    'url' => $relativePath,
    'filename' => $savedFilename,
    'size' => $fileSizeBytes
], 201, 'Image uploaded successfully');
