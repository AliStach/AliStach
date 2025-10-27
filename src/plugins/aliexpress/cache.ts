import Redis from 'ioredis';
import { ProductCard, SearchResponse, AffiliateLink } from './types.js';

export class AliExpressCache {
  private redis: Redis;
  private readonly SEARCH_TTL = 3600; // 1 hour
  private readonly AFFILIATE_TTL = 86400; // 24 hours
  private readonly RATE_LIMIT_TTL = 86400; // 24 hours

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Generate cache key for search results
   */
  private getSearchKey(keywords: string, filters: any): string {
    const filterString = JSON.stringify(filters);
    const hash = require('crypto').createHash('md5').update(keywords + filterString).digest('hex');
    return `aliexpress:search:${hash}`;
  }

  /**
   * Generate cache key for affiliate links
   */
  private getAffiliateKey(originalUrl: string): string {
    const hash = require('crypto').createHash('md5').update(originalUrl).digest('hex');
    return `aliexpress:affiliate:${hash}`;
  }

  /**
   * Generate cache key for rate limiting
   */
  private getRateLimitKey(service: string, identifier: string): string {
    return `aliexpress:ratelimit:${service}:${identifier}`;
  }

  /**
   * Cache search results
   */
  async cacheSearchResults(keywords: string, filters: any, results: SearchResponse): Promise<void> {
    const key = this.getSearchKey(keywords, filters);
    const data = {
      ...results,
      cached: true,
      cachedAt: new Date().toISOString(),
    };
    
    await this.redis.setex(key, this.SEARCH_TTL, JSON.stringify(data));
  }

  /**
   * Get cached search results
   */
  async getCachedSearchResults(keywords: string, filters: any): Promise<SearchResponse | null> {
    const key = this.getSearchKey(keywords, filters);
    const cached = await this.redis.get(key);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    return null;
  }

  /**
   * Cache affiliate links
   */
  async cacheAffiliateLinks(links: AffiliateLink[]): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    for (const link of links) {
      const key = this.getAffiliateKey(link.originalUrl);
      pipeline.setex(key, this.AFFILIATE_TTL, JSON.stringify(link));
    }
    
    await pipeline.exec();
  }

  /**
   * Get cached affiliate link
   */
  async getCachedAffiliateLink(originalUrl: string): Promise<AffiliateLink | null> {
    const key = this.getAffiliateKey(originalUrl);
    const cached = await this.redis.get(key);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    return null;
  }

  /**
   * Get multiple cached affiliate links
   */
  async getCachedAffiliateLinks(originalUrls: string[]): Promise<Map<string, AffiliateLink>> {
    const keys = originalUrls.map(url => this.getAffiliateKey(url));
    const cached = await this.redis.mget(...keys);
    
    const results = new Map<string, AffiliateLink>();
    
    cached.forEach((data, index) => {
      if (data) {
        const link = JSON.parse(data);
        results.set(originalUrls[index], link);
      }
    });
    
    return results;
  }

  /**
   * Check rate limit for API calls
   */
  async checkRateLimit(service: 'search' | 'affiliate', identifier: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = this.getRateLimitKey(service, identifier);
    const current = await this.redis.get(key);
    
    if (!current) {
      // First request in window
      await this.redis.setex(key, windowSeconds, '1');
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: Date.now() + (windowSeconds * 1000),
      };
    }
    
    const count = parseInt(current);
    const ttl = await this.redis.ttl(key);
    
    if (count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + (ttl * 1000),
      };
    }
    
    // Increment counter
    await this.redis.incr(key);
    
    return {
      allowed: true,
      remaining: limit - count - 1,
      resetTime: Date.now() + (ttl * 1000),
    };
  }

  /**
   * Cache popular search terms for analytics
   */
  async trackSearchTerm(term: string): Promise<void> {
    const key = 'aliexpress:popular_searches';
    await this.redis.zincrby(key, 1, term.toLowerCase());
    
    // Keep only top 1000 terms
    await this.redis.zremrangebyrank(key, 0, -1001);
  }

  /**
   * Get popular search terms
   */
  async getPopularSearchTerms(limit: number = 10): Promise<Array<{ term: string; count: number }>> {
    const key = 'aliexpress:popular_searches';
    const results = await this.redis.zrevrange(key, 0, limit - 1, 'WITHSCORES');
    
    const terms: Array<{ term: string; count: number }> = [];
    for (let i = 0; i < results.length; i += 2) {
      terms.push({
        term: results[i],
        count: parseInt(results[i + 1]),
      });
    }
    
    return terms;
  }

  /**
   * Clear cache for specific search
   */
  async clearSearchCache(keywords: string, filters: any): Promise<void> {
    const key = this.getSearchKey(keywords, filters);
    await this.redis.del(key);
  }

  /**
   * Clear all AliExpress cache
   */
  async clearAllCache(): Promise<void> {
    const keys = await this.redis.keys('aliexpress:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    searchCacheSize: number;
    affiliateCacheSize: number;
    popularSearches: number;
    rateLimitEntries: number;
  }> {
    const [searchKeys, affiliateKeys, popularKeys, rateLimitKeys] = await Promise.all([
      this.redis.keys('aliexpress:search:*'),
      this.redis.keys('aliexpress:affiliate:*'),
      this.redis.keys('aliexpress:popular_searches'),
      this.redis.keys('aliexpress:ratelimit:*'),
    ]);

    return {
      searchCacheSize: searchKeys.length,
      affiliateCacheSize: affiliateKeys.length,
      popularSearches: popularKeys.length,
      rateLimitEntries: rateLimitKeys.length,
    };
  }
}