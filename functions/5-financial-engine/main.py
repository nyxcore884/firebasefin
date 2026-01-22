import datetime
import json
import logging
from firebase_functions import https_fn, options

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lazy globals
analyzer = None
mapper = None

def get_analyzer():
    global analyzer
    if analyzer is None:
        analyzer = FinancialAnalyzer()
    return analyzer

def get_mapper():
    global mapper
    if mapper is None:
        mapper = FinancialMapper()
    return mapper

class FinancialAnalyzer:
    def __init__(self):
        from google.cloud import firestore
        self.db = firestore.Client()
        # Pre-import modules
        global pd, np, Prophet, IsolationForest, VertexAIManager, reconcile_accounts, jsonify
        import pandas as pd
        import numpy as np
        from flask import jsonify
        from prophet import Prophet
        from sklearn.ensemble import IsolationForest
        from vertex_manager import VertexAIManager
        from accounting import reconcile_accounts

    def generate_forecast(self, company_id):
        """Generate forecast using Prophet with company context"""
        base_value = 1000
        trend_slope = 1
        
        # Simulate different trends for different companies
        if company_id == 'Acme Inc':
            base_value = 5000
            trend_slope = 5
        elif company_id == 'Globex Corp':
            base_value = 8000
            trend_slope = -2 # Declining
        elif company_id == 'Soylent Corp':
            base_value = 12000
            trend_slope = 10
            
        dates = pd.date_range(start='2023-01-01', periods=180)
        # Add some noise and trend
        values = np.linspace(0, 180 * trend_slope, 180) + np.random.randn(180) * 100 + base_value
        df = pd.DataFrame({'ds': dates, 'y': values})

        model = Prophet()
        model.fit(df)
        
        future = model.make_future_dataframe(periods=30)
        forecast = model.predict(future)
        result = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(60)
        
        # Transform for frontend
        output = []
        for index, row in result.iterrows():
            output.append({
                'name': row['ds'].strftime('%b'), # Month name for Chart
                'full_date': row['ds'].strftime('%Y-%m-%d'),
                'forecast': round(row['yhat'], 2),
                'lower': round(row['yhat_lower'], 2),
                'upper': round(row['yhat_upper'], 2),
                'actual': round(row['yhat'] + np.random.randn() * 50, 2) if index < 30 else None # Simulate actuals for only half
            })
            
        return output

    def run_all_checks(self):
        """Run all anomaly detection algorithms"""
        # In a real scenario, fetch all recent data from Firestore
        # docs = self.db.collection('transactions').limit(500).stream()
        # data = [doc.to_dict() for doc in docs]
        
        # Mock Data Generation for Demo
        mock_data = []
        for i in range(200):
            mock_data.append({
                'id': i,
                'amount': np.random.uniform(100, 15000), # Some large ones
                'revenue': np.random.uniform(5000, 20000), 
                'vendor': np.random.choice(['Vendor A', 'Vendor B', 'Vendor C', 'Unknown']),
                'category': 'Payment'
            })
        # Inject anomalies
        mock_data.append({'id': 999, 'amount': 25000, 'revenue': 50000, 'vendor': 'Vendor X', 'category': 'Payment'}) # Large
        mock_data.append({'id': 998, 'amount': 500, 'revenue': 100, 'vendor': 'Vendor A', 'category': 'Revenue'}) # Low Rev outlier

        anomalies = []
        anomalies.extend(self.detect_large_transactions(mock_data))
        anomalies.extend(self.detect_revenue_anomalies(mock_data))
        anomalies.extend(self.detect_suspicious_payments(mock_data))
        
        return anomalies

    def detect_large_transactions(self, data):
        """Use Case A: Unusual Transaction Volumes (Thresholding)"""
        threshold = 10000
        anomalies = []
        for t in data:
            if t.get('amount', 0) > threshold:
                anomalies.append({
                    'name': f"Large Transaction #{t['id']}",
                    'explanation': f"Amount {t['amount']:.2f} exceeds threshold {threshold}",
                    'type': 'Threshold'
                })
        return anomalies

    def detect_revenue_anomalies(self, data):
        """Use Case B: Inconsistent Revenue Patterns (Z-Score)"""
        revenues = [t.get('revenue', 0) for t in data]
        if not revenues: return []
        
        mean = np.mean(revenues)
        std = np.std(revenues)
        
        anomalies = []
        for t in data:
            rev = t.get('revenue', 0)
            if std > 0 and np.abs((rev - mean) / std) > 2:
                anomalies.append({
                    'name': f"Revenue Anomaly #{t['id']}",
                    'explanation': f"Revenue {rev:.2f} deviates significantly (Z-Score > 2)",
                    'type': 'Statistical'
                })
        return anomalies

    def detect_suspicious_payments(self, data):
        """Use Case C: Suspicious Vendor Payments (Isolation Forest)"""
        df = pd.DataFrame(data)
        if df.empty or 'amount' not in df.columns: return []

        # Simple feature set for demo: amount
        X = df[['amount']].fillna(0)
        
        model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
        model.fit(X)
        predictions = model.predict(X)
        
        anomalies = []
        df['anomaly'] = predictions
        outliers = df[df['anomaly'] == -1]
        
        for idx, row in outliers.iterrows():
             # Avoid duplicating if caught by threshold, but ML might catch subtle ones
             if row['amount'] < 10000: # Only adding if NOT already large (example logic)
                anomalies.append({
                    'name': f"Suspicious Activity #{row['id']}",
                    'explanation': f"ML Model detected irregular pattern for {row['vendor']}",
                    'type': 'ML'
                })
        return anomalies

