import firebase_admin
from firebase_admin import credentials, firestore
import datetime
import os

# FORCE EMULATOR FOR LOCAL DEV
os.environ["FIRESTORE_EMULATOR_HOST"] = "127.0.0.1:8080"
os.environ["GCLOUD_PROJECT"] = "studio-9381016045-4d625"

# Initialize Firebase Admin (Mock creds are fine for emulator)
cred = credentials.ApplicationDefault() 
firebase_admin.initialize_app(cred, {
    'projectId': 'studio-9381016045-4d625',
})
db = firestore.client()

def seed_flow_data():
    company_id = 'SGG-001'
    
    # 1. FinSight Studio System Flow (v2.2 Refined)
    controller_flow = {
        'nodes': [
            # --- ZONES (Visual Containers) ---
            { 'id': 'zone-data', 'type': 'systemZone', 'position': {'x': -50, 'y': 50}, 'data': {'kind': 'systemZone', 'label': 'Data & Memory Layer', 'zoneColor': 'emerald'}, 'style': {'width': 350, 'height': 400}, 'zIndex': -1 },
            { 'id': 'zone-truth', 'type': 'systemZone', 'position': {'x': 350, 'y': 50}, 'data': {'kind': 'systemZone', 'label': 'Truth Engines', 'zoneColor': 'blue'}, 'style': {'width': 350, 'height': 400}, 'zIndex': -1 },
            { 'id': 'zone-ai', 'type': 'systemZone', 'position': {'x': 750, 'y': 50}, 'data': {'kind': 'systemZone', 'label': 'AI Cognitive Layer', 'zoneColor': 'purple'}, 'style': {'width': 550, 'height': 400}, 'zIndex': -1 },
            { 'id': 'zone-gov', 'type': 'systemZone', 'position': {'x': 1350, 'y': 50}, 'data': {'kind': 'systemZone', 'label': 'Governance & Output', 'zoneColor': 'amber'}, 'style': {'width': 300, 'height': 400}, 'zIndex': -1 },

            # --- ZONE 1: DATA ---
            {
                'id': 'fire-storage',
                'type': 'data',
                'position': {'x': 20, 'y': 120},
                'data': {'kind': 'data', 'label': 'Ingestion Blobs', 'subType': 'storage', 'path': 'gs://ingestion-bucket', 'recordCount': 10542, 'status': 'active', 'lastWriteAt': 'Just now'},
                'parentNode': 'zone-data', 'extent': 'parent'
            },
            {
                'id': 'fire-trans',
                'type': 'data',
                'position': {'x': 20, 'y': 280},
                'data': {'kind': 'data', 'label': 'Financial Txns', 'subType': 'firestore', 'path': 'financial_transactions', 'recordCount': 892, 'status': 'active', 'lastWriteAt': '2m ago'},
                'parentNode': 'zone-data', 'extent': 'parent'
            },

            # --- ZONE 2: TRUTH ENGINES ---
            {
                'id': 'fn-induct',
                'type': 'truthEngine',
                'position': {'x': 380, 'y': 120},
                'data': {'kind': 'truthEngine', 'label': 'Schema Induction', 'functionId': 'induct_schema_v2', 'batchTime': '120ms', 'throughput': 450, 'status': 'running'},
            },
            {
                'id': 'fn-ledger',
                'type': 'truthEngine',
                'position': {'x': 380, 'y': 280},
                'data': {'kind': 'truthEngine', 'label': 'Ledger Expansion', 'functionId': 'double_entry_expand', 'batchTime': '45ms', 'throughput': 1200, 'status': 'running'},
            },

            # --- ZONE 3: AI COGNITIVE (Granular Chain) ---
            {
                'id': 'ai-intent',
                'type': 'aiIntent',
                'position': {'x': 780, 'y': 150},
                'data': {'kind': 'aiIntent', 'label': 'Metric Analysis', 'confidence': 0.98, 'status': 'active'},
            },
            {
                'id': 'ai-tool',
                'type': 'aiToolExecution',
                'position': {'x': 950, 'y': 250}, # Staggered for flow
                'data': {'kind': 'aiToolExecution', 'label': 'get_burn_rate()', 'toolName': 'financial_metrics_api', 'status': 'success', 'duration': '85ms'},
            },
            {
                'id': 'ai-model',
                'type': 'aiModel',
                'position': {'x': 1150, 'y': 150},
                'data': {'kind': 'aiModel', 'label': 'Gemini 1.5 Pro', 'model': 'google-vertex-ai', 'tokenUsage': 405, 'status': 'streaming'},
            },

            # --- ZONE 4: GOVERNANCE ---
            {
                'id': 'gov-dashboard',
                'type': 'governance',
                'position': {'x': 1380, 'y': 120},
                'data': {'kind': 'governance', 'label': 'CFO Dashboard', 'type': 'dashboard', 'targetId': 'view_cfo_main', 'lastAuditAt': '1h ago'},
            },
            {
                'id': 'gov-alerts',
                'type': 'governance',
                'position': {'x': 1380, 'y': 280},
                'data': {'kind': 'governance', 'label': 'Executive Alerts', 'type': 'alert', 'targetId': 'alert_channel_high', 'alertCount': 3, 'lastAuditAt': 'Active'},
            },
        ],
        'edges': [
            # Data Flow (Blue)
            {'id': 'e1', 'source': 'fire-storage', 'target': 'fn-induct', 'data': {'type': 'data'}},
            {'id': 'e2', 'source': 'fn-induct', 'target': 'fire-trans', 'data': {'type': 'data'}},
            {'id': 'e3', 'source': 'fire-trans', 'target': 'fn-ledger', 'data': {'type': 'data'}},
            {'id': 'e4', 'source': 'fn-ledger', 'target': 'gov-dashboard', 'data': {'type': 'data'}},
            
            # AI Flow (Purple) - Logic Chain
            {'id': 'e-ai-1', 'source': 'fn-ledger', 'target': 'ai-intent', 'data': {'type': 'ai', 'active': True}}, # Trigger from data
            {'id': 'e-ai-2', 'source': 'ai-intent', 'target': 'ai-tool', 'data': {'type': 'ai', 'active': True}},
            {'id': 'e-ai-3', 'source': 'ai-tool', 'target': 'ai-model', 'data': {'type': 'ai', 'active': True}},
            
            # Alert Flow (Amber)
            {'id': 'e-alert', 'source': 'ai-model', 'target': 'gov-alerts', 'data': {'type': 'alert', 'active': True}},
        ],
        'updatedAt': firestore.SERVER_TIMESTAMP,
        'version': '1.0'
    }

    lineage_flow = {
        'nodes': [
            {
                'id': 't1',
                'type': 'tableNode',
                'position': {'x': 100, 'y': 100},
                'data': {
                    'kind': 'table',
                    'label': 'financial_transactions',
                    'schema': [
                        {'field': 'id', 'type': 'UUID'},
                        {'field': 'amount', 'type': 'numeric'},
                        {'field': 'entity_id', 'type': 'fk'}
                    ]
                }
            }
        ],
        'edges': [],
        'updatedAt': firestore.SERVER_TIMESTAMP,
        'version': '1.0'
    }

    db.collection('controller_flows').document(company_id).collection('flows').document('main-controller').set(controller_flow)
    db.collection('controller_flows').document(company_id).collection('flows').document('data-lineage').set(lineage_flow)
    # --- KNOWLEDGE BASE SEEDING ---
    kb_data = [
        {"id": "ds1", "name": "Executive Compensation 2023", "type": "pdf", "status": "indexed", "lastSync": "10m ago", "docCount": 42},
        {"id": "ds2", "name": "ERP Transactional Ledger", "type": "firestore", "status": "indexing", "lastSync": "now", "docCount": 5820},
    ]
    for doc in kb_data:
        db.collection('knowledge_base').document(doc['id']).set(doc)

    # --- AI BLUEPRINT SEEDING ---
    # Blueprint for "How is our cash runway?" intent
    blueprint_nodes = [
        {"id": "intent_runway", "type": "input", "data": {"label": "Intent: Cash Runway Analysis", "kind": "intent"}, "position": {"x": 100, "y": 800}},
        {"id": "router_main", "type": "default", "data": {"label": "Intent Router (Gemini)", "kind": "router"}, "position": {"x": 350, "y": 800}},
        {"id": "tool_forecast", "type": "output", "data": {"label": "Power Forecast Tool", "kind": "tool"}, "position": {"x": 600, "y": 750}},
        {"id": "tool_rag", "type": "output", "data": {"label": "Knowledge Retrieval (RAG)", "kind": "tool"}, "position": {"x": 600, "y": 850}},
    ]
    blueprint_edges = [
        {"id": "e_b1", "source": "intent_runway", "target": "router_main", "animated": True},
        {"id": "e_b2", "source": "router_main", "target": "tool_forecast", "label": "Numerical Query"},
        {"id": "e_b3", "source": "router_main", "target": "tool_rag", "label": "Policy Query"},
    ]
    
    # Save Blueprint to a specific doc
    db.collection('controller_flows').document(company_id).collection('flows').document('ai-blueprint').set({
        "nodes": blueprint_nodes,
        "edges": blueprint_edges,
        "updatedAt": firestore.SERVER_TIMESTAMP
    })

    print("FinSight Studio system flow, Knowledge Base, and AI Blueprint seeded.")

if __name__ == '__main__':
    seed_flow_data()
