// Debug script to get detailed email error information
require('dotenv').config();
const { sendEmail } = require('./utils/sendEmail');

async function debugEmailError() {
  console.log("🔍 EMAIL ERROR DEBUGGING SCRIPT");
  console.log("=================================");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Environment:", process.env.NODE_ENV || 'development');
  console.log("");

  // Check environment variables
  console.log("📋 ENVIRONMENT VARIABLES:");
  console.log("AHASEND_API_KEY:", process.env.AHASEND_API_KEY ? `Set (${process.env.AHASEND_API_KEY.length} chars)` : "❌ NOT SET");
  console.log("AHASEND_ACCOUNT_ID:", process.env.AHASEND_ACCOUNT_ID || "❌ NOT SET");
  console.log("AHASEND_FROM_EMAIL:", process.env.AHASEND_FROM_EMAIL || "❌ NOT SET");
  console.log("AHASEND_FROM_NAME:", process.env.AHASEND_FROM_NAME || "❌ NOT SET");
  console.log("");

  // Test API connectivity
  console.log("🌐 TESTING AHASEND API CONNECTIVITY:");
  try {
    const testEmail = process.env.AHASEND_FROM_EMAIL || "test@example.com";
    console.log("Sending test email to:", testEmail);

    await sendEmail({
      to: testEmail,
      subject: "CoStacked Debug - Email Error Test",
      text: "This is a debug test to identify email sending issues.",
      html: "<p>This is a <strong>debug test</strong> to identify email sending issues.</p>"
    });

    console.log("✅ EMAIL SENT SUCCESSFULLY!");
    console.log("🎉 No issues found - email system is working correctly");

  } catch (error) {
    console.log("❌ EMAIL SENDING FAILED!");
    console.log("Error Type:", error.constructor.name);
    console.log("Error Message:", error.message);

    if (error.stack) {
      console.log("Error Stack:", error.stack);
    }

    // Provide specific troubleshooting based on error
    console.log("");
    console.log("🔧 TROUBLESHOOTING GUIDANCE:");

    if (error.message.includes("401")) {
      console.log("• API Key is invalid or expired");
      console.log("• Check AHASEND_API_KEY in environment variables");
      console.log("• Regenerate API key in AHAsend dashboard");
    } else if (error.message.includes("403")) {
      console.log("• Account access denied");
      console.log("• Check AHASEND_ACCOUNT_ID is correct");
      console.log("• Verify account has email sending permissions");
    } else if (error.message.includes("412")) {
      console.log("• Domain not verified");
      console.log("• Check DNS records for the sender domain");
      console.log("• Verify domain in AHAsend dashboard");
      console.log("• Domain:", process.env.AHASEND_FROM_EMAIL?.split('@')[1] || "unknown");
    } else if (error.message.includes("400")) {
      console.log("• Bad request - invalid email format or missing required fields");
      console.log("• Check AHASEND_FROM_EMAIL format");
    } else if (error.message.includes("429")) {
      console.log("• Rate limit exceeded");
      console.log("• Wait a few minutes and try again");
    } else if (error.message.includes("network") || error.message.includes("fetch")) {
      console.log("• Network connectivity issue");
      console.log("• Check internet connection");
      console.log("• AHAsend API may be down");
    } else {
      console.log("• Unknown error - check the full error details above");
      console.log("• Review AHAsend API documentation");
      console.log("• Contact AHAsend support if needed");
    }

    console.log("");
    console.log("📊 ERROR SUMMARY:");
    console.log("• Status: Email system not working");
    console.log("• Action Required: Fix the issue above");
    console.log("• Next Step: Run this script again after fixes");
  }
}

debugEmailError().catch(console.error);