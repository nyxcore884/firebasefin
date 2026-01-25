#!/usr/bin/env bash
# deploy-staging-interactive.sh
# Interactive setup and deployment for the Decoupled Financial Pipeline.

set -euo pipefail

confirm() {
  read -r -p "${1} [y/N]: " resp
  case "$resp" in
    [yY]|[yY][eE][sS]) return 0 ;;
    *) return 1 ;;
  esac
}

echo "=========================================================="
echo "🎯 firebasefin: Interactive Deployment Orchestrator"
echo "=========================================================="

read -r -p "GCP Project ID: " PROJECT_ID
if [ -z "${PROJECT_ID}" ]; then
  echo "❌ Project ID required. Exiting."
  exit 1
fi

read -r -p "GCP Region (default us-central1): " REGION
REGION="${REGION:-us-central1}"

read -r -p "Artifact Registry repo name (default artifact-repo): " ARTIFACT_REPO
ARTIFACT_REPO="${ARTIFACT_REPO:-artifact-repo}"

read -r -p "Artifact Registry location (default us-central1): " ARTIFACT_REG_LOCATION
ARTIFACT_REG_LOCATION="${ARTIFACT_REG_LOCATION:-us-central1}"

read -r -p "DuckDB image name (default duckdb-analytics): " DUCKDB_IMAGE
DUCKDB_IMAGE="${DUCKDB_IMAGE:-duckdb-analytics}"

read -r -p "Uploads bucket name (default: <project>-financial-uploads): " UPLOADS_BUCKET
UPLOADS_BUCKET="${UPLOADS_BUCKET:-${PROJECT_ID}-financial-uploads}"

read -r -p "Reports bucket name (default: <project>-generated-reports): " REPORTS_BUCKET
REPORTS_BUCKET="${REPORTS_BUCKET:-${PROJECT_ID}-generated-reports}"

read -r -p "BigQuery dataset name (default financial_data): " BQ_DATASET
BQ_DATASET="${BQ_DATASET:-financial_data}"

echo
echo "----------------------------------------------------------"
echo "🔍 Deployment Summary:"
echo "  Project ID:            ${PROJECT_ID}"
echo "  Region:                ${REGION}"
echo "  Artifact Registry:     ${ARTIFACT_REPO} (${ARTIFACT_REG_LOCATION})"
echo "  DuckDB Image:          ${DUCKDB_IMAGE}"
echo "  Uploads Bucket:        gs://${UPLOADS_BUCKET}"
echo "  Reports Bucket:        gs://${REPORTS_BUCKET}"
echo "  BigQuery Dataset:      ${BQ_DATASET}"
echo "----------------------------------------------------------"
echo

if ! confirm "🚀 Proceed to initialize infrastructure and trigger Cloud Build?"; then
  echo "Aborted by user."
  exit 0
fi

gcloud config set project "${PROJECT_ID}"

echo "✅ Enabling APIs..."
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

echo "✅ Checking Artifact Registry..."
if ! gcloud artifacts repositories describe "${ARTIFACT_REPO}" --location="${ARTIFACT_REG_LOCATION}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  gcloud artifacts repositories create "${ARTIFACT_REPO}" \
    --repository-format=docker --location="${ARTIFACT_REG_LOCATION}" \
    --description="Docker repo for firebasefin" --project="${PROJECT_ID}"
fi

echo "✅ Creating Pub/Sub topics..."
gcloud pubsub topics create raw-rows-created --project="${PROJECT_ID}" || true
gcloud pubsub topics create normalized-rows-created --project="${PROJECT_ID}" || true

echo "✅ Creating Service Accounts..."
gcloud iam service-accounts create ingestion-sa --display-name="Ingestion SA" --project="${PROJECT_ID}" || true
gcloud iam service-accounts create transformation-sa --display-name="Transformation SA" --project="${PROJECT_ID}" || true
gcloud iam service-accounts create accounting-sa --display-name="Accounting SA" --project="${PROJECT_ID}" || true
gcloud iam service-accounts create duckdb-sa --display-name="DuckDB SA" --project="${PROJECT_ID}" || true

PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')
CLOUDBUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Define SA emails for IAM
INGEST_SA_EMAIL="ingestion-sa@${PROJECT_ID}.iam.gserviceaccount.com"
TRANSFORM_SA_EMAIL="transformation-sa@${PROJECT_ID}.iam.gserviceaccount.com"
ACCOUNT_SA_EMAIL="accounting-sa@${PROJECT_ID}.iam.gserviceaccount.com"
DUCKDB_SA_EMAIL="duckdb-sa@${PROJECT_ID}.iam.gserviceaccount.com"

echo "✅ Configuring IAM roles..."
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${INGEST_SA_EMAIL}" --role="roles/datastore.user" --condition=None >/dev/null
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${TRANSFORM_SA_EMAIL}" --role="roles/datastore.user" --condition=None >/dev/null
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${ACCOUNT_SA_EMAIL}" --role="roles/datastore.user" --condition=None >/dev/null
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${INGEST_SA_EMAIL}" --role="roles/storage.objectViewer" --condition=None >/dev/null
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${INGEST_SA_EMAIL}" --role="roles/pubsub.publisher" --condition=None >/dev/null
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${TRANSFORM_SA_EMAIL}" --role="roles/pubsub.publisher" --condition=None >/dev/null
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${TRANSFORM_SA_EMAIL}" --role="roles/pubsub.subscriber" --condition=None >/dev/null
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${ACCOUNT_SA_EMAIL}" --role="roles/pubsub.subscriber" --condition=None >/dev/null
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${DUCKDB_SA_EMAIL}" --role="roles/bigquery.dataViewer" --condition=None >/dev/null

# Cloud Build special permissions
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${CLOUDBUILD_SA}" --role="roles/run.admin" --condition=None >/dev/null
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${CLOUDBUILD_SA}" --role="roles/cloudfunctions.admin" --condition=None >/dev/null
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${CLOUDBUILD_SA}" --role="roles/iam.serviceAccountUser" --condition=None >/dev/null
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${CLOUDBUILD_SA}" --role="roles/artifactregistry.writer" --condition=None >/dev/null
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${CLOUDBUILD_SA}" --role="roles/storage.admin" --condition=None >/dev/null

echo "✅ Checking Storage Buckets..."
if ! gsutil ls -b "gs://${UPLOADS_BUCKET}" >/dev/null 2>&1; then
  gsutil mb -l "${REGION}" "gs://${UPLOADS_BUCKET}"
fi
if ! gsutil ls -b "gs://${REPORTS_BUCKET}" >/dev/null 2>&1; then
  gsutil mb -l "${REGION}" "gs://${REPORTS_BUCKET}"
fi

echo "✅ Checking BigQuery Dataset..."
if ! bq --project_id="${PROJECT_ID}" ls --format=prettyjson "${PROJECT_ID}:${BQ_DATASET}" >/dev/null 2>&1; then
  bq --location=US mk --dataset "${PROJECT_ID}:${BQ_DATASET}" || true
fi

echo
read -r -p "🚀 Trigger Cloud Build now? [y/N]: " ok
if [[ "${ok}" =~ ^[Yy] ]]; then
  gcloud builds submit --config=cloudbuild.yaml . \
    --substitutions=_PROJECT_ID="${PROJECT_ID}",_REGION="${REGION}",_ARTIFACT_REGISTRY_LOCATION="${ARTIFACT_REG_LOCATION}",_ARTIFACT_REGISTRY_REPO="${ARTIFACT_REPO}",_DUCKDB_IMAGE_NAME="${DUCKDB_IMAGE}",_DUCKDB_SA="${DUCKDB_SA_EMAIL}",_INGEST_SA="${INGEST_SA_EMAIL}",_TRANSFORM_SA="${TRANSFORM_SA_EMAIL}",_ACCOUNTING_SA="${ACCOUNT_SA_EMAIL}",_FUNCTION_REGION="${REGION}" \
    --project="${PROJECT_ID}"
  echo "🛠 Cloud Build submitted. Monitor logs in GCP Console."
else
  echo "⏭ Cloud Build skipped. Infrastructure is ready."
fi

echo "✨ Done."
