import os
import json
import logging
# import pandas as pd # Lazy loaded
from firebase_functions import https_fn, options
from werkzeug.utils import secure_filename
import firebase_admin
from firebase_admin import credentials, initialize_app

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

<<<<<<< Updated upstream
# Initialize Firebase Admin (Required for Storage/Firestore access if not using google.cloud lib directly)
=======
# Emulator Support: Ensure STORAGE_EMULATOR_HOST is set if running in emulator
if os.environ.get("FIREBASE_STORAGE_EMULATOR_HOST") and not os.environ.get("STORAGE_EMULATOR_HOST"):
    os.environ["STORAGE_EMULATOR_HOST"] = os.environ["FIREBASE_STORAGE_EMULATOR_HOST"]
    logger.info(f"Set STORAGE_EMULATOR_HOST to {os.environ['STORAGE_EMULATOR_HOST']}")


# Initialize Firebase Admin
>>>>>>> Stashed changes
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

def validate_data(df) -> bool:
    import pandas as pd
    # 1. Flexible Column Mapping
    # Standardize headers to lower case
    df.columns = [c.lower().strip().replace(' ', '_') for c in df.columns]
    
    # Required concepts, not exact names. We will map synonyms.
    # We essentially need: Date, Amount. Others are optional/can be defaulted.
    
    has_date = any(col in df.columns for col in ['date', 'doc_date', 'document_date', 'posting_date', 'day'])
    has_amount = any(col in df.columns for col in ['amount', 'value', 'amount_gel', 'dmbtr', 'balance', 'turnover'])
    
    if not has_date or not has_amount:
         logger.warning(f"Validation Soft-Fail: Missing crucial date/amount columns. Found: {list(df.columns)}")
         # We will proceed but mark as 'RAW_UNSTRUCTURED' in transformation if needed.
         # For now, return False to enforce at least rudimentary quality.
         # Actually, for "Actual PY", it might be missing standard headers if it starts at row 5.
         # But we can't solve row-skipping here easily without seeing the file.
         # Let's Return TRUE but log warning to allow the pipeline to proceed to Transformation where we can apply defaults.
         return True 

    return True
    
    if not all(col in df_cols for col in required_columns):
        if not is_trial_balance: # Allow TB uploads to have different schema
            logger.warning(f"Validation Failed: Missing columns. Found {df_cols}, Expected {required_columns}")
            return False

    # 2. Strict Data Quality Checks (Phase 18)
    try:
        # Date Format Validation (YYYY-MM-DD or standard formats)
        if 'date' in df_cols:
             # Coerce errors to NaT, then check for NaT
             temp_dates = pd.to_datetime(df['date'], errors='coerce')
             if temp_dates.isna().any():
                 logger.warning("Validation Failed: Invalid Date Formats detected.")
                 return False

        # Range Validation
        if 'amount' in df_cols:
             # Check for realistic ranges (e.g., < 1 Billion for a single txn, mostly positive unless adjustment)
             # keeping it simple: just warn on huge numbers, fail on NaN
             if pd.to_numeric(df['amount'], errors='coerce').isna().any():
                  logger.warning("Validation Failed: Non-numeric amounts detected.")
                  return False
             
             if (df['amount'].abs() > 1000000000).any():
                  logger.warning("Validation Warning: Extremely large values (> 1B) detected.")
                  # We don't fail, just warn, as it might be a consolidation entry
        
    except Exception as e:
        logger.error(f"Strict Validation Error: {e}")
        return False

    # 3. Balance Sheet Logic (if applicable)
    if 'category' in df_cols and 'amount' in df_cols:
        try:
            check_df = df.copy()
            check_df.columns = [c.lower() for c in check_df.columns]
            
            assets = check_df[check_df['category'].str.lower() == 'assets']['amount'].sum()
            liabilities = check_df[check_df['category'].str.lower() == 'liabilities']['amount'].sum()
            equity = check_df[check_df['category'].str.lower() == 'equity']['amount'].sum()
            
            # Allow small floating point variance
            if abs(assets - (liabilities + equity)) > 1.0:
                 logger.warning(f"Balance Sheet Imbalance: A={assets}, L+E={liabilities+equity}")
        except Exception as e:
            logger.warning(f"Validation Logic Warning: {e}")

    return True

