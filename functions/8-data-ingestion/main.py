import os
import json
import logging
import csv
import io
import datetime
from firebase_functions import https_fn, options
from werkzeug.utils import secure_filename
import firebase_admin
from firebase_admin import credentials, initialize_app

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firebase Admin
if not firebase_admin._apps:
    initialize_app()

# Lazy Global for Firestore
db = None

def get_db():
    global db
    if db is None:
        from google.cloud import firestore
        db = firestore.Client()
    return db

def check_period_lock(company_id: str, period: str) -> bool:
    """
    Checks if a financial period is 'Locked' by the CFO.
    Period format: YYYY-MM
    """
    try:
        db_client = get_db()
        lock_ref = db_client.collection('period_controls').document(f"{company_id}_{period}")
        doc = lock_ref.get()
        if doc.exists:
            return doc.to_dict().get('status') == 'Locked'
        return False
    except Exception as e:
        logger.error(f"Lock Check Error: {e}")
        return False

def log_audit_event(user_id: str, action: str, details: dict):
    """
    Records a governance audit event.
    """
    try:
        db_client = get_db()
        from google.cloud import firestore
        db_client.collection('governance_audit').add({
            'user_id': user_id,
            'action': action,
            'details': details,
            'timestamp': firestore.SERVER_TIMESTAMP
        })
    except Exception as e:
        logger.error(f"Audit Log Error: {e}")

def validate_data(rows) -> bool:
    if not rows:
        return True
    
    # Normalize keys of the first row to check for existence
    first_row_keys = [k.lower().strip().replace(' ', '_') for k in rows[0].keys()]
    
    has_date = any(col in first_row_keys for col in ['date', 'doc_date', 'document_date', 'posting_date', 'day'])
    has_amount = any(col in first_row_keys for col in ['amount', 'value', 'amount_gel', 'dmbtr', 'balance', 'turnover'])
    
    if not has_date or not has_amount:
         logger.warning(f"Validation Soft-Fail: Missing crucial date/amount columns. Found: {list(first_row_keys)}")
         return True 
    return True

def get_mapping_rules():
    """Fetch Mapping Rules from Firestore"""
    mapping_dict = {}
    try:
        db_client = get_db()
        rules_ref = db_client.collection('mapping_rules')
        rules_docs = rules_ref.stream()
        
        for doc in rules_docs:
            data = doc.to_dict()
            if 'rawField' in data and 'targetField' in data:
                mapping_dict[data['rawField'].lower()] = data['targetField']
                
        logger.info(f"Loaded {len(mapping_dict)} mapping rules from Firestore.")
    except Exception as e:
        logger.error(f"Error loading mapping rules: {e}")
    return mapping_dict

def map_row(row, mapping_dict):
    """Refactored logic for processing a single row dict"""
    # Normalize keys first
    norm_row = {k.lower().strip().replace(' ', '_'): v for k, v in row.items()}
    
    # 1. Company Mapping
    company_id = 'SGG-001' # Default
    entity_vals = []
    for col in ['entity', 'company', 'organization', 'branch', 'sub']:
        if col in norm_row:
            entity_vals.append(str(norm_row[col]))
    
    entity_str = " ".join(entity_vals)
    if any(x in entity_str for x in ['Export', 'SOG', 'SGG-002']): company_id = 'SGG-002'
    elif any(x in entity_str for x in ['Telav', 'SGG-003']): company_id = 'SGG-003'
    
    norm_row['company_id'] = company_id
    
    # 2. Category Mapping
    gl = str(norm_row.get('gl_account', norm_row.get('gl', ''))).strip()
    desc = str(norm_row.get('description', norm_row.get('memo', ''))).lower()
    
    category = 'Unmapped'
    sub_category = 'Unmapped'
    
    # Priority 1: Dynamic Validation matches
    mapped = False
    for raw, target in mapping_dict.items():
        if raw in desc or (gl and raw == gl):
            if '>' in target:
                parts = [p.strip() for p in target.split('>')]
                category, sub_category = parts[0], parts[1]
            else:
                category, sub_category = target, 'General'
            mapped = True
            break
    
    # Priority 2: Hardcoded Fallback
    if not mapped:
        if gl.startswith('4'):
            if 'social' in desc or '4001' in gl: 
                category, sub_category = 'Revenue', 'Social Gas Sales'
            else:
                category, sub_category = 'Revenue', 'Other Revenue'
        elif gl.startswith('5'):
            if 'cost' in desc and 'social' in desc: 
                category, sub_category = 'COGS', 'Cost of Social Gas'
            else:
                category, sub_category = 'Expenses', 'Operating Expenses'
        elif gl.startswith('1'): category, sub_category = 'Assets', 'Current Assets'
        elif gl.startswith('2'): category, sub_category = 'Liabilities', 'Current Liabilities'
        elif gl.startswith('3'): category, sub_category = 'Equity', 'Retained Earnings'
    
    norm_row['category'] = category
    norm_row['sub_category'] = sub_category
    
    # 3. Department
    dept = str(norm_row.get('department', '')).lower()
    if 'tech' in dept: norm_row['department'] = 'Technical Department'
    elif 'fin' in dept: norm_row['department'] = 'Finance Department'
    elif 'ops' in dept or 'oper' in dept: norm_row['department'] = 'Operations Department'
    else: norm_row['department'] = 'General'
    
    # 4. Date & Amount Normalization
    # Date
    date_val = norm_row.get('date', '')
    if not date_val:
        date_val = datetime.date.today().isoformat()
    norm_row['date'] = str(date_val)
    
    # Amount
    try:
        raw_amt = float(norm_row.get('amount', 0))
    except (ValueError, TypeError):
        raw_amt = 0.0
        
    currency = str(norm_row.get('currency', 'GEL')).upper()
    rate = 2.7 if currency == 'USD' else (3.0 if currency == 'EUR' else 1.0)
    norm_row['amount_gel'] = raw_amt * rate
    
    return norm_row

