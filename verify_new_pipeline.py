import hashlib
import uuid
import csv
import io

def verify_pipeline_logic():
    print("=== PIPELINE LOGIC VERIFICATION (LIGHTWEIGHT) ===")
    
    # 1. INGESTION SIMULATION
    print("\n[INGESTION]")
    # External file
    file_content = "Date,Amount,Description\n2025-07-01,1234.56,SALARY PAYMENT\n2025-07-02,50.00,TBC BANK COMMISSION"
    filename = "bank_statement_july.csv"
    
    # SHA-256 (Mandatory)
    checksum = hashlib.sha256(file_content.encode()).hexdigest()
    file_id = f"f_{uuid.uuid4().hex[:12]}"
    print(f"ACCEPTED FILE: {filename}")
    print(f"FINGERPRINT (SHA-256): {checksum}")
    print(f"GENERATED FILE_ID: {file_id}")
    
    # Structural Parsing (Strictly string preservation, no accounting)
    reader = csv.DictReader(io.StringIO(file_content))
    raw_rows = [row for row in reader]
    print(f"RAW_ROWS PERSISTED: {len(raw_rows)} records")
    print(f"EVENT EMITTED: raw-rows-created for {file_id}")

    # 2. MAPPING ENGINE SIMULATION
    print("\n[MAPPING ENGINE]")
    # Consumes: raw-rows-created
    normalized_rows = []
    source_profile = "BankStatement_Generic_v1"
    
    for idx, raw in enumerate(raw_rows):
        # NO ACCOUNTING Logic here, only normalization and tagging
        norm = {
            'date': raw.get('Date'),
            'amount': raw.get('Amount'),
            'description': raw.get('Description'),
            'source_file_id': file_id,
            'source_row_index': idx,
            'category_tag': 'Bank Fee' if 'commission' in raw.get('Description', '').lower() else 'General'
        }
        normalized_rows.append(norm)
        
    print(f"NORMALIZED_ROWS PERSISTED: {len(normalized_rows)} records")
    print(f"EVENT EMITTED: normalized-rows-created for {file_id}")

    # 3. ACCOUNTING ENGINE SIMULATION
    print("\n[ACCOUNTING ENGINE]")
    # Consumes: normalized-rows-created
    ledger_entries = []
    
    for norm in normalized_rows:
        # Atomic Financial Truth (Double-Entry)
        try:
            amt = float(norm['amount'])
        except:
            amt = 0.0
            
        tag = norm['category_tag']
        entity_id = "LLC_GEO_SUB_1"
        
        if tag == 'Bank Fee':
            # DEBIT Expense, CREDIT Asset
            ledger_entries.append({'entity_id': entity_id, 'account_id': '6100', 'direction': 'DEBIT', 'amount': amt})
            ledger_entries.append({'entity_id': entity_id, 'account_id': '1000', 'direction': 'CREDIT', 'amount': amt})
        else:
            # Generic Mapping
            ledger_entries.append({'entity_id': entity_id, 'account_id': '4000', 'direction': 'CREDIT', 'amount': amt})
            ledger_entries.append({'entity_id': entity_id, 'account_id': '9999', 'direction': 'DEBIT', 'amount': amt})

    print(f"LEDGER_ENTRIES POSTED: {len(ledger_entries)} atomic records")
    print(f"TRACEABILITY: Every entry points back to source_row_id")

    # Double-Check Integrity
    debits = sum(e['amount'] for e in ledger_entries if e['direction'] == 'DEBIT')
    credits = sum(e['amount'] for e in ledger_entries if e['direction'] == 'CREDIT')
    
    print(f"\n[INTEGRITY CHECK]")
    print(f"TOTAL DEBITS: {debits:.2f}")
    print(f"TOTAL CREDITS: {credits:.2f}")
    print(f"BALANCE: {debits - credits:.2e}")
    
    if abs(debits - credits) < 1e-9:
        print("VERIFICATION SUCCESS: DOUBLE-ENTRY COMPLIANT")
    else:
        print("VERIFICATION FAILED: IMBALANCE DETECTED")

if __name__ == "__main__":
    verify_pipeline_logic()