class ComplianceRulesEngine:
    def validate(self, transaction):
        errors = []
        if transaction.get('category', '').startswith('Revenue'):
            if transaction.get('amount', 0) > 115000: 
                errors.append("Revenue exceeds 115% of budget")
        return {'status': 'ok' if not errors else 'error', 'errors': errors}

class FinancialMapper:
    def __init__(self):
        from google.cloud import firestore
        self.db = firestore.Client()
        self.rules_engine = ComplianceRulesEngine()

    def process_transaction(self, transaction):
        validation = self.rules_engine.validate(transaction)
        
        reconciliation = []
        if validation['status'] == 'ok':
             # Store in Firestore
             self.db.collection('financial_data').add(transaction)
             # Double Entry Check
             reconciliation = reconcile_accounts([transaction])
        
        return {
            'status': 'success' if validation['status'] == 'ok' else 'error',
            'data': transaction,
            'validation': validation,
            'reconciliation': reconciliation
        }
    
    def get_all_data(self):
        docs = self.db.collection('financial_data').limit(100).stream()
        data = [d.to_dict() for d in docs]
        
        if not data:
            # Fallback Mock Data for Analysis Page Integration
            return [
              {'id': 'OPEX-001', 'article': 'Office Supplies', 'budget': 5000, 'actual': 4890, 'variance': 110, 'pct': 2.2, 'status': 'success', 'category': 'Operating Expenses'},
              {'id': 'OPEX-002', 'article': 'Software Licensing', 'budget': 12000, 'actual': 12500, 'variance': -500, 'pct': -4.1, 'status': 'warning', 'category': 'Operating Expenses'},
              {'id': 'CAPEX-001', 'article': 'New Laptops', 'budget': 25000, 'actual': 23800, 'variance': 1200, 'pct': 4.8, 'status': 'success', 'category': 'Capital Expenditures'},
              {'id': 'MKTG-001', 'article': 'Social Media Campaign', 'budget': 8000, 'actual': 9200, 'variance': -1200, 'pct': -15.0, 'status': 'critical', 'category': 'Marketing'},
              {'id': 'RSRCH-001', 'article': 'Market Research Study', 'budget': 15000, 'actual': 14500, 'variance': 500, 'pct': 3.3, 'status': 'success', 'category': 'Marketing'},
              {'id': 'HR-001', 'article': 'Employee Training', 'budget': 10000, 'actual': 11000, 'variance': -1000, 'pct': -10.0, 'status': 'warning', 'category': 'Human Resources'},
              {'id': 'OPEX-003', 'article': 'Travel Expenses', 'budget': 7500, 'actual': 6000, 'variance': 1500, 'pct': 20.0, 'status': 'success', 'category': 'Operating Expenses'},
            ]
        return data

    def get_company_transactions(self, company_id, period):
        """Retrieves and filters transactions from Firestore with a mock fallback."""
        import pandas as pd
        import numpy as np

        # For the demo, we use high-quality mock data that matches metrics.py requirements
        # These fields are required by metrics.calculate_metrics:
        # id, category, sub_category, entry_type (Debit/Credit), amount_gel

        mock_transactions = [
            {'id': 'T-001', 'category': 'Assets', 'sub_category': 'Cash', 'entry_type': 'Debit', 'amount_gel': 50000, 'company_id': company_id, 'period': period, 'department': 'Finance Department'},
            {'id': 'T-002', 'category': 'Liabilities', 'sub_category': 'Accounts Payable', 'entry_type': 'Credit', 'amount_gel': 20000, 'company_id': company_id, 'period': period, 'department': 'Finance Department'},
            {'id': 'T-003', 'category': 'Revenue', 'sub_category': 'Product Sales', 'entry_type': 'Credit', 'amount_gel': 35000, 'company_id': company_id, 'period': period, 'department': 'Sales Department'},
            {'id': 'T-004', 'category': 'COGS', 'sub_category': 'Inventory', 'entry_type': 'Debit', 'amount_gel': 15000, 'company_id': company_id, 'period': period, 'department': 'Operations Department'},
            {'id': 'T-005', 'category': 'Expenses', 'sub_category': 'Depreciation', 'entry_type': 'Debit', 'amount_gel': 2000, 'company_id': company_id, 'period': period, 'department': 'Finance Department'},
            {'id': 'T-006', 'category': 'Expenses', 'sub_category': 'Interest', 'entry_type': 'Debit', 'amount_gel': 1000, 'company_id': company_id, 'period': period, 'department': 'Finance Department'},
            {'id': 'T-007', 'category': 'Equity', 'sub_category': 'Retained Earnings', 'entry_type': 'Credit', 'amount_gel': 30000, 'company_id': company_id, 'period': period, 'department': 'Finance Department'},
        ]
        
        # Real Firestore Fetch (attempt)
        try:
            docs = self.db.collection('financial_data')\
                .where('company_id', '==', company_id)\
                .where('period', '==', period)\
                .limit(500).stream()
            real_data = [d.to_dict() for d in docs]
            if real_data:
                return pd.DataFrame(real_data)
        except Exception as e:
            logger.warning(f"Firestore Fetch Failed (likely missing index): {e}")

        # Fallback to Mock
        return pd.DataFrame(mock_transactions)

