import sys
import os
import json

# Add the functions directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'functions/5-financial-engine')))

# Mock Firestore if needed or use local logic if possible
# Since we are testing logic, we can mock the Firestore Client if we really wanted to.
# However, we can also just test the parts that don't depend on firestore or use a mock.

import ml_config

def test_ml_config_logic():
    print("Testing ML Config Logic...")
    
    # 1. Test get_training_metrics
    metrics = ml_config.get_training_metrics()
    print("\nTraining Metrics:")
    print(f"  Accuracy: {metrics['accuracy_score']}")
    print(f"  R-Squared: {metrics['r_squared']}")
    print(f"  Top Feature: {metrics['feature_importance'][0]['feature']} ({metrics['feature_importance'][0]['weight']})")
    
    # 2. Test Default Config (get_ml_config will attempt Firestore, so we might need to mock or just check if it handles error)
    print("\nNote: get_ml_config and update_ml_config require live Firestore connection.")
    print("Logic verification complete for local components.")

if __name__ == "__main__":
    test_ml_config_logic()
