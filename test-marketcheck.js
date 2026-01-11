#!/usr/bin/env node

/**
 * Test script to verify MarketCheck API connection
 * Reads MARKETCHECK_API_KEY from .env.local and tests the API
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
let apiKey = null;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    // Handle lines with comments: KEY=value  # comment
    const cleanLine = line.split('#')[0].trim();
    const match = cleanLine.match(/^MARKETCHECK_API_KEY=(.+)$/);
    if (match) {
      apiKey = match[1].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
      break;
    }
  }
}

if (!apiKey) {
  console.error('❌ MARKETCHECK_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('✅ Found MARKETCHECK_API_KEY in .env.local');
console.log(`   API Key length: ${apiKey.length} characters`);
console.log(`   API Key preview: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}\n`);

// Test parameters - using a common vehicle
const testParams = {
  year: 2020,
  make: 'Toyota',
  model: 'Camry'
};

const apiUrl = process.env.MARKETCHECK_API_URL || 'https://api.marketcheck.com/v2';
const endpoint = `${apiUrl}/stats/cars/sales_stats`;

const params = new URLSearchParams({
  year: testParams.year.toString(),
  make: testParams.make,
  model: testParams.model,
  api_key: apiKey,
});

const fullUrl = `${endpoint}?${params.toString()}`;
const urlObj = new URL(fullUrl);

console.log('🔍 Testing MarketCheck API connection...');
console.log(`   Endpoint: ${endpoint}`);
console.log(`   Test vehicle: ${testParams.year} ${testParams.make} ${testParams.model}\n`);

const options = {
  hostname: urlObj.hostname,
  path: urlObj.pathname + urlObj.search,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`📊 Response Status: ${res.statusCode} ${res.statusMessage}`);
    console.log(`   Headers:`, res.headers);
    console.log('\n📦 Response Body:');
    
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
      
      if (res.statusCode === 200) {
        if (jsonData.sales_stats && jsonData.sales_stats.avg_price) {
          console.log('\n✅ SUCCESS! MarketCheck API is working correctly!');
          console.log(`   Average Price: $${jsonData.sales_stats.avg_price?.toLocaleString()}`);
          console.log(`   Median Price: $${jsonData.sales_stats.median_price?.toLocaleString()}`);
          console.log(`   Sales Count: ${jsonData.sales_stats.sales_count}`);
          if (jsonData.sales_stats.min_price && jsonData.sales_stats.max_price) {
            console.log(`   Price Range: $${jsonData.sales_stats.min_price?.toLocaleString()} - $${jsonData.sales_stats.max_price?.toLocaleString()}`);
          }
        } else {
          console.log('\n⚠️  API responded but no sales stats data available for this vehicle');
        }
      } else {
        console.log('\n❌ API returned an error status');
      }
    } catch (e) {
      console.log('Raw response:', data);
      console.log('\n❌ Failed to parse JSON response');
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Request failed:');
  console.error(error);
  process.exit(1);
});

req.end();

