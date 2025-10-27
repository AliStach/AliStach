import { FastifyInstance } from 'fastify';
import { AliExpressPlugin } from '../plugins/aliexpress/index.js';

/**
 * Enhanced Chat Service with AliExpress Integration
 * This shows how to integrate the AliExpress plugin into your existing GPT chat flow
 */
export class ChatService {
  private fastify: FastifyInstance;
  private aliexpressPlugin: AliExpressPlugin;

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.aliexpressPlugin = fastify.aliexpress;
  }

  /**
   * Process chat message with AliExpress product search integration
   */
  async processMessage(message: string, sessionId: string, userId?: string): Promise<{
    response: string;
    type: 'text' | 'products' | 'error';
    products?: any[];
    streaming?: boolean;
  }> {
    try {
      // Step 1: Check if message contains product search intent
      const aliexpressContext = await this.aliexpressPlugin.processMessage(message, userId);

      if (aliexpressContext.isProductSearch) {
        // Handle product search
        if (aliexpressContext.error) {
          return {
            response: aliexpressContext.error,
            type: 'error',
          };
        }

        if (aliexpressContext.suggestions && aliexpressContext.suggestions.length > 0) {
          return {
            response: `I can help you search for products! ${aliexpressContext.suggestions.join(' ')}`,
            type: 'text',
          };
        }

        if (aliexpressContext.searchResponse) {
          const formattedResponse = this.aliexpressPlugin.formatForGPT(aliexpressContext, message);
          const productCards = this.aliexpressPlugin.getProductCards(aliexpressContext);

          return {
            response: formattedResponse,
            type: 'products',
            products: productCards,
          };
        }
      }

      // Step 2: If not a product search, process with regular GPT
      const gptResponse = await this.processWithGPT(message, sessionId, userId);
      
      return {
        response: gptResponse,
        type: 'text',
        streaming: true,
      };

    } catch (error) {
      console.error('Chat service error:', error);
      return {
        response: 'Sorry, I encountered an error processing your message. Please try again.',
        type: 'error',
      };
    }
  }

  /**
   * Process message with GPT (your existing implementation)
   */
  private async processWithGPT(message: string, sessionId: string, userId?: string): Promise<string> {
    // Your existing GPT processing logic here
    // This would integrate with your GPT service, context manager, etc.
    
    // Example implementation:
    // const context = await this.contextManager.getContext(sessionId);
    // const gptRequest = this.buildGPTRequest(message, context);
    // const response = await this.gptClient.generateResponse(gptRequest);
    // await this.contextManager.updateContext(sessionId, message, response);
    // return response;
    
    return "This would be your GPT response";
  }

  /**
   * Enhanced message processing with context awareness
   */
  async processMessageWithContext(
    message: string, 
    sessionId: string, 
    userId?: string,
    fileContext?: any[]
  ): Promise<{
    response: string;
    type: 'text' | 'products' | 'error';
    products?: any[];
    references?: any[];
    streaming?: boolean;
  }> {
    // First check for product search
    const aliexpressContext = await this.aliexpressPlugin.processMessage(message, userId);

    if (aliexpressContext.isProductSearch) {
      // Handle product search (same as above)
      if (aliexpressContext.searchResponse) {
        const formattedResponse = this.aliexpressPlugin.formatForGPT(aliexpressContext, message);
        const productCards = this.aliexpressPlugin.getProductCards(aliexpressContext);

        return {
          response: formattedResponse,
          type: 'products',
          products: productCards,
        };
      }
    }

    // Process with GPT including file context
    const gptResponse = await this.processWithGPTAndFiles(message, sessionId, userId, fileContext);
    
    return {
      response: gptResponse.content,
      type: 'text',
      references: gptResponse.references,
      streaming: true,
    };
  }

  /**
   * Process with GPT including file context (your existing implementation)
   */
  private async processWithGPTAndFiles(
    message: string, 
    sessionId: string, 
    userId?: string,
    fileContext?: any[]
  ): Promise<{ content: string; references?: any[] }> {
    // Your existing GPT + file processing logic
    return { content: "GPT response with file context" };
  }
}