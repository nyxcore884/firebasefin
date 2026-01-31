import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

const COMPANIES = ['SGG-001', 'SGG-002', 'SGG-003'];
const DEPARTMENTS = ['IT Ops', 'Marketing', 'Logistics', 'HR', 'Sales', 'R&D', 'Legal', 'Admin', 'Finance'];
const CATEGORIES: Record<string, string[]> = {
    'Revenue': ['Product Sales', 'Service Revenue', 'Licensing'],
    'Expenses': ['Salaries', 'Rent', 'Utilities', 'Marketing', 'Travel', 'Software'],
    'COGS': ['Raw Materials', 'Manufacturing', 'Distribution'],
    'Assets': ['Cash', 'Accounts Receivable', 'Equipment'],
    'Liabilities': ['Accounts Payable', 'Loans', 'Accrued Expenses'],
};

function randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateTransactions(companyId: string, period: string, count: number = 50) {
    const transactions: any[] = [];
    const [year, month] = period.split('-').map(Number);

    for (let i = 0; i < count; i++) {
        const category = randomChoice(Object.keys(CATEGORIES));
        const subCategory = randomChoice(CATEGORIES[category]);
        const department = randomChoice(DEPARTMENTS);

        let amount: number;
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
        });
    }

    return transactions;
}

export async function seedFirestore(): Promise<{ success: boolean; count: number }> {
    console.log('🌱 Starting FinSight Data Seeder...');

    const periods = ['2023-10', '2023-11', '2023-12'];
    let totalCreated = 0;

    try {
        for (const company of COMPANIES) {
            for (const period of periods) {
                console.log(`📊 Generating ${company} / ${period}...`);
                const transactions = generateTransactions(company, period, 50);

                const batch = writeBatch(db);
                for (const tx of transactions) {
                    const docRef = doc(db, 'financial_transactions', tx.transaction_id);
                    batch.set(docRef, {
                        ...tx,
                        created_at: serverTimestamp()
                    });
                }

                await batch.commit();
                totalCreated += transactions.length;
                console.log(`   ✅ Created ${transactions.length} transactions`);
            }
        }

        // Create company registry
        console.log('\n🏢 Creating company registry...');
        for (const company of COMPANIES) {
            await setDoc(doc(db, 'companies', company), {
                id: company,
                name: `Company ${company}`,
                currency: 'GEL',
                fiscal_year_end: '12-31',
                created_at: serverTimestamp()
            });
        }

        console.log(`\n🎉 Seeding complete! Total transactions: ${totalCreated}`);
        return { success: true, count: totalCreated };
    } catch (error) {
        console.error('Seeding failed:', error);
        return { success: false, count: 0 };
    }
}
