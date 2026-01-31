import sys
import os

# Simulate the environment Firebase CLI creates
func_dir = os.path.abspath("functions/2-transformation")
sys.path.insert(0, func_dir)

try:
    import main
    print("Successfully imported main.py")
    # Check if the function exists
    if hasattr(main, 'transform_raw_rows'):
        print("transform_raw_rows found")
    else:
        print("transform_raw_rows NOT found")
except Exception as e:
    print(f"FAILED to import main.py: {e}")
    import traceback
    traceback.print_exc()
