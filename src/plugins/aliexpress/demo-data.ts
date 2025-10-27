import { ProductCard, SearchResponse } from './types.js';

export const demoProducts: ProductCard[] = [
  {
    id: 'demo-1',
    title: 'Wireless Bluetooth Earbuds with Charging Case',
    image: 'https://via.placeholder.com/300x300/007bff/ffffff?text=Earbuds',
    price: {
      current: 15.99,
      original: 29.99,
      currency: 'USD',
      discount: '47% off',
    },
    seller: {
      name: 'TechStore Official',
      rating: 4.5,
      orders: 1250,
    },
    affiliateUrl: 'https://s.click.aliexpress.com/demo-affiliate-link-1',
    originalUrl: 'https://www.aliexpress.com/item/demo-product-1.html',
    relevanceScore: 0.95,
  },
  {
    id: 'demo-2',
    title: 'True Wireless Earphones with Noise Cancellation',
    image: 'https://via.placeholder.com/300x300/28a745/ffffff?text=Wireless',
    price: {
      current: 18.50,
      original: 35.00,
      currency: 'USD',
      discount: '47% off',
    },
    seller: {
      name: 'AudioTech Store',
      rating: 4.3,
      orders: 890,
    },
    affiliateUrl: 'https://s.click.aliexpress.com/demo-affiliate-link-2',
    originalUrl: 'https://www.aliexpress.com/item/demo-product-2.html',
    relevanceScore: 0.88,
  },
  {
    id: 'demo-3',
    title: 'Mini Bluetooth 5.0 Earbuds Sports Headphones',
    image: 'https://via.placeholder.com/300x300/dc3545/ffffff?text=Sports',
    price: {
      current: 12.99,
      currency: 'USD',
    },
    seller: {
      name: 'SportsTech',
      rating: 4.1,
      orders: 567,
    },
    affiliateUrl: 'https://s.click.aliexpress.com/demo-affiliate-link-3',
    originalUrl: 'https://www.aliexpress.com/item/demo-product-3.html',
    relevanceScore: 0.82,
  },
];

export function generateDemoSearchResponse(query: string): SearchResponse {
  const filteredProducts = demoProducts.filter(product => 
    product.title.toLowerCase().includes(query.toLowerCase()) ||
    query.toLowerCase().includes('earbuds') ||
    query.toLowerCase().includes('wireless') ||
    query.toLowerCase().includes('bluetooth')
  );

  return {
    products: filteredProducts,
    totalResults: filteredProducts.length,
    currentPage: 1,
    totalPages: 1,
    searchTime: Math.floor(Math.random() * 200) + 50, // 50-250ms
    cached: false,
  };
}