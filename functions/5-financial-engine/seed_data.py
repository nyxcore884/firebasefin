"""
FinSight Enterprise - Financial Data Seeder
Populates Firestore with realistic financial transactions for demo/testing.

Usage:
  cd functions/5-financial-engine
  python seed_data.py
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
import random
import os

# Force Firestore Emulator
os.environ['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080'

# Initialize Firebase
if not firebase_admin._apps:
    firebase_admin.initialize_app()

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
    base_date = datetime.strptime(f"{period}-01", "%Y-%m-%d")
    
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
        day_offset = random.randint(0, 28)
        tx_date = base_date + timedelta(days=day_offset)
        
        transaction = {
            'transaction_id': f'TX-{company_id}-{period.replace("-", "")}-{i:04d}',
            'company_id': company_id,
            'date': tx_date.strftime('%Y-%m-%d'),
            'category': category,
            'sub_category': sub_category,
            'department': department,
            'amount': round(amount, 2),
            'amount_gel': round(amount, 2),  # For GEL-based calculations
            'currency': 'GEL',
            'description': f'{sub_category} - {department}',
            'counterparty': f'Vendor-{random.randint(100, 999)}',
            'account': f'{random.randint(1000, 9999)}-{category[:3].upper()}',
            'entry_type': 'Debit' if category in ['Expenses', 'COGS', 'Assets'] else 'Credit',
            'created_at': firestore.SERVER_TIMESTAMP
        }
        transactions.append(transaction)
    
    return transactions

def seed_firestore():
    """Seed Firestore with sample transactions."""
    print("🌱 Starting FinSight Data Seeder...")
    
    # Generate for multiple companies and periods
    periods = ['2023-10', '2023-11', '2023-12']
    total_created = 0
    
    for company in COMPANIES:
        for period in periods:
            print(f"📊 Generating {company} / {period}...")
            transactions = generate_transactions(company, period, count=50)
            
            # Batch write for efficiency
            batch = db.batch()
            for tx in transactions:
                doc_ref = db.collection('financial_transactions').document(tx['transaction_id'])
                batch.set(doc_ref, tx)
            
            batch.commit()
            total_created += len(transactions)
            print(f"   ✅ Created {len(transactions)} transactions")
    
    # Also create company registry
    print("\n🏢 Creating company registry...")
    for company in COMPANIES:
        db.collection('companies').document(company).set({
            'id': company,
            'name': f'Company {company}',
            'currency': 'GEL',
            'fiscal_year_end': '12-31',
            'created_at': firestore.SERVER_TIMESTAMP
        })
    print(f"   ✅ Created {len(COMPANIES)} companies")
    
    print(f"\n🎉 Seeding complete! Total transactions: {total_created}")
    print("   Now refresh your Dashboard to see real data.")

if __name__ == '__main__':
    seed_firestore()
