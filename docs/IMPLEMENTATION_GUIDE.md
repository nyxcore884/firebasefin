# Financial AI Platform - Implementation Guide

## Quick Start

### 1. Prerequisites
- Google Cloud Account with billing enabled
- Node.js 18+ and Python 3.11+
- Firebase CLI
- Docker

### 2. Initial Setup

```bash
# Clone repository
git clone https://github.com/yourorg/financial-ai-platform
cd financial-ai-platform

# Set up GCP project
gcloud init
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Run migrations
alembic upgrade head

# Start development server
uvicorn main:app --reload
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase config

# Start development server
npm run dev
```

### 5. Deploy to Production

```bash
# Deploy backend
gcloud run deploy financial-ai-backend \
  --source ./backend \
  --region europe-west1 \
  --allow-unauthenticated

# Deploy frontend
cd frontend
npm run build
firebase deploy --only hosting
```

## Configuration Examples

See the comprehensive architecture documents for detailed configuration.

## Support

For questions or issues, contact: support@financial-ai-platform.com
