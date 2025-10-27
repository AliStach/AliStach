// AliExpress Plugin Types
export interface AliExpressConfig {
  appKey: string;
  appSecret: string;
  pid: string; // Your affiliate PID
  baseUrl: string;
  timeout: number;
  rateLimits: {
    searchAPI: {
      requestsPerSecond: number;
      requestsPerDay: number;
    };
    affiliateAPI: {
      requestsPerSecond: number;
      requestsPerDay: number;
    };
  };
}

export interface ProductSearchRequest {
  keywords: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  pageNo?: number;
  pageSize?: number;
  sort?: 'SALE_PRICE_ASC' | 'SALE_PRICE_DESC' | 'LAST_VOLUME_ASC' | 'LAST_VOLUME_DESC';
  targetCurrency?: string;
  targetLanguage?: string;
}

export interface AliExpressProduct {
  productId: string;
  productTitle: string;
  productUrl: string;
  imageUrl: string;
  originalPrice: number;
  salePrice: number;
  discount?: string;
  currency: string;
  categoryId: string;
  categoryName: string;
  sellerId: string;
  sellerName: string;
  volume: number;
  evaluateScore: number;
  commission?: {
    commissionRate: string;
    commission: string;
  };
}

export interface ProductCard {
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
  affiliateUrl: string;
  originalUrl: string;
  relevanceScore: number;
}

export interface SearchIntent {
  keywords: string[];
  category?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  attributes?: Record<string, string>;
  confidence: number;
}

export interface AffiliateLink {
  originalUrl: string;
  affiliateUrl: string;
  shortUrl?: string;
  trackingId: string;
}

export interface SearchResponse {
  products: ProductCard[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  searchTime: number;
  cached: boolean;
}