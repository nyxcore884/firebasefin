#!/bin/bash
# setup-all.sh

PROJECT_ID="studio-9381016045-4d625"
REGION="us-central1"

echo "Setting up complete financial analysis system..."

# 1. Deploy Cloud Functions
cd functions
./deploy-all.sh

# 2. Build and deploy Cloud Run
cd ../services/financial-analysis-engine
gcloud builds submit --config cloudbuild.yaml

# 3. Set up Vertex AI
cd ../../vertex-ai
docker build -t gcr.io/$PROJECT_ID/prophet-trainer:latest -f Dockerfile.training .
docker push gcr.io/$PROJECT_ID/prophet-trainer:latest

docker build -t gcr.io/$PROJECT_ID/prophet-serving:latest -f Dockerfile.serving .
docker push gcr.io/$PROJECT_ID/prophet-serving:latest

gsutil cp train_prophet.py gs://$PROJECT_ID-ml-artifacts/training/

echo "✓ Deployment complete!"
echo "API URL: $(gcloud run services describe financial-analysis-engine --region=$REGION --format='value(status.url)')"
