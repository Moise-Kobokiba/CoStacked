// Direct test of the verification endpoint
require('dotenv').config();
const fetch = require('node-fetch');

async function testVerifyEndpoint() {
  console.log("🧪 TESTING VERIFICATION ENDPOINT DIRECTLY");
  console.log("==========================================");

  const API_BASE = 'https://co-stacked-backend.onrender.com/api';

  console.log("Testing verification endpoint...");

  // Test with dummy data to see the response
  const testData = {
    email: "test@example.com",
    token: "123456"
  };

  try {
    const response = await fetch(`${API_BASE}/users/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log("Response status:", response.status, response.statusText);

    const result = await response.json();
    console.log("Response body:", JSON.stringify(result, null, 2));

    if (response.status === 400) {
      console.log("✅ Endpoint responding correctly - invalid token rejected as expected");
    } else if (response.status === 200) {
      console.log("✅ Verification successful!");
    } else {
      console.log("❌ Unexpected response");
    }

  } catch (error) {
    console.log("❌ Network error:", error.message);
  }

  console.log("\n📋 INTERPRETATION:");
  console.log("If status is 400: Endpoint working, token just invalid (expected)");
  console.log("If status is 500: Backend error in verification logic");
  console.log("If network error: CORS or connectivity issue");
}

testVerifyEndpoint();