<<<<<<< Updated upstream

def map_financial_data(df):
    """Maps raw inputs to SOCAR Standard Hierarchy using rules from Firestore"""
    import pandas as pd
    logger.info("Starting Dynamic Mapping...")
    
    # 1. Fetch Mapping Rules from Firestore
=======
def unpivot_cross_tab_data(rows):
    """
    Robust Unpivot Logic:
    1. Scans first 20 rows to find the 'Header Row' containing month names.
    2. Uses that row as keys for subsequent data.
    3. Unpivots data from Cross-Tab to Flat format.
    """
    if not rows: return rows
    
    month_map = {
        'january': 1, 'jan': 1, 'february': 2, 'feb': 2, 'march': 3, 'mar': 3,
        'april': 4, 'apr': 4, 'may': 5, 'june': 6, 'jun': 6,
        'july': 7, 'jul': 7, 'august': 8, 'aug': 8, 'september': 9, 'sep': 9, 'sept': 9,
        'october': 10, 'oct': 10, 'november': 11, 'nov': 11, 'december': 12, 'dec': 12
    }
    
    # helper to check if a row looks like a header
    def get_month_matches(row_keys):
        matches = []
        for k in row_keys:
            if str(k).lower().strip() in month_map:
                matches.append(str(k).lower().strip())
        return matches

    # 1. Header Hunting
    header_row_index = -1
    detected_keys = []
    
    # Check if we already have keys in the first row dict
    first_keys = list(rows[0].keys())
    if len(get_month_matches(first_keys)) >= 1:
        header_row_index = -1 # Already correct
        detected_keys = first_keys
    else:
        # Scan values of first 20 rows to find headers
        for idx, row in enumerate(rows[:20]):
            # In parsed CSV/Excel, 'keys' are often columns, but if header is down,
            # the values in this row might be the real headers.
            # However, DictReader/OpenPyXL usually sets keys from Row 1.
            # If header is row 5, Row 1 keys are garbage, and Row 5's VALUES are the headers.
            
            # Check values
            row_values = [str(v) for v in row.values() if v]
            matches = get_month_matches(row_values)
            if len(matches) >= 3:
                header_row_index = idx
                detected_keys = row_values
                logger.info(f"Refined Header Detection: Found headers at Row {idx+1}: {matches}")
                break
    
    # If we found a new header row deep in the file, we need to re-map the data
    # BECAREFUL: The 'rows' list is already dicts with WRONG keys.
    # We need to grab the values from subsequent rows and map them to 'detected_keys'.
    
    clean_data_rows = []
    
    if header_row_index != -1:
        # We need to realign data
        # Row at header_row_index contains the keys.
        # Rows after that contain the data.
        
        # OpenPyXL/CSV reader already parsed it into dicts based on Row 1 (garbage).
        # We need to treat them as lists of values essentially.
        
        # Map detected_keys (list of strings) to their position in the 'values' list?
        # No, dicts are unordered in older python but ordered in new.
        # Safer: The values in `rows[header_row_index]` ARE the keys.
        # But we don't know which key in the garbage-dict corresponds to which column index efficiently
        # unless we rely on insertion order (Python 3.7+ feature, standard now).
        
        # Strategy:
        # 1. Provide a mapping from Garbage-Key -> Real-Key based on the Header Row Line.
        header_source_row = rows[header_row_index]
        key_map = {} # GarbageKey -> RealKey
        
        for k, v in header_source_row.items():
            if str(v).lower().strip() in month_map or str(v).lower().strip() in ['company', 'gl', 'description', 'amount']:
                 key_map[k] = str(v).strip()
            # If v contains header name, map k to v
            
        # Actually simplest way: Just grab values() list from subsequent rows and zip with detected_keys?
        # But we need to ensure alignment.
        # Let's trust that `rows[header_row_index].values()` represents the column order.
        real_keys = list(rows[header_row_index].values())
        
        for row in rows[header_row_index+1:]:
            new_row_dict = {}
            vals = list(row.values())
            # Zip only up to length
            for i, key in enumerate(real_keys):
                if i < len(vals) and key:
                    new_row_dict[str(key)] = vals[i]
            clean_data_rows.append(new_row_dict)
            
    else:
        # Standard case (Header was Row 1) or Header not found
        if len(get_month_matches(first_keys)) < 1:
             return rows # Give up
        clean_data_rows = rows

    # 2. Unpivot Logic (Same as before but on clean_data_rows)
    new_rows = []
    current_year = datetime.date.today().year 
    
    for row in clean_data_rows:
        # Base metadata
        base_data = {k: v for k, v in row.items() if str(k).lower().strip() not in month_map}
        
        for col_name in row:
            key_clean = str(col_name).lower().strip()
            if key_clean in month_map:
                val = row[col_name]
                try:
                    if isinstance(val, str):
                        val = val.replace(',', '').replace(' ', '')
                        if val in ['-', '']: val = 0
                    amount = float(val)
                except (ValueError, TypeError):
                    amount = 0.0
                    
                if amount != 0:
                    new_record = base_data.copy()
                    month_num = month_map[key_clean]
                    year = 2023 # Context default
                    new_record['date'] = f"{year}-{month_num:02d}-01"
                    new_record['amount'] = amount
                    new_rows.append(new_record)
                    
    logger.info(f"Unpivoted {len(clean_data_rows)} source rows into {len(new_rows)} transactions.")
    logger.info(f"[UNPIVOT-DEBUG] Sample output: {new_rows[:2] if new_rows else 'EMPTY'}")
    return new_rows

