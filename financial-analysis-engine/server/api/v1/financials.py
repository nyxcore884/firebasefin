
from flask import Blueprint, jsonify, request
from google.cloud import firestore
import google.auth
import requests
import os

financials_bp = Blueprint('financials', __name__)

# Initialize Firestore client
_, PROJECT_ID = google.auth.default()
db = firestore.Client(project=PROJECT_ID)

# Get Vertex AI Endpoint details from environment variables
AIP_ENDPOINT_ID = os.environ.get("AIP_ENDPOINT_ID")
AIP_PROJECT = os.environ.get("AIP_PROJECT")
AIP_LOCATION = os.environ.get("AIP_LOCATION")

@financials_bp.route('/financial-data', methods=['GET'])
def get_financial_data():
    """
    Fetches aggregated financial data from Firestore.
    """
    try:
        # Fetch detailed budget data
        detailed_budget_ref = db.collection('financial_data_collection').document('detailed_budget').collection('documents')
        detailed_budget_docs = detailed_budget_ref.stream()
        detailed_budget = [doc.to_dict() for doc in detailed_budget_docs]

        # Fetch recent activity (you can customize this query)
        # For this example, we'll just pull a few recent transactions
        july_transactions_ref = db.collection('financial_data_collection').document('july_sgg_transactions').collection('documents').limit(5)
        july_transactions_docs = july_transactions_ref.stream()
        
        activity = []
        for doc in july_transactions_docs:
            data = doc.to_dict()
            activity.append({
                "user": "System",
                "name": f"Txn: {data.get('transactionNumber', 'N/A')}",
                "action": f"Processed debit of {data.get('amountDebitCurrency', 0)}",
                "time": "Just now",
                "status": "Completed"
            })


        response_data = {
            "detailed_budget": detailed_budget,
            "activity": activity,
            # You can add more data from other collections here
        }
        
        return jsonify(response_data), 200

    except Exception as e:
        print(f"Error fetching financial data: {e}")
        return jsonify({"error": "Failed to fetch financial data"}), 500

@financials_bp.route('/predict', methods=['POST'])
def predict():
    """
    Proxies prediction requests to the Vertex AI endpoint.
    """
    if not all([AIP_ENDPOINT_ID, AIP_PROJECT, AIP_LOCATION]):
        return jsonify({"error": "Vertex AI endpoint is not configured"}), 500

    try:
        # Get the request body from the client
        request_data = request.get_json()

        # Construct the URL for the Vertex AI endpoint
        endpoint_url = f"https://{AIP_LOCATION}-aiplatform.googleapis.com/v1/projects/{AIP_PROJECT}/locations/{AIP_LOCATION}/endpoints/{AIP_ENDPOINT_ID}:predict"

        # Get the access token for authentication
        credentials, project_id = google.auth.default()
        credentials.refresh(google.auth.transport.requests.Request())
        access_token = credentials.token

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        # Forward the request to Vertex AI
        vertex_response = requests.post(endpoint_url, json=request_data, headers=headers)
        vertex_response.raise_for_status() # Raise an exception for bad status codes

        return jsonify(vertex_response.json()), 200

    except requests.exceptions.RequestException as e:
        print(f"Error calling Vertex AI: {e}")
        # Try to return the actual error from Vertex if possible
        error_body = e.response.json() if e.response else {"error": "Network error calling prediction service"}
        return jsonify(error_body), 502 # Bad Gateway
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": "An internal error occurred while making a prediction"}), 500
