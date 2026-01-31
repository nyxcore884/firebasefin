import sys
import os

# Add functions to path
sys.path.insert(0, os.path.abspath("functions"))

try:
    import main
    print("Successfully imported functions.main")
    for attr in dir(main):
        val = getattr(main, attr)
        if callable(val) and not attr.startswith("__"):
            print(f"Exported: {attr}")
except Exception as e:
    print(f"Error importing functions.main: {e}")
    import traceback
    traceback.print_exc()
