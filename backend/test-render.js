// Test script to verify Render.com deployment
const fetch = require('node-fetch');

async function testRenderDeployment() {
  console.log("🧪 TESTING RENDER.COM DEPLOYMENT");
  console.log("==================================");

  const API_BASE = 'https://co-stacked-backend.onrender.com/api';

  try {
    // Test 1: Basic health check
    console.log("\n1. Testing basic API connectivity...");
    const healthResponse = await fetch(`${API_BASE}/users`);
    console.log(`   Status: ${healthResponse.status} ${healthResponse.statusText}`);

    // Test 2: Test registration with minimal data (should fail gracefully)
    console.log("\n2. Testing registration endpoint...");
    const testData = {
      name: "Test User",
      email: "test@example.com",
      password: "testpassword123",
      role: "developer"
    };

    const registerResponse = await fetch(`${API_BASE}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log(`   Registration Status: ${registerResponse.status} ${registerResponse.statusText}`);

    if (registerResponse.status === 500) {
      console.log("   ❌ 500 Error - Environment variables likely not updated");
      const errorText = await registerResponse.text();
      console.log(`   Error details: ${errorText.substring(0, 200)}...`);
    } else if (registerResponse.status === 201) {
      console.log("   ✅ Registration successful - Email system working!");
      const result = await registerResponse.json();
      console.log(`   Response: ${JSON.stringify(result, null, 2)}`);
    } else {
      console.log(`   ⚠️  Unexpected status - check logs`);
      const result = await registerResponse.json();
      console.log(`   Response: ${JSON.stringify(result, null, 2)}`);
    }

  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
    console.log("💡 This could mean:");
    console.log("   • Render.com service is down");
    console.log("   • Network connectivity issues");
    console.log("   • CORS or firewall blocking requests");
  }

  console.log("\n📋 SUMMARY:");
  console.log("If you see 500 error: Environment variables not updated in Render.com");
  console.log("If you see 201 success: Email system working perfectly!");
  console.log("If you see network error: Check Render.com service status");
}

testRenderDeployment();