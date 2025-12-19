require('dotenv').config();
const { sendEmail } = require('./utils/sendEmail');

async function diagnose() {
  console.log("--- AHAsend API v2 Configuration Diagnosis ---");

  const vars = {
    AHASEND_API_KEY: process.env.AHASEND_API_KEY,
    AHASEND_ACCOUNT_ID: process.env.AHASEND_ACCOUNT_ID,
    AHASEND_FROM_EMAIL: process.env.AHASEND_FROM_EMAIL,
    AHASEND_FROM_NAME: process.env.AHASEND_FROM_NAME
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
    console.log("\nRequired variables:");
    console.log("• AHASEND_API_KEY - Your AHAsend API key");
    console.log("• AHASEND_ACCOUNT_ID - Your AHAsend account ID");
    console.log("• AHASEND_FROM_EMAIL - Verified sender email");
    console.log("• AHASEND_FROM_NAME - Sender name (optional)");
    console.log("\nGet API credentials from: https://dash.ahasend.com/api-keys");
    return;
  }

  console.log("\nAttempting to send test email via API...");
  try {
    await sendEmail({
      to: vars.AHASEND_FROM_EMAIL, // Send to self
      subject: "Test Email from Diagnosis Script",
      text: "This is a test email to verify AHAsend API v2 configuration.",
      html: "<p>This is a test email to verify <strong>AHAsend API v2</strong> configuration.</p>"
    });
    console.log("SUCCESS: Test email sent successfully via API!");
  } catch (error) {
    console.error("FAILURE: Error sending email via API.");
    console.error("Full error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    if (error.message.includes("401")) {
      console.error("🔍 Hint: API key authentication failed - check AHASEND_API_KEY");
    }
    if (error.message.includes("403")) {
      console.error("🔍 Hint: Account access denied - check AHASEND_ACCOUNT_ID and domain verification");
    }
    if (error.message.includes("400")) {
      console.error("🔍 Hint: Bad request - check AHASEND_FROM_EMAIL domain verification");
    }
    if (error.message.includes("412")) {
      console.error("🔍 Hint: Domain not verified - check DNS records for costacked.co.za");
    }
    if (error.message.includes("429")) {
      console.error("🔍 Hint: Rate limit exceeded - wait and try again");
    }
  }
}

diagnose();
