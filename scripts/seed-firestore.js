/**
 * Direct Firestore Seeder Script
 * Run with: node scripts/seed-firestore.js
 * 
 * This seeds the Firestore emulator with sample financial transactions.
 */

const admin = require('firebase-admin');

// Connect to the Firestore emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

// Initialize Firebase Admin with a dummy project (we're using the emulator)
admin.initializeApp({
    projectId: 'studio-9381016045-4d625'
});

const db = admin.firestore();

const COMPANIES = ['SGG-001', 'SGG-002', 'SGG-003'];
const DEPARTMENTS = ['IT Ops', 'Marketing', 'Logistics', 'HR', 'Sales', 'R&D', 'Legal', 'Admin', 'Finance'];
const CATEGORIES = {
    'Revenue': ['Product Sales', 'Service Revenue', 'Licensing'],
    'Expenses': ['Salaries', 'Rent', 'Utilities', 'Marketing', 'Travel', 'Software'],
    'COGS': ['Raw Materials', 'Manufacturing', 'Distribution'],
    'Assets': ['Cash', 'Accounts Receivable', 'Equipment'],
    'Liabilities': ['Accounts Payable', 'Loans', 'Accrued Expenses'],
};

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateTransactions(companyId, period, count = 50) {
    const transactions = [];
    const [year, month] = period.split('-').map(Number);

    for (let i = 0; i < count; i++) {
        const category = randomChoice(Object.keys(CATEGORIES));
        const subCategory = randomChoice(CATEGORIES[category]);
        const department = randomChoice(DEPARTMENTS);

        let amount;
        if (category === 'Revenue') {
            amount = 5000 + Math.random() * 145000;
        } else if (['Expenses', 'COGS'].includes(category)) {
            amount = 1000 + Math.random() * 49000;
        } else {
            amount = 10000 + Math.random() * 490000;
        }

        const day = 1 + Math.floor(Math.random() * 28);
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        transactions.push({
            transaction_id: `TX-${companyId}-${period.replace('-', '')}-${String(i).padStart(4, '0')}`,
            company_id: companyId,
            date: dateStr,
            category,
            sub_category: subCategory,
            department,
            amount: Math.round(amount * 100) / 100,
            amount_gel: Math.round(amount * 100) / 100,
            currency: 'GEL',
            description: `${subCategory} - ${department}`,
            counterparty: `Vendor-${100 + Math.floor(Math.random() * 900)}`,
            account: `${1000 + Math.floor(Math.random() * 9000)}-${category.substring(0, 3).toUpperCase()}`,
            entry_type: ['Expenses', 'COGS', 'Assets'].includes(category) ? 'Debit' : 'Credit',
            created_at: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    return transactions;
}

async function seedFirestore() {
    console.log('🌱 Starting FinSight Data Seeder...');
    console.log('📡 Connecting to Firestore emulator at 127.0.0.1:8080\n');

    const periods = ['2023-10', '2023-11', '2023-12'];
    let totalCreated = 0;

    try {
        for (const company of COMPANIES) {
            for (const period of periods) {
                console.log(`📊 Generating ${company} / ${period}...`);
                const transactions = generateTransactions(company, period, 50);

                const batch = db.batch();
                for (const tx of transactions) {
                    const docRef = db.collection('financial_transactions').doc(tx.transaction_id);
                    batch.set(docRef, tx);
                }

                await batch.commit();
                totalCreated += transactions.length;
                console.log(`   ✅ Created ${transactions.length} transactions`);
            }
        }

        // Create company registry
        console.log('\n🏢 Creating company registry...');
        for (const company of COMPANIES) {
            await db.collection('companies').doc(company).set({
                id: company,
                name: `Company ${company}`,
                currency: 'GEL',
                fiscal_year_end: '12-31',
                created_at: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`   ✅ Created company: ${company}`);
        }

        console.log(`\n🎉 Seeding complete! Total transactions: ${totalCreated}`);
        console.log('📌 Data is now available in your Firestore emulator.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedFirestore();
