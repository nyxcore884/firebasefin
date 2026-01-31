import os
import py_compile

ROOT_DIR = "functions"
errors = []

for root, dirs, files in os.walk(ROOT_DIR):
    if "main.py" in files:
        path = os.path.join(root, "main.py")
        try:
            py_compile.compile(path, doraise=True)
            print(f"OK: {path}")
        except Exception as e:
            print(f"ERROR: {path}: {e}")
            errors.append((path, str(e)))

if not errors:
    print("All functions are syntactically correct.")
else:
    print(f"Found {len(errors)} errors.")
