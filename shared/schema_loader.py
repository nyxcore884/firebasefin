import os
import glob
import yaml
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Base directory for schemas
SCHEMAS_DIR = os.path.join(os.path.dirname(__file__), "schemas")

def load_local_schemas() -> Dict[str, Dict[str, Any]]:
    """Loads all profile-specific YAML schemas from the local directory."""
    schemas = {}
    pattern = os.path.join(SCHEMAS_DIR, "*.yaml")
    for path in glob.glob(pattern):
        try:
            with open(path, "r", encoding="utf-8") as fh:
                data = yaml.safe_load(fh)
                if data and ("name" in data or "dataset" in data):
                    name = data.get("name") or data.get("dataset", {}).get("name")
                    if name:
                        schemas[name.lower()] = data
                        logger.info(f"Loaded local schema: {name} from {path}")
        except Exception as e:
            logger.exception(f"Failed to load schema {path}: {e}")
    return schemas

def get_mapping_rules_from_firestore(firestore_client):
    """Fetches dynamic mapping overrides from Firestore."""
    mapping = {}
    try:
        # Expected collection: mapping_rules
        # Expected doc structure: { "raw_field": "Date", "target_field": "date" }
        docs = firestore_client.collection('mapping_rules').stream()
        for doc in docs:
            d = doc.to_dict()
            raw = d.get('raw_field') or d.get('rawField') or d.get('raw')
            target = d.get('target_field') or d.get('targetField') or d.get('target')
            if raw and target:
                mapping[str(raw).lower()] = target
    except Exception as e:
        logger.warning("Dynamic mapping_rules not found or unavailable in Firestore.")
    return mapping

def get_combined_mapping_rules(profile_name: str = None, firestore_client=None):
    """
    Combines static YAML mapping with dynamic Firestore overrides.
    Priority: 
    1. Firestore Overrides (User-defined in UI)
    2. Local YAML Schema (Version-controlled)
    3. Global Heuristics (Fallback)
    """
    local_schemas = load_local_schemas()
    firestore_mappings = {}
    
    if firestore_client:
        firestore_mappings = get_mapping_rules_from_firestore(firestore_client)

    # 1. Start with profile-specific rules if available
    schema = local_schemas.get(profile_name.lower()) if profile_name else None
    
    combined = {}
    
    # 2. Add local schema patterns to the map
    if schema:
        for m in schema.get('mappings', []):
            target = m.get('target_field') or m.get('target')
            patterns = m.get('raw_patterns', [])
            for p in patterns:
                combined[p.lower()] = target
                
    # 3. Layer Firestore overrides on top (allowing users to correct mappings via UI)
    for k, v in firestore_mappings.items():
        combined[k.lower()] = v

    return {
        "active_schema": schema,
        "combined_mappings": combined,
        "is_dynamic": len(firestore_mappings) > 0
    }
