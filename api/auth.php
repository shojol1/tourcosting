<?php
// api/auth.php
require_once __DIR__ . '/../config/database.php';

$action = $_GET['action'] ?? 'check';

if ($action === 'login') {
    $input = json_decode(file_get_contents('php://input'), true);
    $password = $input['password'] ?? $_POST['password'] ?? '';

    // Default admin PIN / password
    $adminPin = 'admin123';

    if ($password === $adminPin) {
        $_SESSION['is_admin'] = true;
        sendResponse(true, ['is_admin' => true], 'এডমিন হিসেবে সফলভাবে লগইন হয়েছে!');
    } else {
        sendResponse(false, null, 'ভুল এডমিন পাসওয়ার্ড! আবার চেষ্টা করুন।', 401);
    }
} elseif ($action === 'logout') {
    $_SESSION['is_admin'] = false;
    session_destroy();
    sendResponse(true, ['is_admin' => false], 'লগআউট হয়েছে');
} else {
    // Check state
    sendResponse(true, ['is_admin' => isAdmin()]);
}
