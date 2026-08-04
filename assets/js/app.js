// assets/js/app.js - Main Application Logic, Permissions & Interactivity

let currentTourId = null;
let currentSummaryData = null;
let isAdminUser = false;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    initTheme();
    setupEventListeners();
    await checkAuthState();
    await loadToursList();
}

// ----------------- BENGALI NUMERAL CONVERTER HELPERS -----------------

function toBanglaNumeral(strOrNum) {
    if (strOrNum === null || strOrNum === undefined) return '';
    const str = String(strOrNum);
    const banglaDigits = {'0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯'};
    return str.replace(/[0-9]/g, digit => banglaDigits[digit]);
}

function formatBnCurrency(num) {
    if (isNaN(num)) num = 0;
    const formattedStr = Number(num).toLocaleString('en-US', { maximumFractionDigits: 2 });
    return '৳ ' + toBanglaNumeral(formattedStr);
}

// ----------------- THEME MANAGEMENT -----------------

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        if (theme === 'light') {
            btn.innerHTML = '🌙 ডার্ক';
        } else {
            btn.innerHTML = '☀️ লাইট';
        }
    }
}

// ----------------- AUTHENTICATION MANAGEMENT -----------------

async function checkAuthState() {
    try {
        const res = await fetch('api/auth.php?action=check');
        const json = await res.json();
        isAdminUser = json.success && json.data && json.data.is_admin === true;
        updateUIForRole(isAdminUser);
    } catch (err) {
        console.error('Auth check error:', err);
    }
}

function updateUIForRole(isAdmin) {
    isAdminUser = isAdmin;
    const body = document.body;
    const authBadge = document.getElementById('authBadge');
    const authBtn = document.getElementById('authBtn');

    if (isAdmin) {
        body.classList.add('is-admin-mode');
        if (authBadge) {
            authBadge.className = 'badge badge-admin';
            authBadge.textContent = '👑 এডমিন মোড';
        }
        if (authBtn) {
            authBtn.textContent = '🚪 লগআউট';
            authBtn.className = 'btn btn-danger btn-sm';
        }
    } else {
        body.classList.remove('is-admin-mode');
        if (authBadge) {
            authBadge.className = 'badge badge-viewer';
            authBadge.textContent = '👁️ পাবলিক ভিউয়ার';
        }
        if (authBtn) {
            authBtn.textContent = '🔐 এডমিন লগইন';
            authBtn.className = 'btn btn-secondary btn-sm';
        }
    }

    if (currentTourId) {
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab) {
            switchTab(activeTab.getAttribute('data-tab'));
        }
    }
}

async function handleAuthBtnClick() {
    if (isAdminUser) {
        if (confirm('আপনি কি এডমিন মোড থেকে লগআউট করতে চান?')) {
            try {
                const res = await fetch('api/auth.php?action=logout', { method: 'POST' });
                const json = await res.json();
                if (json.success) {
                    showToast('লগআউট সম্পন্ন হয়েছে');
                    await checkAuthState();
                }
            } catch (err) { console.error(err); }
        }
    } else {
        openModal('modalAdminLogin');
    }
}

function setupEventListeners() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            const targetPane = document.getElementById(tabId);
            if (targetPane) targetPane.classList.add('active');

            if (currentTourId) {
                switchTab(tabId);
            }
        });
    });

    const tourSelect = document.getElementById('tourSelect');
    if (tourSelect) {
        tourSelect.addEventListener('change', (e) => {
            const selectedVal = e.target.value;
            if (selectedVal === 'new') {
                if (!isAdminUser) {
                    showToast('নতুন ট্যুর তৈরি করতে এডমিন হিসেবে লগইন করুন!', 'error');
                    openModal('modalAdminLogin');
                    tourSelect.value = currentTourId || '';
                    return;
                }
                openModal('modalNewTour');
            } else if (selectedVal) {
                currentTourId = parseInt(selectedVal);
                loadTourData(currentTourId);
            }
        });
    }

    document.querySelectorAll('[data-modal]').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const modalId = trigger.getAttribute('data-modal');
            openModal(modalId);
        });
    });

    document.querySelectorAll('.modal-close, [data-close-modal]').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modal = closeBtn.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    setupFormHandlers();
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : '⚠️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ----------------- TOURS DATA MANAGEMENT -----------------

