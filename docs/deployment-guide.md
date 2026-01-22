# 🚀 Deployment Guide

This guide provides the step-by-step process for deploying the complete financial analysis system.

## Prerequisites

1.  **Google Cloud SDK:** Ensure you have `gcloud` installed and authenticated.
2.  **Project ID:** Your GCP Project ID is set in your `gcloud` configuration (`gcloud config set project YOUR_PROJECT_ID`).
3.  **Permissions:** You have the necessary IAM roles (e.g., Cloud Build Editor, Cloud Run Admin, Cloud Functions Developer, Vertex AI User) to deploy resources.
4.  **APIs Enabled:** Make sure the following APIs are enabled in your GCP project:
    *   Cloud Build API
    *   Cloud Run Admin API
    *   Cloud Functions API
    *   Vertex AI API
    *   Cloud Storage API
    *   Pub/Sub API
    *   Firestore API
    *   BigQuery API

## Deployment Order

The components must be deployed in a specific order to ensure dependencies are met.

### 1. Update Backend Dependencies

Before deploying the main API, ensure its dependencies are up to date. The `financial-analysis-engine` service requires libraries for BigQuery and Vertex AI.

*   **File:** `services/financial-analysis-engine/requirements.txt`
*   **Action:** Add `google-cloud-bigquery` and `google-cloud-aiplatform` to the file.

### 2. Deploy Cloud Run API

This is the central backend service. It needs to be deployed first so that the frontend and other services can communicate with it.

```bash
# Navigate to the service directory
cd services/financial-analysis-engine

# Submit the build to Cloud Build, which will build and deploy the service
gcloud builds submit --config cloudbuild.yaml
```

### 3. Deploy Cloud Functions

These functions handle the event-driven data processing pipeline.

```bash
# Navigate to the functions directory from the project root
cd functions

# Run the deployment script to deploy all functions
./deploy-all.sh
```

### 4. Set up Vertex AI Resources

This step involves building and publishing the custom Docker containers for training and serving the ML models.

```bash
# Navigate to the Vertex AI directory from the project root
cd vertex-ai

# Get your Project ID
PROJECT_ID=$(gcloud config get-value project)

# Build and push the training container
docker build -t gcr.io/$PROJECT_ID/prophet-trainer:latest -f Dockerfile.training .
docker push gcr.io/$PROJECT_ID/prophet-trainer:latest

# Build and push the serving container
docker build -t gcr.io/$PROJECT_ID/prophet-serving:latest -f Dockerfile.serving .
docker push gcr.io/$PROJECT_ID/prophet-serving:latest
```

Once these steps are complete, the backend system will be fully operational. You can then proceed with integrating and deploying the frontend application.
