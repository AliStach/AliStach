import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';
import { AliExpressConfig, ProductSearchRequest, AliExpressProduct, AffiliateLink } from './types.js';

export class AliExpressClient {
  private client: AxiosInstance;
  private config: AliExpressConfig;

  constructor(config: AliExpressConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * Generate API signature for AliExpress requests
   */
  private generateSignature(params: Record<string, any>): string {
    // Sort parameters alphabetically
    const sortedKeys = Object.keys(params).sort();
    
    // Create query string
    let queryString = '';
    sortedKeys.forEach(key => {
      queryString += key + params[key];
    });
    
    // Add secret at beginning and end
    const signString = this.config.appSecret + queryString + this.config.appSecret;
    
    // Generate MD5 hash
    return crypto.createHash('md5').update(signString).digest('hex').toUpperCase();
  }

  /**
   * Create base parameters for API requests
   */
  private createBaseParams(method: string): Record<string, any> {
    const timestamp = Date.now().toString();
    
    return {
      method,
      app_key: this.config.appKey,
      timestamp,
      format: 'json',
      v: '2.0',
      sign_method: 'md5',
    };
  }

  /**
   * Search for products using AliExpress Open API
   */
  async searchProducts(request: ProductSearchRequest): Promise<AliExpressProduct[]> {
    const params = {
      ...this.createBaseParams('aliexpress.affiliate.product.query'),
      keywords: request.keywords,
      category_ids: request.categoryId,
      min_sale_price: request.minPrice,
      max_sale_price: request.maxPrice,
      page_no: request.pageNo || 1,
      page_size: Math.min(request.pageSize || 20, 50), // Max 50 per request
      sort: request.sort || 'SALE_PRICE_ASC',
      target_currency: request.targetCurrency || 'USD',
      target_language: request.targetLanguage || 'EN',
    };

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key] === undefined) {
        delete params[key];
      }
    });

    // Generate signature
    params.sign = this.generateSignature(params);

    try {
      const response = await this.client.post('/sync', new URLSearchParams(params));
      
      if (response.data.aliexpress_affiliate_product_query_response?.resp_result?.result?.products) {
        return this.parseProducts(response.data.aliexpress_affiliate_product_query_response.resp_result.result.products);
      }
      
      return [];
    } catch (error) {
      console.error('AliExpress search error:', error);
      throw new Error(`Product search failed: ${error.message}`);
    }
  }

  /**
   * Generate affiliate links for product URLs
   */
  async generateAffiliateLinks(productUrls: string[]): Promise<AffiliateLink[]> {
    const params = {
      ...this.createBaseParams('aliexpress.affiliate.link.generate'),
      source_values: productUrls.join(','),
      promotion_link_type: 0, // Normal promotion link
      tracking_id: this.config.pid,
    };

    params.sign = this.generateSignature(params);

    try {
      const response = await this.client.post('/sync', new URLSearchParams(params));
      
      if (response.data.aliexpress_affiliate_link_generate_response?.resp_result?.result?.promotion_links) {
        return this.parseAffiliateLinks(
          response.data.aliexpress_affiliate_link_generate_response.resp_result.result.promotion_links,
          productUrls
        );
      }
      
      // Fallback: return original URLs if affiliate generation fails
      return productUrls.map(url => ({
        originalUrl: url,
        affiliateUrl: url,
        trackingId: this.config.pid,
      }));
    } catch (error) {
      console.error('Affiliate link generation error:', error);
      // Return original URLs as fallback
      return productUrls.map(url => ({
        originalUrl: url,
        affiliateUrl: url,
        trackingId: this.config.pid,
      }));
    }
  }

  /**
   * Parse product data from API response
   */
  private parseProducts(products: any[]): AliExpressProduct[] {
    return products.map(product => ({
      productId: product.product_id,
      productTitle: product.product_title,
      productUrl: product.product_detail_url,
      imageUrl: product.product_main_image_url,
      originalPrice: parseFloat(product.original_price || product.target_original_price || '0'),
      salePrice: parseFloat(product.target_sale_price || product.sale_price || '0'),
      discount: product.discount,
      currency: product.target_sale_price_currency || 'USD',
      categoryId: product.category_id,
      categoryName: product.category_name,
      sellerId: product.shop_id,
      sellerName: product.shop_url,
      volume: parseInt(product.volume || '0'),
      evaluateScore: parseFloat(product.evaluate_score || '0'),
      commission: product.commission_rate ? {
        commissionRate: product.commission_rate,
        commission: product.commission,
      } : undefined,
    }));
  }

  /**
   * Parse affiliate links from API response
   */
  private parseAffiliateLinks(links: any[], originalUrls: string[]): AffiliateLink[] {
    const linkMap = new Map();
    
    links.forEach(link => {
      linkMap.set(link.source_value, {
        originalUrl: link.source_value,
        affiliateUrl: link.promotion_link,
        shortUrl: link.short_promotion_link,
        trackingId: this.config.pid,
      });
    });

    // Ensure we return a link for each original URL
    return originalUrls.map(url => 
      linkMap.get(url) || {
        originalUrl: url,
        affiliateUrl: url,
        trackingId: this.config.pid,
      }
    );
  }

  /**
   * Get product categories (for future enhancement)
   */
  async getCategories(): Promise<any[]> {
    const params = {
      ...this.createBaseParams('aliexpress.affiliate.category.get'),
    };

    params.sign = this.generateSignature(params);

    try {
      const response = await this.client.post('/sync', new URLSearchParams(params));
      return response.data.aliexpress_affiliate_category_get_response?.resp_result?.result?.categories || [];
    } catch (error) {
      console.error('Category fetch error:', error);
      return [];
    }
  }
}