async function loadToursList() {
    try {
        const res = await fetch('api/tours.php');
        const json = await res.json();
        if (json.success) {
            const tours = json.data;
            const tourSelect = document.getElementById('tourSelect');
            if (!tourSelect) return;

            tourSelect.innerHTML = '<option value="">-- ট্যুর সিলেক্ট করুন --</option>';
            tours.forEach(tour => {
                const opt = document.createElement('option');
                opt.value = tour.id;
                opt.textContent = `${tour.name} (${tour.destination})`;
                if (tour.status === 'active') opt.textContent += ' [চলতি]';
                tourSelect.appendChild(opt);
            });

            if (isAdminUser) {
                const newOpt = document.createElement('option');
                newOpt.value = 'new';
                newOpt.textContent = '+ নতুন ট্যুর তৈরি করুন...';
                tourSelect.appendChild(newOpt);
            }

            if (tours.length > 0) {
                const activeTour = tours.find(t => t.status === 'active') || tours[0];
                currentTourId = activeTour.id;
                tourSelect.value = currentTourId;
                await loadTourData(currentTourId);
            } else {
                document.getElementById('emptyState').style.display = 'block';
                document.getElementById('tourContentArea').style.display = 'none';
            }
        }
    } catch (err) {
        console.error('Error loading tours:', err);
    }
}

async function loadTourData(tourId) {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('tourContentArea').style.display = 'block';

    // Show tab bar (matching Android AppBar visibility)
    const tabBar = document.getElementById('mainTabBar');
    if (tabBar) tabBar.style.display = 'block';

    await refreshSummary(tourId);
    
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        switchTab(activeTab.getAttribute('data-tab'));
    }
}

async function refreshSummary(tourId) {
    try {
        const res = await fetch(`api/summary.php?tour_id=${tourId}`);
        const json = await res.json();
        if (json.success) {
            currentSummaryData = json.data;
            renderHeaderAndKPIs(json.data);
            populateMemberDropdowns(json.data.member_audit);
        }
    } catch (err) {
        console.error('Error fetching summary:', err);
    }
}

function renderHeaderAndKPIs(data) {
    const tour = data.tour;
    document.getElementById('tourTitle').textContent = tour.name;
    document.getElementById('tourDestination').textContent = tour.destination;
    
    const startDateBn = tour.start_date ? toBanglaNumeral(tour.start_date) : '';
    const endDateBn = tour.end_date ? toBanglaNumeral(tour.end_date) : '';
    document.getElementById('tourDates').textContent = startDateBn + (endDateBn ? ' হতে ' + endDateBn : '');
    
    const badge = document.getElementById('tourStatusBadge');
    badge.className = `badge badge-${tour.status}`;
    badge.textContent = tour.status === 'active' ? 'চলতি ট্যুর' : (tour.status === 'completed' ? 'সম্পন্ন' : 'পরিকল্পিত');

    document.getElementById('kpiTotalMembers').textContent = toBanglaNumeral(data.member_count) + ' জন';
    document.getElementById('kpiTotalCollected').textContent = formatBnCurrency(data.total_collections);
    document.getElementById('kpiTotalExpenses').textContent = formatBnCurrency(data.total_expenses);
    document.getElementById('kpiTotalDonations').textContent = formatBnCurrency(data.total_donations);
    document.getElementById('kpiPerPersonShare').textContent = formatBnCurrency(data.per_person_share);

    // Member out-of-pocket expenses (matching Android cardKpiMemberExpenses)
    const memberExpEl = document.getElementById('kpiTotalMemberExpenses');
    if (memberExpEl) {
        const memberExpTotal = data.total_member_expenses !== undefined ? data.total_member_expenses : 0;
        memberExpEl.textContent = formatBnCurrency(memberExpTotal);
    }
    
    // Fund Balance — matching Android tvFundBalance with prefix
    const balanceEl = document.getElementById('kpiFundBalance');
    const fundBal = data.fund_balance || 0;
    balanceEl.textContent = 'ক্যাশ ব্যালেন্স: ' + formatBnCurrency(fundBal);
    balanceEl.style.color = fundBal >= 0 ? '#10b981' : '#ef4444';

    const budget = parseFloat(tour.budget) || 0;
    const spent = data.total_expenses;
    const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
    
    document.getElementById('budgetSpentText').textContent = `${formatBnCurrency(spent)} / ${formatBnCurrency(budget)} (${toBanglaNumeral(pct)}%)`;
    const progressBar = document.getElementById('budgetProgressBar');
    if (progressBar) {
        progressBar.style.width = pct + '%';
        progressBar.style.background = pct > 90 ? 'var(--danger)' : (pct > 75 ? 'var(--warning)' : 'var(--primary)');
    }
}