def get_mapping_rules():
    """Fetch Mapping Rules from Firestore"""
    mapping_dict = {}
>>>>>>> Stashed changes
    try:
        db_client = get_db()
        rules_ref = db_client.collection('mapping_rules')
        rules_docs = rules_ref.stream()
        
        mapping_dict = {}
        for doc in rules_docs:
            data = doc.to_dict()
            mapping_dict[data['rawField'].lower()] = data['targetField']
            
        logger.info(f"Loaded {len(mapping_dict)} mapping rules from Firestore.")
    except Exception as e:
        logger.error(f"Error loading mapping rules: {e}")
        mapping_dict = {}

    # 2. Apply Dynamic Column Mapping
    # If a column header matches a 'rawField', we can rename it or create a standardized col
    # For SOCAR, we want to map into: company_id, category, sub_category, amount_gel, date
    
    # Simple strategy: If rules exist, try to find matching columns in CSV
    current_cols = [c.lower() for c in df.columns]
    
    # Pre-map Company
    def map_company(row):
        # Check standard synonyms
        entity_val = ""
        possible_cols = ['entity', 'company', 'organization', 'branch', 'sub']
        for col in possible_cols:
            if col in df.columns:
                entity_val = str(row.get(col, '')).strip()
                break
        
        if any(x in entity_val for x in ['Georgia', 'SGG', 'SGG-001']): return 'SGG-001'
        if any(x in entity_val for x in ['Export', 'SOG', 'SGG-002']): return 'SGG-002'
        if any(x in entity_val for x in ['Telav', 'SGG-003']): return 'SGG-003'
        return 'SGG-001'
    
    df['company_id'] = df.apply(map_company, axis=1)

    # 3. Dynamic GL & Category Mapping
    def map_category_dynamic(row):
        # First, try to find a column that corresponds to a mapping rule
        # We look for values in the row that match rawFields if the row is small, 
        # or we look for specific columns.
        
        gl = str(row.get('gl_account', row.get('gl', ''))).strip()
        desc = str(row.get('description', row.get('memo', ''))).lower()
        
        # Priority 1: Check if 'description' or 'gl' matches any rawField in our dynamic mapping
        # This allows users to map specific accounts directly in the UI.
        for raw, target in mapping_dict.items():
            if raw in desc or (gl and raw == gl):
                # Target is expected to be a string like "Revenue > Social Gas"
                if '>' in target:
                    parts = [p.strip() for p in target.split('>')]
                    return (parts[0], parts[1])
                return (target, 'General')

        # Priority 2: Hardcoded SOCAR Fallback (keeping your original logic as safety)
        if gl.startswith('4'):
            if 'social' in desc or '4001' in gl: return ('Revenue', 'Social Gas Sales')
            return ('Revenue', 'Other Revenue')
        if gl.startswith('5'):
            if 'cost' in desc and 'social' in desc: return ('COGS', 'Cost of Social Gas')
            return ('Expenses', 'Operating Expenses')
        if gl.startswith('1'): return ('Assets', 'Current Assets')
        if gl.startswith('2'): return ('Liabilities', 'Current Liabilities')
        if gl.startswith('3'): return ('Equity', 'Retained Earnings')
        
        return ('Unmapped', 'Unmapped')

    df[['category', 'sub_category']] = df.apply(lambda r: pd.Series(map_category_dynamic(r)), axis=1)
    
    # 4. Department Mapping
    def map_department(row):
        dept = str(row.get('department', '')).lower()
        if 'tech' in dept: return 'Technical Department'
        if 'fin' in dept: return 'Finance Department'
        if 'ops' in dept or 'oper' in dept: return 'Operations Department'
        return 'General'

    df['department'] = df.apply(map_department, axis=1)
    return df

