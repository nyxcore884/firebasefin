import os

ROOT = "functions"
folders = os.listdir(ROOT)

mapping = {
    "2-transformation": "transformation",
    "3-analysis": "analysis",
    "4-doc-analysis": "doc_analysis",
    "5-financial-engine": "financial_engine",
    "6-accounting-engine": "accounting_engine",
    "6-prognosis-engine": "prognosis_engine",
    "7-dataset-registry": "dataset_registry",
    "7-mapping-ingestion": "mapping_ingestion",
    "8-data-ingestion": "data_ingestion",
    "9-ai-query": "ai_query",
    "10-localization-engine": "localization_engine",
    "10-reporting": "reporting",
    "11-governance": "governance",
    "11-knowledge-engine": "knowledge_engine",
    "12-anomaly-engine": "anomaly_engine",
    "12-dashboard-actions": "dashboard_actions",
    "13-metric-materializer": "metric_materializer",
    "14-board-reporting": "board_reporting",
    "15-truth-engine": "truth_engine"
}

for old, new in mapping.items():
    old_path = os.path.join(ROOT, old)
    new_path = os.path.join(ROOT, new)
    if os.path.exists(old_path):
        try:
            os.rename(old_path, new_path)
            print(f"Renamed {old} to {new}")
        except Exception as e:
            print(f"Failed to rename {old}: {e}")

# Create __init__.py in each to make them packages
for folder in os.listdir(ROOT):
    folder_path = os.path.join(ROOT, folder)
    if os.path.isdir(folder_path):
        init_file = os.path.join(folder_path, "__init__.py")
        if not os.path.exists(init_file):
            with open(init_file, 'w') as f:
                pass
            print(f"Created __init__.py in {folder}")
