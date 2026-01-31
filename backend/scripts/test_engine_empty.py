from app.services.deterministic_engine import deterministic_engine
import logging

logging.basicConfig(level=logging.INFO)

def test_engine():
    try:
        print("Testing Profit Margin with empty tables...")
        result = deterministic_engine.calculate_metrics("SGG", "profit_margin")
        print("Result:", result)
        
        print("\nTesting Revenue Trends...")
        result = deterministic_engine.calculate_metrics("SGG", "revenue_trends")
        print("Result:", result)
        
    except Exception as e:
        print("CRASHED:", e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_engine()
