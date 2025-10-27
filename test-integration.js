#!/usr/bin/env node

/**
 * Simple test script to demonstrate AliExpress integration
 * Run with: node test-integration.js
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testAliExpressIntegration() {
  console.log('🧪 Testing AliExpress Integration...\n');

  // Test 1: Health Check
  console.log('1. Testing health check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed');
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Services: ${JSON.stringify(response.data.services)}\n`);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return;
  }

  // Test 2: Direct Product Search
  console.log('2. Testing direct product search...');
  try {
    const searchResponse = await axios.post(`${BASE_URL}/api/aliexpress/search`, {
      query: 'wireless earbuds under $20',
      userId: 'test-user'
    });
    
    console.log('✅ Product search successful');
    console.log(`   Found ${searchResponse.data.products?.length || 0} products`);
    console.log(`   Search time: ${searchResponse.data.searchTime}ms`);
    console.log(`   Cached: ${searchResponse.data.cached}\n`);
    
    if (searchResponse.data.products?.length > 0) {
      const product = searchResponse.data.products[0];
      console.log('   Sample product:');
      console.log(`   - Title: ${product.title}`);
      console.log(`   - Price: $${product.price.current}`);
      console.log(`   - Affiliate URL: ${product.affiliateUrl}`);
      console.log('');
    }
  } catch (error) {
    console.log('❌ Product search failed:', error.response?.data || error.message);
  }

  // Test 3: Chat Integration
  console.log('3. Testing chat integration...');
  try {
    const chatResponse = await axios.post(`${BASE_URL}/api/chat/message`, {
      message: 'find me bluetooth speakers around $30',
      sessionId: 'test-session-123',
      userId: 'test-user'
    });
    
    console.log('✅ Chat integration successful');
    console.log(`   Response type: ${chatResponse.data.type}`);
    console.log(`   Products found: ${chatResponse.data.products?.length || 0}`);
    console.log(`   Response preview: ${chatResponse.data.response.substring(0, 100)}...\n`);
  } catch (error) {
    console.log('❌ Chat integration failed:', error.response?.data || error.message);
  }

  // Test 4: Non-product Query
  console.log('4. Testing non-product query...');
  try {
    const chatResponse = await axios.post(`${BASE_URL}/api/chat/message`, {
      message: 'what is the weather like today?',
      sessionId: 'test-session-123',
      userId: 'test-user'
    });
    
    console.log('✅ Non-product query handled correctly');
    console.log(`   Response type: ${chatResponse.data.type}`);
    console.log(`   Is product search: ${chatResponse.data.products ? 'Yes' : 'No'}\n`);
  } catch (error) {
    console.log('❌ Non-product query failed:', error.response?.data || error.message);
  }

  // Test 5: Plugin Statistics
  console.log('5. Testing plugin statistics...');
  try {
    const statsResponse = await axios.get(`${BASE_URL}/api/aliexpress/stats`);
    console.log('✅ Statistics retrieved successfully');
    console.log(`   Cache stats: ${JSON.stringify(statsResponse.data.cacheStats)}`);
    console.log(`   Popular searches: ${statsResponse.data.popularSearches.length} terms\n`);
  } catch (error) {
    console.log('❌ Statistics failed:', error.response?.data || error.message);
  }

  console.log('🎉 Integration test completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Configure your AliExpress credentials in .env');
  console.log('2. Test with real product searches');
  console.log('3. Integrate with your frontend UI');
  console.log('4. Monitor performance and optimize caching');
}

// Sample product search queries for testing
const sampleQueries = [
  'wireless earbuds under $20',
  'phone case for iPhone',
  'bluetooth speakers around $50',
  'laptop stand under $30',
  'gaming mouse pad',
  'USB cable 3 feet',
  'portable charger 10000mah',
  'desk lamp LED',
  'keyboard wireless',
  'headphones noise cancelling'
];

async function runSampleSearches() {
  console.log('\n🔍 Running sample searches...\n');
  
  for (const query of sampleQueries.slice(0, 3)) {
    console.log(`Searching: "${query}"`);
    try {
      const response = await axios.post(`${BASE_URL}/api/chat/message`, {
        message: query,
        sessionId: `test-${Date.now()}`,
        userId: 'test-user'
      });
      
      console.log(`✅ Found ${response.data.products?.length || 0} products`);
    } catch (error) {
      console.log(`❌ Search failed: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Run tests
if (process.argv.includes('--samples')) {
  runSampleSearches();
} else {
  testAliExpressIntegration();
}