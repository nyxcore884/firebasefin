import os
import glob
import yaml
import logging
from typing import Dict, Any, List
from collections import defaultdict
from google.cloud import firestore

logger = logging.getLogger(__name__)
SCHEMAS_DIR = os.path.join(os.path.dirname(__file__), "schemas")

def load_local_schemas() -> Dict[str, Dict[str, Any]]:
    schemas = {}
    pattern = os.path.join(SCHEMAS_DIR, "*.yaml")
    for path in glob.glob(pattern):
        try:
            with open(path, "r", encoding="utf-8") as fh:
                data = yaml.safe_load(fh)
                if data and "name" in data:
                    schemas[data["name"]] = data
                    logger.info(f"Loaded local schema: {data['name']} from {path}")
        except Exception as e:
            logger.exception(f"Failed to load schema {path}: {e}")
    return schemas

def get_mapping_rules_from_firestore(db, source_profile: str = None) -> List[Dict[str, Any]]:
    """
    Return active mapping rules from Firestore.
    Prioritizes rules from active mapping_sets for the specified profile.
    """
    rules = []
    try:
        mapping_set_ids = []
        if source_profile:
            sets_q = db.collection('mapping_sets')\
                .where('source_profile', '==', source_profile)\
                .where('active', '==', True).stream()
            for s in sets_q:
                mapping_set_ids.append(s.id)

        if mapping_set_ids:
            # Firestore 'in' supports up to 10 elements
            chunks = [mapping_set_ids[i:i+10] for i in range(0, len(mapping_set_ids), 10)]
            for chunk in chunks:
                rules_q = db.collection('mapping_rules')\
                    .where('mapping_set_id', 'in', chunk)\
                    .where('active', '==', True).stream()
                for r in rules_q:
                    rules.append(r.to_dict())
        else:
            # global active rules fallback
            rules_q = db.collection('mapping_rules').where('active', '==', True).stream()
            for r in rules_q:
                rules.append(r.to_dict())

        logger.info(f"Loaded {len(rules)} active mapping rules for profile={source_profile}")
    except Exception as e:
        logger.error(f"Error loading mapping_rules from Firestore: {e}")
    return rules

def build_mapping_index(rules: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """
    Builds a priority-descending index of rules.
    Specificity score: Rules with more context (unit, region) score higher.
    """
    index = defaultdict(list)
    for r in rules:
        raw_field = r.get('raw_field', 'budget_article') or 'budget_article'
        index[raw_field].append(r)

    def specificity_score(rule: Dict[str, Any]) -> int:
        score = 0
        if rule.get('structural_unit'): score += 1
        if rule.get('counterparty'): score += 1
        if rule.get('region'): score += 1
        return score

    # Sort each field's rules by (Priority, Specificity)
    for k in index:
        index[k].sort(key=lambda x: (int(x.get('priority', 0)), specificity_score(x)), reverse=True)
    
    return dict(index)

def get_combined_mapping_rules(db=None, source_profile: str = None):
    """
    API entry point for the Mapping Engine.
    Combines static YAML definitions with runtime Firestore overrides.
    """
    local_schemas = load_local_schemas()
    firestore_mappings = []
    
    if db:
        firestore_mappings = get_mapping_rules_from_firestore(db, source_profile)

    # 1. Simple Aggregated Map (Pattern -> Target)
    combined = {}
    for schema in local_schemas.values():
        for m in schema.get('mappings', []):
            target = m.get('target_field') or m.get('target')
            for p in m.get('raw_patterns', []):
                combined[p.lower()] = target

    # 2. Firestore Overrides (Exact matches overwrite simple YAML mappings)
    for r in firestore_mappings:
        raw_val = str(r.get('raw_value', '')).lower()
        target = r.get('target_value') or r.get('target_field')
        if raw_val and target:
            combined[raw_val] = target

    # 3. Contextual Index (For complex matching in transform function)
    mapping_index = build_mapping_index(firestore_mappings)

    return {
        "local_schemas": local_schemas,
        "firestore_mappings": firestore_mappings,
        "combined_mappings": combined,
        "mapping_index": mapping_index
    }
