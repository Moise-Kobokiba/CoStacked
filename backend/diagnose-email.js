require('dotenv').config();
const { sendEmail } = require('./utils/sendEmail');

async function diagnose() {
  console.log("--- AhaSend Configuration Diagnosis ---");
  
  const vars = {
    AHASEND_API_KEY: process.env.AHASEND_API_KEY,
    AHASEND_ACCOUNT_ID: process.env.AHASEND_ACCOUNT_ID,
    AHA_FROM_EMAIL: process.env.AHA_FROM_EMAIL,
    AHA_FROM_NAME: process.env.AHA_FROM_NAME
  };

  let missing = [];
  for (const [key, value] of Object.entries(vars)) {
    if (!value) {
      console.log(`❌ ${key} is MISSING`);
      missing.push(key);
    } else {
      console.log(`✅ ${key} is present (length: ${value.length})`);
    }
  }

  if (missing.length > 0) {
    console.error("\nFATAL: Missing environment variables. Email service will fail.");
    return;
  }

  // First test API key authentication
  console.log("\n2. Testing API Key Authentication...");
  const fetch = require('node-fetch');
  try {
    const authResponse = await fetch(`https://api.ahasend.com/v2/accounts/${vars.AHASEND_ACCOUNT_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vars.AHASEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { email: vars.AHA_FROM_EMAIL, name: vars.AHA_FROM_NAME },
        recipients: [{ email: vars.AHA_FROM_EMAIL }],
        subject: "API Test",
        text_content: "This is a test email to verify API connectivity."
      })
    });

    if (authResponse.ok) {
      console.log("✅ API key authentication successful");
      const result = await authResponse.json();
      console.log("Test message queued successfully");
    } else {
      console.error(`❌ API key authentication failed: ${authResponse.status} ${authResponse.statusText}`);
      const errorBody = await authResponse.json();
      console.error("Error details:", errorBody);
      return;
    }
  } catch (authError) {
    console.error("❌ API authentication test failed:", authError.message);
    return;
  }

  console.log("\nAttempting to send test email...");
  try {
    await sendEmail({
      to: vars.AHA_FROM_EMAIL, // Send to self
      subject: "Test Email from Diagnosis Script",
      text: "This is a test email to verify AhaSend v2 configuration.",
      html: "<p>This is a test email to verify <strong>AhaSend v2</strong> configuration.</p>"
    });
    console.log("SUCCESS: Test email sent successfully.");
  } catch (error) {
    console.error("FAILURE: Error sending email.");
    console.error(error.message);
    if (error.message.includes("401")) {
      console.error("Hint: API Key authentication works but email sending failed.");
    }
    if (error.message.includes("422")) {
      console.error("Hint: Check if sender email is verified in MailerSend.");
    }
    if (error.message.includes("403")) {
      console.error("Hint: Check API key permissions or domain verification.");
    }
  }
}

diagnose();
