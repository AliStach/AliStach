import { SearchIntent } from './types.js';

export class ProductIntentParser {
  private priceRegex = /\$?(\d+(?:\.\d{2})?)\s*(?:to|-)?\s*\$?(\d+(?:\.\d{2})?)?/i;
  private categoryKeywords = new Map([
    ['electronics', ['phone', 'laptop', 'computer', 'tablet', 'headphones', 'earbuds', 'speaker', 'camera', 'tv', 'monitor']],
    ['clothing', ['shirt', 'dress', 'pants', 'shoes', 'jacket', 'hoodie', 'jeans', 'sneakers', 'boots']],
    ['home', ['furniture', 'decor', 'kitchen', 'bedroom', 'living room', 'bathroom', 'garden', 'tools']],
    ['beauty', ['makeup', 'skincare', 'perfume', 'cosmetics', 'hair', 'nail', 'beauty']],
    ['sports', ['fitness', 'gym', 'running', 'yoga', 'sports', 'outdoor', 'camping', 'hiking']],
    ['toys', ['toy', 'game', 'puzzle', 'doll', 'action figure', 'board game', 'kids', 'children']],
    ['automotive', ['car', 'auto', 'vehicle', 'motorcycle', 'bike', 'parts', 'accessories']],
  ]);

  /**
   * Parse user message to extract product search intent
   */
  parseIntent(message: string): SearchIntent {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Extract keywords (remove common stop words and search indicators)
    const stopWords = new Set(['find', 'search', 'looking', 'for', 'want', 'need', 'buy', 'get', 'show', 'me', 'under', 'below', 'above', 'around', 'about']);
    const words = normalizedMessage.split(/\s+/).filter(word => 
      word.length > 2 && !stopWords.has(word) && !/^\$?\d+/.test(word)
    );

    // Extract price range
    const priceRange = this.extractPriceRange(normalizedMessage);
    
    // Detect category
    const category = this.detectCategory(normalizedMessage);
    
    // Calculate confidence based on various factors
    const confidence = this.calculateConfidence(normalizedMessage, words, priceRange, category);

    return {
      keywords: words,
      category,
      priceRange,
      confidence,
    };
  }

  /**
   * Extract price range from message
   */
  private extractPriceRange(message: string): { min?: number; max?: number } | undefined {
    const priceMatch = message.match(this.priceRegex);
    if (!priceMatch) return undefined;

    const price1 = parseFloat(priceMatch[1]);
    const price2 = priceMatch[2] ? parseFloat(priceMatch[2]) : undefined;

    if (price2) {
      return {
        min: Math.min(price1, price2),
        max: Math.max(price1, price2),
      };
    }

    // Single price mentioned - check context
    if (message.includes('under') || message.includes('below') || message.includes('less than')) {
      return { max: price1 };
    }
    
    if (message.includes('above') || message.includes('over') || message.includes('more than')) {
      return { min: price1 };
    }

    // Default to max price if context unclear
    return { max: price1 };
  }

  /**
   * Detect product category from message
   */
  private detectCategory(message: string): string | undefined {
    for (const [category, keywords] of this.categoryKeywords) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return category;
      }
    }
    return undefined;
  }

  /**
   * Calculate confidence score for the parsed intent
   */
  private calculateConfidence(message: string, keywords: string[], priceRange?: any, category?: string): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence for clear product search indicators
    const searchIndicators = ['find', 'search', 'looking for', 'want', 'need', 'buy', 'show me'];
    if (searchIndicators.some(indicator => message.includes(indicator))) {
      confidence += 0.2;
    }

    // Boost confidence for specific keywords
    if (keywords.length >= 2) {
      confidence += 0.1;
    }

    // Boost confidence for price range
    if (priceRange) {
      confidence += 0.1;
    }

    // Boost confidence for detected category
    if (category) {
      confidence += 0.1;
    }

    // Reduce confidence for very short or vague messages
    if (message.length < 10 || keywords.length === 0) {
      confidence -= 0.2;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Check if message contains product search intent
   */
  isProductSearchIntent(message: string): boolean {
    const intent = this.parseIntent(message);
    return intent.confidence > 0.6;
  }

  /**
   * Generate search suggestions for ambiguous queries
   */
  generateSuggestions(message: string): string[] {
    const intent = this.parseIntent(message);
    const suggestions: string[] = [];

    if (intent.keywords.length === 0) {
      suggestions.push("Could you be more specific about what product you're looking for?");
      return suggestions;
    }

    if (!intent.priceRange) {
      suggestions.push("What's your budget range for this item?");
    }

    if (!intent.category) {
      suggestions.push("What category of product are you interested in?");
    }

    if (intent.keywords.length === 1) {
      suggestions.push(`Are you looking for ${intent.keywords[0]} in any specific style or brand?`);
    }

    return suggestions;
  }
}