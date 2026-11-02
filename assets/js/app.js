/* assets/js/app.js - Main Application Controller for TourCosting Web App */

let currentTourId = null;
let currentTourObj = null;
let tourList = [];
let membersList = [];
let collectionsList = [];
let expensesList = [];
let donationsList = [];
let galleryList = [];
let summaryData = null;

let isAdmin = false;
let logoTapCount = 0;
let lastLogoTapTime = 0;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    initTheme();
    checkAdminMode();
    setupEventListeners();
    await loadToursList();
}

// ----------------- HELPERS & UTILS -----------------

function toBangla(strOrNum) {
    if (strOrNum === null || strOrNum === undefined) return '';
    const str = String(strOrNum);
    const banglaDigits = {'0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯'};
    return str.replace(/[0-9]/g, d => banglaDigits[d]);
}

function formatBnCurrency(num) {
    if (isNaN(num)) num = 0;
    const formatted = Number(num).toLocaleString('en-US', { maximumFractionDigits: 2 });
    return '৳ ' + toBangla(formatted);
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
    const icon = type === 'success' ? '✅' : '⚠️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ----------------- THEME & ADMIN MODE -----------------

function initTheme() {
    const savedTheme = localStorage.getItem('tour_theme') || 'light';
    setTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('tour_theme', newTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('btnThemeToggle');
    if (btn) btn.innerHTML = theme === 'light' ? '🌙 ডার্ক' : '☀️ লাইট';
}

function checkAdminMode() {
    isAdmin = localStorage.getItem('tour_is_admin') === 'true';
    updateAdminUI();
}

function updateAdminUI() {
    const badge = document.getElementById('adminBadge');
    const btnAdmin = document.getElementById('btnAdminToggle');

    if (badge) {
        badge.className = isAdmin ? 'badge badge-admin' : 'badge badge-viewer';
        badge.textContent = isAdmin ? '👑 এডমিন মোড' : '👁️ ভিউয়ার মোড';
    }

    if (btnAdmin) {
        btnAdmin.textContent = isAdmin ? '🚪 এডমিন লগআউট' : '🔐 এডমিন মোড';
        btnAdmin.className = isAdmin ? 'btn btn-danger btn-sm' : 'btn btn-secondary btn-sm';
    }

    // 1. Re-render all dynamic tab content first
    if (currentTourId) {
        renderMembersTab();
        renderExpensesTab();
        renderDonationsTab();
        renderGalleryTab();
        computeAndRenderSummary();
    }

    // 2. Update display of all .admin-only buttons (including static & dynamic)
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = isAdmin ? '' : 'none';
    });

    // 3. Update Tours Select Option for Admin
    const spinner = document.getElementById('spinnerTours');
    if (spinner) {
        let newOpt = spinner.querySelector('option[value="new"]');
        if (isAdmin && !newOpt) {
            newOpt = document.createElement('option');
            newOpt.value = 'new';
            newOpt.textContent = '+ নতুন ট্যুর তৈরি করুন...';
            spinner.appendChild(newOpt);
        } else if (!isAdmin && newOpt) {
            newOpt.remove();
        }
    }
}

function handleLogoClick() {
    const now = Date.now();
    if (now - lastLogoTapTime < 500) {
        logoTapCount++;
    } else {
        logoTapCount = 1;
    }
    lastLogoTapTime = now;

    if (logoTapCount >= 7) {
        logoTapCount = 0;
        promptAdminLogin();
    }
}

function promptAdminLogin() {
    if (isAdmin) {
        if (confirm('আপনি কি এডমিন মোড থেকে বের হতে চান?')) {
            isAdmin = false;
            localStorage.setItem('tour_is_admin', 'false');
            updateAdminUI();
            showToast('এডমিন মোড থেকে বের হয়েছেন');
        }
        return;
    }

    const pass = prompt('🔑 এডমিন মোডে ঢুকতে গোপন পাসওয়ার্ড দিন:');
    if (pass === 'admin123') {
        isAdmin = true;
        localStorage.setItem('tour_is_admin', 'true');
        updateAdminUI();
        showToast('👑 এডমিন মোড সক্রিয় করা হয়েছে!');
    } else if (pass !== null) {
        showToast('⚠️ ভুল পাসওয়ার্ড!', 'error');
    }
}

// ----------------- EVENT LISTENERS -----------------

function setupEventListeners() {
    document.getElementById('appLogo').addEventListener('click', handleLogoClick);
    document.getElementById('btnAdminToggle').addEventListener('click', promptAdminLogin);
    document.getElementById('btnThemeToggle').addEventListener('click', toggleTheme);

    const tourSelect = document.getElementById('spinnerTours');
    tourSelect.addEventListener('change', async (e) => {
        const val = e.target.value;
        if (val === 'new') {
            openModal('modalAddTour');
            tourSelect.value = currentTourId || '';
        } else if (val) {
            currentTourId = parseInt(val);
            await loadTourData(currentTourId);
        }
    });

    // Tab Bar Buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Modals Close Handler
    document.querySelectorAll('.modal-close, [data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) modal.classList.remove('active');
        });
    });

    setupFormSubmissions();
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

