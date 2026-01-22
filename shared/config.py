# Shared configuration for the financial data processing system

import os

# GCP Project
PROJECT_ID = os.environ.get('GCP_PROJECT', 'studio-9381016045-4d625')

# Pub/Sub
PUBSUB_TOPIC = os.environ.get('PUBSUB_TOPIC', 'file-processing-topic')

# BigQuery
BIGQUERY_DATASET = os.environ.get('BIGQUERY_DATASET_ID', 'financial_data')

# Firestore
FINANCIAL_DATA_COLLECTION = 'financial_data_collection'

# Cloud Storage
FINANCIAL_UPLOADS_BUCKET = f'{PROJECT_ID}-financial-uploads'

# Cloud Run / Functions Region
REGION = os.environ.get('GCP_REGION', 'us-central1')

# Artifact Registry for ML Models
ARTIFACT_BUCKET = f'{PROJECT_ID}-ml-artifacts'

# --- Document Intelligence ---
# This mapping provides context to the ingestion and transformation services.
# It defines the expected structure for known financial documents.
DOCUMENT_TYPES = {
    'MASTER_BUDGET_TEMPLATE': {
        'pattern': 'SOCAR Budgeting_Template',
        'type': 'excel',
        'required_sheets': ['Detailed Budget', 'Budget PY', 'CAPEX B VS T', 'CAPEX SENT']
    },
    'TRANSACTION_LOG_SGG': {
        'pattern': 'SGG',
        'type': 'csv',
        'required_columns': ['date', 'trans_no', 'Amount_debit_curr']
    },
    'BUDGET_HOLDER_MAPPING': {
        'pattern': 'budget_holder_mapping',
        'type': 'csv',
        'required_columns': ['budget_article', 'budget_holder']
    },
    'COST_ITEM_MAP': {
        'pattern': 'cost_item_map',
        'type': 'csv',
        'required_columns': ['cost_item', 'budget_article']
    }
}
