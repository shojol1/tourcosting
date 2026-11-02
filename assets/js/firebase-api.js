/* assets/js/firebase-api.js - Firebase Cloud Firestore Client for TourCosting */

const firebaseConfig = {
    apiKey: "AIzaSyDV2r3u1QH1_oKLKNCYQbc0rwOFaSTYQTQ",
    authDomain: "tour-costing-3ca03.firebaseapp.com",
    projectId: "tour-costing-3ca03",
    storageBucket: "tour-costing-3ca03.firebasestorage.app",
    messagingSenderId: "1007412688656",
    appId: "1:1007412688656:web:097ab8873c25a1a6a51795",
    measurementId: "G-Q4W9VR8EJ1"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Helper to generate unique integer ID for new items (matches Android int model)
function generateNumericId() {
    return Math.floor((Date.now() / 1000) % 100000000) * 1000 + Math.floor(Math.random() * 1000);
}

const FirebaseApi = {
    // ----------------- TOURS -----------------
    getTours: async () => {
        const snapshot = await db.collection('tours').get();
        const tours = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            tours.push({ ...data, id: Number(data.id || doc.id) });
        });
        // Sort descending by id
        return tours.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    },

    addTour: async (body) => {
        const id = Number(body.id) || generateNumericId();
        const docData = {
            ...body,
            id: id,
            created_at: body.created_at || new Date().toISOString()
        };
        await db.collection('tours').doc(String(id)).set(docData);
        return [docData];
    },

    updateTour: async (id, body) => {
        const docRef = db.collection('tours').doc(String(id));
        await docRef.set(body, { merge: true });
        const updated = await docRef.get();
        return [updated.data()];
    },

    deleteTour: async (id) => {
        await db.collection('tours').doc(String(id)).delete();
        // Cascade delete related records
        const deleteRelated = async (colName) => {
            const snap = await db.collection(colName).where('tour_id', '==', Number(id)).get();
            const batch = db.batch();
            snap.forEach(d => batch.delete(d.ref));
            await batch.commit();
        };
        await Promise.all([
            deleteRelated('members'),
            deleteRelated('collections'),
            deleteRelated('expenses'),
            deleteRelated('donations'),
            deleteRelated('gallery')
        ]);
        return { success: true };
    },

    // ----------------- MEMBERS -----------------
    getMembers: async (tourId) => {
        const snap = await db.collection('members')
            .where('tour_id', '==', Number(tourId))
            .get();
        const list = [];
        snap.forEach(doc => {
            const data = doc.data();
            list.push({ ...data, id: Number(data.id || doc.id) });
        });
        return list.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
    },

    addMember: async (body) => {
        const id = Number(body.id) || generateNumericId();
        const docData = {
            ...body,
            id: id,
            tour_id: Number(body.tour_id),
            created_at: body.created_at || new Date().toISOString()
        };
        await db.collection('members').doc(String(id)).set(docData);
        return [docData];
    },

    updateMember: async (id, body) => {
        const docRef = db.collection('members').doc(String(id));
        await docRef.set(body, { merge: true });
        const updated = await docRef.get();
        return [updated.data()];
    },

    deleteMember: async (id) => {
        await db.collection('members').doc(String(id)).delete();
        // Cascade delete collections of this member
        const snap = await db.collection('collections').where('member_id', '==', Number(id)).get();
        const batch = db.batch();
        snap.forEach(d => batch.delete(d.ref));
        await batch.commit();
        return { success: true };
    },

    // ----------------- COLLECTIONS -----------------
    getCollections: async (tourId) => {
        const snap = await db.collection('collections')
            .where('tour_id', '==', Number(tourId))
            .get();
        const list = [];
        snap.forEach(doc => {
            const data = doc.data();
            list.push({ ...data, id: Number(data.id || doc.id) });
        });
        return list.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
    },

    addCollection: async (body) => {
        const id = Number(body.id) || generateNumericId();
        const docData = {
            ...body,
            id: id,
            tour_id: Number(body.tour_id),
            member_id: Number(body.member_id),
            amount: Number(body.amount) || 0,
            payment_date: body.payment_date || new Date().toISOString().split('T')[0],
            payment_method: body.payment_method || 'Cash'
        };
        await db.collection('collections').doc(String(id)).set(docData);
        return [docData];
    },

    updateCollection: async (id, body) => {
        const docRef = db.collection('collections').doc(String(id));
        const cleanBody = { ...body };
        if (cleanBody.amount !== undefined) cleanBody.amount = Number(cleanBody.amount);
        await docRef.set(cleanBody, { merge: true });
        const updated = await docRef.get();
        return [updated.data()];
    },

    deleteCollection: async (id) => {
        await db.collection('collections').doc(String(id)).delete();
        return { success: true };
    },

    // ----------------- EXPENSES -----------------
    getExpenses: async (tourId) => {
        const snap = await db.collection('expenses')
            .where('tour_id', '==', Number(tourId))
            .get();
        const list = [];
        snap.forEach(doc => {
            const data = doc.data();
            list.push({ ...data, id: Number(data.id || doc.id) });
        });
        return list.sort((a, b) => {
            if (b.expense_date !== a.expense_date) {
                return (b.expense_date || '').localeCompare(a.expense_date || '');
            }
            return (Number(b.id) || 0) - (Number(a.id) || 0);
        });
    },

    addExpense: async (body) => {
        const id = Number(body.id) || generateNumericId();
        const docData = {
            ...body,
            id: id,
            tour_id: Number(body.tour_id),
            amount: Number(body.amount) || 0,
            paid_by_member_id: body.paid_by_member_id ? Number(body.paid_by_member_id) : null,
            expense_date: body.expense_date || new Date().toISOString().split('T')[0]
        };
        await db.collection('expenses').doc(String(id)).set(docData);
        return [docData];
    },

    updateExpense: async (id, body) => {
        const docRef = db.collection('expenses').doc(String(id));
        const cleanBody = { ...body };
        if (cleanBody.amount !== undefined) cleanBody.amount = Number(cleanBody.amount);
        if (cleanBody.paid_by_member_id !== undefined) {
            cleanBody.paid_by_member_id = cleanBody.paid_by_member_id ? Number(cleanBody.paid_by_member_id) : null;
        }
        await docRef.set(cleanBody, { merge: true });
        const updated = await docRef.get();
        return [updated.data()];
    },

    deleteExpense: async (id) => {
        await db.collection('expenses').doc(String(id)).delete();
        return { success: true };
    },

    reimburseExpense: async (id) => {
        const docRef = db.collection('expenses').doc(String(id));
        await docRef.set({ paid_by_member_id: null }, { merge: true });
        const updated = await docRef.get();
        return [updated.data()];
    },

    // ----------------- DONATIONS -----------------
    getDonations: async (tourId) => {
        const snap = await db.collection('donations')
            .where('tour_id', '==', Number(tourId))
            .get();
        const list = [];
        snap.forEach(doc => {
            const data = doc.data();
            list.push({ ...data, id: Number(data.id || doc.id) });
        });
        return list.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    },

    addDonation: async (body) => {
        const id = Number(body.id) || generateNumericId();
        const docData = {
            ...body,
            id: id,
            tour_id: Number(body.tour_id),
            amount: Number(body.amount) || 0,
            donation_date: body.donation_date || new Date().toISOString().split('T')[0]
        };
        await db.collection('donations').doc(String(id)).set(docData);
        return [docData];
    },

    updateDonation: async (id, body) => {
        const docRef = db.collection('donations').doc(String(id));
        const cleanBody = { ...body };
        if (cleanBody.amount !== undefined) cleanBody.amount = Number(cleanBody.amount);
        await docRef.set(cleanBody, { merge: true });
        const updated = await docRef.get();
        return [updated.data()];
    },

    deleteDonation: async (id) => {
        await db.collection('donations').doc(String(id)).delete();
        return { success: true };
    },

    // ----------------- GALLERY -----------------
    getGallery: async (tourId) => {
        const snap = await db.collection('gallery')
            .where('tour_id', '==', Number(tourId))
            .get();
        const list = [];
        snap.forEach(doc => {
            const data = doc.data();
            list.push({ ...data, id: Number(data.id || doc.id) });
        });
        return list.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    },

    addGallery: async (body) => {
        const id = Number(body.id) || generateNumericId();
        const docData = {
            ...body,
            id: id,
            tour_id: Number(body.tour_id),
            created_at: body.created_at || new Date().toISOString()
        };
        await db.collection('gallery').doc(String(id)).set(docData);
        return [docData];
    },

    deleteGallery: async (id) => {
        await db.collection('gallery').doc(String(id)).delete();
        return { success: true };
    },

    // ----------------- IMGBB UPLOAD -----------------
    uploadImgBb: async (rawBase64) => {
        const formData = new FormData();
        formData.append('key', '6d207e02198a847aa98d0a2a901485a5');
        formData.append('image', rawBase64);
        const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
        const json = await res.json();
        if (json && json.data && json.data.url) {
            return json.data.url;
        }
        throw new Error('ImgBB upload failed');
    }
};

// Expose as both FirebaseApi and SupabaseApi so existing app.js works seamlessly
window.FirebaseApi = FirebaseApi;
window.SupabaseApi = FirebaseApi;
