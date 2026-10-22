<?php
// config/database.php - Supabase PostgreSQL Connection & Schema Initializer

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$host = 'db.xikfgjbhfrsctzpzartc.supabase.co';
$port = '5432';
$dbname = 'postgres';
$user = 'postgres';
$pass = 'Shojol@1122';

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=require";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    // Create PostgreSQL Tables automatically if they don't exist
    $sqlTours = "CREATE TABLE IF NOT EXISTS tours (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        start_date DATE NULL,
        end_date DATE NULL,
        budget DECIMAL(12,2) DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'active',
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );";

    $sqlMembers = "CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        tour_id INT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NULL,
        email VARCHAR(100) NULL,
        role VARCHAR(100) DEFAULT 'Member',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );";

    $sqlCollections = "CREATE TABLE IF NOT EXISTS collections (
        id SERIAL PRIMARY KEY,
        tour_id INT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
        member_id INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        amount DECIMAL(12,2) NOT NULL,
        payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
        payment_method VARCHAR(50) DEFAULT 'Cash',
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );";

    $sqlExpenses = "CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        tour_id INT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        paid_by_member_id INT NULL REFERENCES members(id) ON DELETE SET NULL,
        expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
        notes TEXT NULL,
        receipt_image VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );";

    $sqlDonations = "CREATE TABLE IF NOT EXISTS donations (
        id SERIAL PRIMARY KEY,
        tour_id INT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
        donor_name VARCHAR(255) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );";

    $sqlGallery = "CREATE TABLE IF NOT EXISTS gallery (
        id SERIAL PRIMARY KEY,
        tour_id INT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
        image_path VARCHAR(255) NOT NULL,
        caption VARCHAR(255) NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );";

    $pdo->exec($sqlTours);
    $pdo->exec($sqlMembers);
    $pdo->exec($sqlCollections);
    $pdo->exec($sqlExpenses);
    $pdo->exec($sqlDonations);
    $pdo->exec($sqlGallery);

} catch (PDOException $e) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'error' => 'Supabase Database connection failed: ' . $e->getMessage()]);
    exit;
}

function getLastInsertId($pdo, $seqName) {
    try {
        return $pdo->lastInsertId($seqName);
    } catch (Exception $ex) {
        return $pdo->lastInsertId();
    }
}

function sendResponse($success, $data = [], $message = '', $statusCode = 200) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($statusCode);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

function isAdmin() {
    $headerPin = $_SERVER['HTTP_X_ADMIN_PIN'] ?? '';
    return (isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true) || ($headerPin === 'admin123');
}

function requireAdmin() {
    if (!isAdmin()) {
        sendResponse(false, null, 'শুধুমাত্র এডমিন এই কাজটি করতে পারবেন। অনুগ্রহ করে লগইন করুন।', 403);
    }
}
