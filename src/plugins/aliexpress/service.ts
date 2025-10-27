import { AliExpressClient } from './client.js';
import { ProductIntentParser } from './intent-parser.js';
import { AliExpressCache } from './cache.js';
import { 
  AliExpressConfig, 
  ProductSearchRequest, 
  ProductCard, 
  SearchResponse, 
  SearchIntent,
  AliExpressProduct,
  AffiliateLink 
} from './types.js';
import Redis from 'ioredis';

export class AliExpressService {
  private client: AliExpressClient;
  private intentParser: ProductIntentParser;
  private cache: AliExpressCache;
  private config: AliExpressConfig;

  constructor(config: AliExpressConfig, redis: Redis) {
    this.config = config;
    this.client = new AliExpressClient(config);
    this.intentParser = new ProductIntentParser();
    this.cache = new AliExpressCache(redis);
  }

  /**
   * Process user message and return product search results
   */
  async processMessage(message: string, userId?: string): Promise<{
    isProductSearch: boolean;
    response?: SearchResponse;
    suggestions?: string[];
    error?: string;
  }> {
    try {
      // Parse intent from user message
      const intent = this.intentParser.parseIntent(message);
      
      if (!this.intentParser.isProductSearchIntent(message)) {
        return {
          isProductSearch: false,
          suggestions: this.intentParser.generateSuggestions(message),
        };
      }

      // Check if we have real API credentials
      const hasRealCredentials = this.config.appSecret !== 'demo-secret' && 
                                this.config.pid !== 'demo-pid';

      if (!hasRealCredentials) {
        // Use demo data for testing
        const { generateDemoSearchResponse } = await import('./demo-data.js');
        const demoResponse = generateDemoSearchResponse(intent.keywords.join(' '));
        
        return {
          isProductSearch: true,
          response: demoResponse,
        };
      }

      // Check rate limits for real API
      const rateLimitCheck = await this.checkRateLimit('search', userId || 'anonymous');
      if (!rateLimitCheck.allowed) {
        return {
          isProductSearch: true,
          error: `Rate limit exceeded. Please try again in ${Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000)} seconds.`,
        };
      }

      // Search for products with real API
      const searchResponse = await this.searchProducts(intent);
      
      // Track search term for analytics
      if (this.cache) {
        await this.cache.trackSearchTerm(intent.keywords.join(' '));
      }

      return {
        isProductSearch: true,
        response: searchResponse,
      };

    } catch (error) {
      console.error('AliExpress service error:', error);
      
      // Fallback to demo data on error
      try {
        const intent = this.intentParser.parseIntent(message);
        if (this.intentParser.isProductSearchIntent(message)) {
          const { generateDemoSearchResponse } = await import('./demo-data.js');
          const demoResponse = generateDemoSearchResponse(intent.keywords.join(' '));
          
          return {
            isProductSearch: true,
            response: demoResponse,
          };
        }
      } catch (fallbackError) {
        // Ignore fallback errors
      }
      
      return {
        isProductSearch: true,
        error: 'Sorry, I encountered an error while searching for products. Please try again.',
      };
    }
  }

  /**
   * Search for products based on parsed intent
   */
  async searchProducts(intent: SearchIntent, pageNo: number = 1, pageSize: number = 10): Promise<SearchResponse> {
    const startTime = Date.now();
    
    // Create search request
    const searchRequest: ProductSearchRequest = {
      keywords: intent.keywords.join(' '),
      categoryId: this.getCategoryId(intent.category),
      minPrice: intent.priceRange?.min,
      maxPrice: intent.priceRange?.max,
      pageNo,
      pageSize: Math.min(pageSize, 20), // Limit to 20 per request
      sort: 'SALE_PRICE_ASC',
      targetCurrency: 'USD',
      targetLanguage: 'EN',
    };

    // Check cache first
    const cached = await this.cache.getCachedSearchResults(searchRequest.keywords, {
      categoryId: searchRequest.categoryId,
      minPrice: searchRequest.minPrice,
      maxPrice: searchRequest.maxPrice,
      pageNo: searchRequest.pageNo,
    });

    if (cached) {
      return cached;
    }

    // Search products via API
    const products = await this.client.searchProducts(searchRequest);
    
    // Convert to product cards with affiliate links
    const productCards = await this.convertToProductCards(products);
    
    const searchResponse: SearchResponse = {
      products: productCards,
      totalResults: products.length,
      currentPage: pageNo,
      totalPages: Math.ceil(products.length / pageSize),
      searchTime: Date.now() - startTime,
      cached: false,
    };

    // Cache the results
    await this.cache.cacheSearchResults(searchRequest.keywords, {
      categoryId: searchRequest.categoryId,
      minPrice: searchRequest.minPrice,
      maxPrice: searchRequest.maxPrice,
      pageNo: searchRequest.pageNo,
    }, searchResponse);

    return searchResponse;
  }

