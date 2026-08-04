<?php
// api/gallery.php
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $tour_id = isset($_GET['tour_id']) ? intval($_GET['tour_id']) : null;
    if (!$tour_id) {
        sendResponse(false, [], 'tour_id is required', 400);
    }
    $stmt = $pdo->prepare("SELECT * FROM gallery WHERE tour_id = ? ORDER BY uploaded_at DESC");
    $stmt->execute([$tour_id]);
    $images = $stmt->fetchAll();
    sendResponse(true, $images);
} elseif ($method === 'POST') {
    requireAdmin();
    $tour_id = intval($_POST['tour_id'] ?? 0);
    $caption = trim($_POST['caption'] ?? '');

    if (!$tour_id) {
        sendResponse(false, null, 'Tour ID is required', 400);
    }

    if (!isset($_FILES['images'])) {
        sendResponse(false, null, 'No image file uploaded', 400);
    }

    $uploadDir = __DIR__ . '/../uploads/gallery/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    $uploadedCount = 0;

    $files = $_FILES['images'];
    $fileList = [];
    if (is_array($files['name'])) {
        foreach ($files['name'] as $idx => $name) {
            $fileList[] = [
                'name' => $files['name'][$idx],
                'type' => $files['type'][$idx],
                'tmp_name' => $files['tmp_name'][$idx],
                'error' => $files['error'][$idx],
                'size' => $files['size'][$idx]
            ];
        }
    } else {
        $fileList[] = $files;
    }

    foreach ($fileList as $file) {
        if ($file['error'] === UPLOAD_ERR_OK) {
            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (in_array($ext, $allowed)) {
                $fileName = 'tour_' . $tour_id . '_' . time() . '_' . uniqid() . '.' . $ext;
                $targetFile = $uploadDir . $fileName;
                if (move_uploaded_file($file['tmp_name'], $targetFile)) {
                    $relPath = 'uploads/gallery/' . $fileName;
                    $stmt = $pdo->prepare("INSERT INTO gallery (tour_id, image_path, caption) VALUES (?, ?, ?)");
                    $stmt->execute([$tour_id, $relPath, $caption]);
                    $uploadedCount++;
                }
            }
        }
    }

    if ($uploadedCount > 0) {
        sendResponse(true, ['count' => $uploadedCount], "$uploadedCount image(s) uploaded successfully");
    } else {
        sendResponse(false, null, 'Failed to upload images. Check file type and size.', 400);
    }
} elseif ($method === 'DELETE') {
    requireAdmin();
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        sendResponse(false, null, 'Invalid Image ID', 400);
    }
    $stmt = $pdo->prepare("SELECT image_path FROM gallery WHERE id = ?");
    $stmt->execute([$id]);
    $img = $stmt->fetch();
    if ($img && !empty($img['image_path'])) {
        $filePath = __DIR__ . '/../' . $img['image_path'];
        if (file_exists($filePath)) {
            @unlink($filePath);
        }
    }
    $stmt = $pdo->prepare("DELETE FROM gallery WHERE id = ?");
    $stmt->execute([$id]);
    sendResponse(true, null, 'Image deleted successfully');
}
