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
  console.log(`AHASEND_API_KEY: ${API_KEY ? 'Set (length: ' + API_KEY.length + ')' : '❌ NOT SET'}`);
  console.log(`AHASEND_ACCOUNT_ID: ${ACCOUNT_ID || '❌ NOT SET'}`);
  console.log(`AHA_FROM_EMAIL: ${FROM_EMAIL || '❌ NOT SET'}`);
  console.log(`AHA_FROM_NAME: ${FROM_NAME}`);

  if (!API_KEY || !ACCOUNT_ID || !FROM_EMAIL) {
    console.log("\n❌ Missing required environment variables on Render.com!");
    console.log("Please add these to your Render.com service environment variables:");
    console.log("- AHASEND_API_KEY");
    console.log("- AHASEND_ACCOUNT_ID");
    console.log("- AHA_FROM_EMAIL");
    console.log("- AHA_FROM_NAME (optional)");
    return;
  }

  const fetch = require('node-fetch');

  console.log("\nTesting API connection...");
  console.log("API URL:", `https://api.ahasend.com/v2/accounts/${ACCOUNT_ID}/messages`);

  try {
    // Send test email via API
    const response = await fetch(`https://api.ahasend.com/v2/accounts/${ACCOUNT_ID}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        from: { email: FROM_EMAIL, name: FROM_NAME },
        recipients: [{ email: FROM_EMAIL }],
        subject: "Production API Test - CoStacked",
        text_content: "This is a production test email via API.",
        html_content: "<p>This is a <strong>production test</strong> email via API.</p>"
      })
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
    console.log("❌ API test failed:", error.message);
    console.log("🔧 Check: Render.com might have network restrictions to AHAsend API");
  }
    });

    // Test connection
    await transporter.verify();
    console.log("✅ SMTP connection successful!");

    // Send test email
    const mailOptions = {
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: FROM_EMAIL,
      subject: "Production SMTP Test - CoStacked",
      text: "This is a production test email via SMTP.",
      html: "<p>This is a <strong>production test</strong> email via SMTP.</p>"
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Production email test successful!");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);

  } catch (error) {
    console.log("❌ SMTP test failed:", error.message);
    if (error.code === 'EAUTH') {
      console.log("🔧 Check: SMTP credentials might be incorrect on Render.com");
    } else if (error.code === 'ECONNREFUSED') {
      console.log("🔧 Check: Render.com might have network restrictions to AHAsend SMTP");
    }
  }
}

testProductionEmail();