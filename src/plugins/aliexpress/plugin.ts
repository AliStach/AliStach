import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { AliExpressService } from './service.js';
import { AliExpressConfig } from './types.js';
import Redis from 'ioredis';

// Plugin interface for integrating with your existing GPT chat system
export interface AliExpressPluginOptions {
  config: AliExpressConfig;
  redis: Redis;
}

export interface ChatPluginContext {
  isProductSearch: boolean;
  searchResponse?: any;
  suggestions?: string[];
  error?: string;
}

/**
 * AliExpress Plugin for GPT Chat System
 * Integrates product search capabilities into existing chat flow
 */
export class AliExpressPlugin {
  private service: AliExpressService;
  private enabled: boolean = true;

  constructor(options: AliExpressPluginOptions) {
    this.service = new AliExpressService(options.config, options.redis);
  }

  /**
   * Process chat message and determine if it's a product search
   * This integrates with your existing GPT message processing pipeline
   */
  async processMessage(message: string, userId?: string): Promise<ChatPluginContext> {
    if (!this.enabled) {
      return { isProductSearch: false };
    }

    return await this.service.processMessage(message, userId);
  }

  /**
   * Format product search results for GPT response
   */
  formatForGPT(context: ChatPluginContext, originalMessage: string): string {
    if (!context.isProductSearch) {
      return '';
    }

    if (context.error) {
      return context.error;
    }

    if (context.suggestions && context.suggestions.length > 0) {
      return `I can help you search for products! ${context.suggestions.join(' ')}`;
    }

    if (context.searchResponse) {
      return this.service.formatProductsForChat(context.searchResponse, originalMessage);
    }

    return '';
  }

  /**
   * Get product cards for rich UI display
   */
  getProductCards(context: ChatPluginContext) {
    return context.searchResponse?.products || [];
  }

  /**
   * Enable/disable the plugin
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Get plugin statistics
   */
  async getStats() {
    return await this.service.getStats();
  }
}

/**
 * Fastify plugin registration for API endpoints
 */
export async function aliexpressPlugin(
  fastify: FastifyInstance,
  options: AliExpressPluginOptions & FastifyPluginOptions
) {
  const plugin = new AliExpressPlugin(options);

  // Register the plugin instance for use in other parts of the application
  fastify.decorate('aliexpress', plugin);

  // API endpoint for direct product search
  fastify.post('/api/aliexpress/search', {
    schema: {
      body: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', minLength: 1, maxLength: 200 },
          userId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { query, userId } = request.body as { query: string; userId?: string };
    
    try {
      const context = await plugin.processMessage(query, userId);
      
      if (context.error) {
        return reply.code(400).send({ error: context.error });
      }

      if (!context.isProductSearch) {
        return reply.send({
          isProductSearch: false,
          suggestions: context.suggestions,
        });
      }

      return reply.send({
        isProductSearch: true,
        products: context.searchResponse?.products || [],
        totalResults: context.searchResponse?.totalResults || 0,
        searchTime: context.searchResponse?.searchTime || 0,
        cached: context.searchResponse?.cached || false,
      });
    } catch (error) {
      fastify.log.error('AliExpress search error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // API endpoint for plugin statistics
  fastify.get('/api/aliexpress/stats', async (request, reply) => {
    try {
      const stats = await plugin.getStats();
      return reply.send(stats);
    } catch (error) {
      fastify.log.error('AliExpress stats error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // API endpoint to enable/disable plugin
  fastify.post('/api/aliexpress/toggle', {
    schema: {
      body: {
        type: 'object',
        required: ['enabled'],
        properties: {
          enabled: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const { enabled } = request.body as { enabled: boolean };
    plugin.setEnabled(enabled);
    return reply.send({ enabled });
  });
}

// Type augmentation for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    aliexpress: AliExpressPlugin;
  }
}