<?php
// api/expenses.php
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $tour_id = isset($_GET['tour_id']) ? intval($_GET['tour_id']) : null;
    if (!$tour_id) {
        sendResponse(false, [], 'tour_id is required', 400);
    }
    $stmt = $pdo->prepare("
        SELECT e.*, m.name AS paid_by_member_name
        FROM expenses e
        LEFT JOIN members m ON e.paid_by_member_id = m.id
        WHERE e.tour_id = ?
        ORDER BY e.expense_date DESC, e.id DESC
    ");
    $stmt->execute([$tour_id]);
    $expenses = $stmt->fetchAll();
    sendResponse(true, $expenses);
} elseif ($method === 'POST') {
    requireAdmin();
    $tour_id = intval($_POST['tour_id'] ?? 0);
    $category = trim($_POST['category'] ?? 'General');
    $title = trim($_POST['title'] ?? '');
    $amount = floatval($_POST['amount'] ?? 0);
    $paid_by_member_id = (!empty($_POST['paid_by_member_id']) && intval($_POST['paid_by_member_id']) > 0) ? intval($_POST['paid_by_member_id']) : null;
    $expense_date = $_POST['expense_date'] ?? date('Y-m-d');
    $notes = trim($_POST['notes'] ?? '');
    
    if (!$tour_id && empty($_POST)) {
        $input = json_decode(file_get_contents('php://input'), true);
        $tour_id = intval($input['tour_id'] ?? 0);
        $category = trim($input['category'] ?? 'General');
        $title = trim($input['title'] ?? '');
        $amount = floatval($input['amount'] ?? 0);
        $paid_by_member_id = (!empty($input['paid_by_member_id']) && intval($input['paid_by_member_id']) > 0) ? intval($input['paid_by_member_id']) : null;
        $expense_date = $input['expense_date'] ?? date('Y-m-d');
        $notes = trim($input['notes'] ?? '');
    }

    if (!$tour_id || empty($title) || $amount <= 0) {
        sendResponse(false, null, 'Tour ID, Expense Title, and valid Amount are required', 400);
    }

    $receipt_image = null;
    if (isset($_FILES['receipt_image']) && $_FILES['receipt_image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/../uploads/receipts/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $ext = pathinfo($_FILES['receipt_image']['name'], PATHINFO_EXTENSION);
        $fileName = 'receipt_' . time() . '_' . uniqid() . '.' . strtolower($ext);
        $targetFile = $uploadDir . $fileName;
        
        $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        if (in_array(strtolower($ext), $allowed)) {
            if (move_uploaded_file($_FILES['receipt_image']['tmp_name'], $targetFile)) {
                $receipt_image = 'uploads/receipts/' . $fileName;
            }
        }
    }

    $id = intval($input['id'] ?? $_POST['id'] ?? 0);

    if ($id > 0) {
        $stmt = $pdo->prepare("UPDATE expenses SET category = ?, title = ?, amount = ?, paid_by_member_id = ?, expense_date = ?, notes = ? WHERE id = ?");
        $stmt->execute([$category, $title, $amount, $paid_by_member_id, $expense_date, $notes, $id]);
        sendResponse(true, ['id' => $id], 'Expense updated successfully');
    } else {
        $stmt = $pdo->prepare("INSERT INTO expenses (tour_id, category, title, amount, paid_by_member_id, expense_date, notes, receipt_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$tour_id, $category, $title, $amount, $paid_by_member_id, $expense_date, $notes, $receipt_image]);
        $newId = getLastInsertId($pdo, 'expenses_id_seq');
        sendResponse(true, ['id' => $newId], 'Expense recorded successfully');
    }
} elseif ($method === 'DELETE') {
    requireAdmin();
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) {
        sendResponse(false, null, 'Invalid Expense ID', 400);
    }
    $stmt = $pdo->prepare("SELECT receipt_image FROM expenses WHERE id = ?");
    $stmt->execute([$id]);
    $expense = $stmt->fetch();
    if ($expense && !empty($expense['receipt_image'])) {
        $filePath = __DIR__ . '/../' . $expense['receipt_image'];
        if (file_exists($filePath)) {
            @unlink($filePath);
        }
    }

    $stmt = $pdo->prepare("DELETE FROM expenses WHERE id = ?");
    $stmt->execute([$id]);
    sendResponse(true, null, 'Expense deleted successfully');
}
