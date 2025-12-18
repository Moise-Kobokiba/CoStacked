// Test script to simulate production environment
process.env.NODE_ENV = 'production';

// Don't load .env file (simulate production)
const fetch = require('node-fetch');

async function testProductionEmail() {
  console.log("=== Testing Production Email Configuration ===\n");

  // Check if environment variables are set (without dotenv)
  const API_KEY = process.env.AHASEND_API_KEY;
  const ACCOUNT_ID = process.env.AHASEND_ACCOUNT_ID;
  const FROM_EMAIL = process.env.AHA_FROM_EMAIL;
  const FROM_NAME = process.env.AHA_FROM_NAME || "CoStacked";

  console.log("Environment Variables Check:");
  console.log(`AHA_API_KEY: ${API_KEY ? 'Set (length: ' + API_KEY.length + ')' : '❌ NOT SET'}`);
  console.log(`AHA_ACCOUNT_ID: ${ACCOUNT_ID || '❌ NOT SET'}`);
  console.log(`AHA_FROM_EMAIL: ${FROM_EMAIL || '❌ NOT SET'}`);
  console.log(`AHA_FROM_NAME: ${FROM_NAME}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

  if (!API_KEY || !ACCOUNT_ID || !FROM_EMAIL) {
    console.log("\n❌ Missing required environment variables on Render.com!");
    console.log("Please add these to your Render.com service environment variables:");
    console.log("- AHA_API_KEY");
    console.log("- AHA_ACCOUNT_ID");
    console.log("- AHA_FROM_EMAIL");
    console.log("- AHA_FROM_NAME (optional)");
    return;
  }

  const url = `https://api.ahasend.com/v2/accounts/${ACCOUNT_ID}/messages`;
  const payload = {
    from: { email: FROM_EMAIL, name: FROM_NAME },
    recipients: [{ email: FROM_EMAIL }],
    subject: "Production Test - CoStacked",
    text_content: "This is a production test email.",
    html_content: "<p>This is a <strong>production test</strong> email.</p>"
  };

  console.log("\nTesting API call...");
  console.log("URL:", url);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);

    const body = await response.json();
    console.log("Response Body:", JSON.stringify(body, null, 2));

    if (response.ok) {
      console.log("✅ Production email test successful!");
    } else {
      console.log("❌ Production email test failed!");
      if (response.status === 401) {
        console.log("🔧 Check: API key might be incorrect on Render.com");
      } else if (response.status === 403) {
        console.log("🔧 Check: Account ID or domain verification issues");
      }
    }
  } catch (error) {
    console.log("❌ Network error:", error.message);
    console.log("🔧 Check: Render.com might have network restrictions to AHAsend");
  }
}

testProductionEmail();