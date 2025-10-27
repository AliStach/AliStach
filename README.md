# GPT Chat with AliExpress Integration

A GPT-powered chat assistant that integrates with AliExpress affiliate search to provide product recommendations with monetized links.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Redis (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AliStach/Kiro.git
   cd Kiro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your actual credentials
   # NEVER commit the .env file to git!
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Or direct start
   npx tsx src/app.ts
   ```

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `REDIS_URL` | Redis connection string | No |
| `ALIEXPRESS_APP_KEY` | Your AliExpress API key | Yes* |
| `ALIEXPRESS_APP_SECRET` | Your AliExpress API secret | Yes* |
| `ALIEXPRESS_PID` | Your affiliate PID | Yes* |
| `OPENAI_API_KEY` | OpenAI API key for GPT | Yes* |

*Required for full functionality

## 🧪 Testing

```bash
# Test server health
curl http://localhost:3000/health

# Test chat endpoint
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "sessionId": "test"}'
```

## 📁 Project Structure

```
src/
├── app.ts                 # Main server application
├── plugins/
│   └── aliexpress/        # AliExpress integration plugin
├── services/              # Business logic services
└── config/                # Configuration files
```

## 🔒 Security

- Never commit `.env` files
- All secrets are stored in environment variables
- API keys are validated before use
- Input validation on all endpoints

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t gpt-chat .
docker run -p 3000:3000 --env-file .env gpt-chat
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## ⚠️ Important Notes

- Keep your `.env` file local and never commit it
- Configure your AliExpress affiliate credentials properly
- Monitor API usage to stay within rate limits
- Test all endpoints before deploying to production