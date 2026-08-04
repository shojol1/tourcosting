<?php
// index.php - Main Single Page Web Application
require_once __DIR__ . '/config/database.php';
?>
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TourCosting - ট্যুর খরচ ও কালেকশন ম্যানেজার</title>
    
    <!-- Google Fonts & SolaimanLipi Bengali Font CDN -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.maateen.me/solaiman-lipi/font.css">
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/style.css">

    <!-- html2pdf Library CDN for instant client-side PDF export -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
</head>
<body>

    <!-- Header & Navigation Bar (matching Android Toolbar) -->
    <header class="app-header">
        <div class="container header-content">
            <a href="index.php" class="logo">
                <div class="logo-icon">✈️</div>
                <div class="logo-text">
                    <h1>TourCosting</h1>
                    <span>ট্যুর খরচ, কস্টিং ও মেমোরি ট্র্যাকার</span>
                </div>
            </a>

            <div class="tour-controls">
                <button id="themeToggleBtn" class="btn btn-secondary btn-sm" onclick="toggleTheme()">🌙 ডার্ক</button>
                <span id="authBadge" class="badge badge-viewer">👁️ ভিউয়ার</span>
                
                <select id="tourSelect" class="custom-select">
                    <option value="">-- লোড হচ্ছে... --</option>
                </select>
                
                <button class="btn btn-primary btn-sm admin-only" data-modal="modalNewTour">+ নতুন ট্যুর</button>
                
                <button id="authBtn" class="btn btn-secondary btn-sm" onclick="handleAuthBtnClick()">🔐 এডমিন</button>
            </div>
        </div>

        <!-- Tab Bar (matching Android TabLayout - scrollable with indicator) -->
        <div class="app-tabs-container" id="mainTabBar" style="display:none;">
            <div class="container">
                <div class="app-tabs">
                    <button class="tab-btn active" data-tab="tabDashboard">📊 ওভারভিউ</button>
                    <button class="tab-btn" data-tab="tabMembers">👥 সদস্য ও জমা</button>
                    <button class="tab-btn" data-tab="tabExpenses">💸 খরচের হিসাব</button>
                    <button class="tab-btn" data-tab="tabDonations">🎁 ডোনেশন</button>
                    <button class="tab-btn" data-tab="tabGallery">📸 ফটো অ্যালবাম</button>
                    <button class="tab-btn" data-tab="tabReport">📑 হিসাব ও PDF</button>
                </div>
            </div>
        </div>
    </header>

    <main class="container" style="flex:1;">
        
        <!-- Empty State (No Tour Selected or Existing) -->
        <div id="emptyState" class="card" style="display:none; text-align:center; padding:4rem 1.5rem; margin-top:2rem;">
            <div style="font-size:3rem; margin-bottom:1rem;">⛵</div>
            <h2 style="margin-bottom:0.5rem; color:var(--text-primary);">কোন সক্রিয় ট্যুর পাওয়া যায়নি</h2>
            <p style="color:var(--text-muted); margin:0.5rem 0 1.5rem;">আপনার বন্ধুদের সাথে নতুন ভ্রমণের কস্টিং ও কালেকশন শুরু করতে এডমিন মোডে নতুন ট্যুর তৈরি করুন।</p>
            <button class="btn btn-primary admin-only" data-modal="modalNewTour">+ নতুন ট্যুর তৈরি করুন</button>
        </div>

        <!-- Tour Content Area -->
        <div id="tourContentArea" style="display:none;">
            
            <div class="tab-content">
                
                <!-- TOUR HEADER BANNER (matching Android fragment_overview.xml banner card) -->
                <div class="tour-banner" id="tourBannerCard">
                    <div class="tour-info">
                        <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.35rem;">
                            <h2 id="tourTitle">ট্যুরের নাম</h2>
                            <span id="tourStatusBadge" class="badge badge-active">চলতি</span>
                        </div>
                        <p>
                            <span>📍 গন্তব্য: <strong id="tourDestination">-</strong></span>
                            <span>📅 <span id="tourDates">-</span></span>
                        </p>
                    </div>
                </div>

                <!-- KPI STATS GRID (matching Android GridLayout — centered cards) -->
                <div class="stats-grid">
                    <div class="stat-card primary" id="cardKpiMembers">
                        <div class="stat-header">
                            <span class="stat-icon">👥</span>
                            <span class="stat-title">মোট সদস্য</span>
                        </div>
                        <div class="stat-value" id="kpiTotalMembers">0 জন</div>
                    </div>

                    <div class="stat-card accent" id="cardKpiCollections">
                        <div class="stat-header">
                            <span class="stat-icon">💰</span>
                            <span class="stat-title">মোট জমা</span>
                        </div>
                        <div class="stat-value" id="kpiTotalCollected">৳ 0</div>
                    </div>

                    <div class="stat-card danger" id="cardKpiExpenses">
                        <div class="stat-header">
                            <span class="stat-icon">💸</span>
                            <span class="stat-title">মোট খরচ</span>
                        </div>
                        <div class="stat-value" id="kpiTotalExpenses">৳ 0</div>
                    </div>

                    <div class="stat-card warning" id="cardKpiDonations">
                        <div class="stat-header">
                            <span class="stat-icon">🎁</span>
                            <span class="stat-title">ডোনেশন</span>
                        </div>
                        <div class="stat-value" id="kpiTotalDonations">৳ 0</div>
                    </div>

                    <div class="stat-card primary" id="cardKpiMemberExpenses">
                        <div class="stat-header">
                            <span class="stat-icon">💳</span>
                            <span class="stat-title">মেম্বারদের থেকে খরচ</span>
                        </div>
                        <div class="stat-value" id="kpiTotalMemberExpenses">৳ 0</div>
                    </div>
                </div>

                <!-- SUMMARY COST SHARE CARD (matching Android summary card centered) -->
                <div class="summary-cost-card">
                    <div class="summary-label">📊 প্রতি সদস্যের প্রাপ্য খরচের অংশ</div>
                    <div class="summary-amount" id="kpiPerPersonShare">৳ 0</div>
                    <div class="summary-balance" id="kpiFundBalance">ক্যাশ ব্যালেন্স: ৳ 0</div>
                </div>

                <!-- TAB 1: DASHBOARD OVERVIEW -->
                <div id="tabDashboard" class="tab-pane active">
                    <div class="grid-2">
                        <div class="card">
                            <div class="card-header">
                                <div class="card-title">📈 বাজেট ট্র্যাকার</div>
                                <span id="budgetSpentText" style="font-size:0.85rem; color:var(--text-muted);">৳ 0 / ৳ 0</span>
                            </div>
                            <div class="budget-progress-wrap">
                                <div style="font-size:0.82rem; color:var(--text-muted); margin-bottom:0.4rem;">বাজেট ব্যবহারের অগ্রগতি:</div>
                                <div class="budget-track">
                                    <div id="budgetProgressBar" class="budget-fill" style="width:0%;"></div>
                                </div>
                            </div>
                            
                            <div class="info-banner" style="margin-top:1rem; margin-bottom:0;">
                                <div class="info-banner-icon">ℹ️</div>
                                <div class="info-banner-text">
                                    <h4>সহজ হিসাব নির্দেশিকা</h4>
                                    <p>যেকোনো মেম্বার ডোনেশন বা স্পন্সর দিলে সেই টাকা মোট খরচ থেকে বাদ যায়, ফলে সকল মেম্বারের জনপ্রতি খরচের পরিমাণ সমানভাবে কমে যায়। ট্যুর শেষে কে টাকা ফেরত পাবে বা কার বকেয়া আছে তা "হিসাব ও PDF" ট্যাবে দেখতে পারবেন।</p>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-header">
                                <div class="card-title">⚡ দ্রুত এক্সেস</div>
                            </div>
                            <div style="display:flex; flex-direction:column; gap:0.65rem;">
                                <div class="admin-only" style="display:flex; flex-direction:column; gap:0.65rem;">
                                    <button class="btn btn-primary" data-modal="modalAddCollection">💰 সদস্যের জমা গ্রহণ করুন</button>
                                    <button class="btn btn-secondary" data-modal="modalAddExpense">💸 নতুন খরচ এন্ট্রি করুন</button>
                                    <button class="btn btn-accent" data-modal="modalAddDonation">🎁 ডোনেশন / স্পন্সর যোগ</button>
                                    <button class="btn btn-secondary" data-modal="modalAddGallery">📸 ট্যুরের ছবি আপলোড</button>
                                </div>
                                <div class="viewer-notice" style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:0.85rem; background:var(--bg-main); border-radius:var(--radius-sm);">
                                    👁️ আপনি পাবলিক ভিউয়ার মোডে আছেন। এন্ট্রি করতে উপরে "🔐 এডমিন" লগইন করুন।
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- TAB 2: MEMBERS & COLLECTIONS -->
                <div id="tabMembers" class="tab-pane">
                    <div class="card" style="margin-bottom:1rem;">
                        <div class="card-header">
                            <div class="card-title">🎴 সদস্য সেটেলমেন্ট (Visual Cards)</div>
                            <div class="admin-only" style="display:flex; gap:0.4rem;">
                                <button class="btn btn-secondary btn-sm" data-modal="modalAddMember">+ নতুন সদস্য</button>
                                <button class="btn btn-primary btn-sm" data-modal="modalAddCollection">+ জমা নিন</button>
                            </div>
                        </div>
                        <div id="memberAvatarGrid" class="member-avatar-grid">
                            <!-- Dynamic Avatar Cards Rendered by JS -->
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">👥 সদস্য জমার তালিকা ও স্টেটমেন্ট</div>
                        </div>
                        
                        <div class="table-responsive">
                            <table class="custom-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>সদস্যের নাম</th>
                                        <th>রোল / পদবী</th>
                                        <th>মোট জমা (Paid)</th>
                                        <th>প্রাপ্য অংশ (Share)</th>
                                        <th>ব্যালেন্স স্ট্যাটাস</th>
                                        <th class="admin-only">অ্যাকশন</th>
                                    </tr>
                                </thead>
                                <tbody id="membersTableBody">
                                    <!-- Dynamic Rows -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- TAB 3: EXPENSES LEDGER -->
                <div id="tabExpenses" class="tab-pane">
                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">💸 খরচের লেজার ও বিবরণী</div>
                            <button class="btn btn-primary btn-sm admin-only" data-modal="modalAddExpense">+ খরচ এন্ট্রি</button>
                        </div>
                        <div class="table-responsive">
                            <table class="custom-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>ক্যাটাগরি</th>
                                        <th>খরচের বিবরণ</th>
                                        <th>পরিমাণ</th>
                                        <th>পরিশোধকারী</th>
                                        <th>তারিখ</th>
                                        <th>রসিদ/মেমো</th>
                                        <th class="admin-only">অ্যাকশন</th>
                                    </tr>
                                </thead>
                                <tbody id="expensesTableBody">
                                    <!-- Dynamic Rows -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- TAB 4: DONATIONS -->
                <div id="tabDonations" class="tab-pane">
                    <div class="info-banner">
                        <div class="info-banner-icon">🎁</div>
                        <div class="info-banner-text">
                            <h4>স্পন্সর ও ডোনেশন ব্যবস্থাপনা</h4>
                            <p>যদি ট্যুরের কোন মেম্বার বা বাইরের শুভাকাঙ্ক্ষী কিছু টাকা ডোনেশন দেন, তবে সেই টাকা পুরো গ্রুপের মোট খরচ কমায়। ফলে প্রত্যেক মেম্বারের মাথাপিছু খরচের পরিমাণ কমে যায়।</p>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">📜 ডোনেশন ও স্পন্সর লিস্ট</div>
                            <button class="btn btn-accent btn-sm admin-only" data-modal="modalAddDonation">+ ডোনেশন এন্ট্রি</button>
                        </div>
                        <div class="table-responsive">
                            <table class="custom-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>দাতা / স্পন্সরের নাম</th>
                                        <th>পরিমাণ</th>
                                        <th>তারিখ</th>
                                        <th>নোট / বিবরণ</th>
                                        <th class="admin-only">অ্যাকশন</th>
                                    </tr>
                                </thead>
                                <tbody id="donationsTableBody">
                                    <!-- Dynamic Rows -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- TAB 5: GALLERY -->
                <div id="tabGallery" class="tab-pane">
                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">📸 ট্যুর মেমোরি অ্যালবাম</div>
                            <button class="btn btn-primary btn-sm admin-only" data-modal="modalAddGallery">+ ছবি আপলোড</button>
                        </div>
                        <div id="galleryGrid" class="gallery-grid">
                            <!-- Dynamic Gallery Cards -->
                        </div>
                    </div>
                </div>

                <!-- TAB 6: FINAL REPORT & PDF EXPORT -->
                <div id="tabReport" class="tab-pane">
                    <div class="card no-print" style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                        <div>
                            <h3 style="margin-bottom:0.2rem; color:var(--text-primary);">📑 ট্যুরের চূড়ান্ত হিসাব বিবরণী</h3>
                            <p style="color:var(--text-muted); font-size:0.85rem;">সকল খরচ, জমা ও রিফান্ড বকেয়ার সুনির্দিষ্ট রসিদ PDF আকারে সংরক্ষণ করুন।</p>
                        </div>
                        <div style="display:flex; gap:0.6rem;">
                            <button class="btn btn-secondary" onclick="window.print()">🖨️ প্রিন্ট করুন</button>
                            <button class="btn btn-primary" onclick="exportTourSummaryToPDF()">⏬ PDF ডাউনলোড</button>
                        </div>
                    </div>

                    <!-- Printable PDF view container -->
                    <div id="reportAuditArea">
                        <!-- Dynamic Report Generated by JS -->
                    </div>
                </div>

            </div>
        </div>
    </main>

    <!-- ==================== MODALS ==================== -->

    <!-- Modal: Admin Login -->
    <div id="modalAdminLogin" class="modal">
        <div class="modal-dialog">
            <div class="modal-header">
                <h3 class="modal-title">🔐 এডমিন প্যানেলে লগইন করুন</h3>
                <button class="modal-close">&times;</button>
            </div>
            <form id="formAdminLogin">
                <div class="modal-body">
                    <div class="info-banner" style="margin-bottom:1rem;">
                        <div class="info-banner-text" style="font-size:0.85rem;">
                            🔑 ডিফল্ট এডমিন পাসওয়ার্ড: <strong>admin123</strong>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">এডমিন পাসওয়ার্ড / PIN *</label>
                        <input type="password" name="password" id="adminPasswordInput" class="form-control" placeholder="পাসওয়ার্ড দিন..." required autofocus>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-close-modal>বাতিল</button>
                    <button type="submit" class="btn btn-primary">লগইন করুন</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal: New Tour -->
    <div id="modalNewTour" class="modal">
        <div class="modal-dialog">
            <div class="modal-header">
                <h3 class="modal-title">+ নতুন ট্যুর শুরু করুন</h3>
                <button class="modal-close">&times;</button>
            </div>
            <form id="formNewTour">
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">ট্যুরের নাম *</label>
                        <input type="text" name="name" class="form-control" placeholder="যেমন: সেন্টমার্টিন ভ্রমণ ২০২৬" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">গন্তব্যস্থান *</label>
                        <input type="text" name="destination" class="form-control" placeholder="যেমন: Saint Martin, Cox's Bazar" required>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
                        <div class="form-group">
                            <label class="form-label">শুরুর তারিখ</label>
                            <input type="date" name="start_date" class="form-control">
                        </div>
                        <div class="form-group">
                            <label class="form-label">শেষের তারিখ</label>
                            <input type="date" name="end_date" class="form-control">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">আনুমানিক মোট বাজেট (৳)</label>
                        <input type="number" step="0.01" name="budget" class="form-control" placeholder="50000">
                    </div>
                    <div class="form-group">
                        <label class="form-label">বিবরণ / নোট</label>
                        <textarea name="description" class="form-control" placeholder="ট্যুর সংক্রান্ত জরুরি কোন বিবরণ..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-close-modal>বাতিল</button>
                    <button type="submit" class="btn btn-primary">ট্যুর তৈরি করুন</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal: Add Member -->
    <div id="modalAddMember" class="modal">
        <div class="modal-dialog">
            <div class="modal-header">
                <h3 class="modal-title">+ নতুন সদস্য যুক্ত করুন</h3>
                <button class="modal-close">&times;</button>
            </div>
            <form id="formAddMember">
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">সদস্যের নাম *</label>
                        <input type="text" name="name" class="form-control" placeholder="যেমন: শফিক আহমেদ" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">মোবাইল নম্বর</label>
                        <input type="text" name="phone" class="form-control" placeholder="01700000000">
                    </div>
                    <div class="form-group">
                        <label class="form-label">পদবী / ভূমিকা</label>
                        <input type="text" name="role" class="form-control" placeholder="যেমন: Organizer / Member" value="Member">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-close-modal>বাতিল</button>
                    <button type="submit" class="btn btn-primary">সদস্য যুক্ত করুন</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal: Add Collection -->
    <div id="modalAddCollection" class="modal">
        <div class="modal-dialog">
            <div class="modal-header">
                <h3 class="modal-title">+ টাকা জমা গ্রহণ করুন</h3>
                <button class="modal-close">&times;</button>
            </div>
            <form id="formAddCollection">
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">সদস্য নির্বাচন করুন *</label>
                        <select id="collectionMemberSelect" name="member_id" class="form-control" required>
                            <option value="">-- মেম্বার নির্বাচন করুন --</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">জমাকৃত টাকার পরিমাণ (৳) *</label>
                        <input type="number" step="0.01" name="amount" class="form-control" placeholder="2000" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">জমার তারিখ</label>
                        <input type="date" name="payment_date" class="form-control" value="<?php echo date('Y-m-d'); ?>">
                    </div>
                    <div class="form-group">
                        <label class="form-label">পেমেন্ট মেথড</label>
                        <select name="payment_method" class="form-control">
                            <option value="Cash">ক্যাশ (Cash)</option>
                            <option value="bkash">বিকাশ (bKash)</option>
                            <option value="Nagad">নগদ (Nagad)</option>
                            <option value="Bank">ব্যাংক ট্রান্সফার</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">নোট / বিবরণ</label>
                        <input type="text" name="notes" class="form-control" placeholder="যেমন: প্রথম কিস্তি">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-close-modal>বাতিল</button>
                    <button type="submit" class="btn btn-primary">জমা নিশ্চিত করুন</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal: Add Expense -->
    <div id="modalAddExpense" class="modal">
        <div class="modal-dialog">
            <div class="modal-header">
                <h3 class="modal-title">+ খরচের বিবরণী এন্ট্রি করুন</h3>
                <button class="modal-close">&times;</button>
            </div>
            <form id="formAddExpense" enctype="multipart/form-data">
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">খরচের শিরোনাম *</label>
                        <input type="text" name="title" class="form-control" placeholder="যেমন: বিকালের নাস্তা / বাস ভাড়া" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">ক্যাটাগরি *</label>
                        <select name="category" class="form-control" required>
                            <option value="খাবার (Food)">খাবার (Food)</option>
                            <option value="যাতায়াত (Transport)">যাতায়াত (Transport)</option>
                            <option value="হোটেল (Hotel)">হোটেল / থাকার খরচ</option>
                            <option value="টিকিট (Tickets)">টিকিট ও এন্ট্রি ফি</option>
                            <option value="অন্যান্য (Misc)">অন্যান্য (Misc)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">টাকার পরিমাণ (৳) *</label>
                        <input type="number" step="0.01" name="amount" class="form-control" placeholder="1500" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">কার পকেট থেকে দেয়া হয়েছে?</label>
                        <select id="expensePaidBySelect" name="paid_by_member_id" class="form-control">
                            <option value="">-- সেন্ট্রাল ফান্ড / ক্যাশ --</option>
                        </select>
                        <small style="color:var(--text-muted); font-size:0.75rem;">যদি কোন নির্দিষ্ট মেম্বার নিজ পকেট থেকে দিয়ে থাকেন</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">তারিখ</label>
                        <input type="date" name="expense_date" class="form-control" value="<?php echo date('Y-m-d'); ?>">
                    </div>
                    <div class="form-group">
                        <label class="form-label">রসিদ / মেমোর ছবি (ঐচ্ছিক)</label>
                        <input type="file" name="receipt_image" accept="image/*" class="form-control">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-close-modal>বাতিল</button>
                    <button type="submit" class="btn btn-primary">খরচ সংরক্ষণ করুন</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal: Add Donation -->
    <div id="modalAddDonation" class="modal">
        <div class="modal-dialog">
            <div class="modal-header">
                <h3 class="modal-title">+ ডোনেশন / স্পন্সর এন্ট্রি</h3>
                <button class="modal-close">&times;</button>
            </div>
            <form id="formAddDonation">
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">দাতা / স্পন্সরের নাম *</label>
                        <input type="text" name="donor_name" class="form-control" placeholder="যেমন: মেহেরাব ভাই (স্পন্সর)" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">ডোনেশনের পরিমাণ (৳) *</label>
                        <input type="number" step="0.01" name="amount" class="form-control" placeholder="5000" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">তারিখ</label>
                        <input type="date" name="donation_date" class="form-control" value="<?php echo date('Y-m-d'); ?>">
                    </div>
                    <div class="form-group">
                        <label class="form-label">বিবরণ / নোট</label>
                        <input type="text" name="notes" class="form-control" placeholder="যেমন: দুপুরের খাবারের সৌজন্যে">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-close-modal>বাতিল</button>
                    <button type="submit" class="btn btn-primary">ডোনেশন সংরক্ষণ করুন</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal: Add Gallery Photo -->
    <div id="modalAddGallery" class="modal">
        <div class="modal-dialog">
            <div class="modal-header">
                <h3 class="modal-title">+ ট্যুরের ছবি আপলোড করুন</h3>
                <button class="modal-close">&times;</button>
            </div>
            <form id="formAddGallery" enctype="multipart/form-data">
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">ছবি নির্বাচন করুন (একাধিক সম্ভব) *</label>
                        <input type="file" name="images[]" multiple accept="image/*" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">ক্যাপশন / বিবরণ</label>
                        <input type="text" name="caption" class="form-control" placeholder="যেমন: সেন্টমার্টিনের সূর্যাস্ত">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-close-modal>বাতিল</button>
                    <button type="submit" class="btn btn-primary">আপলোড করুন</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Lightbox Modal -->
    <div id="lightboxModal" class="lightbox-modal">
        <div class="lightbox-content">
            <span class="lightbox-close" onclick="closeModal('lightboxModal')">&times;</span>
            <img id="lightboxImg" src="" alt="Enlarged View">
            <div id="lightboxCaption" style="color:white; text-align:center; margin-top:0.5rem; font-size:0.95rem;"></div>
        </div>
    </div>

    <!-- FAB Button (matching Android FloatingActionButton) — Admin only -->
    <button class="fab-btn admin-only" id="fabActionBtn" onclick="toggleQuickActionMenu()" title="দ্রুত এন্ট্রি">＋</button>

    <!-- Quick Action Menu (matching Android dialog_quick_action_grid.xml) -->
    <div class="quick-action-menu admin-only" id="quickActionMenu">
        <div class="quick-action-header">
            <div class="quick-action-icon-wrap">⚡</div>
            <div>
                <div class="quick-action-title">দ্রুত ডাটা এন্ট্রি মেনু</div>
                <div class="quick-action-subtitle">কাঙ্ক্ষিত এন্ট্রি অপশন বেছে নিন</div>
            </div>
        </div>

        <div class="quick-action-item" onclick="closeQuickMenu(); openModal('modalAddMember')">
            <div class="quick-action-item-icon">👤</div>
            <div class="quick-action-item-info">
                <div class="quick-action-item-title">নতুন সদস্য যোগ করুন</div>
                <div class="quick-action-item-desc">ট্যুরে নতুন মেম্বারের নাম অন্তর্ভুক্ত করুন</div>
            </div>
            <div class="quick-action-arrow">›</div>
        </div>

        <div class="quick-action-item" onclick="closeQuickMenu(); openModal('modalAddCollection')">
            <div class="quick-action-item-icon">💰</div>
            <div class="quick-action-item-info">
                <div class="quick-action-item-title">টাকা জমা গ্রহণ করুন</div>
                <div class="quick-action-item-desc">সদস্যের থেকে কিস্তি বা জমার টাকা তুলুন</div>
            </div>
            <div class="quick-action-arrow">›</div>
        </div>

        <div class="quick-action-item" onclick="closeQuickMenu(); openModal('modalAddExpense')">
            <div class="quick-action-item-icon">💸</div>
            <div class="quick-action-item-info">
                <div class="quick-action-item-title">নতুন খরচের এন্ট্রি দিন</div>
                <div class="quick-action-item-desc">ট্যুরের সাধারণ বা আউট-অব-পকেট খরচ লিখুন</div>
            </div>
            <div class="quick-action-arrow">›</div>
        </div>

        <div class="quick-action-item" onclick="closeQuickMenu(); openModal('modalAddDonation')">
            <div class="quick-action-item-icon">🎁</div>
            <div class="quick-action-item-info">
                <div class="quick-action-item-title">ডোনেশন / স্পন্সর যোগ করুন</div>
                <div class="quick-action-item-desc">বাইরের শুভানুধ্যায়ীর অনুদান হিসাব করুন</div>
            </div>
            <div class="quick-action-arrow">›</div>
        </div>

        <div class="quick-action-item" onclick="closeQuickMenu(); openModal('modalNewTour')">
            <div class="quick-action-item-icon">✈️</div>
            <div class="quick-action-item-info">
                <div class="quick-action-item-title">নতুন ট্যুর তৈরি করুন</div>
                <div class="quick-action-item-desc">সম্পূর্ণ নতুন ভ্রমণের প্রজেক্ট সেটআপ করুন</div>
            </div>
            <div class="quick-action-arrow">›</div>
        </div>
    </div>

    <!-- JavaScript files -->
    <script src="assets/js/app.js"></script>
    <script src="assets/js/pdf-export.js"></script>
    <script>
        // FAB + Quick Action Menu Logic
        function toggleQuickActionMenu() {
            const menu = document.getElementById('quickActionMenu');
            const fab = document.getElementById('fabActionBtn');
            const isOpen = menu.classList.toggle('active');
            fab.style.transform = isOpen ? 'rotate(45deg)' : '';
        }

        function closeQuickMenu() {
            document.getElementById('quickActionMenu').classList.remove('active');
            document.getElementById('fabActionBtn').style.transform = '';
        }

        // Close quick menu when clicking outside
        document.addEventListener('click', function(e) {
            const menu = document.getElementById('quickActionMenu');
            const fab = document.getElementById('fabActionBtn');
            if (menu && fab && !menu.contains(e.target) && !fab.contains(e.target)) {
                closeQuickMenu();
            }
        });
    </script>

</body>
</html>
