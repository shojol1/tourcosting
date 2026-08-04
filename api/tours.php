<?php
// api/tours.php
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM tours WHERE id = ?");
        $stmt->execute([$id]);
        $tour = $stmt->fetch();
        if ($tour) {
            sendResponse(true, $tour);
        } else {
            sendResponse(false, null, 'Tour not found', 404);
        }
    } else {
        $stmt = $pdo->query("SELECT * FROM tours ORDER BY created_at DESC");
        $tours = $stmt->fetchAll();
        sendResponse(true, $tours);
    }
} elseif ($method === 'POST') {
    requireAdmin();
    $input = json_decode(file_get_contents('php://input'), true);
    
    $name = trim($input['name'] ?? $_POST['name'] ?? '');
    $destination = trim($input['destination'] ?? $_POST['destination'] ?? '');
    $start_date = !empty($input['start_date'] ?? $_POST['start_date'] ?? null) ? ($input['start_date'] ?? $_POST['start_date']) : null;
    $end_date = !empty($input['end_date'] ?? $_POST['end_date'] ?? null) ? ($input['end_date'] ?? $_POST['end_date']) : null;
    $budget = floatval($input['budget'] ?? $_POST['budget'] ?? 0);
    $status = $input['status'] ?? $_POST['status'] ?? 'active';
    $description = trim($input['description'] ?? $_POST['description'] ?? '');
    $banner_image = trim($input['banner_image'] ?? $_POST['banner_image'] ?? '');

    if (empty($name) || empty($destination)) {
        sendResponse(false, null, 'Tour name and destination are required', 400);
    }

    // Handle Base64 image data string from mobile phone gallery
    if (!empty($banner_image) && strpos($banner_image, 'data:image') === 0) {
        $uploadDir = __DIR__ . '/../uploads/banners/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $parts = explode(',', $banner_image);
        $data = base64_decode(end($parts));
        $fileName = 'banner_' . time() . '_' . uniqid() . '.jpg';
        $targetFile = $uploadDir . $fileName;
        file_put_contents($targetFile, $data);
        $banner_image = 'uploads/banners/' . $fileName;
    }

    // Handle multipart file upload
    if (isset($_FILES['banner_image']) && $_FILES['banner_image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/../uploads/banners/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $ext = pathinfo($_FILES['banner_image']['name'], PATHINFO_EXTENSION);
        $fileName = 'banner_' . time() . '_' . uniqid() . '.' . strtolower($ext);
        $targetFile = $uploadDir . $fileName;
        
        $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        if (in_array(strtolower($ext), $allowed)) {
            if (move_uploaded_file($_FILES['banner_image']['tmp_name'], $targetFile)) {
                $banner_image = 'uploads/banners/' . $fileName;
            }
        }
    }

    $id = intval($input['id'] ?? $_POST['id'] ?? 0);
    if ($id > 0) {
        if (!empty($banner_image)) {
            $stmt = $pdo->prepare("UPDATE tours SET name = ?, destination = ?, start_date = ?, end_date = ?, budget = ?, status = ?, description = ?, banner_image = ? WHERE id = ?");
            $stmt->execute([$name, $destination, $start_date, $end_date, $budget, $status, $description, $banner_image, $id]);
        } else {
            $stmt = $pdo->prepare("UPDATE tours SET name = ?, destination = ?, start_date = ?, end_date = ?, budget = ?, status = ?, description = ? WHERE id = ?");
            $stmt->execute([$name, $destination, $start_date, $end_date, $budget, $status, $description, $id]);
        }
        sendResponse(true, ['id' => $id], 'Tour updated successfully');
    } else {
        $stmt = $pdo->prepare("INSERT INTO tours (name, destination, start_date, end_date, budget, status, description, banner_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $destination, $start_date, $end_date, $budget, $status, $description, $banner_image]);
        $newId = getLastInsertId($pdo, 'tours_id_seq');
        sendResponse(true, ['id' => $newId], 'Tour created successfully');
    }
} elseif ($method === 'DELETE') {
    requireAdmin();
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        sendResponse(false, null, 'Invalid Tour ID', 400);
    }
    $stmt = $pdo->prepare("DELETE FROM tours WHERE id = ?");
    $stmt->execute([$id]);
    sendResponse(true, null, 'Tour deleted successfully');
}
