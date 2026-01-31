import os
import shutil
import re

ROOT_DIR = "functions"
AUTH_UTILS_SRC = "shared/auth_utils.py"

subdirs = [d for d in os.listdir(ROOT_DIR) if os.path.isdir(os.path.join(ROOT_DIR, d))]

for subdir in subdirs:
    target_path = os.path.join(ROOT_DIR, subdir)
    auth_utils_dest = os.path.join(target_path, "auth_utils.py")
    main_py_path = os.path.join(target_path, "main.py")
    
    # 1. Copy auth_utils.py
    shutil.copy(AUTH_UTILS_SRC, auth_utils_dest)
    
    # 2. Patch main.py
    if os.path.exists(main_py_path):
        with open(main_py_path, 'r') as f:
            content = f.read()
        
        # Clean up any existing attempts
        # Remove any @nexus_authenticated that were misplaced
        content = re.sub(r'\n\s*@nexus_authenticated[^\n]*\n', '\n', content)
        content = re.sub(r'from auth_utils import nexus_authenticated\s*\n', '', content)
        
        # Add import at the top
        content = "from auth_utils import nexus_authenticated\n" + content
        
        # Find all https_fn.on_request decorators and place @nexus_authenticated AFTER them
        # We look for @https_fn.on_request followed by any amount of args until the closing )
        # Using a non-greedy dotall match to find the closing ) that is followed by def
        pattern = r'(@https_fn\.on_request\s*\([^@]*\))\n\s*def'
        content = re.sub(pattern, r'\1\n@nexus_authenticated\ndef', content, flags=re.DOTALL)
        
        # Special case for those that might have been missed or have other decorators
        # Let's just ensure @nexus_authenticated is always followed by def
        # but we already did re.sub. 
        
        # Cleanup potential double newlines
        content = content.replace('\n\n@nexus_authenticated', '\n@nexus_authenticated')

        with open(main_py_path, 'w') as f:
            f.write(content)
        print(f"Standardized {subdir}")

print("Done.")
