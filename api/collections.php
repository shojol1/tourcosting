<?php
// api/collections.php
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $tour_id = isset($_GET['tour_id']) ? intval($_GET['tour_id']) : null;
    if (!$tour_id) {
        sendResponse(false, [], 'tour_id is required', 400);
    }
    $stmt = $pdo->prepare("
        SELECT c.*, m.name AS member_name
        FROM collections c
        JOIN members m ON c.member_id = m.id
        WHERE c.tour_id = ?
        ORDER BY c.payment_date DESC, c.id DESC
    ");
    $stmt->execute([$tour_id]);
    $collections = $stmt->fetchAll();
    sendResponse(true, $collections);
} elseif ($method === 'POST') {
    requireAdmin();
    $input = json_decode(file_get_contents('php://input'), true);

    $tour_id = intval($input['tour_id'] ?? $_POST['tour_id'] ?? 0);
    $member_id = intval($input['member_id'] ?? $_POST['member_id'] ?? 0);
    $amount = floatval($input['amount'] ?? $_POST['amount'] ?? 0);
    $payment_date = $input['payment_date'] ?? $_POST['payment_date'] ?? date('Y-m-d');
    $payment_method = trim($input['payment_method'] ?? $_POST['payment_method'] ?? 'Cash');
    $notes = trim($input['notes'] ?? $_POST['notes'] ?? '');

    if (!$tour_id || !$member_id || $amount <= 0) {
        sendResponse(false, null, 'Tour ID, Member, and valid Amount are required', 400);
    }

    $mode = $input['mode'] ?? $_POST['mode'] ?? '';
    $id = intval($input['id'] ?? $_POST['id'] ?? 0);

    if ($mode === 'set_total') {
        $stmt = $pdo->prepare("DELETE FROM collections WHERE tour_id = ? AND member_id = ?");
        $stmt->execute([$tour_id, $member_id]);

        $stmt = $pdo->prepare("INSERT INTO collections (tour_id, member_id, amount, payment_date, payment_method, notes) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$tour_id, $member_id, $amount, $payment_date, $payment_method, 'নবায়নকৃত মোট জমা']);
        $newId = getLastInsertId($pdo, 'collections_id_seq');
        sendResponse(true, ['id' => $newId], 'সদস্যের মোট জমা সংশোধন করা হয়েছে');
    } elseif ($id > 0) {
        $stmt = $pdo->prepare("UPDATE collections SET member_id = ?, amount = ?, payment_date = ?, payment_method = ?, notes = ? WHERE id = ?");
        $stmt->execute([$member_id, $amount, $payment_date, $payment_method, $notes, $id]);
        sendResponse(true, ['id' => $id], 'Collection updated successfully');
    } else {
        $stmt = $pdo->prepare("INSERT INTO collections (tour_id, member_id, amount, payment_date, payment_method, notes) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$tour_id, $member_id, $amount, $payment_date, $payment_method, $notes]);
        $newId = getLastInsertId($pdo, 'collections_id_seq');
        sendResponse(true, ['id' => $newId], 'Payment collection recorded successfully');
    }
} elseif ($method === 'DELETE') {
    requireAdmin();
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        sendResponse(false, null, 'Invalid Collection ID', 400);
    }
    $stmt = $pdo->prepare("DELETE FROM collections WHERE id = ?");
    $stmt->execute([$id]);
    sendResponse(true, null, 'Collection entry deleted');
}
