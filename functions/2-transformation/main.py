import os
import json
import logging
import base64
import sys
from firebase_functions import pubsub_fn, options
from google.cloud import firestore, pubsub_v1
import firebase_admin
from firebase_admin import initialize_app

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

def normalize_row(raw_row, rules):
    """
    Apply normalization rules based on source_profile and dynamic overrides.
    Maintains a flat structure for downstream Accounting Engine compatibility.
    """
    raw = raw_row.get('raw', {})
    schema = rules.get('active_schema')
    mappings = rules.get('combined_mappings', {})
    
    normalized = {
        'source_file_id': raw_row.get('file_id'),
        'source_row_index': raw_row.get('row_index'),
        'date': '',
        'amount': 0.0,
        'currency': 'GEL',
        'description': '',
        'category_tag': 'General'
    }
    
    # 1. Field Mapping with pattern match
    mapped_keys = set()
    targets = ['date', 'amount', 'currency', 'description', 'gl_account']
    
    for k, v in raw.items():
        lk = str(k).lower()
        if lk in mappings:
            target = mappings[lk]
            if target in targets:
                normalized[target] = v
                mapped_keys.add(k)
                
    # 2. Preserve Unmapped Fields (Patch 004 requirement)
    for k, v in raw.items():
        if k not in mapped_keys:
            normalized[f"original_{k}"] = v

    # 3. Fallback to Generic Heuristics
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
        
        if not file_id: return

        logger.info(f"Mapping Engine: Transforming file {file_id}")
        
        # Load Mapping Rules
        try:
            rules = get_combined_mapping_rules(source_profile, db)
            mapping_version = {
                'profile': source_profile,
                'dynamic_overrides': rules.get('is_dynamic', False),
                'timestamp': datetime.datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to load rules: {e}")
            rules = {"combined_mappings": {}}
            mapping_version = {'status': 'error', 'profile': source_profile}

        raw_rows_ref = db.collection('raw_rows').where('file_id', '==', file_id).stream()
        
        batch = db.batch()
        normalized_collection = db.collection('normalized_rows')
        
        written = 0
        for doc in raw_rows_ref:
            raw_data = doc.to_dict()
            normalized_data = normalize_row(raw_data, rules)
            
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
            'row_count': written
        }).encode('utf-8'))

    except Exception as e:
        logger.error(f"Mapping Engine Error: {e}", exc_info=True)
