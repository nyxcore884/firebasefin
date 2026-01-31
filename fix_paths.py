import os

ROOT = "functions"
for folder in os.listdir(ROOT):
    main_py = os.path.join(ROOT, folder, "main.py")
    if os.path.exists(main_py):
        with open(main_py, 'r') as f:
            content = f.read()
        
        # Add sys.path.append of the current directory at the top
        fix = "import sys, os\nsys.path.append(os.path.dirname(__file__))\n"
        if fix not in content:
            with open(main_py, 'w') as f:
                f.write(fix + content)
            print(f"Fixed sys.path in {main_py}")
