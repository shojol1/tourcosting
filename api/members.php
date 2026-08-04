<?php
// api/members.php
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $tour_id = isset($_GET['tour_id']) ? intval($_GET['tour_id']) : null;
    if (!$tour_id) {
        sendResponse(false, [], 'tour_id is required', 400);
    }
    
    $stmt = $pdo->prepare("
        SELECT m.*, 
               COALESCE(SUM(c.amount), 0) AS total_paid
        FROM members m
        LEFT JOIN collections c ON m.id = c.member_id
        WHERE m.tour_id = ?
        GROUP BY m.id
        ORDER BY m.name ASC
    ");
    $stmt->execute([$tour_id]);
    $members = $stmt->fetchAll();
    sendResponse(true, $members);
} elseif ($method === 'POST') {
    requireAdmin();
    $input = json_decode(file_get_contents('php://input'), true);

    $tour_id = intval($input['tour_id'] ?? $_POST['tour_id'] ?? 0);
    $name = trim($input['name'] ?? $_POST['name'] ?? '');
    $phone = trim($input['phone'] ?? $_POST['phone'] ?? '');
    $email = trim($input['email'] ?? $_POST['email'] ?? '');
    $role = trim($input['role'] ?? $_POST['role'] ?? 'Member');
    $id = intval($input['id'] ?? $_POST['id'] ?? 0);

    if (!$tour_id || empty($name)) {
        sendResponse(false, null, 'Tour ID and Member Name are required', 400);
    }

    if ($id > 0) {
        $stmt = $pdo->prepare("UPDATE members SET name = ?, phone = ?, email = ?, role = ? WHERE id = ? AND tour_id = ?");
        $stmt->execute([$name, $phone, $email, $role, $id, $tour_id]);
        sendResponse(true, ['id' => $id], 'Member updated successfully');
    } else {
        $stmt = $pdo->prepare("INSERT INTO members (tour_id, name, phone, email, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$tour_id, $name, $phone, $email, $role]);
        $newId = getLastInsertId($pdo, 'members_id_seq');
        sendResponse(true, ['id' => $newId], 'Member added successfully');
    }
} elseif ($method === 'DELETE') {
    requireAdmin();
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        sendResponse(false, null, 'Invalid Member ID', 400);
    }
    $stmt = $pdo->prepare("DELETE FROM members WHERE id = ?");
    $stmt->execute([$id]);
    sendResponse(true, null, 'Member removed successfully');
}
