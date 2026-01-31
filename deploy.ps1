# Deployment Script
$IMAGE = "gcr.io/studio-9381016045-4d625/firebasefin-backend"

Write-Host "Building Frontend..."
npm run build
if ($LASTEXITCODE -ne 0) { throw "Frontend Build Failed" }

Write-Host "Building Backend Container..."
Set-Location -Path "backend"
gcloud builds submit --tag $IMAGE
if ($LASTEXITCODE -ne 0) { throw "Build Failed" }

Write-Host "Deploying directly to Cloud Run..."
gcloud run deploy firebasefin-backend --image $IMAGE --region us-central1 --platform managed --allow-unauthenticated --project studio-9381016045-4d625
if ($LASTEXITCODE -ne 0) { throw "Deploy Failed" }

Set-Location -Path ".."
Write-Host "Deploying Hosting..."
firebase deploy --only hosting
Write-Host "Deploying Functions..."
firebase deploy --only functions
Write-Host "DONE"
