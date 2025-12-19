// Test message sending via HTTP API to check notification creation
const fetch = require('node-fetch');

async function testHTTPMessageNotification() {
  console.log("🧪 TESTING HTTP MESSAGE NOTIFICATION");
  console.log("====================================");

  const API_BASE = 'https://co-stacked-backend.onrender.com/api';

  // First, get an access token by logging in as Molatelo
  console.log("1. Logging in as Molatelo...");

  try {
    const loginResponse = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: "molatelo@example.com", // You'll need to use the actual email
        password: "password123"
      })
    });

    if (!loginResponse.ok) {
      console.log("❌ Login failed - need to get the correct login credentials");
      console.log("Please provide the correct email/password for Molatelo Ramusi");
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;

    console.log("✅ Login successful, got token");

    // Get conversations to find the one with Gang Green
    console.log("2. Getting conversations...");
    const conversationsResponse = await fetch(`${API_BASE}/messages/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!conversationsResponse.ok) {
      console.log("❌ Failed to get conversations");
      return;
    }

    const conversations = await conversationsResponse.json();
    console.log(`Found ${conversations.length} conversations`);

    // Find conversation with Gang Green (you'll need to identify it by participants)
    // For now, let's assume we need to create one or find it manually

    console.log("3. To test properly, we need to:");
    console.log("   - Know Molatelo's login credentials");
    console.log("   - Find or create conversation with Gang Green");
    console.log("   - Send a message via HTTP API");
    console.log("   - Check if notification is created");

    console.log("\n💡 RECOMMENDATION:");
    console.log("Test this in the frontend instead:");
    console.log("1. Log in as Molatelo in the app");
    console.log("2. Send a message to Gang Green");
    console.log("3. Check Gang Green's notifications");
    console.log("4. Check browser console for any errors");

  } catch (error) {
    console.log("❌ Test error:", error.message);
  }
}

testHTTPMessageNotification();