# GitHub Deployment Guide

## 🚀 Step-by-Step Deployment (Windows PowerShell)

### 1. Verify Security
```powershell
# Check that .env is NOT being tracked
git status

# Verify .gitignore exists and includes .env
Get-Content .gitignore | Select-String ".env"

# Make sure no secrets are in tracked files
git grep -i "secret\|key\|password" -- "*.ts" "*.js" "*.json"
```

### 2. Initialize Git Repository
```powershell
# Initialize git repository
git init

# Add all files (except those in .gitignore)
git add .

# Check what will be committed (should NOT include .env)
git status

# Create initial commit
git commit -m "Initial commit: GPT Chat with AliExpress integration"
```

### 3. Connect to GitHub
```powershell
# Add GitHub remote
git remote add origin https://github.com/AliStach/Kiro.git

# Verify remote is set
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

### 4. Verify Deployment
```powershell
# Check repository on GitHub
# Visit: https://github.com/AliStach/Kiro

# Verify .env is NOT in the repository
# Check that .env.example IS in the repository
```

## 🔒 Security Verification Commands

### Before Pushing
```powershell
# Double-check no sensitive files will be committed
git ls-files | Select-String ".env$"
# Should return nothing

# Verify .gitignore is working
git check-ignore .env
# Should return: .env

# Check for any hardcoded secrets
git grep -E "(secret|key|password|token)" -- "*.ts" "*.js" "*.json" | Select-String -NotMatch "placeholder|example|your_"
# Should return nothing or only safe references
```

### After Pushing
```powershell
# Clone repository to test
git clone https://github.com/AliStach/Kiro.git test-clone
cd test-clone

# Verify .env is not present
Test-Path .env
# Should return: False

# Verify .env.example is present
Test-Path .env.example
# Should return: True

# Clean up test
cd ..
Remove-Item -Recurse -Force test-clone
```

## 🌐 Production Deployment

### Environment Setup
```powershell
# On production server, create .env from template
cp .env.example .env

# Edit with production values
notepad .env

# Install dependencies
npm ci --production

# Start server
npm start
```

### Health Check
```powershell
# Test production deployment
Invoke-RestMethod -Uri "http://your-domain.com/health" -Method GET
```

## ⚠️ Important Reminders

1. **NEVER commit .env files**
2. **Always use .env.example for templates**
3. **Rotate secrets regularly**
4. **Use different credentials for dev/prod**
5. **Monitor repository for accidental secret commits**

## 🔄 Updating Repository

```powershell
# Make changes
git add .
git commit -m "Description of changes"
git push origin main
```

## 🚨 Emergency: Secrets Accidentally Committed

If you accidentally commit secrets:

```powershell
# Remove from git history (DANGEROUS - rewrites history)
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env" --prune-empty --tag-name-filter cat -- --all

# Force push (only if repository is private and you're sure)
git push origin --force --all

# Immediately rotate all exposed credentials
```

**Better approach**: Delete repository and recreate if secrets were exposed.