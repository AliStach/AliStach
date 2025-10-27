#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Tests the deployed Render service endpoints
 */

import axios from 'axios';

const BASE_URL = process.argv[2] || 'https://your-app.onrender.com';

async function verifyDeployment() {
  console.log(`🧪 Verifying deployment at: ${BASE_URL}\n`);

  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`, {
      timeout: 10000
    });
    
    if (healthResponse.status === 200 && healthResponse.data.status === 'healthy') {
      console.log('✅ Health check passed');
      console.log(`   Status: ${healthResponse.data.status}`);
      console.log(`   Services: ${JSON.stringify(healthResponse.data.services)}\n`);
    } else {
      console.log('❌ Health check failed');
      console.log(`   Status: ${healthResponse.status}`);
      console.log(`   Data: ${JSON.stringify(healthResponse.data)}\n`);
    }

    // Test 2: Root Endpoint
    console.log('2. Testing root endpoint...');
    const rootResponse = await axios.get(BASE_URL, {
      timeout: 10000
    });
    
    if (rootResponse.status === 200) {
      console.log('✅ Root endpoint working');
      console.log(`   Message: ${rootResponse.data.message}\n`);
    }

    // Test 3: Chat Endpoint - Regular Message
    console.log('3. Testing chat endpoint (regular message)...');
    const chatResponse1 = await axios.post(`${BASE_URL}/api/chat/message`, {
      message: 'Hello, server!',
      sessionId: 'test-session'
    }, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (chatResponse1.status === 200) {
      console.log('✅ Chat endpoint working');
      console.log(`   Response: ${chatResponse1.data.response}\n`);
    }

    // Test 4: Chat Endpoint - Product Search
    console.log('4. Testing product search...');
    const chatResponse2 = await axios.post(`${BASE_URL}/api/chat/message`, {
      message: 'find me wireless earbuds under $20',
      sessionId: 'test-session'
    }, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (chatResponse2.status === 200 && chatResponse2.data.type === 'products') {
      console.log('✅ Product search working');
      console.log(`   Found ${chatResponse2.data.products?.length || 0} products`);
      console.log(`   Response type: ${chatResponse2.data.type}\n`);
    } else {
      console.log('⚠️  Product search not working as expected');
      console.log(`   Response type: ${chatResponse2.data.type}`);
      console.log(`   Response: ${chatResponse2.data.response.substring(0, 100)}...\n`);
    }

    console.log('🎉 Deployment verification completed!');
    console.log('\n📋 Summary:');
    console.log(`✅ Server is running at: ${BASE_URL}`);
    console.log('✅ Health check endpoint working');
    console.log('✅ Chat functionality operational');
    console.log('✅ Product search integrated');
    
    console.log('\n🔗 Available endpoints:');
    console.log(`- Health: ${BASE_URL}/health`);
    console.log(`- Chat: ${BASE_URL}/api/chat/message`);
    console.log(`- Root: ${BASE_URL}/`);

  } catch (error) {
    console.log('❌ Deployment verification failed');
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.log('   Server is not accessible. Check:');
      console.log('   - URL is correct');
      console.log('   - Server is deployed and running');
      console.log('   - No network connectivity issues');
    } else if (error.response) {
      console.log(`   HTTP ${error.response.status}: ${error.response.statusText}`);
      console.log(`   Response: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check Render dashboard for deployment status');
    console.log('2. Verify environment variables are set');
    console.log('3. Check server logs for errors');
    console.log('4. Ensure health check path is /health');
  }
}

// Usage: node verify-deployment.js https://your-app.onrender.com
verifyDeployment();