// ----------------- DATA LOADING & SUMMARY CALCULATOR -----------------

async function loadToursList() {
    try {
        tourList = await SupabaseApi.getTours();
        const select = document.getElementById('spinnerTours');
        select.innerHTML = '<option value="">-- ট্যুর সিলেক্ট করুন --</option>';

        tourList.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = `${toBangla(t.name)} (${toBangla(t.destination)})`;
            select.appendChild(opt);
        });

        if (isAdmin) {
            const newOpt = document.createElement('option');
            newOpt.value = 'new';
            newOpt.textContent = '+ নতুন ট্যুর তৈরি করুন...';
            select.appendChild(newOpt);
        }

        if (tourList.length > 0) {
            currentTourId = tourList[0].id;
            select.value = currentTourId;
            await loadTourData(currentTourId);
        } else {
            document.getElementById('emptyState').style.display = 'block';
            document.getElementById('mainContentArea').style.display = 'none';
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function loadTourData(tourId) {
    try {
        currentTourObj = tourList.find(t => t.id === tourId);
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('mainContentArea').style.display = 'block';

        // Parallel Fetching
        const [members, collections, expenses, donations, gallery] = await Promise.all([
            SupabaseApi.getMembers(tourId),
            SupabaseApi.getCollections(tourId),
            SupabaseApi.getExpenses(tourId),
            SupabaseApi.getDonations(tourId),
            SupabaseApi.getGallery(tourId)
        ]);

        membersList = members || [];
        collectionsList = collections || [];
        expensesList = expenses || [];
        donationsList = donations || [];
        galleryList = gallery || [];

        computeAndRenderSummary();
        renderMembersTab();
        renderExpensesTab();
        renderDonationsTab();
        renderGalleryTab();
    } catch (err) {
        console.error(err);
        showToast('ডাটা লোড করতে সমস্যা: ' + err.message, 'error');
    }
}

function computeAndRenderSummary() {
    summaryData = computeSummary(currentTourObj, membersList, collectionsList, expensesList, donationsList);
    
    // Render Overview Banner & KPIs
    document.getElementById('tvTourName').textContent = summaryData.tour.name;
    document.getElementById('tvDestination').textContent = `📍 গন্তব্য: ${summaryData.tour.destination}`;
    
    const bannerEl = document.querySelector('.tour-banner');
    if (bannerEl) {
        const rawPic = summaryData.tour.banner_image || summaryData.tour.image_url;
        const bgImg = (rawPic && rawPic.trim().length > 0) ? rawPic.trim() : 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80';
        bannerEl.style.backgroundImage = `linear-gradient(135deg, rgba(15, 23, 42, 0.82) 0%, rgba(30, 41, 59, 0.88) 100%), url('${bgImg}')`;
    }
    
    document.getElementById('kpiMemberCount').textContent = toBangla(summaryData.memberCount) + ' জন';
    document.getElementById('kpiTotalCollections').textContent = formatBnCurrency(summaryData.totalCollections);
    document.getElementById('kpiTotalExpenses').textContent = formatBnCurrency(summaryData.totalExpenses);
    document.getElementById('kpiTotalDonations').textContent = formatBnCurrency(summaryData.totalDonations);
    document.getElementById('kpiTotalOutOfPocket').textContent = formatBnCurrency(summaryData.totalOutOfPocket);
    document.getElementById('kpiNetGroupCost').textContent = formatBnCurrency(summaryData.netGroupCost);
    document.getElementById('kpiPerPersonShare').textContent = formatBnCurrency(summaryData.perPersonShare);
    document.getElementById('kpiRemainingBalance').textContent = formatBnCurrency(summaryData.fundBalance);

    // Out of Pocket Reimbursement Card
    const containerReimburse = document.getElementById('containerOutOfPocketList');
    containerReimburse.innerHTML = '';

    if (summaryData.outOfPocketExpenses.length > 0) {
        document.getElementById('cardOutOfPocketSection').style.display = 'block';
        summaryData.outOfPocketExpenses.forEach(exp => {
            const row = document.createElement('div');
            row.className = 'item-row';
            row.innerHTML = `
                <div class="info">
                    <h4>💳 ${toBangla(exp.title)}</h4>
                    <p>পরিশোধকারী: <strong>${toBangla(exp.paid_by_member_name || 'সদস্য')}</strong></p>
                </div>
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <span class="amount" style="color:var(--warning);">${formatBnCurrency(exp.amount)}</span>
                    ${isAdmin ? `<button class="btn btn-primary btn-sm" onclick="reimburseMemberExpense(${exp.id}, '${exp.paid_by_member_name || 'সদস্য'}')">পরিশোধ করা হয়েছে</button>` : ''}
                </div>
            `;
            containerReimburse.appendChild(row);
        });
    } else {
        document.getElementById('cardOutOfPocketSection').style.display = 'none';
    }
}

function computeSummary(tour, members, collections, expenses, donations) {
    let totalCollections = 0;
    const memberCollectionsMap = {};
    collections.forEach(c => {
        const amt = Number(c.amount || 0);
        totalCollections += amt;
        memberCollectionsMap[c.member_id] = (memberCollectionsMap[c.member_id] || 0) + amt;
    });

    let totalExpenses = 0;
    let totalOutOfPocket = 0;
    const memberOutOfPocketMap = {};
    const outOfPocketExpenses = [];
    const memberNameMap = {};
    members.forEach(m => { memberNameMap[m.id] = m.name; });

    expenses.forEach(e => {
        const amt = Number(e.amount || 0);
        totalExpenses += amt;
        if (e.paid_by_member_id && e.paid_by_member_id > 0) {
            totalOutOfPocket += amt;
            memberOutOfPocketMap[e.paid_by_member_id] = (memberOutOfPocketMap[e.paid_by_member_id] || 0) + amt;
            if (!e.paid_by_member_name) {
                e.paid_by_member_name = memberNameMap[e.paid_by_member_id] || 'সদস্য';
            }
            outOfPocketExpenses.push(e);
        }
    });

    let totalDonations = 0;
    donations.forEach(d => {
        totalDonations += Number(d.amount || 0);
    });

    const memberCount = members.length;
    const netGroupCost = Math.max(0, totalExpenses - totalDonations);
    const perPersonShare = memberCount > 0 ? (netGroupCost / memberCount) : 0;
    const fundBalance = (totalCollections + totalOutOfPocket + totalDonations) - totalExpenses;

    const memberAudit = members.map(m => {
        const deposits = memberCollectionsMap[m.id] || 0;
        const outOfPocket = memberOutOfPocketMap[m.id] || 0;
        const totalPaid = deposits + outOfPocket;
        const netBalance = totalPaid - perPersonShare;
        let status = 'settled';
        if (netBalance > 0.009) status = 'refund';
        else if (netBalance < -0.009) status = 'due';

        return {
            id: m.id,
            name: m.name,
            phone: m.phone,
            role: m.role,
            total_deposits: deposits,
            total_out_of_pocket: outOfPocket,
            total_paid: totalPaid,
            required_share: perPersonShare,
            net_balance: netBalance,
            status: status
        };
    });

    return {
        tour: tour || {},
        memberCount,
        totalCollections,
        totalExpenses,
        totalDonations,
        totalOutOfPocket,
        netGroupCost,
        perPersonShare,
        fundBalance,
        memberAudit,
        outOfPocketExpenses
    };
}

// ----------------- TAB RENDERING -----------------

function renderMembersTab() {
    const container = document.getElementById('containerMembersList');
    container.innerHTML = '';

    if (!summaryData || summaryData.memberAudit.length === 0) {
        container.innerHTML = '<div class="card" style="text-align:center; color:var(--text-muted);">কোনো সদস্যের তথ্য পাওয়া যায়নি।</div>';
        return;
    }

    summaryData.memberAudit.forEach(m => {
        const card = document.createElement('div');
        card.className = 'card';
        const isRefund = m.status === 'refund';
        const badgeColor = isRefund ? 'badge-admin' : (m.status === 'due' ? 'badge-viewer' : 'badge-admin');
        const badgeText = isRefund ? `ফেরত পাবেন: ${formatBnCurrency(m.net_balance)}` : (m.status === 'due' ? `বকেয়া রয়েছে: ${formatBnCurrency(Math.abs(m.net_balance))}` : 'পরিশোধিত');

        card.innerHTML = `
            <div class="card-header">
                <div style="display:flex; align-items:center; gap:0.6rem;">
                    <div style="width:36px; height:36px; background:var(--primary-bg); border-radius:50%; display:flex; align-items:center; justify-content:center;">👤</div>
                    <div>
                        <h3 style="font-size:1.1rem;">${toBangla(m.name)}</h3>
                        <span style="font-size:0.8rem; color:var(--text-muted);">${toBangla(m.role || 'Member')}</span>
                    </div>
                </div>
                <span class="badge ${badgeColor}">${badgeText}</span>
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:0.5rem; font-size:0.85rem; background:var(--bg-main); padding:0.75rem; border-radius:8px;">
                <div>জমা: <strong>${formatBnCurrency(m.total_deposits)}</strong></div>
                <div>পকেট খরচ: <strong>${formatBnCurrency(m.total_out_of_pocket)}</strong></div>
                <div>মোট প্রদেয়: <strong>${formatBnCurrency(m.total_paid)}</strong></div>
            ${isAdmin ? `
                <div style="margin-top:0.75rem; display:flex; justify-content:flex-end; gap:0.4rem; flex-wrap:wrap;">
                    <button class="btn btn-primary btn-sm" onclick="openAddCollectionForMember(${m.id})">💰 টাকা জমা নিন</button>
                    <button class="btn btn-secondary btn-sm" onclick="openManageMemberCollections(${m.id}, '${m.name}')">✏️ জমা এডিট</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteMember(${m.id})">🗑️ রিমুভ</button>
                </div>
            ` : ''}
        `;
        container.appendChild(card);
    });
}

function renderExpensesTab() {
    const container = document.getElementById('containerExpensesList');
    container.innerHTML = '';

    if (expensesList.length === 0) {
        container.innerHTML = '<div class="card" style="text-align:center; color:var(--text-muted);">কোনো খরচের এন্ট্রি নেই।</div>';
        return;
    }

    expensesList.forEach(exp => {
        const row = document.createElement('div');
        row.className = 'item-row';
        const paidBy = exp.paid_by_member_name ? ` (পকেট থেকে: ${toBangla(exp.paid_by_member_name)})` : '';
        row.innerHTML = `
            <div class="info">
                <h4>💸 ${toBangla(exp.title)}</h4>
                <p>📅 ${toBangla(exp.expense_date || '')} ${paidBy}</p>
            </div>
            <div style="display:flex; align-items:center; gap:0.6rem;">
                <span class="amount" style="color:var(--danger);">${formatBnCurrency(exp.amount)}</span>
                ${isAdmin ? `
                    <button class="btn btn-secondary btn-sm" onclick="editExpense(${exp.id})">✏️</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteExpense(${exp.id})">🗑️</button>
                ` : ''}
            </div>
        `;
        container.appendChild(row);
    });
}

function renderDonationsTab() {
    const container = document.getElementById('containerDonationsList');
    container.innerHTML = '';

    if (donationsList.length === 0) {
        container.innerHTML = '<div class="card" style="text-align:center; color:var(--text-muted);">কোনো ডোনেশনের এন্ট্রি নেই।</div>';
        return;
    }

    donationsList.forEach(d => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <div class="info">
                <h4>🎁 ${toBangla(d.donor_name)}</h4>
                <p>📅 ${toBangla(d.donation_date || '')}</p>
            </div>
            <div style="display:flex; align-items:center; gap:0.6rem;">
                <span class="amount" style="color:var(--info);">${formatBnCurrency(d.amount)}</span>
                ${isAdmin ? `
                    <button class="btn btn-secondary btn-sm" onclick="editDonation(${d.id})">✏️</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteDonation(${d.id})">🗑️</button>
                ` : ''}
            </div>
        `;
        container.appendChild(row);
    });
}

function renderGalleryTab() {
    const container = document.getElementById('containerGalleryGrid');
    container.innerHTML = '';

    if (galleryList.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:2rem;">কোনো ছবি আপলোড করা হয়নি। (সর্বোচ্চ ৪টি ছবি)</div>';
        return;
    }

    galleryList.forEach(img => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `
            <img src="${img.image_path}" alt="Gallery Image" onclick="openImageViewer('${img.image_path}', '${img.caption || ''}')">
            ${isAdmin ? `<button class="delete-btn" onclick="deleteGalleryImage(event, ${img.id})">🗑️</button>` : ''}
        `;
        container.appendChild(item);
    });
}

// ----------------- ACTIONS & FORM HANDLERS -----------------

function compressImageFile(file, maxWidth = 1200, maxHeight = 800, quality = 0.82) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
            img.src = e.target.result;
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

async function handleModalBannerPhotoSelect(e, previewId) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const compressedBase64 = await compressImageFile(file);
        pendingModalBannerBase64 = compressedBase64;
        const imgEl = document.getElementById(previewId);
        if (imgEl) {
            imgEl.src = pendingModalBannerBase64;
            imgEl.style.display = 'block';
        }
    } catch (err) {
        showToast('ছবি প্রসেস করতে সমস্যা: ' + err.message, 'error');
    }
}

async function handleBannerCoverPhotoSelect(e) {
    const file = e.target.files[0];
    if (!file || !currentTourId) return;

    showToast('🖼️ ব্যানার কভার প্রসেস ও আপলোড হচ্ছে...');

    try {
        const base64Img = await compressImageFile(file);
        await SupabaseApi.updateTour(currentTourId, { banner_image: base64Img });
        showToast('✅ ব্যানার কভার পিকচার সফলভাবে আপডেট করা হয়েছে!');
        await loadToursList();
    } catch (err) {
        showToast('ব্যানার কভার আপডেট ব্যর্থ: ' + err.message, 'error');
    }
}

function setupFormSubmissions() {
    // Add Tour
    document.getElementById('formAddTour').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('inputTourName').value.trim();
        const dest = document.getElementById('inputTourDest').value.trim();
        const imageUrl = pendingModalBannerBase64 || '';
        pendingModalBannerBase64 = null;

        if (!name || !dest) return;

        try {
            await SupabaseApi.addTour({ name, destination: dest, banner_image: imageUrl, budget: 30000, status: 'active' });
            closeModal('modalAddTour');
            showToast('✅ নতুন ট্যুর তৈরি হয়েছে!');
            await loadToursList();
        } catch (err) { showToast(err.message, 'error'); }
    });

    // Edit Tour
    document.getElementById('formEditTour').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('inputEditTourName').value.trim();
        const dest = document.getElementById('inputEditTourDest').value.trim();
        const status = document.getElementById('selectEditTourStatus').value;
        if (!name || !dest || !currentTourId) return;

        const updatePayload = { name, destination: dest, status };
        if (pendingModalBannerBase64) {
            updatePayload.banner_image = pendingModalBannerBase64;
            pendingModalBannerBase64 = null;
        }

        try {
            await SupabaseApi.updateTour(currentTourId, updatePayload);
            closeModal('modalEditTour');
            showToast('✅ ট্যুর তথ্য আপডেট করা হয়েছে!');
            await loadToursList();
        } catch (err) { showToast(err.message, 'error'); }
    });

    // Add Member
    document.getElementById('formAddMember').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('inputMemberName').value.trim();
        if (!name || !currentTourId) return;

        try {
            await SupabaseApi.addMember({ tour_id: currentTourId, name, role: 'Member' });
            closeModal('modalAddMember');
            showToast('✅ নতুন সদস্য যুক্ত করা হয়েছে!');
            await loadTourData(currentTourId);
        } catch (err) { showToast(err.message, 'error'); }
    });

    // Add Collection
    document.getElementById('formAddCollection').addEventListener('submit', async (e) => {
        e.preventDefault();
        const memberId = parseInt(document.getElementById('selectMemberCollection').value);
        const amount = parseFloat(document.getElementById('inputCollectionAmount').value);
        if (!memberId || !amount) return;

        try {
            await SupabaseApi.addCollection({ tour_id: currentTourId, member_id: memberId, amount });
            closeModal('modalAddCollection');
            showToast('✅ টাকা জমা সম্পন্ন হয়েছে!');
            await loadTourData(currentTourId);
        } catch (err) { showToast(err.message, 'error'); }
    });

    // Add/Edit Expense
    document.getElementById('formAddExpense').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('inputExpenseId').value;
        const title = document.getElementById('inputExpenseTitle').value.trim();
        const amount = parseFloat(document.getElementById('inputExpenseAmount').value);
        const paidById = parseInt(document.getElementById('selectExpensePaidBy').value);

        if (!title || !amount) return;

        const body = {
            tour_id: currentTourId,
            title,
            amount,
            category: 'সাধারণ খরচ',
            paid_by_member_id: paidById > 0 ? paidById : null
        };

        try {
            if (id) {
                await SupabaseApi.updateExpense(id, body);
                showToast('✅ খরচ আপডেট করা হয়েছে!');
            } else {
                await SupabaseApi.addExpense(body);
                showToast('✅ নতুন খরচ এন্ট্রি করা হয়েছে!');
            }
            closeModal('modalAddExpense');
            await loadTourData(currentTourId);
        } catch (err) { showToast(err.message, 'error'); }
    });

    // Edit Collection Amount
    document.getElementById('formEditCollection').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('inputEditCollectionId').value;
        const newAmount = parseFloat(document.getElementById('inputEditCollectionAmount').value);
        if (!id || isNaN(newAmount)) return;

        try {
            await SupabaseApi.updateCollection(id, { amount: newAmount });
            closeModal('modalEditCollection');
            closeModal('modalManageCollections');
            showToast('✅ জমার পরিমাণ আপডেট করা হয়েছে!');
            await loadTourData(currentTourId);
        } catch (err) { showToast(err.message, 'error'); }
    });

    // Add/Edit Donation
    document.getElementById('formAddDonation').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('inputDonationId').value;
        const donor_name = document.getElementById('inputDonorName').value.trim();
        const amount = parseFloat(document.getElementById('inputDonationAmount').value);

        if (!donor_name || !amount) return;

        const body = { tour_id: currentTourId, donor_name, amount };

        try {
            if (id) {
                await SupabaseApi.updateDonation(id, body);
                showToast('✅ ডোনেশন আপডেট করা হয়েছে!');
            } else {
                await SupabaseApi.addDonation(body);
                showToast('✅ ডোনেশন যুক্ত করা হয়েছে!');
            }
            closeModal('modalAddDonation');
            await loadTourData(currentTourId);
        } catch (err) { showToast(err.message, 'error'); }
    });
}

// ----------------- ADMIN DELETES & REIMBURSEMENT -----------------

async function deleteMember(id) {
    if (confirm('আপনি কি এই সদস্যকে মুছে ফেলতে চান?')) {
        try {
            await SupabaseApi.deleteMember(id);
            showToast('মেম্বার রিমুভ করা হয়েছে');
            await loadTourData(currentTourId);
        } catch (err) { showToast(err.message, 'error'); }
    }
}

async function deleteExpense(id) {
    if (confirm('আপনি কি এই খরচের এন্ট্রিটি মুছে ফেলতে চান?')) {
        try {
            await SupabaseApi.deleteExpense(id);
            showToast('খরচের এন্ট্রি রিমুভ করা হয়েছে');
            await loadTourData(currentTourId);
        } catch (err) { showToast(err.message, 'error'); }
    }
}

async function deleteDonation(id) {
    if (confirm('আপনি কি এই ডোনেশনের এন্ট্রিটি মুছে ফেলতে চান?')) {
        try {
            await SupabaseApi.deleteDonation(id);
            showToast('ডোনেশন রিমুভ করা হয়েছে');
            await loadTourData(currentTourId);
        } catch (err) { showToast(err.message, 'error'); }
    }
}

async function deleteGalleryImage(e, id) {
    e.stopPropagation();
    if (confirm('আপনি কি এই ছবিটি মুছে ফেলতে চান?')) {
        try {
            await SupabaseApi.deleteGallery(id);
            showToast('ছবি রিমুভ করা হয়েছে');
            await loadTourData(currentTourId);
        } catch (err) { showToast(err.message, 'error'); }
    }
}

async function reimburseMemberExpense(id, memberName) {
    if (confirm(`আপনি কি ${memberName} এর আউট-অব-পকেট খরচ সেন্ট্রাল ফান্ড থেকে পরিশোধ করতে চান?`)) {
        try {
            await SupabaseApi.reimburseExpense(id);
            showToast(`✅ ${memberName} কে পরিশোধ করা হয়েছে!`);
            await loadTourData(currentTourId);
        } catch (err) { showToast(err.message, 'error'); }
    }
}

// Open Modal Triggers with Populated Data
function openAddCollectionModal() {
    const select = document.getElementById('selectMemberCollection');
    select.innerHTML = '<option value="">-- সদস্য নির্বাচন করুন --</option>';
    membersList.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `👤 ${toBangla(m.name)}`;
        select.appendChild(opt);
    });
    openModal('modalAddCollection');
}

function openAddCollectionForMember(memberId) {
    const select = document.getElementById('selectMemberCollection');
    select.innerHTML = '<option value="">-- সদস্য নির্বাচন করুন --</option>';
    membersList.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `👤 ${toBangla(m.name)}`;
        if (m.id === memberId) opt.selected = true;
        select.appendChild(opt);
    });
    openModal('modalAddCollection');
}

function openEditTourModal() {
    if (!currentTourObj) return;
    pendingModalBannerBase64 = null;
    document.getElementById('inputEditTourName').value = currentTourObj.name || '';
    document.getElementById('inputEditTourDest').value = currentTourObj.destination || '';
    document.getElementById('selectEditTourStatus').value = currentTourObj.status || 'active';

    const previewEl = document.getElementById('previewEditBanner');
    if (previewEl) {
        const rawPic = currentTourObj.banner_image || currentTourObj.image_url;
        if (rawPic) {
            previewEl.src = rawPic;
            previewEl.style.display = 'block';
        } else {
            previewEl.style.display = 'none';
        }
    }
    openModal('modalEditTour');
}

async function deleteCurrentTour() {
    if (!currentTourObj) return;
    if (confirm(`আপনি কি "${currentTourObj.name}" ট্যুরটি সম্পূর্ণ মুছে ফেলতে চান?`)) {
        try {
            await SupabaseApi.deleteTour(currentTourId);
            showToast('ট্যুর ডিলেট করা হয়েছে');
            currentTourId = null;
            await loadToursList();
        } catch (err) { showToast(err.message, 'error'); }
    }
}

function openManageMemberCollections(memberId, memberName) {
    document.getElementById('tvManageCollectionsTitle').textContent = `📜 ${toBangla(memberName)} এর জমার ইতিহাস ও এডিট`;
    const container = document.getElementById('containerMemberCollectionHistory');
    container.innerHTML = '';

    const memberCollections = collectionsList.filter(c => c.member_id === memberId);

    if (memberCollections.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:1rem;">এই সদস্যের কোনো জমা রেকর্ড নেই।</div>';
    } else {
        memberCollections.forEach(c => {
            const row = document.createElement('div');
            row.className = 'item-row';
            const dateStr = c.payment_date ? toBangla(c.payment_date) : '';
            row.innerHTML = `
                <div class="info">
                    <h4>💰 ${formatBnCurrency(c.amount)}</h4>
                    <p>📅 তারিখ: ${dateStr || 'আজ'}</p>
                </div>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <button class="btn btn-secondary btn-sm" onclick="openEditCollectionModal(${c.id}, ${c.amount})">✏️ এডিট</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCollectionRecord(${c.id}, ${memberId}, '${memberName}')">🗑️ ডিলেট</button>
                </div>
            `;
            container.appendChild(row);
        });
    }

    openModal('modalManageCollections');
}

function openEditCollectionModal(id, currentAmount) {
    document.getElementById('inputEditCollectionId').value = id;
    document.getElementById('inputEditCollectionAmount').value = currentAmount;
    openModal('modalEditCollection');
}

async function deleteCollectionRecord(id, memberId, memberName) {
    if (confirm('আপনি কি এই জমা এন্ট্রিটি ডিলেট করতে চান?')) {
        try {
            await SupabaseApi.deleteCollection(id);
            showToast('জমা এন্ট্রি রিমুভ করা হয়েছে');
            closeModal('modalManageCollections');
            await loadTourData(currentTourId);
        } catch (err) { showToast(err.message, 'error'); }
    }
}

function openAddExpenseModal() {
    document.getElementById('inputExpenseId').value = '';
    document.getElementById('inputExpenseTitle').value = '';
    document.getElementById('inputExpenseAmount').value = '';
    
    const select = document.getElementById('selectExpensePaidBy');
    select.innerHTML = '<option value="0">🏢 সেন্ট্রাল ফান্ড (গ্রুপ ফান্ড)</option>';
    membersList.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `👤 ${toBangla(m.name)} (পকেট থেকে)`;
        select.appendChild(opt);
    });
    openModal('modalAddExpense');
}

function editExpense(id) {
    const exp = expensesList.find(e => e.id === id);
    if (!exp) return;

    document.getElementById('inputExpenseId').value = exp.id;
    document.getElementById('inputExpenseTitle').value = exp.title;
    document.getElementById('inputExpenseAmount').value = exp.amount;

    const select = document.getElementById('selectExpensePaidBy');
    select.innerHTML = '<option value="0">🏢 সেন্ট্রাল ফান্ড (গ্রুপ ফান্ড)</option>';
    membersList.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `👤 ${toBangla(m.name)} (পকেট থেকে)`;
        if (m.id === exp.paid_by_member_id) opt.selected = true;
        select.appendChild(opt);
    });
    openModal('modalAddExpense');
}

function openAddDonationModal() {
    document.getElementById('inputDonationId').value = '';
    document.getElementById('inputDonorName').value = '';
    document.getElementById('inputDonationAmount').value = '';
    openModal('modalAddDonation');
}

function editDonation(id) {
    const d = donationsList.find(item => item.id === id);
    if (!d) return;

    document.getElementById('inputDonationId').value = d.id;
    document.getElementById('inputDonorName').value = d.donor_name;
    document.getElementById('inputDonationAmount').value = d.amount;
    openModal('modalAddDonation');
}

// ----------------- PHOTO GALLERY UPLOAD & ROTATION -----------------

let selectedImageFile = null;
let currentRotation = 0;

function handleGalleryPhotoSelect(event) {
    if (galleryList.length >= 4) {
        showToast('⚠️ অ্যালবামে সর্বোচ্চ ৪টি ছবি আপলোড করা যাবে!', 'error');
        return;
    }
    const file = event.target.files[0];
    if (!file) return;

    selectedImageFile = file;
    currentRotation = 0;

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('previewUploadImage').src = e.target.result;
        document.getElementById('previewUploadImage').style.transform = `rotate(${currentRotation}deg)`;
        openModal('modalRotateUpload');
    };
    reader.readAsDataURL(file);
}

function rotateUploadImage() {
    currentRotation = (currentRotation + 90) % 360;
    document.getElementById('previewUploadImage').style.transform = `rotate(${currentRotation}deg)`;
}

async function confirmGalleryUpload() {
    if (!selectedImageFile) return;

    try {
        showToast('⏳ ছবি আপলোড হচ্ছে...');
        const caption = document.getElementById('inputPhotoCaption').value.trim() || 'ট্যুরের সুন্দর মুহূর্ত';
        
        // Convert to Base64
        const reader = new FileReader();
        reader.onload = async function(e) {
            const fullBase64 = e.target.result;
            const rawBase64 = fullBase64.split(',')[1];
            
            let imageUrl = fullBase64;
            try {
                imageUrl = await SupabaseApi.uploadImgBb(rawBase64);
            } catch (err) { console.warn('ImgBB fallback to Base64'); }

            await SupabaseApi.addGallery({
                tour_id: currentTourId,
                image_path: imageUrl,
                caption: caption
            });

            closeModal('modalRotateUpload');
            showToast('✅ ছবি অ্যালবাম ভিউয়ে যোগ করা হয়েছে!');
            await loadTourData(currentTourId);
        };
        reader.readAsDataURL(selectedImageFile);
    } catch (err) {
        showToast('ছবি আপলোডে সমস্যা: ' + err.message, 'error');
    }
}

function openImageViewer(url, caption) {
    document.getElementById('fullViewerImage').src = url;
    document.getElementById('fullViewerCaption').textContent = caption || 'ট্যুর অ্যালবাম ছবি';
    openModal('modalFullViewer');
}

// ----------------- REPORT PDF & JPG EXPORT -----------------

function generateReportData() {
    if (!summaryData) return;

    const container = document.getElementById('reportExportContainer');
    const memberDepositMap = {};
    collectionsList.forEach(c => {
        memberDepositMap[c.member_id] = (memberDepositMap[c.member_id] || 0) + Number(c.amount || 0);
    });

    const totalFund = summaryData.totalCollections + summaryData.totalDonations;
    const remainingBalance = totalFund - summaryData.totalExpenses;

    let memberRowsHtml = '';
    membersList.forEach(m => {
        const deposited = memberDepositMap[m.id] || 0;
        memberRowsHtml += `
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #e2e8f0;">
                <span>👤 ${toBangla(m.name)}</span>
                <strong style="color:${deposited > 0 ? '#10b981' : '#94a3b8'};">${formatBnCurrency(deposited)}</strong>
            </div>
        `;
    });

    let expenseRowsHtml = '';
    expensesList.forEach(e => {
        const paidBy = e.paid_by_member_name ? ` (পকেট থেকে: ${toBangla(e.paid_by_member_name)})` : '';
        expenseRowsHtml += `
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #e2e8f0;">
                <span>💸 ${toBangla(e.title)} ${paidBy}</span>
                <strong style="color:#ef4444;">${formatBnCurrency(e.amount)}</strong>
            </div>
        `;
    });

    container.innerHTML = `
        <div style="background:#f8fafc; padding:30px; border-radius:16px; color:#0f172a; font-family:'Hind Siliguri', sans-serif;">
            <div style="background:linear-gradient(135deg, #0f172a, #1e293b); color:#fff; padding:24px; border-radius:12px; margin-bottom:20px;">
                <h2 style="margin:0 0 6px 0; font-size:1.5rem;">${toBangla(currentTourObj.name)}</h2>
                <p style="margin:0; color:#cbd5e1; font-size:0.95rem;">📍 গন্তব্য: ${toBangla(currentTourObj.destination)}</p>
                <div style="margin-top:12px; font-size:0.85rem; color:#94a3b8;">📅 ট্যুরের সম্পূর্ণ অ-টু-জেড আর্থিক রিপোর্ট</div>
            </div>

            <h3 style="font-size:1.1rem; margin-bottom:10px;">👤 মেম্বার জমা ও ফান্ড প্রাপ্তি</h3>
            <div style="background:#fff; padding:16px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:16px;">
                ${memberRowsHtml}
                <div style="display:flex; justify-content:space-between; padding-top:10px; font-weight:bold;">
                    <span>সর্বমোট মেম্বার জমা:</span>
                    <span style="color:#10b981;">${formatBnCurrency(summaryData.totalCollections)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding-top:6px; color:#3b82f6; font-weight:bold;">
                    <span>🎁 ডোনেশন প্রাপ্ত (স্পন্সর):</span>
                    <span>${formatBnCurrency(summaryData.totalDonations)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding-top:10px; border-top:1px solid #cbd5e1; margin-top:8px; font-size:1.1rem; font-weight:bold;">
                    <span>💰 মোট ফান্ড প্রাপ্তি (মেম্বার জমা + ডোনেশন):</span>
                    <span style="color:#10b981;">${formatBnCurrency(totalFund)}</span>
                </div>
            </div>

            <h3 style="font-size:1.1rem; margin-bottom:10px;">💸 ট্যুরের খরচের বিবরণী (খাতওয়ারী তালিকা)</h3>
            <div style="background:#fff; padding:16px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:16px;">
                ${expenseRowsHtml || '<div style="color:#94a3b8;">কোনো খরচ নেই।</div>'}
                <div style="display:flex; justify-content:space-between; padding-top:10px; border-top:1px solid #cbd5e1; margin-top:8px; font-weight:bold; color:#ef4444; font-size:1.1rem;">
                    <span>সর্বমোট খরচ (Total Cost):</span>
                    <span>${formatBnCurrency(summaryData.totalExpenses)}</span>
                </div>
            </div>

            <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:20px; border-radius:14px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h3 style="margin:0; color:#047857; font-size:1.1rem;">💰 অবশিষ্টাংশ টাকা / অবশিষ্ট ফান্ড</h3>
                    <p style="margin:2px 0 0 0; color:#059669; font-size:0.8rem;">হিসাব: (মোট ফান্ড প্রাপ্তি - সর্বমোট খরচ)</p>
                </div>
                <div style="font-size:1.5rem; font-weight:bold; color:#047857;">${formatBnCurrency(remainingBalance)}</div>
            </div>
            
            <div style="text-align:center; margin-top:20px; color:#94a3b8; font-size:0.8rem;">জনস্বার্থে তৈরি: ট্যুর হিসাব অ্যাপ (TourCosting)</div>
        </div>
    `;
}

async function exportReportFile() {
    const format = document.getElementById('selectExportFormat').value;
    generateReportData();
    const elem = document.getElementById('reportExportContainer');
    openModal('modalExportReport');

    try {
        if (format === 'pdf') {
            const opt = {
                margin: 0.5,
                filename: `Tour_Report_${Date.now()}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };
            await html2pdf().set(opt).from(elem).save();
            showToast('✅ PDF ফাইল ডাউনলোড করা হয়েছে!');
        } else {
            const canvas = await html2canvas(elem, { scale: 2 });
            const link = document.createElement('a');
            link.download = `Tour_Report_${Date.now()}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.95);
            link.click();
            showToast('✅ JPG ছবি ডাউনলোড করা হয়েছে!');
        }
    } catch (err) {
        showToast('রফতানি করতে সমস্যা: ' + err.message, 'error');
    }
}
