#!/usr/bin/env bash
# deploy-staging.sh
# Production-ready deployment for the FinanceWise Decoupled Pipeline.

set -euo pipefail

# === CONFIGURE ===
PROJECT_ID="studio-9381016045-4d625"
REGION="us-central1"
ARTIFACT_REGISTRY_LOCATION="us-central1"
ARTIFACT_REGISTRY_REPO="artifact-repo"
DUCKDB_IMAGE_NAME="duckdb-analytics"
FUNCTION_REGION="${REGION}"

# Existing Service Accounts provided by user
APPLICATION_SA="financewise-app-ser@${PROJECT_ID}.iam.gserviceaccount.com"
ADMIN_SA="firebase-adminsdk-fbsvc@${PROJECT_ID}.iam.gserviceaccount.com"

# Granular Pipeline Service accounts (To be created/verified)
INGEST_SA="ingestion-sa@${PROJECT_ID}.iam.gserviceaccount.com"
TRANSFORM_SA="transformation-sa@${PROJECT_ID}.iam.gserviceaccount.com"
ACCOUNTING_SA="accounting-sa@${PROJECT_ID}.iam.gserviceaccount.com"
DUCKDB_SA="${APPLICATION_SA}" # Using existing application SA for DuckDB

# Storage buckets
UPLOADS_BUCKET="${PROJECT_ID}-financial-uploads"
REPORTS_BUCKET="${PROJECT_ID}-generated-reports"

# BigQuery dataset
BQ_DATASET="financial_data"

# Topics
RAW_TOPIC="raw-rows-created"
NORMALIZED_TOPIC="normalized-rows-created"

echo "----------------------------------------------------------"
echo "🚀 Target Project: ${PROJECT_ID}"
echo "----------------------------------------------------------"

gcloud config set project "${PROJECT_ID}"

# === 1. Enable Required APIs ===
echo "✅ Enabling required APIs..."
gcloud services enable \
  cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  pubsub.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  bigquery.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  monitoring.googleapis.com \
  --project="${PROJECT_ID}"

# === 2. Create Artifact Registry ===
echo "✅ Checking Artifact Registry..."
if ! gcloud artifacts repositories describe "${ARTIFACT_REGISTRY_REPO}" --location="${ARTIFACT_REGISTRY_LOCATION}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud artifacts repositories create "${ARTIFACT_REGISTRY_REPO}" \
    --repository-format=docker \
    --location="${ARTIFACT_REGISTRY_LOCATION}" \
    --description="Docker repo for financial pipeline" \
    --project="${PROJECT_ID}"
fi

# === 3. Create Pub/Sub Topics ===
echo "✅ Creating Pub/Sub topics..."
gcloud pubsub topics create "${RAW_TOPIC}" --project="${PROJECT_ID}" || true
gcloud pubsub topics create "${NORMALIZED_TOPIC}" --project="${PROJECT_ID}" || true

# === 4. Create/Verify Pipeline Service Accounts ===
echo "✅ Configuring service accounts..."
gcloud iam service-accounts create ingestion-sa --display-name="Ingestion Function SA" --project="${PROJECT_ID}" || true
gcloud iam service-accounts create transformation-sa --display-name="Transformation Function SA" --project="${PROJECT_ID}" || true
gcloud iam service-accounts create accounting-sa --display-name="Accounting Function SA" --project="${PROJECT_ID}" || true

# === 5. Grant IAM Roles (Least Privilege) ===
echo "✅ Configuring IAM permissions..."
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')

# Firestore access for the pipeline functions
for SA in "${INGEST_SA}" "${TRANSFORM_SA}" "${ACCOUNTING_SA}"; do
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${SA}" --role="roles/datastore.user" --condition=None >/dev/null
done

# Storage access (Ingestion reads, Admin handles setup)
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${INGEST_SA}" --role="roles/storage.objectViewer" --condition=None >/dev/null

