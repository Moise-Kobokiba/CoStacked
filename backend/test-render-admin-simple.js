// Simple test for admin registration - bypass email to isolate the issue
const fetch = require('node-fetch');

async function testRenderAdminSimple() {
  console.log("🧪 SIMPLE ADMIN REGISTRATION TEST");
  console.log("=================================");

  const API_BASE = 'https://co-stacked-backend.onrender.com/api';

  // Test 1: Check if the endpoint is accessible
  console.log("1. Testing endpoint accessibility...");
  try {
    const healthResponse = await fetch(`${API_BASE}/users`);
    console.log("Health check status:", healthResponse.status);
  } catch (error) {
    console.log("❌ Cannot reach backend:", error.message);
    return;
  }

  // Test 2: Try admin registration with wrong secret key
  console.log("\n2. Testing with wrong secret key...");
  const wrongKeyData = {
    name: "Test Admin",
    email: "test@example.com",
    password: "password123",
    role: "admin",
    secretKey: "wrong-key"
  };

  try {
    const wrongKeyResponse = await fetch(`${API_BASE}/admin/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wrongKeyData)
    });

    console.log("Wrong key response status:", wrongKeyResponse.status);
    const wrongKeyResult = await wrongKeyResponse.json();
    console.log("Wrong key response:", JSON.stringify(wrongKeyResult, null, 2));

    if (wrongKeyResponse.status === 401) {
      console.log("✅ Secret key validation is working");
    } else {
      console.log("❌ Unexpected response for wrong key");
    }
  } catch (error) {
    console.log("❌ Error testing wrong key:", error.message);
  }

  // Test 3: Try with correct secret key (but expect it to fail due to missing env vars or model issues)
  console.log("\n3. Testing with correct secret key...");
  const correctKeyData = {
    name: "Test Admin Correct",
    email: `test-correct-${Date.now()}@example.com`,
    password: "password123",
    role: "admin",
    secretKey: "j2PJjKWOqBhDubfsOU9ZuJN+87Ce5ueyUpEkNc4GASc=" // This should match your ADMIN_SECRET_KEY
  };

  try {
    const correctKeyResponse = await fetch(`${API_BASE}/admin/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(correctKeyData)
    });

    console.log("Correct key response status:", correctKeyResponse.status);

    if (correctKeyResponse.status === 500) {
      console.log("❌ 500 error persists - check Render.com logs immediately");
      console.log("The issue is likely:");
      console.log("- Missing environment variables on Render.com");
      console.log("- TempRegistration model not registered");
      console.log("- Database connection issues");
      console.log("- Email service configuration");
    } else if (correctKeyResponse.status === 201) {
      console.log("✅ Admin registration successful!");
      const result = await correctKeyResponse.json();
      console.log("Response:", JSON.stringify(result, null, 2));
    } else {
      const result = await correctKeyResponse.json();
      console.log("Response:", JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.log("❌ Error testing correct key:", error.message);
  }

  console.log("\n💡 IMMEDIATE ACTION REQUIRED:");
  console.log("1. Check Render.com application logs for the detailed 500 error");
  console.log("2. Look for stack traces and error messages");
  console.log("3. Verify all environment variables are set on Render.com");
  console.log("4. Check if ADMIN_SECRET_KEY matches");
  console.log("5. Ensure TempRegistration model is properly imported");
}

testRenderAdminSimple();