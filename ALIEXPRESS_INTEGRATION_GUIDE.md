# AliExpress Affiliate Search Integration Guide

## Overview

This guide shows how to integrate AliExpress affiliate product search into your existing GPT chat system. The integration is designed as a modular plugin that seamlessly extends your chat capabilities.

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
ALIEXPRESS_APP_KEY=520934
ALIEXPRESS_APP_SECRET=your_app_secret_here
ALIEXPRESS_PID=your_affiliate_pid_here
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
# With Docker Compose (recommended)
docker-compose up -d

# Or locally
npm run dev
```

### 4. Test the Integration

```bash
# Test product search
curl -X POST http://localhost:3000/api/aliexpress/search \
  -H "Content-Type: application/json" \
  -d '{"query": "wireless earbuds under $20"}'

# Test chat integration
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "find me wireless earbuds under $20", "sessionId": "test-session"}'
```

## 📋 API Reference

### AliExpress Open API Integration

#### Search Products Endpoint
```
POST https://api-sg.aliexpress.com/sync
```

**Parameters:**
```typescript
{
  method: 'aliexpress.affiliate.product.query',
  app_key: string,           // Your AppKey (520934)
  timestamp: string,         // Unix timestamp
  format: 'json',
  v: '2.0',
  sign_method: 'md5',
  sign: string,              // MD5 signature
  keywords: string,          // Search keywords
  category_ids?: string,     // Category filter
  min_sale_price?: number,   // Minimum price
  max_sale_price?: number,   // Maximum price
  page_no?: number,          // Page number (default: 1)
  page_size?: number,        // Results per page (max: 50)
  sort?: string,             // Sort order
  target_currency?: string,  // Currency (default: USD)
  target_language?: string   // Language (default: EN)
}
```

#### Generate Affiliate Links Endpoint
```
POST https://api-sg.aliexpress.com/sync
```

**Parameters:**
```typescript
{
  method: 'aliexpress.affiliate.link.generate',
  app_key: string,
  timestamp: string,
  format: 'json',
  v: '2.0',
  sign_method: 'md5',
  sign: string,
  source_values: string,     // Comma-separated product URLs
  promotion_link_type: 0,    // Link type (0 = normal)
  tracking_id: string        // Your PID
}
```

### Rate Limits

- **Search API**: 10 requests/second, 10,000 requests/day
- **Affiliate API**: 5 requests/second, 5,000 requests/day

### Authentication

All requests require MD5 signature generation:

```typescript
function generateSignature(params: Record<string, any>, secret: string): string {
  const sortedKeys = Object.keys(params).sort();
  let queryString = '';
  sortedKeys.forEach(key => {
    queryString += key + params[key];
  });
  const signString = secret + queryString + secret;
  return crypto.createHash('md5').update(signString).digest('hex').toUpperCase();
}
```

## 🔧 Integration Steps

### Step 1: Plugin Registration

```typescript
// src/app.ts
import { aliexpressPlugin } from './plugins/aliexpress/index.js';
import { aliexpressConfig } from './config/aliexpress.js';

const fastify = Fastify();
const redis = new Redis(process.env.REDIS_URL);

// Register AliExpress plugin
await fastify.register(aliexpressPlugin, {
  config: aliexpressConfig,
  redis,
});
```

### Step 2: Chat Service Integration

```typescript
// src/services/chat-service.ts
export class ChatService {
  async processMessage(message: string, sessionId: string, userId?: string) {
    // Check for product search intent
    const aliexpressContext = await this.fastify.aliexpress.processMessage(message, userId);

    if (aliexpressContext.isProductSearch) {
      if (aliexpressContext.searchResponse) {
        return {
          response: this.fastify.aliexpress.formatForGPT(aliexpressContext, message),
          type: 'products',
          products: this.fastify.aliexpress.getProductCards(aliexpressContext),
        };
      }
    }

    // Fall back to regular GPT processing
    return await this.processWithGPT(message, sessionId, userId);
  }
}
```

### Step 3: Intent Detection

The system automatically detects product search intent using:

- **Keywords**: Product-related terms
- **Price indicators**: "under $20", "$10-$50", "cheap", "budget"
- **Search phrases**: "find", "search for", "looking for", "show me"
- **Categories**: Electronics, clothing, home, beauty, etc.

**Examples of detected intents:**
- ✅ "find me wireless earbuds under $20"
- ✅ "looking for cheap phone cases"
- ✅ "show me bluetooth speakers around $50"
- ❌ "how's the weather today?"
- ❌ "what's 2+2?"

### Step 4: Response Formatting

Products are returned as rich cards:

```typescript
interface ProductCard {
  id: string;
  title: string;
  image: string;
  price: {
    current: number;
    original?: number;
    currency: string;
    discount?: string;
  };
  seller: {
    name: string;
    rating: number;
    orders: number;
  };
  affiliateUrl: string;      // Your monetized link
  originalUrl: string;
  relevanceScore: number;
}
```

## 🎯 Usage Examples

### Basic Product Search

```typescript
// User message: "find me wireless earbuds under $20"
const context = await aliexpressPlugin.processMessage(message, userId);