  /**
   * Convert AliExpress products to product cards with affiliate links
   */
  private async convertToProductCards(products: AliExpressProduct[]): Promise<ProductCard[]> {
    if (products.length === 0) return [];

    // Get product URLs for affiliate link generation
    const productUrls = products.map(p => p.productUrl);
    
    // Check cache for existing affiliate links
    const cachedLinks = await this.cache.getCachedAffiliateLinks(productUrls);
    
    // Find URLs that need affiliate link generation
    const urlsToProcess = productUrls.filter(url => !cachedLinks.has(url));
    
    // Generate affiliate links for uncached URLs
    let newAffiliateLinks: AffiliateLink[] = [];
    if (urlsToProcess.length > 0) {
      newAffiliateLinks = await this.client.generateAffiliateLinks(urlsToProcess);
      await this.cache.cacheAffiliateLinks(newAffiliateLinks);
    }

    // Create affiliate link map
    const affiliateLinkMap = new Map<string, AffiliateLink>();
    
    // Add cached links
    cachedLinks.forEach((link, url) => {
      affiliateLinkMap.set(url, link);
    });
    
    // Add new links
    newAffiliateLinks.forEach(link => {
      affiliateLinkMap.set(link.originalUrl, link);
    });

    // Convert to product cards
    return products.map((product, index) => {
      const affiliateLink = affiliateLinkMap.get(product.productUrl);
      
      return {
        id: product.productId,
        title: product.productTitle,
        image: product.imageUrl,
        price: {
          current: product.salePrice,
          original: product.originalPrice !== product.salePrice ? product.originalPrice : undefined,
          currency: product.currency,
          discount: product.discount,
        },
        seller: {
          name: product.sellerName || 'AliExpress Seller',
          rating: product.evaluateScore,
          orders: product.volume,
        },
        affiliateUrl: affiliateLink?.affiliateUrl || product.productUrl,
        originalUrl: product.productUrl,
        relevanceScore: this.calculateRelevanceScore(product, index),
      };
    });
  }

  /**
   * Calculate relevance score for product ranking
   */
  private calculateRelevanceScore(product: AliExpressProduct, position: number): number {
    let score = 1.0;
    
    // Position penalty (earlier results are more relevant)
    score -= position * 0.05;
    
    // Boost for high seller rating
    if (product.evaluateScore > 4.5) score += 0.1;
    else if (product.evaluateScore > 4.0) score += 0.05;
    
    // Boost for high volume (popular products)
    if (product.volume > 1000) score += 0.1;
    else if (product.volume > 100) score += 0.05;
    
    // Boost for products with commission info (better for affiliates)
    if (product.commission) score += 0.05;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get category ID from category name
   */
  private getCategoryId(category?: string): string | undefined {
    const categoryMap: Record<string, string> = {
      'electronics': '44',
      'clothing': '3',
      'home': '13',
      'beauty': '66',
      'sports': '18',
      'toys': '26',
      'automotive': '34',
    };
    
    return category ? categoryMap[category] : undefined;
  }

  /**
   * Check rate limits for API calls
   */
  private async checkRateLimit(service: 'search' | 'affiliate', identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const limits = this.config.rateLimits;
    const limit = service === 'search' ? limits.searchAPI.requestsPerSecond : limits.affiliateAPI.requestsPerSecond;
    
    return this.cache.checkRateLimit(service, identifier, limit, 1); // 1 second window
  }

  /**
   * Format products as rich chat response
   */
  formatProductsForChat(searchResponse: SearchResponse, query: string): string {
    if (searchResponse.products.length === 0) {
      return `I couldn't find any products matching "${query}". Try different keywords or check the spelling.`;
    }

    let response = `Found ${searchResponse.products.length} products for "${query}":\n\n`;
    
    searchResponse.products.slice(0, 5).forEach((product, index) => {
      const discount = product.price.discount ? ` (${product.price.discount} off)` : '';
      const originalPrice = product.price.original && product.price.original !== product.price.current 
        ? ` ~~$${product.price.original.toFixed(2)}~~` : '';
      
      response += `**${index + 1}. ${product.title}**\n`;
      response += `💰 $${product.price.current.toFixed(2)}${originalPrice}${discount}\n`;
      response += `⭐ ${product.seller.rating.toFixed(1)} rating • ${product.seller.orders} orders\n`;
      response += `🔗 [View Product](${product.affiliateUrl})\n\n`;
    });

    if (searchResponse.products.length > 5) {
      response += `... and ${searchResponse.products.length - 5} more products available.\n`;
    }

    response += `\n*Search completed in ${searchResponse.searchTime}ms*`;
    if (searchResponse.cached) {
      response += ` *(cached result)*`;
    }

    return response;
  }

  /**
   * Get service statistics
   */
  async getStats(): Promise<{
    cacheStats: any;
    popularSearches: Array<{ term: string; count: number }>;
  }> {
    const [cacheStats, popularSearches] = await Promise.all([
      this.cache.getCacheStats(),
      this.cache.getPopularSearchTerms(10),
    ]);

    return {
      cacheStats,
      popularSearches,
    };
  }
}