// assets/js/pdf-export.js - Client-Side PDF Generation & Print Engine

function exportTourSummaryToPDF() {
    const reportElement = document.getElementById('reportAuditArea');
    if (!reportElement) {
        alert('রিপোর্ট প্রস্তুত করা সম্ভব হয়নি।');
        return;
    }

    const tourName = document.getElementById('tourTitle') ? document.getElementById('tourTitle').textContent : 'Tour_Report';
    const fileName = `${tourName.replace(/[^a-zA-Z0-9_]/g, '_')}_Final_Audit_Statement.pdf`;

    if (typeof html2pdf !== 'undefined') {
        const opt = {
            margin:       [0.4, 0.4, 0.4, 0.4],
            filename:     fileName,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        showToast('PDF ফাইল জেনারেট হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...', 'warning');

        html2pdf().set(opt).from(reportElement).save().then(() => {
            showToast('PDF এক্সপোর্ট সম্পন্ন হয়েছে!');
        }).catch(err => {
            console.error('PDF export error, falling back to print view:', err);
            window.print();
        });
    } else {
        // Fallback to browser print view
        window.print();
    }
}