if (context.isProductSearch && context.searchResponse) {
  const products = context.searchResponse.products;
  // Display product cards with affiliate links
}
```

### GPT Integration

```typescript
// Enhanced GPT prompt with product context
const systemPrompt = `
You are a helpful shopping assistant. When users ask about products, 
search AliExpress and provide product recommendations with affiliate links.

User query: "${message}"
${context.isProductSearch ? `
Found ${context.searchResponse?.products.length} products:
${context.searchResponse?.products.map(p => 
  `- ${p.title}: $${p.price.current} (${p.affiliateUrl})`
).join('\n')}
` : ''}

Provide a helpful response with product recommendations.
`;
```

### WebSocket Real-time Updates

```typescript
// WebSocket message handler
connection.socket.on('message', async (message) => {
  const data = JSON.parse(message.toString());
  const result = await chatService.processMessage(data.message, data.sessionId);
  
  connection.socket.send(JSON.stringify({
    type: result.type,
    response: result.response,
    products: result.products,
    timestamp: new Date().toISOString(),
  }));
});
```

## 🔄 Caching Strategy

### Search Results Cache
- **TTL**: 1 hour
- **Key**: `aliexpress:search:{hash(keywords+filters)}`
- **Purpose**: Reduce API calls for identical searches

### Affiliate Links Cache
- **TTL**: 24 hours
- **Key**: `aliexpress:affiliate:{hash(originalUrl)}`
- **Purpose**: Avoid regenerating affiliate links

### Rate Limiting Cache
- **TTL**: Based on API limits
- **Key**: `aliexpress:ratelimit:{service}:{userId}`
- **Purpose**: Enforce API rate limits

## 🛡️ Error Handling

### API Failures
```typescript
try {
  const products = await client.searchProducts(request);
} catch (error) {
  // Log error and return graceful fallback
  console.error('AliExpress API error:', error);
  return {
    isProductSearch: true,
    error: 'Sorry, product search is temporarily unavailable.',
  };
}
```

### Rate Limit Exceeded
```typescript
const rateLimitCheck = await cache.checkRateLimit('search', userId, 10, 1);
if (!rateLimitCheck.allowed) {
  return {
    isProductSearch: true,
    error: `Rate limit exceeded. Try again in ${rateLimitCheck.resetTime} seconds.`,
  };
}
```

### Affiliate Link Generation Failure
```typescript
// Fallback to original URLs if affiliate generation fails
const affiliateLinks = await client.generateAffiliateLinks(productUrls);
// If generation fails, original URLs are returned automatically
```

## 📊 Monitoring & Analytics

### Key Metrics
- Search volume and popular terms
- Conversion rates (clicks to affiliate links)
- API response times and error rates
- Cache hit ratios
- User engagement with product results

### Health Check Endpoint
```bash
GET /health
```

Returns:
```json
{
  "status": "healthy",
  "services": {
    "redis": "connected",
    "aliexpress": "enabled"
  },
  "stats": {
    "cacheStats": {
      "searchCacheSize": 150,
      "affiliateCacheSize": 500
    },
    "popularSearches": [
      {"term": "wireless earbuds", "count": 45},
      {"term": "phone case", "count": 32}
    ]
  }
}
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build standalone
docker build -t gpt-chat-aliexpress .
docker run -p 3000:3000 --env-file .env gpt-chat-aliexpress
```

### Environment Variables
```bash
# Required
ALIEXPRESS_APP_KEY=520934
ALIEXPRESS_APP_SECRET=your_secret
ALIEXPRESS_PID=your_pid

# Optional
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://...
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gpt-chat-aliexpress
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gpt-chat-aliexpress
  template:
    spec:
      containers:
      - name: app
        image: gpt-chat-aliexpress:latest
        env:
        - name: ALIEXPRESS_APP_KEY
          value: "520934"
        - name: ALIEXPRESS_APP_SECRET
          valueFrom:
            secretKeyRef:
              name: aliexpress-secret
              key: app-secret
```

## 🔧 Customization

### Custom Intent Detection
```typescript
// Extend ProductIntentParser
class CustomIntentParser extends ProductIntentParser {
  parseIntent(message: string): SearchIntent {
    const baseIntent = super.parseIntent(message);
    
    // Add custom logic
    if (message.includes('gift for')) {
      baseIntent.attributes = { ...baseIntent.attributes, gift: 'true' };
    }
    
    return baseIntent;
  }
}
```

### Custom Response Formatting
```typescript
// Custom product card formatter
function formatProductCard(product: ProductCard): string {
  return `
🛍️ **${product.title}**
💰 $${product.price.current} ${product.price.discount ? `(${product.price.discount} off!)` : ''}
⭐ ${product.seller.rating}/5 • ${product.seller.orders} orders
🔗 [Buy Now](${product.affiliateUrl})
  `.trim();
}
```

## 🐛 Troubleshooting

### Common Issues

1. **API Authentication Errors**
   - Verify APP_KEY and APP_SECRET
   - Check signature generation
   - Ensure timestamp is current

2. **Rate Limit Issues**
   - Monitor API usage
   - Implement proper caching
   - Use exponential backoff

3. **No Products Found**
   - Check search keywords
   - Verify category filters
   - Test with broader search terms

4. **Affiliate Links Not Working**
   - Verify PID configuration
   - Check link generation response
   - Test with original URLs as fallback

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development DEBUG=aliexpress:* npm run dev
```

## 📈 Optimization Tips

### Performance
- Cache search results for 1 hour
- Batch affiliate link generation
- Use Redis for session storage
- Implement connection pooling

### Cost Optimization
- Cache affiliate links for 24 hours
- Implement intelligent rate limiting
- Use search result deduplication
- Monitor API usage patterns

### User Experience
- Stream responses for better perceived performance
- Show loading indicators during searches
- Provide search suggestions for failed queries
- Display rich product cards with images

## 🔗 Additional Resources

- [AliExpress Open API Documentation](https://developers.aliexpress.com/en/doc.htm)
- [AliExpress Affiliate Program](https://portals.aliexpress.com/)
- [Fastify Plugin Development](https://www.fastify.io/docs/latest/Reference/Plugins/)
- [Redis Caching Best Practices](https://redis.io/docs/manual/patterns/)

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Test with provided examples
4. Monitor logs for error details