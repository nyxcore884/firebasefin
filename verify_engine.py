import json
import os
import sys

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from backend.app.services.deterministic_engine import deterministic_engine
    print("Engine loaded successfully.")
    
    results = deterministic_engine.tester.run_all_tests()
    print("\n" + "="*50)
    print("DETERMINISTIC ENGINE UNIT TESTS (v17)")
    print("="*50)
    print(f"OVERALL STATUS: {results['overall_status']}")
    print("-" * 50)
    
    for key, res in results['results'].items():
        status_icon = "✅" if res['status'] == "PASS" else "❌"
        print(f"{status_icon} {key}: {res['test_case']} -> {res['status']}")
        if res.get('explanations'):
            print(f"   Explanations: {res['explanations']}")
        if res.get('is_favorable') is not None:
             print(f"   Favorable: {res['is_favorable']}")
    
    print("="*50)

except Exception as e:
    print(f"Verification Failed: {e}")
    import traceback
    traceback.print_exc()
