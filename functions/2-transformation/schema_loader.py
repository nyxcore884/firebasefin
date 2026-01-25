import yaml
from pathlib import Path
import os

# Define path relative to this function
# In Cloud Functions, shared folder might need valid relative path or be copied
# Assuming shared folder is accessible or copied:
# Local dev: ../../shared/schemas
# Deployment: We might need to ensure 'shared' is packaged. 
# For now, using the relative path assumption from the user request.

def load_schema(schema_name="procurement_sog_v1.yaml"):
    # Robust path finding
    base_path = Path(__file__).resolve().parent
    
    # Try local/relative path (Common in monorepo setups)
    potential_paths = [
        base_path / "schemas" / schema_name, # ./schemas/... (Deployment preferred)
        base_path / "shared" / "schemas" / schema_name, # ./shared/schemas/... (if copied)
        base_path.parents[1] / "shared" / "schemas" / schema_name, # ../../shared/schemas/... (Local dev)
    ]
    
    schema_path = None
    for p in potential_paths:
        if p.exists():
            schema_path = p
            break
            
    if not schema_path:
        raise FileNotFoundError(f"Schema {schema_name} not found in {potential_paths}")

    with open(schema_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)
