// Debug login issues
require('dotenv').config();
const fetch = require('node-fetch');

async function debugLogin() {
  console.log("🔍 DEBUGGING LOGIN ISSUES");
  console.log("=========================");

  const API_BASE = 'https://co-stacked-backend.onrender.com/api';

  // Test 1: Try to login with test credentials
  console.log("\n1. Testing login endpoint...");
  try {
    const loginResponse = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: "test@example.com", // Replace with actual test credentials
        password: "testpassword123"
      })
    });

    console.log("Login status:", loginResponse.status);

    if (loginResponse.status === 200) {
      const loginData = await loginResponse.json();
      console.log("✅ Login successful!");
      console.log("Response structure:", {
        hasUser: !!loginData.user,
        hasToken: !!loginData.token,
        userFields: loginData.user ? Object.keys(loginData.user) : []
      });

      if (loginData.token && loginData.user) {
        console.log("✅ Response format correct: { user, token }");

        // Test 2: Try to use the token to access profile
        console.log("\n2. Testing profile access with token...");
        const profileResponse = await fetch(`${API_BASE}/users/profile`, {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
          }
        });

        console.log("Profile status:", profileResponse.status);

        if (profileResponse.status === 200) {
          console.log("✅ Profile access successful!");
          const profileData = await profileResponse.json();
          console.log("Profile data:", Object.keys(profileData));
        } else {
          const errorData = await profileResponse.json();
          console.log("❌ Profile access failed:", errorData);
        }

      } else {
        console.log("❌ Response missing user or token");
        console.log("Expected: { user: {...}, token: '...' }");
        console.log("Received:", JSON.stringify(loginData, null, 2));
      }

    } else if (loginResponse.status === 401) {
      const errorData = await loginResponse.json();
      console.log("❌ Login failed:", errorData.message);
      if (errorData.emailNotVerified) {
        console.log("💡 Email not verified - user needs to verify email first");
      }
    } else {
      console.log("❌ Unexpected login status");
      const errorData = await loginResponse.json();
      console.log("Error:", errorData);
    }

  } catch (error) {
    console.log("❌ Network error:", error.message);
  }

  console.log("\n📋 TROUBLESHOOTING CHECKLIST:");
  console.log("☐ Backend login endpoint returns { user, token }");
  console.log("☐ Frontend receives and stores token in localStorage");
  console.log("☐ Axios interceptor reads token from localStorage");
  console.log("☐ Profile endpoint accepts token and returns user data");
  console.log("☐ Redux state updates with user and token");
  console.log("☐ Protected routes allow navigation");

  console.log("\n💡 MOST COMMON ISSUES:");
  console.log("1. Backend not returning token in login response");
  console.log("2. Token not stored in localStorage with correct key");
  console.log("3. Axios interceptor not finding token");
  console.log("4. Profile fetch failing after login");
  console.log("5. Redux state not updating properly");
}

debugLogin();