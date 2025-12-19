// Test the notification API endpoint directly
const fetch = require('node-fetch');

async function testNotificationEndpoint() {
  console.log("🧪 TESTING NOTIFICATION ENDPOINT");
  console.log("================================");

  const API_BASE = 'https://co-stacked-backend.onrender.com/api';

  // We can't test with authentication without a token, but let's see the response
  console.log("Testing notification endpoint (will likely fail without auth)...");

  try {
    const response = await fetch(`${API_BASE}/notifications`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // No authorization header - this should fail
      }
    });

    console.log("Response status:", response.status, response.statusText);

    if (response.status === 401) {
      console.log("✅ Endpoint exists and requires authentication (expected)");
    } else {
      console.log("⚠️ Unexpected response");
    }

    const result = await response.json();
    console.log("Response:", JSON.stringify(result, null, 2));

  } catch (error) {
    console.log("❌ Network error:", error.message);
    if (error.message.includes('ENOTFOUND')) {
      console.log("💡 Backend may not be running or URL is incorrect");
    }
  }
}

testNotificationEndpoint();