<?php
// api/donations.php
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $tour_id = isset($_GET['tour_id']) ? intval($_GET['tour_id']) : null;
    if (!$tour_id) {
        sendResponse(false, [], 'tour_id is required', 400);
    }
    $stmt = $pdo->prepare("SELECT * FROM donations WHERE tour_id = ? ORDER BY donation_date DESC, id DESC");
    $stmt->execute([$tour_id]);
    $donations = $stmt->fetchAll();
    sendResponse(true, $donations);
} elseif ($method === 'POST') {
    requireAdmin();
    $input = json_decode(file_get_contents('php://input'), true);

    $tour_id = intval($input['tour_id'] ?? $_POST['tour_id'] ?? 0);
    $donor_name = trim($input['donor_name'] ?? $_POST['donor_name'] ?? '');
    $amount = floatval($input['amount'] ?? $_POST['amount'] ?? 0);
    $donation_date = $input['donation_date'] ?? $_POST['donation_date'] ?? date('Y-m-d');
    $notes = trim($input['notes'] ?? $_POST['notes'] ?? '');

    if (!$tour_id || empty($donor_name) || $amount <= 0) {
        sendResponse(false, null, 'Tour ID, Donor Name, and valid Amount are required', 400);
    }

    $stmt = $pdo->prepare("INSERT INTO donations (tour_id, donor_name, amount, donation_date, notes) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$tour_id, $donor_name, $amount, $donation_date, $notes]);
    $newId = getLastInsertId($pdo, 'donations_id_seq');
    sendResponse(true, ['id' => $newId], 'Donation recorded successfully');
} elseif ($method === 'DELETE') {
    requireAdmin();
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        sendResponse(false, null, 'Invalid Donation ID', 400);
    }
    $stmt = $pdo->prepare("DELETE FROM donations WHERE id = ?");
    $stmt->execute([$id]);
    sendResponse(true, null, 'Donation entry deleted');
}
