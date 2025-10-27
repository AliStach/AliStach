# Render Deployment Guide

## 🚀 Deploy AliStach to Render

### Prerequisites
- GitHub repository with the code
- Render account (free tier available)
- AliExpress API credentials

### Step 1: Connect GitHub Repository
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `https://github.com/AliStach/Kiro`
4. Select the repository and branch: `main`

### Step 2: Configure Service Settings
- **Name**: `alistach-gpt-chat`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Build Command**: `npm install`
- **Start Command**: `npx tsx src/app.ts`

### Step 3: Set Environment Variables
Add these environment variables in Render dashboard:

| Variable | Value | Required |
|----------|-------|----------|
| `NODE_ENV` | `production` | Yes |
| `PORT` | `10000` | Yes (Render default) |
| `HOST` | `0.0.0.0` | Yes |
| `ALIEXPRESS_APP_KEY` | `520934` | Yes |
| `ALIEXPRESS_APP_SECRET` | `your_secret_here` | Yes |
| `ALIEXPRESS_PID` | `your_pid_here` | Yes |

### Step 4: Deploy
1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Run `npm install`
   - Start the server with `npx tsx src/app.ts`
   - Assign a public URL

### Step 5: Verify Deployment
Once deployed, test these endpoints:

```bash
# Health check
curl https://your-app.onrender.com/health

# Product search
curl -X POST https://your-app.onrender.com/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "find wireless earbuds", "sessionId": "test"}'
```

### Expected Response
Health check should return:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-27T12:00:00.000Z",
  "services": {
    "redis": "disconnected",
    "server": "running"
  }
}
```

### Troubleshooting

**Build Fails:**
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility

**Server Won't Start:**
- Ensure `PORT` environment variable is set to `10000`
- Check that `HOST` is set to `0.0.0.0`
- Verify start command: `npx tsx src/app.ts`

**Health Check Fails:**
- Confirm `/health` route exists in `src/app.ts`
- Check server logs in Render dashboard

### Production Configuration
For production use:
1. Set real AliExpress API credentials
2. Configure Redis for caching (optional)
3. Set up monitoring and alerts
4. Configure custom domain (paid plans)

### Render.yaml Alternative
If using `render.yaml` for infrastructure as code:
```yaml
services:
  - type: web
    name: alistach-gpt-chat
    env: node
    buildCommand: npm install
    startCommand: npx tsx src/app.ts
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

### Cost Optimization
- **Free Tier**: 750 hours/month, sleeps after 15min inactivity
- **Paid Plans**: Always-on, custom domains, more resources
- **Monitoring**: Use Render's built-in metrics and logs