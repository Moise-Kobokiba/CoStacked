require('dotenv').config();
const fetch = require('node-fetch');

async function testMailerSend() {
  const API_KEY = process.env.AHA_API_KEY;
  const FROM_EMAIL = process.env.AHA_FROM_EMAIL;

  console.log("=== MailerSend Configuration Test ===\n");

  // Check environment variables
  console.log("1. Environment Variables:");
  console.log(`   API Key: ${API_KEY ? 'Set (length: ' + API_KEY.length + ')' : '❌ NOT SET'}`);
  console.log(`   From Email: ${FROM_EMAIL ? FROM_EMAIL : '❌ NOT SET'}`);

  if (!API_KEY || !FROM_EMAIL) {
    console.log("\n❌ Missing required environment variables");
    return;
  }

  try {
    // Test 1: Check API key authentication
    console.log("\n2. Testing API Key Authentication...");
    const response = await fetch('https://api.mailersend.com/v1/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log("✅ API key is valid!");
      const data = await response.json();
      console.log(`   Found ${data.data.length} domains`);

      // Check if domains are verified
      const verifiedDomains = data.data.filter(d => d.verified);
      console.log(`   Verified domains: ${verifiedDomains.length}`);

      if (verifiedDomains.length === 0) {
        console.log("⚠️  No verified domains found. You need to verify your domain in MailerSend.");
        console.log("   Go to: https://app.mailersend.com/domains");
      } else {
        console.log("✅ Domain verification looks good");
      }

      // Test 2: Try to send a test email
      console.log("\n3. Testing Email Sending...");
      const emailResponse = await fetch('https://api.mailersend.com/v1/email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: { email: FROM_EMAIL, name: "CoStacked Test" },
          to: [{ email: FROM_EMAIL }],
          subject: "Test Email from CoStacked",
          text: "This is a test email to verify MailerSend configuration.",
          html: "<p>This is a test email to verify <strong>MailerSend</strong> configuration.</p>"
        })
      });

      if (emailResponse.ok) {
        console.log("✅ Test email sent successfully!");
        console.log("   Check your inbox for the test email.");
      } else {
        const emailError = await emailResponse.json();
        console.log(`❌ Email sending failed: ${emailResponse.status} ${emailResponse.statusText}`);
        console.log("   Error:", emailError);

        if (emailError.message?.includes("verified")) {
          console.log("   💡 Suggestion: Verify your sender email in MailerSend");
          console.log("      Go to: https://app.mailersend.com/verified-senders");
        }
      }

    } else {
      console.log(`❌ API key invalid: ${response.status} ${response.statusText}`);
      const error = await response.json();
      console.log("   Error details:", error);

      console.log("\n🔧 Troubleshooting Steps:");
      console.log("   1. Go to https://app.mailersend.com/api-keys");
      console.log("   2. Create a new API key with full permissions");
      console.log("   3. Copy the key and update your .env file: AHA_API_KEY=your_new_key");
      console.log("   4. Also update the environment variable on Render.com");
    }
  } catch (error) {
    console.log("❌ Test failed:", error.message);
  }
}

testMailerSend();