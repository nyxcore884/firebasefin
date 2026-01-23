import json
import logging
from firebase_functions import https_fn, options
import metrics
import ledger
import reconciliation

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["POST", "OPTIONS"]),
    timeout_sec=60,
    memory=options.MemoryOption.MB_256,
)
def process_transaction(request: https_fn.Request) -> https_fn.Response:
    """
    Orchestrates the Financial Engine:
    1. Receives Transaction Data (JSON)
    2. Calculates Metrics (Deterministic)
    3. Generates Ledger Entries (Double-Entry)
    4. Validates Balance (A = L + E)
    """
    try:
        data = request.get_json(silent=True) or {}
        action = data.get('action')
        
        logger.info(f"Financial Engine Request: {action}")

        # 1. Metrics Calculation Request
        if action == 'metrics':
            # Expecting a list of transactions in 'data' or 'transactions'
            transactions = data.get('data', [])
            if not transactions:
                # If checking context (company/period), we might fetch from Firestore here
                # BUT per architecture, Engine should receive data. 
                # Retaining old behavior of "fetch if empty" is dangerous but might be needed for current Frontend.
                # For now, we return empty structure if no data provided.
                logger.warning("No transactions provided for metrics calculation.")
                pass 

            # Calculate Core Metrics
            financial_totals = metrics.calculate_metrics(transactions)
            
            # Run Reconciliation
            recon_status = reconciliation.reconcile(
                financial_totals["assets"],
                financial_totals["liabilities"],
                financial_totals["equity"]
            )
            
            return https_fn.Response(
                json.dumps({
                    "status": "success",
                    "metrics": financial_totals,
                    "reconciliation": recon_status
                }),
                status=200,
                headers={"Content-Type": "application/json"}
            )

        # 2. Transaction Processing (Ledger Entry)
        elif action == 'process' or not action:
            # Single transaction or list
            txns = data if isinstance(data, list) else [data]
            all_entries = []
            
            for txn in txns:
                entries = ledger.apply_double_entry(txn)
                all_entries.extend(entries)
                
            # In a real system, we would batch write 'all_entries' to Firestore 'ledger' collection here.
            # For now, we return them to the caller or validation.
            
            return https_fn.Response(
                json.dumps({
                    "status": "success",
                    "processed_count": len(txns),
                    "ledger_entries": all_entries
                }),
                status=200,
                headers={"Content-Type": "application/json"}
            )
            
        # 3. Handle Stubbed/Removed Endpoints Gracefully
        elif action in ['forecast', 'anomalies']:
            return https_fn.Response(
                json.dumps({
                    "status": "moved",
                    "message": f"Action '{action}' has been moved to Cloud Run. Please update client."
                }),
                status=404, 
                headers={"Content-Type": "application/json"}
            )
            
        else:
            return https_fn.Response(
                json.dumps({"error": f"Unknown action: {action}"}),
                status=400,
                headers={"Content-Type": "application/json"}
            )

    except Exception as e:
        logger.error(f"Financial Engine Error: {e}")
        return https_fn.Response(
            json.dumps({"error": str(e)}),
            status=500,
            headers={"Content-Type": "application/json"}
        )
