#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Get the GCP Project ID from the gcloud config.
PROJECT_ID=$(gcloud config get-value project)

if [ -z "$PROJECT_ID" ]; then
    echo "GCP Project ID not found. Please run 'gcloud config set project YOUR_PROJECT_ID'"
    exit 1
fi

echo "Starting deployment of financial-analysis-engine to project: $PROJECT_ID"

# Submit the build to Google Cloud Build using the configuration file.
# This will build the Docker image and deploy it to Cloud Run.
gcloud builds submit --config cloudbuild.yaml . --project=$PROJECT_ID

echo "Deployment submitted to Cloud Build. Check the GCP console for progress."