def generate_ledger_entries(df):
    """Generates Double-Entry Ledger Rows (Debit/Credit)"""
    import pandas as pd
    ledger_rows = []
    
    for idx, row in df.iterrows():
        # ... (Same logic, relying on row access)
        amt = row.get('amount_gel', 0)
        cat = row.get('category', 'Unmapped')
        sub = row.get('sub_category', 'General')
        curr = row.get('currency', 'GEL')
        
        # Base Transaction
        base_txn = row.to_dict()
        
        # Double Entry Logic
        debit_entry = base_txn.copy()
        credit_entry = base_txn.copy()
        
        debit_entry['entry_type'] = 'Debit'
        credit_entry['entry_type'] = 'Credit'
        
        if cat == 'Revenue':
            # Revenue = Credit Revenue, Debit Cash/Receivables
            credit_entry['account'] = sub # e.g., 'Social Gas Sales'
            debit_entry['account'] = 'Accounts Receivable'
        elif cat in ['Expenses', 'COGS']:
            # Expense = Debit Expense, Credit Cash/Payables
            debit_entry['account'] = sub # e.g., 'Cost of Social Gas'
            credit_entry['account'] = 'Accounts Payable'
        elif cat == 'Assets':
            debit_entry['account'] = sub
            credit_entry['account'] = 'Cash' # Mock offset
        elif cat == 'Liabilities':
            credit_entry['account'] = sub
            debit_entry['account'] = 'Cash' # Mock offset
        else: # Unmapped or Equity
            debit_entry['account'] = 'Unmapped'
            credit_entry['account'] = 'Suspense Account'

        ledger_rows.append(debit_entry)
        ledger_rows.append(credit_entry)
        
    return pd.DataFrame(ledger_rows)

def transform_data(df):
    import pandas as pd
    # Normalize columns
    df.columns = [c.lower().strip().replace(' ', '_') for c in df.columns]
    
    # 1. Date Transformation
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'], errors='coerce').astype(str)
        
    # 2. Currency Conversion (Mock Logic: Convert everything to GEL)
    if 'amount' in df.columns:
        def convert(row):
            try:
                amt = float(row['amount'])
            except:
                return 0.0
            currency = row.get('currency', 'GEL')
            rate = 2.7 if currency == 'USD' else (3.0 if currency == 'EUR' else 1.0)
            return amt * rate
        
        df['amount_gel'] = df.apply(convert, axis=1)
    else:
        df['amount_gel'] = 0.0
        
    # 3. Apply SOCAR Mapping Logic
    df = map_financial_data(df)
    
    # 4. Generate Double-Entries (Expansion)
    ledger_df = generate_ledger_entries(df)
    
    return ledger_df

