/* assets/js/supabase-api.js - Direct Supabase Rest API Client */

const SUPABASE_URL = "https://dvrzghulbaidbmwnnbxv.supabase.co/rest/v1";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2cnpnaHVsYmFpZGJtd25uYnh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NTk3NTMsImV4cCI6MjEwMTMzNTc1M30.fk4kOUFW7NFDDDtuHbiYZbhZ-pkDxn3M63prw1OkYgE";

async function supabaseFetch(endpoint, options = {}) {
    const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...(options.headers || {})
    };

    const url = `${SUPABASE_URL}/${endpoint}`;
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
        let errText = "";
        try { errText = await response.text(); } catch (e) {}
        throw new Error(`Supabase API Error (${response.status}): ${errText}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : [];
}

// ApiService API Methods
const SupabaseApi = {
    getTours: () => supabaseFetch('tours?select=*&order=id.desc'),
    addTour: (body) => supabaseFetch('tours', { method: 'POST', body: JSON.stringify(body) }),
    updateTour: (id, body) => supabaseFetch(`tours?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    deleteTour: (id) => supabaseFetch(`tours?id=eq.${id}`, { method: 'DELETE' }),
    
    getMembers: (tourId) => supabaseFetch(`members?tour_id=eq.${tourId}`),
    addMember: (body) => supabaseFetch('members', { method: 'POST', body: JSON.stringify(body) }),
    deleteMember: (id) => supabaseFetch(`members?id=eq.${id}`, { method: 'DELETE' }),

    getCollections: (tourId) => supabaseFetch(`collections?tour_id=eq.${tourId}`),
    addCollection: (body) => supabaseFetch('collections', { method: 'POST', body: JSON.stringify(body) }),
    updateCollection: (id, body) => supabaseFetch(`collections?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    deleteCollection: (id) => supabaseFetch(`collections?id=eq.${id}`, { method: 'DELETE' }),

    getExpenses: (tourId) => supabaseFetch(`expenses?tour_id=eq.${tourId}&order=expense_date.desc,id.desc`),
    addExpense: (body) => supabaseFetch('expenses', { method: 'POST', body: JSON.stringify(body) }),
    updateExpense: (id, body) => supabaseFetch(`expenses?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    deleteExpense: (id) => supabaseFetch(`expenses?id=eq.${id}`, { method: 'DELETE' }),
    reimburseExpense: (id) => supabaseFetch(`expenses?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ paid_by_member_id: null }) }),

    getDonations: (tourId) => supabaseFetch(`donations?tour_id=eq.${tourId}&order=donation_date.desc,id.desc`),
    addDonation: (body) => supabaseFetch('donations', { method: 'POST', body: JSON.stringify(body) }),
    updateDonation: (id, body) => supabaseFetch(`donations?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    deleteDonation: (id) => supabaseFetch(`donations?id=eq.${id}`, { method: 'DELETE' }),

    getGallery: (tourId) => supabaseFetch(`gallery?tour_id=eq.${tourId}&order=id.desc`),
    addGallery: (body) => supabaseFetch('gallery', { method: 'POST', body: JSON.stringify(body) }),
    deleteGallery: (id) => supabaseFetch(`gallery?id=eq.${id}`, { method: 'DELETE' }),

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
