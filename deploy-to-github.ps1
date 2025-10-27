# GitHub Deployment Script for Windows PowerShell
# Run with: powershell -ExecutionPolicy Bypass -File deploy-to-github.ps1

Write-Host "🚀 Preparing GPT Chat project for GitHub deployment..." -ForegroundColor Green
Write-Host ""

# Step 1: Security Check
Write-Host "🔒 Step 1: Security verification..." -ForegroundColor Yellow

# Check if .env exists and warn user
if (Test-Path ".env") {
    Write-Host "⚠️  WARNING: .env file detected!" -ForegroundColor Red
    Write-Host "   This file contains secrets and should NOT be committed to GitHub." -ForegroundColor Red
    Write-Host "   It will be excluded by .gitignore, but please verify your secrets are safe." -ForegroundColor Red
    Write-Host ""
}

# Verify .gitignore exists
if (-not (Test-Path ".gitignore")) {
    Write-Host "❌ ERROR: .gitignore file missing!" -ForegroundColor Red
    Write-Host "   This is required to protect sensitive files." -ForegroundColor Red
    exit 1
}

# Check .gitignore includes .env
$gitignoreContent = Get-Content ".gitignore" -Raw
if ($gitignoreContent -notmatch "\.env") {
    Write-Host "❌ ERROR: .gitignore doesn't exclude .env files!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Security checks passed" -ForegroundColor Green
Write-Host ""

# Step 2: Git Initialization
Write-Host "📁 Step 2: Initializing Git repository..." -ForegroundColor Yellow

# Initialize git if not already done
if (-not (Test-Path ".git")) {
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository already exists" -ForegroundColor Green
}

# Step 3: Add files
Write-Host ""
Write-Host "📝 Step 3: Adding files to Git..." -ForegroundColor Yellow

git add .

# Show what will be committed
Write-Host ""
Write-Host "📋 Files to be committed:" -ForegroundColor Cyan
git status --porcelain

# Verify .env is NOT being tracked
$trackedFiles = git ls-files
if ($trackedFiles -match "\.env$") {
    Write-Host "❌ ERROR: .env file is being tracked by Git!" -ForegroundColor Red
    Write-Host "   This would expose your secrets. Aborting deployment." -ForegroundColor Red
    exit 1
}

Write-Host "✅ No sensitive files will be committed" -ForegroundColor Green
Write-Host ""

# Step 4: Commit
Write-Host "💾 Step 4: Creating initial commit..." -ForegroundColor Yellow

git commit -m "Initial commit: GPT Chat with AliExpress integration

- Fastify server with TypeScript
- AliExpress affiliate product search integration  
- Modular plugin architecture
- Secure environment variable handling
- Docker support and deployment guides"

Write-Host "✅ Initial commit created" -ForegroundColor Green
Write-Host ""

# Step 5: Add remote and push
Write-Host "🌐 Step 5: Connecting to GitHub..." -ForegroundColor Yellow

# Check if remote already exists
$remotes = git remote
if ($remotes -notcontains "origin") {
    git remote add origin https://github.com/AliStach/Kiro.git
    Write-Host "✅ GitHub remote added" -ForegroundColor Green
} else {
    Write-Host "✅ GitHub remote already exists" -ForegroundColor Green
}

# Set main branch and push
Write-Host ""
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow

git branch -M main

try {
    git push -u origin main
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Push failed. This might be because:" -ForegroundColor Yellow
    Write-Host "   - Repository already exists with content" -ForegroundColor Yellow
    Write-Host "   - Authentication required" -ForegroundColor Yellow
    Write-Host "   - Network issues" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Try manually:" -ForegroundColor Cyan
    Write-Host "   git push -u origin main --force" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🎉 Deployment preparation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Visit: https://github.com/AliStach/Kiro" -ForegroundColor White
Write-Host "2. Verify .env is NOT in the repository" -ForegroundColor White
Write-Host "3. Check that .env.example IS present" -ForegroundColor White
Write-Host "4. Configure GitHub Pages or deployment platform" -ForegroundColor White
Write-Host "5. Set up environment variables on your hosting platform" -ForegroundColor White
Write-Host ""
Write-Host "🔒 Security reminders:" -ForegroundColor Red
Write-Host "- Never commit .env files" -ForegroundColor White
Write-Host "- Use .env.example for documentation" -ForegroundColor White
Write-Host "- Rotate secrets if accidentally exposed" -ForegroundColor White
Write-Host "- Use different credentials for production" -ForegroundColor White