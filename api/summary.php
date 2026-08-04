<?php
// api/summary.php - Financial Summary & Accounting Calculation Engine
require_once __DIR__ . '/../config/database.php';

$tour_id = isset($_GET['tour_id']) ? intval($_GET['tour_id']) : null;

if (!$tour_id) {
    sendResponse(false, null, 'tour_id is required', 400);
}

// 1. Fetch Tour Info
$stmtTour = $pdo->prepare("SELECT * FROM tours WHERE id = ?");
$stmtTour->execute([$tour_id]);
$tour = $stmtTour->fetch();

if (!$tour) {
    sendResponse(false, null, 'Tour not found', 404);
}

// 2. Fetch Members with total deposits AND out-of-pocket expenses
$stmtMembers = $pdo->prepare("
    SELECT m.*, 
           COALESCE(c_sum.total_collections, 0) AS total_deposits,
           COALESCE(e_sum.total_out_of_pocket, 0) AS total_out_of_pocket,
           (COALESCE(c_sum.total_collections, 0) + COALESCE(e_sum.total_out_of_pocket, 0)) AS total_paid
    FROM members m
    LEFT JOIN (
        SELECT member_id, SUM(amount) AS total_collections 
        FROM collections 
        WHERE tour_id = ? 
        GROUP BY member_id
    ) c_sum ON m.id = c_sum.member_id
    LEFT JOIN (
        SELECT paid_by_member_id, SUM(amount) AS total_out_of_pocket 
        FROM expenses 
        WHERE tour_id = ? AND paid_by_member_id IS NOT NULL 
        GROUP BY paid_by_member_id
    ) e_sum ON m.id = e_sum.paid_by_member_id
    WHERE m.tour_id = ?
    ORDER BY m.name ASC
");
$stmtMembers->execute([$tour_id, $tour_id, $tour_id]);
$members = $stmtMembers->fetchAll();

$memberCount = count($members);

// 3. Fetch Total Collections across tour (from central deposits)
$stmtCollSum = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) AS total_collections FROM collections WHERE tour_id = ?");
$stmtCollSum->execute([$tour_id]);
$totalCollections = floatval($stmtCollSum->fetch()['total_collections']);

// 4. Fetch Total Expenses across tour
$stmtExpSum = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM expenses WHERE tour_id = ?");
$stmtExpSum->execute([$tour_id]);
$totalExpenses = floatval($stmtExpSum->fetch()['total_expenses']);

// 5. Category Breakdown of Expenses
$stmtCatBreakdown = $pdo->prepare("
    SELECT category, COALESCE(SUM(amount), 0) AS total_amount, COUNT(id) AS count
    FROM expenses
    WHERE tour_id = ?
    GROUP BY category
    ORDER BY total_amount DESC
");
$stmtCatBreakdown->execute([$tour_id]);
$categoryBreakdown = $stmtCatBreakdown->fetchAll();

// 6. Fetch Total Donations
$stmtDonSum = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) AS total_donations FROM donations WHERE tour_id = ?");
$stmtDonSum->execute([$tour_id]);
$totalDonations = floatval($stmtDonSum->fetch()['total_donations']);

// 7. Calculate Core Financial Metrics
$netGroupCost = max(0, $totalExpenses - $totalDonations);
$perPersonShare = ($memberCount > 0) ? ($netGroupCost / $memberCount) : 0.00;

// Total Out of Pocket Expenses paid by members directly
$stmtOutSum = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) AS total_out FROM expenses WHERE tour_id = ? AND paid_by_member_id IS NOT NULL");
$stmtOutSum->execute([$tour_id]);
$totalOutOfPocket = floatval($stmtOutSum->fetch()['total_out']);

$fundBalance = ($totalCollections + $totalOutOfPocket + $totalDonations) - $totalExpenses; // Net cash remaining in pool (Collections + Out-of-Pocket + Donations - Expenses)

// 8. Individual Member Breakdown
$memberAudit = [];
foreach ($members as $m) {
    $deposits = floatval($m['total_deposits']);
    $outOfPocket = floatval($m['total_out_of_pocket']);
    $totalPaid = $deposits + $outOfPocket;
    
    $netBalance = $totalPaid - $perPersonShare;
    
    $status = 'settled';
    if ($netBalance > 0.009) {
        $status = 'refund';
    } elseif ($netBalance < -0.009) {
        $status = 'due';
    }

    $memberAudit[] = [
        'id' => intval($m['id']),
        'name' => $m['name'],
        'phone' => $m['phone'],
        'role' => $m['role'],
        'total_deposits' => round($deposits, 2),
        'total_out_of_pocket' => round($outOfPocket, 2),
        'total_paid' => round($totalPaid, 2),
        'required_share' => round($perPersonShare, 2),
        'net_balance' => round($netBalance, 2),
        'status' => $status,
        'abs_diff' => round(abs($netBalance), 2)
    ];
}

// 8. Fetch Out of Pocket Expenses List
$stmtOutExpenses = $pdo->prepare("
    SELECT e.*, m.name AS paid_by_member_name
    FROM expenses e
    JOIN members m ON e.paid_by_member_id = m.id
    WHERE e.tour_id = ? AND e.paid_by_member_id IS NOT NULL
    ORDER BY e.expense_date DESC, e.id DESC
");
$stmtOutExpenses->execute([$tour_id]);
$outOfPocketExpenses = $stmtOutExpenses->fetchAll();

sendResponse(true, [
    'tour' => $tour,
    'member_count' => $memberCount,
    'total_collections' => round($totalCollections, 2),
    'total_expenses' => round($totalExpenses, 2),
    'total_donations' => round($totalDonations, 2),
    'total_out_of_pocket' => round($totalOutOfPocket, 2),
    'net_group_cost' => round($netGroupCost, 2),
    'per_person_share' => round($perPersonShare, 2),
    'fund_balance' => round($fundBalance, 2),
    'category_breakdown' => $categoryBreakdown,
    'member_audit' => $memberAudit,
    'out_of_pocket_expenses' => $outOfPocketExpenses
]);