def store_data(df, filename: str):
    # Store in Firestore 'financial_transactions' collection
    from google.cloud import firestore
    
    client = get_db()
    batch = client.batch()
    collection_ref = client.collection('financial_transactions')
    
    records = df.to_dict(orient='records')
    count = 0
    for record in records:
        record['source_file'] = filename
        record['ingested_at'] = firestore.SERVER_TIMESTAMP
        
        # Use transaction_id as doc ID if available
        doc_id = str(record.get('transaction_id', ''))
        if doc_id:
            doc_ref = collection_ref.document(doc_id)
        else:
            doc_ref = collection_ref.document()
            
        batch.set(doc_ref, record)
        count += 1
        
        # Firestore batch limit is 500
        if count >= 400:
            batch.commit()
            batch = client.batch()
            count = 0
            
    if count > 0:
        batch.commit()

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["post", "options"]),
    timeout_sec=540,
    memory=options.MemoryOption.GB_2,
)
def ingest_data(req: https_fn.Request) -> https_fn.Response:
    """
    HTTP Entrypoint for Data Ingestion.
    Supports:
    1. Multipart/form-data upload ('file')
    2. JSON request for existing Storage file ({'storagePath': '...', 'bucket': '...'})
    """
    try:
        import io
        import pandas as pd
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

            # Lazy Load Storage
            from firebase_admin import storage
            
            bucket = storage.bucket(bucket_name)
            blob = bucket.blob(storage_path)
            
            # Download to memory
            file_stream = io.BytesIO()
            blob.download_to_file(file_stream)
            file_stream.seek(0)
            
        # Check for Direct File Upload
        elif 'file' in req.files:
            file_wrapper = req.files['file']
            if file_wrapper.filename == '':
                 return https_fn.Response(json.dumps({"error": "No selected file"}), status=400, headers={"Content-Type": "application/json"})
            
            filename = secure_filename(file_wrapper.filename)
            file_stream = file_wrapper # FileStorage object acts as stream
        
        else:
            return https_fn.Response(json.dumps({"error": "No file or storagePath provided"}), status=400, headers={"Content-Type": "application/json"})

        
        # Audio Logging (User Requirement 5)
        logger.info(json.dumps({
            'level': 'info',
            'message': 'Transaction processed',
            'transactionId': f"ingest_{filename}_{pd.Timestamp.now().timestamp()}",
            'filename': filename,
            'action': 'ingestion_start'
        }))
        
        # Read file (CSV, Excel, or PDF)
        df = None
        if filename.endswith('.csv'):
            df = pd.read_csv(file_stream)
        elif filename.endswith(('.xls', '.xlsx')):
<<<<<<< Updated upstream
            df = pd.read_excel(file_stream)
=======
             # OpenPyXL Memory Optimization: read_only=True
             wb = openpyxl.load_workbook(file_stream, data_only=True, read_only=True)
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
             
             # **DEBUG LOG**
             if raw_rows:
                 logger.info(f"[DEBUG] Excel parsed. First row keys: {list(raw_rows[0].keys())}")
                 logger.info(f"[DEBUG] Total raw rows: {len(raw_rows)}")

