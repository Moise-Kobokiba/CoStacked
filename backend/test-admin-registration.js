// Test admin registration and verification
require('dotenv').config();
const fetch = require('node-fetch');

async function testAdminRegistration() {
  console.log("🧪 TESTING ADMIN REGISTRATION & VERIFICATION");
  console.log("==============================================");

  const API_BASE = 'https://co-stacked-backend.onrender.com/api';

  // Generate unique test data
  const timestamp = Date.now();
  const testEmail = `admin-test-${timestamp}@example.com`;

  console.log("📧 Test email:", testEmail);

  try {
    // Step 1: Register admin
    console.log("\n1. Registering admin user...");
    const registerData = {
      name: "Test Admin",
      email: testEmail,
      password: "adminpassword123",
      role: "admin",
      secretKey: process.env.ADMIN_SECRET_KEY
    };

    const registerResponse = await fetch(`${API_BASE}/admin/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData)
    });

    console.log("Registration status:", registerResponse.status);

    if (registerResponse.status === 201) {
      const registerResult = await registerResponse.json();
      console.log("✅ Admin registration successful!");
      console.log("Response:", JSON.stringify(registerResult, null, 2));

      // For testing purposes, we'll need to get the verification token from the database
      // In a real scenario, the admin would check their email
      console.log("\n2. Note: In production, check email for verification code");
      console.log("   For testing, the verification token would be in the email");

      // Test invalid token to verify endpoint works
      console.log("\n3. Testing verification with invalid token...");
      const verifyResponse = await fetch(`${API_BASE}/users/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          token: "invalid-token"
        })
      });

      console.log("Verification status:", verifyResponse.status);
      const verifyResult = await verifyResponse.json();
      console.log("Verification response:", JSON.stringify(verifyResult, null, 2));

      if (verifyResponse.status === 400) {
        console.log("✅ Verification endpoint working - correctly rejects invalid tokens");
      }

    } else {
      const error = await registerResponse.json();
      console.log("❌ Admin registration failed:", JSON.stringify(error, null, 2));
    }

  } catch (error) {
    console.log("❌ Test error:", error.message);
  }

  console.log("\n📋 SUMMARY:");
  console.log("If registration works: Admin registration endpoint is functional");
  console.log("If email is sent: Email system working for admin accounts");
  console.log("If verification rejects invalid tokens: Verification logic working");
}

testAdminRegistration();