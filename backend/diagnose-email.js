require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

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
      console.error("Hint: Check if API Key is valid.");
    }
    if (error.message.includes("404")) {
      console.error("Hint: Check if Account ID is correct.");
    }
  }
}

diagnose();
