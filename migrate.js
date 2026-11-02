// web/migrate.js - Node.js CLI script to migrate data from Supabase to Firebase Firestore

const https = require('https');

const SUPABASE_PROJECT_ID = "dvrzghulbaidbmwnnbxv";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2cnpnaHVsYmFpZGJtd25uYnh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NTk3NTMsImV4cCI6MjEwMTMzNTc1M30.fk4kOUFW7NFDDDtuHbiYZbhZ-pkDxn3M63prw1OkYgE";
const FIREBASE_PROJECT_ID = "tour-costing-3ca03";
const FIREBASE_API_KEY = "AIzaSyDV2r3u1QH1_oKLKNCYQbc0rwOFaSTYQTQ";

function fetchSupabase(table) {
    return new Promise((resolve, reject) => {
        const url = `https://${SUPABASE_PROJECT_ID}.supabase.co/rest/v1/${table}?select=*`;
        const req = https.get(url, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error(`Failed to parse JSON for ${table}: ${data}`));
                    }
                } else {
                    reject(new Error(`Supabase returned status ${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', reject);
    });
}

async function run() {
    console.log("==========================================");
    console.log("  Supabase to Firebase Data Migration     ");
    console.log("==========================================");

    const tables = ['tours', 'members', 'collections', 'expenses', 'donations', 'gallery'];

    for (const table of tables) {
        console.log(`\nFetching ${table} from Supabase...`);
        try {
            const records = await fetchSupabase(table);
            console.log(`Found ${records.length} records in ${table}.`);
        } catch (e) {
            console.error(`Error fetching ${table}:`, e.message);
        }
    }
}

run();