function populateMemberDropdowns(members) {
    const memberSelects = ['collectionMemberSelect', 'expensePaidBySelect'];
    memberSelects.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            const currentVal = select.value;
            select.innerHTML = id === 'expensePaidBySelect' ? '<option value="">-- সেন্ট্রাল ফান্ড / ক্যাশ --</option>' : '<option value="">-- মেম্বার নির্বাচন করুন --</option>';
            members.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.textContent = m.name + (m.role ? ` (${m.role})` : '');
                select.appendChild(opt);
            });
            if (currentVal) select.value = currentVal;
        }
    });
}

function switchTab(tabId) {
    if (!currentTourId) return;

    if (tabId === 'tabMembers') {
        loadMembersTab();
    } else if (tabId === 'tabExpenses') {
        loadExpensesTab();
    } else if (tabId === 'tabDonations') {
        loadDonationsTab();
    } else if (tabId === 'tabGallery') {
        loadGalleryTab();
    } else if (tabId === 'tabReport') {
        loadReportTab();
    }
}

// ----------------- TAB LOADERS -----------------

async function loadMembersTab() {
    await refreshSummary(currentTourId);
    if (!currentSummaryData) return;

    const tbody = document.getElementById('membersTableBody');
    const avatarGrid = document.getElementById('memberAvatarGrid');
    
    if (tbody) tbody.innerHTML = '';
    if (avatarGrid) avatarGrid.innerHTML = '';

    currentSummaryData.member_audit.forEach((m, idx) => {
        // 1. Table Row Render
        if (tbody) {
            const tr = document.createElement('tr');
            let statusBadge = '';
            if (m.status === 'refund') {
                statusBadge = `<span class="badge badge-refund">${formatBnCurrency(m.abs_diff)} ফেরত পাবে</span>`;
            } else if (m.status === 'due') {
                statusBadge = `<span class="badge badge-due">${formatBnCurrency(m.abs_diff)} বকেয়া</span>`;
            } else {
                statusBadge = `<span class="badge badge-active">হিসাব ঠিক আছে</span>`;
            }

            const actionCol = isAdminUser ? `
                <td class="admin-only">
                    <button class="btn btn-secondary btn-sm" onclick="openRecordCollectionForMember(${m.id})">+ জমা</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteMember(${m.id})">❌</button>
                </td>
            ` : '';

            tr.innerHTML = `
                <td>${toBanglaNumeral(idx + 1)}</td>
                <td>
                    <strong>${m.name}</strong>
                    ${m.phone ? `<br><small style="color:var(--text-muted)">📱 ${toBanglaNumeral(m.phone)}</small>` : ''}
                </td>
                <td><span class="badge" style="background:rgba(255,255,255,0.08);">${m.role || 'Member'}</span></td>
                <td><strong>${formatBnCurrency(m.total_paid)}</strong></td>
                <td>${formatBnCurrency(m.required_share)}</td>
                <td>${statusBadge}</td>
                ${actionCol}
            `;
            tbody.appendChild(tr);
        }

        // 2. Avatar Card Grid Render
        if (avatarGrid) {
            const card = document.createElement('div');
            card.className = 'member-card glass';
            const initial = m.name ? m.name.charAt(0) : '👤';
            const reqShare = parseFloat(m.required_share) || 1;
            const paidPct = Math.min(100, Math.round((m.total_paid / reqShare) * 100));

            let statusTag = '';
            if (m.status === 'refund') {
                statusTag = `<span class="badge badge-refund" style="font-size:0.75rem;">+${formatBnCurrency(m.abs_diff)} ফেরত</span>`;
            } else if (m.status === 'due') {
                statusTag = `<span class="badge badge-due" style="font-size:0.75rem;">-${formatBnCurrency(m.abs_diff)} বকেয়া</span>`;
            } else {
                statusTag = `<span class="badge badge-active" style="font-size:0.75rem;">হিসাব ঠিক আছে</span>`;
            }

            card.innerHTML = `
                <div>
                    <div class="member-card-header">
                        <div class="member-avatar">${initial}</div>
                        <div class="member-info">
                            <h4>${m.name}</h4>
                            <span>${m.role || 'মেম্বার'} ${m.phone ? '• ' + toBanglaNumeral(m.phone) : ''}</span>
                        </div>
                    </div>

                    <div style="font-size:0.85rem; color:var(--text-muted); display:flex; justify-content:space-between;">
                        <span>জমাকৃত: <strong>${formatBnCurrency(m.total_paid)}</strong></span>
                        <span>প্রাপ্য: ${formatBnCurrency(m.required_share)}</span>
                    </div>

                    <div class="member-progress-bar">
                        <div class="member-progress-fill" style="width:${paidPct}%;"></div>
                    </div>
                </div>

                <div class="member-card-footer">
                    <div>${statusTag}</div>
                    ${isAdminUser ? `<button class="btn btn-secondary btn-sm admin-only" onclick="openRecordCollectionForMember(${m.id})">+ জমা গ্রহণ</button>` : ''}
                </div>
            `;
            avatarGrid.appendChild(card);
        }
    });
}

