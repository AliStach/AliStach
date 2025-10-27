import { AliExpressConfig } from '../plugins/aliexpress/types.js';

/**
 * AliExpress Configuration
 * Set up your API credentials and configuration here
 */
export const aliexpressConfig: AliExpressConfig = {
  appKey: process.env.ALIEXPRESS_APP_KEY || '520934', // Your provided AppKey
  appSecret: process.env.ALIEXPRESS_APP_SECRET || '', // Your App Secret
  pid: process.env.ALIEXPRESS_PID || '', // Your affiliate PID
  baseUrl: 'https://api-sg.aliexpress.com',
  timeout: 10000, // 10 seconds

  rateLimits: {
    searchAPI: {
      requestsPerSecond: 10,
      requestsPerDay: 10000,
    },
    affiliateAPI: {
      requestsPerSecond: 5,
      requestsPerDay: 5000,
    },
  },
};

/**
 * Validate AliExpress configuration
 */
export function validateAliExpressConfig(): void {
  const required = ['ALIEXPRESS_APP_KEY', 'ALIEXPRESS_APP_SECRET', 'ALIEXPRESS_PID'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required AliExpress environment variables: ${missing.join(', ')}`);
  }
}