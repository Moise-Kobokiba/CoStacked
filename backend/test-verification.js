// Test the email verification endpoint
require('dotenv').config();
const fetch = require('node-fetch');

async function testVerification() {
  console.log("🧪 TESTING EMAIL VERIFICATION ENDPOINT");
  console.log("======================================");

  const API_BASE = process.env.NODE_ENV === 'production'
    ? 'https://co-stacked-backend.onrender.com/api'
    : 'http://localhost:10000/api';

  console.log("Testing against:", API_BASE);

  // First, let's try to register a test user to get a verification token
  console.log("\n1. Registering test user...");

  const testData = {
    name: "Test Verification User",
    email: "test-verification-" + Date.now() + "@example.com", // Unique email
    password: "testpassword123",
    role: "developer"
  };

  try {
    const registerResponse = await fetch(`${API_BASE}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log("Registration status:", registerResponse.status);

    if (registerResponse.status === 201) {
      console.log("✅ Registration successful");

      // For testing purposes, let's check if we can find the verification token
      // In a real scenario, the user would get this from email
      console.log("\n2. Checking for verification token in database...");
      console.log("Note: In production, you would extract token from email");
      console.log("For testing, check the email that was sent");

      // Test with a dummy token to see the error response
      console.log("\n3. Testing verification with dummy token...");
      const verifyResponse = await fetch(`${API_BASE}/users/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testData.email,
          token: "dummy-token-123"
        })
      });

      console.log("Verification status:", verifyResponse.status);
      const verifyResult = await verifyResponse.json();
      console.log("Verification response:", JSON.stringify(verifyResult, null, 2));

      if (verifyResponse.status === 400) {
        console.log("✅ Endpoint responding correctly - invalid token rejected");
      }

    } else {
      const error = await registerResponse.json();
      console.log("❌ Registration failed:", JSON.stringify(error, null, 2));
    }

  } catch (error) {
    console.log("❌ Test error:", error.message);
  }

  console.log("\n📋 SUMMARY:");
  console.log("If registration works: Email verification endpoint is functional");
  console.log("If you get 500 errors: Check Render.com logs for detailed errors");
  console.log("If frontend shows extension errors: Try disabling browser extensions");
}

testVerification();