function openRecordCollectionForMember(memberId) {
    if (!isAdminUser) {
        showToast('টাকা এন্ট্রি করতে এডমিন হিসেবে লগইন করুন', 'error');
        return;
    }
    document.getElementById('collectionMemberSelect').value = memberId;
    openModal('modalAddCollection');
}

async function loadExpensesTab() {
    try {
        const res = await fetch(`api/expenses.php?tour_id=${currentTourId}`);
        const json = await res.json();
        if (json.success) {
            const tbody = document.getElementById('expensesTableBody');
            tbody.innerHTML = '';

            json.data.forEach((exp, idx) => {
                const tr = document.createElement('tr');
                const receiptLink = exp.receipt_image ? `<a href="${exp.receipt_image}" target="_blank" style="color:var(--primary);text-decoration:none;">📷 রসিদ দেখুন</a>` : '<span style="color:var(--text-muted)">-</span>';
                
                const actionCol = isAdminUser ? `<td class="admin-only"><button class="btn btn-danger btn-sm" onclick="deleteExpense(${exp.id})">❌</button></td>` : '';

                tr.innerHTML = `
                    <td>${toBanglaNumeral(idx + 1)}</td>
                    <td><span class="badge badge-completed">${exp.category}</span></td>
                    <td><strong>${exp.title}</strong>${exp.notes ? `<br><small style="color:var(--text-muted)">${exp.notes}</small>` : ''}</td>
                    <td style="color:var(--danger);font-weight:700;">${formatBnCurrency(exp.amount)}</td>
                    <td>${exp.paid_by_member_name ? exp.paid_by_member_name : 'সেন্ট্রাল ফান্ড'}</td>
                    <td>${toBanglaNumeral(exp.expense_date)}</td>
                    <td>${receiptLink}</td>
                    ${actionCol}
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadDonationsTab() {
    try {
        const res = await fetch(`api/donations.php?tour_id=${currentTourId}`);
        const json = await res.json();
        if (json.success) {
            const tbody = document.getElementById('donationsTableBody');
            tbody.innerHTML = '';

            json.data.forEach((don, idx) => {
                const tr = document.createElement('tr');
                const actionCol = isAdminUser ? `<td class="admin-only"><button class="btn btn-danger btn-sm" onclick="deleteDonation(${don.id})">❌</button></td>` : '';
                tr.innerHTML = `
                    <td>${toBanglaNumeral(idx + 1)}</td>
                    <td><strong>${don.donor_name}</strong></td>
                    <td style="color:var(--primary);font-weight:700;">${formatBnCurrency(don.amount)}</td>
                    <td>${toBanglaNumeral(don.donation_date)}</td>
                    <td>${don.notes || '-'}</td>
                    ${actionCol}
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadGalleryTab() {
    try {
        const res = await fetch(`api/gallery.php?tour_id=${currentTourId}`);
        const json = await res.json();
        if (json.success) {
            const grid = document.getElementById('galleryGrid');
            grid.innerHTML = '';

            if (json.data.length === 0) {
                grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">এখনো কোন ছবি আপলোড করা হয়নি।</div>`;
                return;
            }

            json.data.forEach(img => {
                const card = document.createElement('div');
                card.className = 'gallery-card';
                const deleteBtn = isAdminUser ? `<button class="btn btn-danger btn-sm admin-only" style="padding:0.15rem 0.4rem;font-size:0.7rem;" onclick="deleteGalleryImage(event, ${img.id})">মুছুন</button>` : '';

                card.innerHTML = `
                    <img src="${img.image_path}" alt="Tour Memory" loading="lazy" onclick="openLightbox('${img.image_path}', '${img.caption || ''}')">
                    <div class="gallery-overlay">
                        <div class="gallery-caption">${img.caption || 'ট্যুরের ছবি'}</div>
                        <div style="display:flex;justify-space-between;align-items:center;margin-top:0.3rem;">
                            <span class="gallery-date">${toBanglaNumeral(new Date(img.uploaded_at).toLocaleDateString())}</span>
                            ${deleteBtn}
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
    } catch (err) {
        console.error(err);
    }
}

function openLightbox(src, caption) {
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightboxCaption').textContent = caption;
    document.getElementById('lightboxModal').classList.add('active');
}

async function loadReportTab() {
    await refreshSummary(currentTourId);
    if (!currentSummaryData) return;

    const data = currentSummaryData;
    const reportContainer = document.getElementById('reportAuditArea');

    const startDateBn = data.tour.start_date ? toBanglaNumeral(data.tour.start_date) : '-';
    const endDateBn = data.tour.end_date ? toBanglaNumeral(data.tour.end_date) : '-';
    const reportDateBn = toBanglaNumeral(new Date().toLocaleDateString());

    reportContainer.innerHTML = `
        <div style="background:#fff; color:#000; padding:2rem; border-radius:12px; font-family:'SolaimanLipi', sans-serif;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #10b981; padding-bottom:1rem; margin-bottom:1.5rem;">
                <div>
                    <h2 style="margin:0; font-size:1.6rem; color:#0f172a;">${data.tour.name}</h2>
                    <p style="margin:0.25rem 0 0; color:#64748b; font-size:0.95rem;">গন্তব্য: ${data.tour.destination} | তারিখ: ${startDateBn} হতে ${endDateBn}</p>
                </div>
                <div style="text-align:right;">
                    <h3 style="margin:0; color:#10b981; font-size:1.3rem;">চূড়ান্ত ট্যুর হিসাব বিবরণী</h3>
                    <small style="color:#64748b;">রিপোর্ট তৈরির তারিখ: ${reportDateBn}</small>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:1rem; background:#f8fafc; padding:1.25rem; border-radius:8px; margin-bottom:1.5rem; border:1px solid #e2e8f0;">
                <div><span style="font-size:0.8rem; color:#64748b;">মোট সদস্য</span><br><strong style="font-size:1.2rem; color:#0f172a;">${toBanglaNumeral(data.member_count)} জন</strong></div>
                <div><span style="font-size:0.8rem; color:#64748b;">মোট জমা (Collection)</span><br><strong style="font-size:1.2rem; color:#059669;">${formatBnCurrency(data.total_collections)}</strong></div>
                <div><span style="font-size:0.8rem; color:#64748b;">মোট খরচ (Gross Expense)</span><br><strong style="font-size:1.2rem; color:#dc2626;">${formatBnCurrency(data.total_expenses)}</strong></div>
                <div><span style="font-size:0.8rem; color:#64748b;">মোট ডোনেশন/স্পন্সর</span><br><strong style="font-size:1.2rem; color:#4f46e5;">${formatBnCurrency(data.total_donations)}</strong></div>
            </div>

            <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:1rem; margin-bottom:1.5rem; font-size:0.9rem; color:#1e40af;">
                💡 <strong>ডোনেশন সমবন্টন নিয়ম:</strong> নিট মোট খরচ = (মোট খরচ ${formatBnCurrency(data.total_expenses)} - ডোনেশন ${formatBnCurrency(data.total_donations)}) = <strong>${formatBnCurrency(data.net_group_cost)}</strong>।<br>
                প্রতি সদস্যের বন্টনযোগ্য খরচ = ${formatBnCurrency(data.net_group_cost)} ÷ ${toBanglaNumeral(data.member_count)} জন = <strong>${formatBnCurrency(data.per_person_share)}</strong>।
            </div>

            <h4 style="margin-bottom:0.75rem; color:#0f172a;">সদস্যদের হিসাব বিবরণী (Member Breakdown & Settlement):</h4>
            <table style="width:100%; border-collapse:collapse; margin-bottom:2rem; font-size:0.9rem;">
                <thead>
                    <tr style="background:#f1f5f9; text-align:left;">
                        <th style="padding:10px; border:1px solid #cbd5e1;">ক্রম</th>
                        <th style="padding:10px; border:1px solid #cbd5e1;">সদস্যের নাম</th>
                        <th style="padding:10px; border:1px solid #cbd5e1;">মোট প্রদানকৃত জমা</th>
                        <th style="padding:10px; border:1px solid #cbd5e1;">প্রাপ্য খরচের অংশ</th>
                        <th style="padding:10px; border:1px solid #cbd5e1;">নিট ব্যালেন্স</th>
                        <th style="padding:10px; border:1px solid #cbd5e1;">চূড়ান্ত অবস্থা</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.member_audit.map((m, i) => `
                        <tr>
                            <td style="padding:10px; border:1px solid #e2e8f0;">${toBanglaNumeral(i + 1)}</td>
                            <td style="padding:10px; border:1px solid #e2e8f0;"><strong>${m.name}</strong> ${m.phone ? `(${toBanglaNumeral(m.phone)})` : ''}</td>
                            <td style="padding:10px; border:1px solid #e2e8f0; font-weight:600;">${formatBnCurrency(m.total_paid)}</td>
                            <td style="padding:10px; border:1px solid #e2e8f0;">${formatBnCurrency(m.required_share)}</td>
                            <td style="padding:10px; border:1px solid #e2e8f0; font-weight:700; color:${m.net_balance >= 0 ? '#059669' : '#dc2626'};">
                                ${m.net_balance >= 0 ? '+' : ''}${formatBnCurrency(m.net_balance)}
                            </td>
                            <td style="padding:10px; border:1px solid #e2e8f0;">
                                ${m.status === 'refund' ? `<span style="background:#d1fae5; color:#065f46; padding:4px 8px; border-radius:4px; font-weight:600;">${formatBnCurrency(m.abs_diff)} ফেরত পাবে</span>` : 
                                  (m.status === 'due' ? `<span style="background:#fee2e2; color:#991b1b; padding:4px 8px; border-radius:4px; font-weight:600;">${formatBnCurrency(m.abs_diff)} বকেয়া পরিশোধ করবে</span>` : '<span style="background:#f3f4f6; color:#374151; padding:4px 8px; border-radius:4px;">হিসাব ঠিক আছে</span>')}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#64748b; margin-top:2rem; border-top:1px solid #e2e8f0; padding-top:1rem;">
                <div>ট্যুর অর্গানাইজার স্বাক্ষর: ____________________</div>
                <div>হিসাব নিরীক্ষক স্বাক্ষর: ____________________</div>
            </div>
        </div>
    `;
}

// ----------------- FORM HANDLERS -----------------

function setupFormHandlers() {
    const formLogin = document.getElementById('formAdminLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('adminPasswordInput').value;
            try {
                const res = await fetch('api/auth.php?action=login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });
                const json = await res.json();
                if (json.success) {
                    showToast(json.message);
                    closeModal('modalAdminLogin');
                    formLogin.reset();
                    await checkAuthState();
                    await loadToursList();
                } else {
                    showToast(json.message, 'error');
                }
            } catch (err) { console.error(err); }
        });
    }

    const formTour = document.getElementById('formNewTour');
    if (formTour) {
        formTour.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(formTour);
            const data = Object.fromEntries(formData.entries());
            try {
                const res = await fetch('api/tours.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const json = await res.json();
                if (json.success) {
                    showToast('নতুন ট্যুর সফলভাবে তৈরি হয়েছে!');
                    closeModal('modalNewTour');
                    formTour.reset();
                    await loadToursList();
                } else {
                    showToast(json.message, 'error');
                }
            } catch (err) { console.error(err); }
        });
    }

    const formMember = document.getElementById('formAddMember');
    if (formMember) {
        formMember.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(formMember);
            const data = Object.fromEntries(formData.entries());
            data.tour_id = currentTourId;

            try {
                const res = await fetch('api/members.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const json = await res.json();
                if (json.success) {
                    showToast('মেম্বার যোগ করা হয়েছে');
                    closeModal('modalAddMember');
                    formMember.reset();
                    await refreshSummary(currentTourId);
                    await loadMembersTab();
                } else {
                    showToast(json.message, 'error');
                }
            } catch (err) { console.error(err); }
        });
    }

    const formCollection = document.getElementById('formAddCollection');
    if (formCollection) {
        formCollection.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(formCollection);
            const data = Object.fromEntries(formData.entries());
            data.tour_id = currentTourId;

            try {
                const res = await fetch('api/collections.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const json = await res.json();
                if (json.success) {
                    showToast('টাকা জমা রেকর্ড করা হয়েছে');
                    closeModal('modalAddCollection');
                    formCollection.reset();
                    await refreshSummary(currentTourId);
                    await loadMembersTab();
                } else {
                    showToast(json.message, 'error');
                }
            } catch (err) { console.error(err); }
        });
    }

    const formExpense = document.getElementById('formAddExpense');
    if (formExpense) {
        formExpense.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(formExpense);
            formData.append('tour_id', currentTourId);

            try {
                const res = await fetch('api/expenses.php', {
                    method: 'POST',
                    body: formData
                });
                const json = await res.json();
                if (json.success) {
                    showToast('খরচের এন্ট্রি সংরক্ষিত হয়েছে');
                    closeModal('modalAddExpense');
                    formExpense.reset();
                    await loadExpensesTab();
                    await refreshSummary(currentTourId);
                } else {
                    showToast(json.message, 'error');
                }
            } catch (err) { console.error(err); }
        });
    }

    const formDonation = document.getElementById('formAddDonation');
    if (formDonation) {
        formDonation.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(formDonation);
            const data = Object.fromEntries(formData.entries());
            data.tour_id = currentTourId;

            try {
                const res = await fetch('api/donations.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const json = await res.json();
                if (json.success) {
                    showToast('ডোনেশন যোগ করা হয়েছে');
                    closeModal('modalAddDonation');
                    formDonation.reset();
                    await loadDonationsTab();
                    await refreshSummary(currentTourId);
                } else {
                    showToast(json.message, 'error');
                }
            } catch (err) { console.error(err); }
        });
    }

    const formGallery = document.getElementById('formAddGallery');
    if (formGallery) {
        formGallery.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(formGallery);
            formData.append('tour_id', currentTourId);

            try {
                const res = await fetch('api/gallery.php', {
                    method: 'POST',
                    body: formData
                });
                const json = await res.json();
                if (json.success) {
                    showToast('ছবি সফলভাবে আপলোড করা হয়েছে');
                    closeModal('modalAddGallery');
                    formGallery.reset();
                    await loadGalleryTab();
                } else {
                    showToast(json.message, 'error');
                }
            } catch (err) { console.error(err); }
        });
    }
}

// ----------------- DELETE FUNCTIONS -----------------

async function deleteMember(id) {
    if (!isAdminUser) return;
    if (!confirm('আপনি কি নিশ্চিত যে এই মেম্বারকে ডিলিট করতে চান?')) return;
    try {
        const res = await fetch(`api/members.php?id=${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
            showToast('মেম্বার ডিলিট করা হয়েছে');
            await refreshSummary(currentTourId);
            await loadMembersTab();
        } else {
            showToast(json.message, 'error');
        }
    } catch (err) { console.error(err); }
}

async function deleteExpense(id) {
    if (!isAdminUser) return;
    if (!confirm('আপনি কি নিশ্চিত যে এই খরচের এন্ট্রি ডিলিট করতে চান?')) return;
    try {
        const res = await fetch(`api/expenses.php?id=${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
            showToast('খরচের এন্ট্রি ডিলিট করা হয়েছে');
            await loadExpensesTab();
            await refreshSummary(currentTourId);
        } else {
            showToast(json.message, 'error');
        }
    } catch (err) { console.error(err); }
}

async function deleteDonation(id) {
    if (!isAdminUser) return;
    if (!confirm('আপনি কি নিশ্চিত যে এই ডোনেশনটি ডিলিট করতে চান?')) return;
    try {
        const res = await fetch(`api/donations.php?id=${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
            showToast('ডোনেশন ডিলিট করা হয়েছে');
            await loadDonationsTab();
            await refreshSummary(currentTourId);
        } else {
            showToast(json.message, 'error');
        }
    } catch (err) { console.error(err); }
}

async function deleteGalleryImage(e, id) {
    e.stopPropagation();
    if (!isAdminUser) return;
    if (!confirm('ছবিটি ডিলিট করতে চান?')) return;
    try {
        const res = await fetch(`api/gallery.php?id=${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
            showToast('ছবি ডিলিট করা হয়েছে');
            await loadGalleryTab();
        } else {
            showToast(json.message, 'error');
        }
    } catch (err) { console.error(err); }
}