def generate_ledger_entries_for_row(row):
    """Generates Double-Entry Ledger Rows (Debit/Credit) for a single transformed row"""
    cat = row.get('category', 'Unmapped')
    sub = row.get('sub_category', 'General')
    
    base_txn = row.copy()
    
    debit_entry = base_txn.copy()
    credit_entry = base_txn.copy()
    
    debit_entry['entry_type'] = 'Debit'
    credit_entry['entry_type'] = 'Credit'
    
    if cat == 'Revenue':
        credit_entry['account'] = sub 
        debit_entry['account'] = 'Accounts Receivable'
    elif cat in ['Expenses', 'COGS']:
        debit_entry['account'] = sub 
        credit_entry['account'] = 'Accounts Payable'
    elif cat == 'Assets':
        debit_entry['account'] = sub
        credit_entry['account'] = 'Cash' 
    elif cat == 'Liabilities':
        credit_entry['account'] = sub
        debit_entry['account'] = 'Cash' 
    else: 
        debit_entry['account'] = 'Unmapped'
        credit_entry['account'] = 'Suspense Account'

    return [debit_entry, credit_entry]


def store_data(records, filename: str):
    # Store in Firestore 'financial_transactions' collection
    from google.cloud import firestore
    
    client = get_db()
    batch = client.batch()
    collection_ref = client.collection('financial_transactions')
    
    count = 0
    for record in records:
        record['source_file'] = filename
        record['ingested_at'] = firestore.SERVER_TIMESTAMP
        
        doc_id = str(record.get('transaction_id', ''))
        if doc_id and doc_id != 'nan':
            doc_ref = collection_ref.document(doc_id)
        else:
            doc_ref = collection_ref.document()
            
        batch.set(doc_ref, record)
        count += 1
        
        if count >= 400:
            batch.commit()
            batch = client.batch()
            count = 0
            
    if count > 0:
        batch.commit()

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["post", "options"]),
    timeout_sec=300,
    memory=options.MemoryOption.MB_512,
)
def ingest_data(req: https_fn.Request) -> https_fn.Response:
    """
    HTTP Entrypoint for Data Ingestion.
    """
    try:
        import openpyxl
        
        file_stream = None
        filename = ""

        # Check for JSON Body (Storage Trigger from Frontend)
        json_data = req.get_json(silent=True)
        user_id = json_data.get('userId', 'anonymous') if json_data else 'anonymous'
        
        if json_data and 'storagePath' in json_data:
            storage_path = json_data['storagePath']
            bucket_name = json_data.get('bucket')
            filename = secure_filename(os.path.basename(storage_path))

            logger.info(f"Processing from Storage: {bucket_name}/{storage_path}")

            from firebase_admin import storage
            bucket = storage.bucket(bucket_name)
            blob = bucket.blob(storage_path)
            
            # Download to memory
            file_stream = io.BytesIO()
            blob.download_to_file(file_stream)
            file_stream.seek(0)
            
        elif 'file' in req.files:
            file_wrapper = req.files['file']
            if file_wrapper.filename == '':
                 return https_fn.Response(json.dumps({"error": "No selected file"}), status=400, headers={"Content-Type": "application/json"})
            
            filename = secure_filename(file_wrapper.filename)
            file_stream = file_wrapper # FileStorage
        else:
            return https_fn.Response(json.dumps({"error": "No file or storagePath provided"}), status=400, headers={"Content-Type": "application/json"})

        # Read file
        raw_rows = []
        if filename.endswith('.csv'):
            if isinstance(file_stream, io.BytesIO):
                text_stream = io.TextIOWrapper(file_stream, encoding='utf-8')
            else:
                # Flask FileStorage
                file_stream.seek(0)
                text_stream = io.TextIOWrapper(file_stream, encoding='utf-8')
                
            reader = csv.DictReader(text_stream)
            raw_rows = [row for row in reader]
            
        elif filename.endswith(('.xls', '.xlsx')):
             # OpenPyXL requires file-like object
             wb = openpyxl.load_workbook(file_stream, data_only=True)
             ws = wb.active
             rows_iter = ws.iter_rows(values_only=True)
             headers = next(rows_iter, None)
             if headers:
                 headers = [str(h) for h in headers if h is not None]
                 for row in rows_iter:
                     record = {}
                     for i, val in enumerate(row):
                         if i < len(headers):
                             record[headers[i]] = val
                     raw_rows.append(record)

        elif filename.endswith('.pdf'):
            from pypdf import PdfReader
            pdf_bytes = io.BytesIO(file_stream.read())
            reader = PdfReader(pdf_bytes)
            text_content = ""
            for page in reader.pages:
                text_content += page.extract_text() + "\n"
            
            raw_rows = [{'content': text_content, 'type': 'unstructured_pdf_text'}]
            
            # Special case for PDF: just separate flow
            store_data(raw_rows, filename)
            return https_fn.Response(json.dumps({
                "message": "PDF ingested successfully (Text Extracted)",
                "rows_processed": 1,
                "preview": text_content[:200] + "..."
            }), status=201, headers={"Content-Type": "application/json"})
            
        else:
             return https_fn.Response(json.dumps({"error": "Unsupported file format."}), status=400, headers={"Content-Type": "application/json"})
             
        # Validate
        if not validate_data(raw_rows):
             return https_fn.Response(json.dumps({"error": "Validation failed"}), status=400, headers={"Content-Type": "application/json"})
             
        # Transform & Map
        mapping_rules = get_mapping_rules()
        transformed_ledger = []
        
        # Track contexts for locking
        contexts = set()
        
        for row in raw_rows:
            # Map
            mapped_row = map_row(row, mapping_rules)
            
            # Check context
            if 'date' in mapped_row and 'company_id' in mapped_row:
                 month_period = mapped_row['date'][:7] # YYYY-MM
                 contexts.add((mapped_row['company_id'], month_period))

            # Generate Ledger
            entries = generate_ledger_entries_for_row(mapped_row)
            transformed_ledger.extend(entries)
        
        # Check Locks
        for company_id, month_period in contexts:
            if check_period_lock(company_id, month_period):
                 return https_fn.Response(json.dumps({
                     "error": f"Governance Violation: Period {month_period} is LOCKED for {company_id}."
                 }), status=403, headers={"Content-Type": "application/json"})

        # Metrics
        total_value = sum(float(r.get('amount_gel', 0)) for r in transformed_ledger if r.get('entry_type') == 'Debit') # Sum Debits only
        
        log_audit_event(user_id, 'INGESTION_COMPLETED', {
            'filename': filename,
            'row_count': len(transformed_ledger),
            'unique_raw_rows': len(raw_rows)
        })
        
        # Store
        store_data(transformed_ledger, filename)
        
        return https_fn.Response(json.dumps({
            "message": "Data ingested successfully",
            "rows_processed": len(transformed_ledger),
            "total_value_gel": total_value,
            "columns": list(transformed_ledger[0].keys()) if transformed_ledger else []
        }), status=201, headers={"Content-Type": "application/json"})

    except Exception as e:
        logger.error(f"Ingestion Error: {e}")
        return https_fn.Response(json.dumps({"error": str(e)}), status=500, headers={"Content-Type": "application/json"})