# Removed global instances (managed by getters)

import functions_framework

@https_fn.on_request(
    cors=options.CorsOptions(cors_origins="*", cors_methods=["POST", "OPTIONS"]),
    timeout_sec=60,
    memory=options.MemoryOption.MB_256,
)
def process_transaction(request: https_fn.Request) -> https_fn.Response:
    from flask import jsonify
    analyzer = get_analyzer()
    mapper = get_mapper()

    data = request.get_json(silent=True) or {}
    action = data.get('action')
    
    if action == 'metrics':
        try:
            company = data.get('company_id')
            period = data.get('period')
            dept = data.get('department', 'All')
            
            if not company or not period:
                return jsonify({'error': 'Missing company_id or period'}), 400

            df = mapper.get_company_transactions(company, period)
            
            # Apply Department filter if not 'All'
            if dept and dept != 'All':
                import pandas as pd
                df = df[df['department'] == f"{dept} Department"]

            from metrics import calculate_metrics
            result = calculate_metrics(df)
            result['context'] = {'company': company, 'period': period, 'department': dept}
            
            return jsonify({
                "status": "success",
                "metrics": result,
                "drill_through": result.get('drill_through', {}),
                "reconciliation": result.get('reconciliation', {'is_balanced': True, 'equation': 'Assets = L + E'})
            })
        except Exception as e:
            logger.error(f"Metrics Error: {e}")
            return jsonify({'error': str(e)}), 500

    elif action == 'forecast':
        try:
            company = data.get('company_id', 'SGG-001')
            forecast = analyzer.generate_forecast(company)
            return jsonify(forecast)
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    elif action == 'anomalies':
        try:
            data_res = analyzer.run_all_checks()
            return jsonify(data_res)
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    else:
        # Default: Process Transaction
        try:
            result = mapper.process_transaction(data)
            return jsonify(result)
        except Exception as e:
            return jsonify({"error": str(e)}), 400
