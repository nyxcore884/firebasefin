import os

REQ_FILE = "functions/requirements.txt"
if os.path.exists(REQ_FILE):
    # Try reading as utf-16le first
    try:
        with open(REQ_FILE, "r", encoding="utf-16-le") as f:
            lines = f.readlines()
    except:
        with open(REQ_FILE, "r") as f:
            lines = f.readlines()
    
    # Strip whitespace and remove Prophet/Sklearn/Numpy/Pandas if we want to be minimal
    # User said Prophet/Sklearn are forbidden at import time and probably shouldn't be in functions
    # However, pandas is often used for data frames. Let's keep pandas if really needed but be careful.
    
    clean_lines = []
    forbidden = ["prophet", "sklearn", "scikit-learn"]
    
    for line in lines:
        l = line.strip().lower()
        if l and not any(f in l for f in forbidden):
            if l not in clean_lines:
                clean_lines.append(l)
    
    # Rewrite as UTF-8
    with open(REQ_FILE, "w", encoding="utf-8") as f:
        for line in sorted(clean_lines):
            f.write(line + "\n")
    print(f"Cleaned {REQ_FILE}")
else:
    print("requirements.txt not found")
