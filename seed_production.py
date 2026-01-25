
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
import random
import os

# DO NOT set FIRESTORE_EMULATOR_HOST variable to target Production

print("🚀 Initializing Production Data Seeder...")

# Initialize without explicit creds (uses Google Application Default Credentials from 'firebase login')
if not firebase_admin._apps:
    app = firebase_admin.initialize_app(options={
        'projectId': 'studio-9381016045-4d625',
    })
    
db = firestore.client()

# Configuration
COMPANIES = ['SGG-001', 'SGG-002', 'SGG-003']
DEPARTMENTS = ['IT Ops', 'Marketing', 'Logistics', 'HR', 'Sales', 'R&D', 'Legal', 'Admin', 'Finance']
CATEGORIES = {
    'Revenue': ['Product Sales', 'Service Revenue', 'Licensing'],
    'Expenses': ['Salaries', 'Rent', 'Utilities', 'Marketing', 'Travel', 'Software'],
    'COGS': ['Raw Materials', 'Manufacturing', 'Distribution'],
    'Assets': ['Cash', 'Accounts Receivable', 'Equipment'],
    'Liabilities': ['Accounts Payable', 'Loans', 'Accrued Expenses'],
}

def generate_transactions(company_id: str, period: str, count: int = 100):
    """Generate realistic financial transactions."""
    transactions = []
    
    # Handle month calculation
    year, month = map(int, period.split('-'))
    base_date = datetime(year, month, 1)
    
    for i in range(count):
        category = random.choice(list(CATEGORIES.keys()))
        sub_category = random.choice(CATEGORIES[category])
        department = random.choice(DEPARTMENTS)
        
        # Generate amount based on category
        if category == 'Revenue':
            amount = random.uniform(5000, 150000)
        elif category in ['Expenses', 'COGS']:
            amount = random.uniform(1000, 50000)
        else:
            amount = random.uniform(10000, 500000)
        
        # Random date within the month
        day_offset = random.randint(0, 27)
        tx_date = base_date + timedelta(days=day_offset)
        
        tx_id = f'TX-{company_id}-{period.replace("-", "")}-{i:04d}'
        
        transaction = {
            'id': tx_id, # Frontend expects 'id'
            'transaction_id': tx_id,
            'company_id': company_id,
            'period': period, # Explicit period field heavily used by reporting
            'date': tx_date.strftime('%Y-%m-%d'),
            'category': category,
            'sub_category': sub_category,
            'department': department,
            'amount': round(amount, 2),
            'amount_gel': round(amount, 2),  # For GEL-based calculations
            'currency': 'GEL',
            'description': f'{sub_category} - {department}',
            'counterparty': f'Vendor-{random.randint(100, 999)}',
            'gl_account': f'{random.randint(1000, 9999)}', # Added for consistency
            'type': 'Debit' if category in ['Expenses', 'COGS', 'Assets'] else 'Credit',
            'timestamp': firestore.SERVER_TIMESTAMP
        }
        transactions.append(transaction)
    
    return transactions

def seed_production():
    """Seed Firestore with sample transactions."""
    
    periods = ['2023-10', '2023-11', '2023-12'] # Q4 Data
    total_created = 0
    
    for company in COMPANIES:
        # 1. Create Company Doc
        print(f"🏢 Registering {company}...")
        db.collection('companies').document(company).set({
            'id': company,
            'name': f'SOCAR Georgia {company.split("-")[1]}',
            'currency': 'GEL',
            'fiscal_year_end': '12-31',
            'created_at': firestore.SERVER_TIMESTAMP
        })

        # 2. Create Transactions
        for period in periods:
            print(f"   📊 Generating transactions for {period}...")
            # Reduced count for faster seeding
            transactions = generate_transactions(company, period, count=30) 
            
            batch = db.batch()
            count = 0
            for tx in transactions:
                doc_ref = db.collection('financial_transactions').document(tx['transaction_id'])
                batch.set(doc_ref, tx)
                count += 1
                if count >= 400: # Firestore batch limit is 500
                    batch.commit()
                    batch = db.batch()
                    count = 0
            
            if count > 0:
                batch.commit()
                
            total_created += len(transactions)
            
    print(f"\n✅ Production Seeding Complete! Injected {total_created} transactions.")
    print("   Refresh your hosted application to see the data.")

if __name__ == '__main__':
    seed_production()
