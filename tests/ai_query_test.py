import pytest
import sys
import os

# Testing Framework for AI Query Engine

class MockAIQueryEngine:
    """
    Mocking the AI Query Engine for unit testing logic logic without live HTTP calls.
    In integration tests, this would call the actual API.
    """
    def generate_answer(self, query):
        query_lower = query.lower()
        
        # Test Case 1: Exact Match
        if "sgg" in query_lower and "sales" in query_lower and "september 15, 2023" in query_lower:
            return "₾150,000 (Source: ERP System)"
            
        # Test Case 2: Partial Match
        if "sgg" in query_lower and "sales" in query_lower and "september 2023" in query_lower:
            return "Total sales for September 2023: ₾1,200,000 (Source: ERP System)"
            
        # Test Case 3: No Data Found
        if "sgg" in query_lower and "sales" in query_lower and "january 1, 2024" in query_lower:
            return "No data available for the specified date"
            
        # Test Case 4: Invalid Query
        if "meaning of life" in query_lower:
            return "Unable to answer. Please provide a valid financial query"
            
        return "Unknown Query"

@pytest.fixture
def engine():
    return MockAIQueryEngine()

def test_exact_match_query(engine):
    """
    Test Scenarios 1: Exact Match Query
    Input: "What were SGG's total sales on September 15, 2023?"
    Expected: "₾150,000 (Source: ERP System)"
    """
    query = "What were SGG's total sales on September 15, 2023?"
    answer = engine.generate_answer(query)
    assert answer == "₾150,000 (Source: ERP System)"

def test_partial_match_query(engine):
    """
    Test Scenarios 2: Partial Match Query
    Input: "Provide SGG's sales data for September 2023"
    Expected: "Total sales for September 2023: ₾1,200,000 (Source: ERP System)"
    """
    query = "Provide SGG's sales data for September 2023"
    answer = engine.generate_answer(query)
    assert answer == "Total sales for September 2023: ₾1,200,000 (Source: ERP System)"

def test_no_data_found(engine):
    """
    Test Scenarios 3: No Data Found
    Input: "What were SGG's sales on January 1, 2024?"
    Expected: "No data available for the specified date"
    """
    query = "What were SGG's sales on January 1, 2024?"
    answer = engine.generate_answer(query)
    assert answer == "No data available for the specified date"

def test_invalid_query(engine):
    """
    Test Scenarios 4: Invalid Query
    Input: "What is the meaning of life?"
    Expected: "Unable to answer. Please provide a valid financial query"
    """
    query = "What is the meaning of life?"
    answer = engine.generate_answer(query)
    assert answer == "Unable to answer. Please provide a valid financial query"

if __name__ == "__main__":
    # Minimal runner if pytest isn't installed in the environment
    eng = MockAIQueryEngine()
    try:
        test_exact_match_query(eng)
        print("✅ test_exact_match_query passed")
        test_partial_match_query(eng)
        print("✅ test_partial_match_query passed")
        test_no_data_found(eng)
        print("✅ test_no_data_found passed")
        test_invalid_query(eng)
        print("✅ test_invalid_query passed")
    except AssertionError as e:
        print(f"❌ Test Failed: {e}")
