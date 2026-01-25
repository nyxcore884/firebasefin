#!/bin/bash
# FinSight v6.4 Deployment Script

echo "🚀 Initializing FinSight Production Deployment Sequence..."

echo "📦 Step 1: Building Frontend Assets (Vite)..."
cd frontend
# Ensure dependencies are clean
npm install
# Production Build
npm run build

echo "🔥 Step 2: Deploying to Firebase Hosting..."
# Go back to root
cd ..
# Deploy only hosting to avoid overwriting function configs unintentionally
firebase deploy --only hosting

echo "✅ FinSight System Live."