# Pub/Sub Graph Logic
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${INGEST_SA}" --role="roles/pubsub.publisher" --condition=None >/dev/null
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${TRANSFORM_SA}" --role="roles/pubsub.publisher" --condition=None >/dev/null
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${TRANSFORM_SA}" --role="roles/pubsub.subscriber" --condition=None >/dev/null
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${ACCOUNTING_SA}" --role="roles/pubsub.subscriber" --condition=None >/dev/null

# BigQuery access for Analytics SA (Using the existing Application SA)
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${DUCKDB_SA}" --role="roles/bigquery.dataViewer" --condition=None >/dev/null
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${DUCKDB_SA}" --role="roles/datastore.user" --condition=None >/dev/null

# BigQuery Editor for Accounting Engine (To stream entries)
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${ACCOUNTING_SA}" --role="roles/bigquery.dataEditor" --condition=None >/dev/null

# Cloud Build permissions to orchestrate deployment
CLOUDBUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${CLOUDBUILD_SA}" --role="roles/run.admin" --condition=None >/dev/null
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${CLOUDBUILD_SA}" --role="roles/cloudfunctions.admin" --condition=None >/dev/null
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${CLOUDBUILD_SA}" --role="roles/iam.serviceAccountUser" --condition=None >/dev/null
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${CLOUDBUILD_SA}" --role="roles/artifactregistry.writer" --condition=None >/dev/null
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${CLOUDBUILD_SA}" --role="roles/storage.admin" --condition=None >/dev/null

# === 6. Create Storage Buckets ===
echo "✅ Creating storage buckets..."
if ! gsutil ls -b "gs://${UPLOADS_BUCKET}" >/dev/null 2>&1; then
  gsutil mb -l "${REGION}" "gs://${UPLOADS_BUCKET}"
fi
if ! gsutil ls -b "gs://${REPORTS_BUCKET}" >/dev/null 2>&1; then
  gsutil mb -l "${REGION}" "gs://${REPORTS_BUCKET}"
fi

# === 7. Create BigQuery Dataset & Tables ===
echo "✅ Configuring BigQuery..."
if ! bq ls --project_id="${PROJECT_ID}" | grep -q "${BQ_DATASET}" >/dev/null 2>&1; then
  bq --location=US mk --dataset "${PROJECT_ID}:${BQ_DATASET}"
fi

# Create analytical tables with specific schemas for ML/AI
echo "   - Creating consolidated_ledger table..."
bq mk --table --project_id="${PROJECT_ID}" "${BQ_DATASET}.consolidated_ledger" \
  transactionDate:STRING,amount:FLOAT,itemCode:STRING,accountId:STRING,direction:STRING,processedAt:STRING || echo "     (Table exists)"

echo "   - Creating detailed_budget table..."
bq mk --table --project_id="${PROJECT_ID}" "${BQ_DATASET}.detailed_budget" \
  transactionDate:DATE,amount:FLOAT,itemCode:STRING || echo "     (Table exists)"

# === 8. Trigger Build ===
echo "🛠 Starting Build Orchestration..."
gcloud builds submit --config=cloudbuild.yaml . \
  --substitutions=_PROJECT_ID="${PROJECT_ID}",_REGION="${REGION}",_ARTIFACT_REGISTRY_LOCATION="${ARTIFACT_REGISTRY_LOCATION}",_ARTIFACT_REGISTRY_REPO="${ARTIFACT_REGISTRY_REPO}",_DUCKDB_IMAGE_NAME="${DUCKDB_IMAGE_NAME}",_DUCKDB_SA="${DUCKDB_SA}",_INGEST_SA="${INGEST_SA}",_TRANSFORM_SA="${TRANSFORM_SA}",_ACCOUNTING_SA="${ACCOUNTING_SA}",_FUNCTION_REGION="${FUNCTION_REGION}" \
  --project="${PROJECT_ID}"

echo "✅ Pipeline setup and build triggered successfully."
