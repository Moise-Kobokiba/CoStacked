require('dotenv').config();
const fetch = require('node-fetch');

async function testAhaSendAPI() {
  const API_KEY = process.env.AHASEND_API_KEY;
  const ACCOUNT_ID = process.env.AHASEND_ACCOUNT_ID;
  const FROM_EMAIL = process.env.AHASEND_FROM_EMAIL;
  const FROM_NAME = process.env.AHASEND_FROM_NAME;

  console.log("=== AHAsend API v2 Configuration Test ===\n");

  // Check environment variables
  console.log("1. Environment Variables:");
  console.log(`   API Key: ${API_KEY ? 'Set (length: ' + API_KEY.length + ')' : '❌ NOT SET'}`);
  console.log(`   Account ID: ${ACCOUNT_ID ? ACCOUNT_ID : '❌ NOT SET'}`);
  console.log(`   From Email: ${FROM_EMAIL || '❌ NOT SET'}`);
  console.log(`   From Name: ${FROM_NAME || '❌ NOT SET'}`);

  if (!API_KEY || !ACCOUNT_ID || !FROM_EMAIL) {
    console.log("\n❌ Missing required environment variables");
    console.log("   Required variables:");
    console.log("   • AHASEND_API_KEY - Your AHAsend API key");
    console.log("   • AHASEND_ACCOUNT_ID - Your AHAsend account ID");
    console.log("   • AHASEND_FROM_EMAIL - Verified sender email");
    console.log("   • AHASEND_FROM_NAME - Sender name (optional)");
    console.log("\n   📋 How to find your Account ID:");
    console.log("   1. Go to https://dash.ahasend.com");
    console.log("   2. Look at the URL: https://dash.ahasend.com/accounts/YOUR_ACCOUNT_ID/...");
    console.log("   3. Copy the account ID from the URL");
    return;
  }

  try {
    // Test 1: Send a test email directly
    console.log("\n2. Testing Email Sending...");
    const emailResponse = await fetch(`https://api.ahasend.com/v2/accounts/${ACCOUNT_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { email: FROM_EMAIL, name: FROM_NAME || "CoStacked Test" },
        recipients: [{ email: FROM_EMAIL }],
        subject: "AHAsend API Test - CoStacked",
        text_content: "This is a test email to verify AHAsend API v2 configuration.",
        html_content: "<p>This is a test email to verify <strong>AHAsend API v2</strong> configuration.</p>"
      })
    });

    if (emailResponse.ok) {
      console.log("✅ Test email sent successfully!");
      const result = await emailResponse.json();
      console.log("   Response:", JSON.stringify(result, null, 2));
      console.log("   📧 Check your inbox for the test email.");
    } else {
      const emailError = await emailResponse.json();
      console.log(`❌ Email sending failed: ${emailResponse.status} ${emailResponse.statusText}`);
      console.log("   Error details:", JSON.stringify(emailError, null, 2));

      // Provide specific troubleshooting based on error
      if (emailResponse.status === 401) {
        console.log("\n🔧 Troubleshooting - 401 Unauthorized:");
        console.log("   • Check that your AHASEND_API_KEY is correct");
        console.log("   • Verify the API key has proper permissions");
        console.log("   • Go to: https://dash.ahasend.com/api-keys");
      } else if (emailResponse.status === 403) {
        console.log("\n🔧 Troubleshooting - 403 Forbidden:");
        console.log("   • Check that your AHASEND_ACCOUNT_ID is correct");
        console.log("   • Verify your sender domain is approved");
        console.log("   • Go to: https://dash.ahasend.com/domains");
      } else if (emailResponse.status === 400) {
        console.log("\n🔧 Troubleshooting - 400 Bad Request:");
        console.log("   • Check that AHASEND_FROM_EMAIL is from a verified domain");
        console.log("   • Verify the email format is correct");
      }
    }
  } catch (error) {
    console.log("❌ Test failed:", error.message);
    console.log("\n🔧 General Troubleshooting:");
    console.log("   1. Verify all environment variables are set correctly");
    console.log("   2. Check your internet connection");
    console.log("   3. Confirm your AHAsend account is active");
  }
}

testAhaSendAPI();