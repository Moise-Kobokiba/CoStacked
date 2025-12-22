// Test admin registration on production-like environment
const fetch = require('node-fetch');

async function testProductionAdminRegistration() {
  console.log("🧪 TESTING PRODUCTION ADMIN REGISTRATION");
  console.log("=========================================");

  const API_BASE = 'https://co-stacked-backend.onrender.com/api';

  // Test data - use a unique email
  const testData = {
    name: "Test Admin Production",
    email: `admin-prod-${Date.now()}@example.com`,
    password: "password123",
    role: "admin",
    secretKey: "j2PJjKWOqBhDubfsOU9ZuJN+87Ce5ueyUpEkNc4GASc=" // This should match your ADMIN_SECRET_KEY
  };

  console.log("Test data:", {
    name: testData.name,
    email: testData.email,
    role: testData.role,
    hasSecretKey: !!testData.secretKey
  });

  try {
    console.log("\n1. Testing admin registration endpoint...");
    const registerResponse = await fetch(`${API_BASE}/admin/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log("Registration status:", registerResponse.status);
    console.log("Response headers:", Object.fromEntries(registerResponse.headers.entries()));

    const responseText = await registerResponse.text();
    console.log("Raw response:", responseText);

    if (registerResponse.status === 201) {
      console.log("✅ Admin registration successful!");
      try {
        const responseData = JSON.parse(responseText);
        console.log("Response data:", JSON.stringify(responseData, null, 2));
      } catch (parseError) {
        console.log("Response is not valid JSON");
      }
    } else if (registerResponse.status === 500) {
      console.log("❌ 500 Internal Server Error - This is the issue!");
      console.log("Check Render.com logs for detailed error stack trace");

      // Try to parse error if it's JSON
      try {
        const errorData = JSON.parse(responseText);
        console.log("Error response:", JSON.stringify(errorData, null, 2));
      } catch (parseError) {
        console.log("Error response is not JSON");
      }
    } else {
      console.log(`❌ Unexpected status: ${registerResponse.status}`);
      try {
        const errorData = JSON.parse(responseText);
        console.log("Error response:", JSON.stringify(errorData, null, 2));
      } catch (parseError) {
        console.log("Response:", responseText);
      }
    }

  } catch (error) {
    console.log("❌ Network error:", error.message);
    console.log("This could mean:");
    console.log("- Render.com service is down");
    console.log("- Network connectivity issues");
    console.log("- CORS issues");
  }

  console.log("\n📋 TROUBLESHOOTING STEPS:");
  console.log("1. ✅ Check Render.com service status");
  console.log("2. 🔍 Check Render.com application logs for detailed error");
  console.log("3. ⚙️ Verify all environment variables are set in Render.com");
  console.log("4. 📧 Test email configuration: node test-ahasend.js");
  console.log("5. 🗃️ Check MongoDB connection in Render.com");

  console.log("\n🔧 COMMON 500 ERROR CAUSES:");
  console.log("- Missing environment variables");
  console.log("- Database connection issues");
  console.log("- Model import/registration problems");
  console.log("- Email service configuration");
  console.log("- Syntax errors in deployed code");
}

testProductionAdminRegistration();