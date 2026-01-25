import os
import json
import logging
import base64
import sys
from firebase_functions import pubsub_fn, options
from google.cloud import firestore, pubsub_v1
import firebase_admin
from firebase_admin import initialize_app
import datetime

# Setup path for shared modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
try:
    from shared.schema_loader import get_combined_mapping_rules
except ImportError:
    # Handle cloud environment where 'shared' is copied into the function root
    try:
        from shared.schema_loader import get_combined_mapping_rules
    except:
        pass

# Initialize Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firebase Admin
if not firebase_admin._apps:
    initialize_app()

db = firestore.Client()
publisher = pubsub_v1.PublisherClient()
PROJECT_ID = os.environ.get('GCP_PROJECT') or "firebasefin"
NORMALIZED_TOPIC = os.environ.get('NORMALIZED_ROWS_TOPIC', 'normalized-rows-created')

# Cache for schemas to minimize I/O
SCHEMA_CACHE = {}

def match_contextual_rule(raw_field, raw_value, row_context, mapping_index):
    """
    Picks the best rule from the prioritized index.
    Complexity: O(R) where R is rules for this field (usually < 5).
    """
    import re
    candidates = mapping_index.get(raw_field, [])
    for r in candidates:
        match_type = r.get('match_type', 'equals')
        rule_val = str(r.get('raw_value', ''))
        
        # 1. Value Match
        if match_type == 'equals' and str(raw_value).strip() != rule_val.strip():
            continue
        elif match_type == 'contains' and rule_val.lower() not in str(raw_value).lower():
            continue
        elif match_type == 'regex' and not re.search(rule_val, str(raw_value)):
            continue
            
        # 2. Context Match (Structural Unit, Region, Counterparty)
        # If a rule provides a context field, it MUST match. Empty = Wildcard.
        if r.get('structural_unit') and r['structural_unit'].lower() not in str(row_context.get('structural_unit', '')).lower():
            continue
        if r.get('region') and r['region'].lower() not in str(row_context.get('region', '')).lower():
            continue
        if r.get('counterparty') and r['counterparty'].lower() not in str(row_context.get('counterparty', '')).lower():
            continue
            
        # First one wins (since sorted by priority/specificity)
        return r
    return None

def normalize_row(raw_row, rules_bundle, company_id="UNKNOWN", period="UNKNOWN"):
    """
    Apply normalization with Business Rule Overrides.
    """
    raw = raw_row.get('raw', {})
    schema = rules_bundle.get('active_schema')
    simple_mappings = rules_bundle.get('combined_mappings', {})
    mapping_index = rules_bundle.get('mapping_index', {})
    
    normalized = {
        'source_file_id': raw_row.get('file_id'),
        'source_row_index': raw_row.get('row_index'),
        'company_id': company_id,
        'period': period,
        'date': '',
        'amount': 0.0,
        'currency': 'GEL',
        'description': '',
        'category_tag': 'General',
        'mapping_version': rules_bundle.get('version', 'static')
    }
    
    mapped_keys = set()
    targets = ['date', 'amount', 'currency', 'description', 'gl_account', 'budget_holder']
    
    # Context for matching
    row_context = {
        'structural_unit': raw.get('structural_unit', raw.get('Structural Unit', '')),
        'region': raw.get('region', raw.get('Region', '')),
        'counterparty': raw.get('counterparty', raw.get('vendor', raw.get('Vendor', '')))
    }

    # 1. Contextual Global Rules (Highest Priority)
    for field in targets:
        rule = match_contextual_rule('description', raw.get('description', ''), row_context, mapping_index)
        if not rule:
            rule = match_contextual_rule('budget_article', raw.get('budget_article', ''), row_context, mapping_index)
            
        if rule and rule.get('target_field') == field:
            normalized[field] = rule.get('target_value')
            if field == 'budget_holder': mapped_keys.add('budget_article')

    # 2. Field Mapping (Pattern match / YAML defaults)
    for k, v in raw.items():
        lk = str(k).lower()
        if lk in simple_mappings:
            target = simple_mappings[lk]
            if target in targets and not normalized.get(target):
                normalized[target] = v
                mapped_keys.add(k)
                
    # 3. Preservation & Heuristics
    for k, v in raw.items():
        if k not in mapped_keys:
            normalized[f"original_{k}"] = v

    if not normalized['date']:
        normalized['date'] = raw.get('Date', raw.get('date', ''))
    if not normalized['amount'] or normalized['amount'] == 0:
        normalized['amount'] = raw.get('Amount', raw.get('amount', '0'))
    if not normalized['description']:
        normalized['description'] = raw.get('Description', raw.get('description', ''))
    
    # 4. Categorization (from specialized Schema)
    if schema:
        gl = str(normalized.get('gl_account', ''))
        acc_mappings = schema.get('account_mappings', {})
        for code_pattern, rules_set in acc_mappings.items():
            if code_pattern == gl or (code_pattern.endswith('*') and gl.startswith(code_pattern[:-1])):
                normalized['category_tag'] = f"{rules_set.get('category')} - {rules_set.get('sub_category')}"
                break
    
    # Clean-up
    try:
        normalized['amount'] = float(str(normalized['amount']).replace(',', ''))
    except:
        normalized['amount'] = 0.0
        
    return normalized

@pubsub_fn.on_message_published(topic="raw-rows-created", region="us-central1")
def transform_raw_rows(event: pubsub_fn.CloudEvent) -> None:
    """
    Subscribes to raw-rows-created, reads raw_rows, performs normalization,
    and writes to normalized_rows.
    """
    try:
        message_data = base64.b64decode(event.data.message.data).decode('utf-8')
        payload = json.loads(message_data)
        
        file_id = payload.get('file_id')
        source_profile = payload.get('source_profile')
        company_id = payload.get('company_id', 'UNKNOWN')
        period = payload.get('period', 'UNKNOWN')
        
        if not file_id: return

        logger.info(f"Mapping Engine: Transforming file {file_id} for {company_id}")
        
        # Load Mapping Rules
        try:
            rules = get_combined_mapping_rules(db=db, source_profile=source_profile)
            mapping_version = {
                'profile': source_profile,
                'dynamic_rules_count': len(rules.get('firestore_mappings', [])),
                'timestamp': datetime.datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to load rules: {e}")
            rules = {"combined_mappings": {}, "mapping_index": {}}
            mapping_version = {'status': 'error', 'profile': source_profile}

        raw_rows_ref = db.collection('raw_rows').where('file_id', '==', file_id).stream()
        
        batch = db.batch()
        normalized_collection = db.collection('normalized_rows')
        
        written = 0
        for doc in raw_rows_ref:
            raw_data = doc.to_dict()
            normalized_data = normalize_row(raw_data, rules, company_id=company_id, period=period)
            
            row_idx = raw_data.get('row_index', written)
            norm_doc_id = f"n_{file_id.replace('f_', '')}_{row_idx}"
            
            batch.set(normalized_collection.document(norm_doc_id), {
                **normalized_data,
                'mapping_version': mapping_version,
                'normalized_at': firestore.SERVER_TIMESTAMP
            })
            
            written += 1
            if written % 400 == 0:
                batch.commit()
                batch = db.batch()
        
        batch.commit()
        
        # Emit Step Completion
        topic_path = publisher.topic_path(PROJECT_ID, NORMALIZED_TOPIC)
        publisher.publish(topic_path, json.dumps({
            'file_id': file_id,
            'source_profile': source_profile,
            'company_id': company_id,
            'period': period,
            'row_count': written
        }).encode('utf-8'))

    except Exception as e:
        logger.error(f"Mapping Engine Error: {e}", exc_info=True)