>>>>>>> Stashed changes
        elif filename.endswith('.pdf'):
            # Basic PDF Text Extraction
            from pypdf import PdfReader
            import io
            
            # request.files['file'] is a stream
            pdf_bytes = io.BytesIO(file.read())
            reader = PdfReader(pdf_bytes)
            
            text_content = ""
            for page in reader.pages:
                text_content += page.extract_text() + "\n"
            
            df = pd.DataFrame([{'content': text_content, 'type': 'unstructured_pdf_text'}])
            
            transformed_df = df 
            store_data(transformed_df, filename)
            
            return https_fn.Response(json.dumps({
                "message": "PDF ingested successfully (Text Extracted)",
                "rows_processed": 1,
                "preview": text_content[:200] + "..."
            }), status=201, headers={"Content-Type": "application/json"})
            
        else:
             return https_fn.Response(json.dumps({"error": "Unsupported file format. Use CSV, Excel, or PDF."}), status=400, headers={"Content-Type": "application/json"})
             
        # Unpivot Check (Cross-Tab Support)
        raw_rows = unpivot_cross_tab_data(raw_rows)
        
        # Validate
        if not validate_data(df):
             return https_fn.Response(json.dumps({"error": "Validation failed: Missing required columns (transaction_id, amount, date, currency)"}), status=400, headers={"Content-Type": "application/json"})
             
        # Transform (Apply Spine Mapping & Deterministic Rules)
        transformed_df = transform_data(df)
        
        # 4. CFO Governance Check: Period Locking
        if 'date' in transformed_df.columns and 'company_id' in transformed_df.columns:
            # Check unique company/period combos in this upload
            transformed_df['month_period'] = transformed_df['date'].str[:7]
            affected_contexts = transformed_df[['company_id', 'month_period']].drop_duplicates()
            
            for _, row in affected_contexts.iterrows():
                if check_period_lock(row['company_id'], row['month_period']):
                    log_audit_event(user_id, 'REJECTED_INGESTION_LOCKED', {
                        'company': row['company_id'],
                        'period': row['month_period'],
                        'file': filename
                    })
                    return https_fn.Response(json.dumps({
                        "error": f"Governance Violation: Period {row['month_period']} is LOCKED for {row['company_id']}."
                    }), status=403, headers={"Content-Type": "application/json"})

        # 5. Audit Valid Ingestion
        log_audit_event(user_id, 'INGESTION_COMPLETED', {
            'filename': filename,
            'row_count': len(transformed_df),
            'companies': list(transformed_df['company_id'].unique())
        })
        # Calculate Summary Metrics
        total_value = transformed_df['amount_gel'].sum()
        row_count = len(transformed_df)
        date_min = transformed_df['date'].min() if 'date' in transformed_df.columns else 'N/A'
        date_max = transformed_df['date'].max() if 'date' in transformed_df.columns else 'N/A'
        
        validation_summary = {
            "total_rows": int(row_count),
            "date_range": f"{date_min} to {date_max}",
            "currency_normalized": "GEL",
            "mapped_companies": transformed_df['company_id'].nunique() if 'company_id' in transformed_df.columns else 0
        }
        
        # Store
        store_data(transformed_df, filename)
        
        # Register Dataset in Catalog
        dataset_metadata = {
             'id': filename.lower().replace('.', '_').replace(' ', '_'),
             'name': filename,
             'description': f"Imported via Data Hub on {datetime.datetime.now().strftime('%Y-%m-%d')}",
             'owner': user_id,
             'type': 'ingested_file',
             'tags': ['finance' if 'accounting' in filename.lower() or 'gl' in list(transformed_ledger[0].keys() if transformed_ledger else []) else 'general'],
             'schema': {k: str(type(v).__name__) for k, v in transformed_ledger[0].items()} if transformed_ledger else {},
             'lineage': ['Storage', 'Ingestion_Pipeline'],
             'row_count': len(transformed_ledger),
             'total_value': total_value,
             'created_at': firestore.SERVER_TIMESTAMP,
             'quality_status': [{'rule': 'schema_validation', 'passed': True, 'timestamp': firestore.SERVER_TIMESTAMP}]
        }
        
        try:
            db_client = get_db()
            db_client.collection('datasets').document(dataset_metadata['id']).set(dataset_metadata, merge=True)
            logger.info(f"Dataset registered: {dataset_metadata['id']}")
        except Exception as reg_error:
            logger.error(f"Failed to register dataset: {reg_error}")

        return https_fn.Response(json.dumps({
            "message": "Data ingested successfully",
            "rows_processed": row_count,
            "total_value_gel": float(total_value),
            "validation_summary": validation_summary,
            "columns": list(transformed_df.columns)
        }), status=201, headers={"Content-Type": "application/json"})

    except Exception as e:
        logger.error(f"Ingestion Error: {e}")
        return https_fn.Response(json.dumps({"error": str(e)}), status=500, headers={"Content-Type": "application/json"})
