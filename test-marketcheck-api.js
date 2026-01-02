/**
 * Test script for MarketCheck Sales Stats API
 * Run with: node test-marketcheck-api.js
 */

const testMarketCheck = async () => {
  // Test with a common car: 2015 Honda Civic
  const year = 2015;
  const make = "Honda";
  const model = "Civic";

  const apiKey = process.env.MARKETCHECK_API_KEY;
  const apiUrl =
    process.env.MARKETCHECK_API_URL || "https://marketcheck-prod.apigee.net/v1";

  if (!apiKey) {
    console.error("❌ MARKETCHECK_API_KEY not found in environment variables");
    console.log("Please set MARKETCHECK_API_KEY in your .env.local file");
    process.exit(1);
  }

  console.log("🧪 Testing MarketCheck Sales Stats API...");
  console.log(`   Year: ${year}`);
  console.log(`   Make: ${make}`);
  console.log(`   Model: ${model}`);
  console.log(`   API URL: ${apiUrl}`);
  console.log(
    `   API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`,
  );
  console.log("");

  const params = new URLSearchParams({
    year: year.toString(),
    make: make,
    model: model,
    api_key: apiKey,
  });

  const url = `${apiUrl}/stats/cars/sales_stats?${params.toString()}`;
  console.log(`📡 Request URL: ${url.replace(apiKey, "***")}`);
  console.log("");

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log(
      `📥 Response Status: ${response.status} ${response.statusText}`,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error Response:");
      console.error(errorText);
      process.exit(1);
    }

    const data = await response.json();
    console.log("");
    console.log("✅ API Response:");
    console.log(JSON.stringify(data, null, 2));
    console.log("");

    if (data.sales_stats) {
      const stats = data.sales_stats;
      console.log("📊 Sales Stats Summary:");
      console.log(
        `   Average Price: $${stats.avg_price?.toLocaleString() || "N/A"}`,
      );
      console.log(
        `   Median Price: $${stats.median_price?.toLocaleString() || "N/A"}`,
      );
      console.log(`   Sales Count: ${stats.sales_count || "N/A"}`);
      if (stats.min_price && stats.max_price) {
        console.log(
          `   Price Range: $${stats.min_price.toLocaleString()} - $${stats.max_price.toLocaleString()}`,
        );
      }
      console.log("");
      console.log("✅ MarketCheck API is working correctly!");
    } else {
      console.log("⚠️  No sales_stats found in response");
    }
  } catch (error) {
    console.error("❌ Error testing MarketCheck API:");
    console.error(error);
    if (error.name === "AbortError") {
      console.error("   Request timed out after 10 seconds");
    }
    process.exit(1);
  }
};

// Load environment variables if .env.local exists
try {
  require("dotenv").config({ path: ".env.local" });
} catch (e) {
  // dotenv not available, assume env vars are set
}

testMarketCheck();
