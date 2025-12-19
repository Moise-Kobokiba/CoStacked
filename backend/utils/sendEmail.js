// backend/utils/sendEmail.js

const fetch = require('node-fetch'); // v2 syntax

const sendEmail = async ({ to, subject, text, html }) => {
  const API_KEY = process.env.AHASEND_API_KEY;
  const ACCOUNT_ID = process.env.AHASEND_ACCOUNT_ID;
  const FROM_EMAIL = process.env.AHASEND_FROM_EMAIL;
  const FROM_NAME = process.env.AHASEND_FROM_NAME || "CoStacked";

  if (!API_KEY || !ACCOUNT_ID || !FROM_EMAIL) {
    console.error("Missing AHAsend config:", {
      hasKey: !!API_KEY,
      hasAccountId: !!ACCOUNT_ID,
      fromEmail: FROM_EMAIL,
      fromName: FROM_NAME,
    });
    throw new Error("Email service is not configured correctly.");
  }

  const url = `https://api.ahasend.com/v2/accounts/${ACCOUNT_ID}/messages`;

  const payload = {
    from: { email: FROM_EMAIL, name: FROM_NAME },
    recipients: [{ email: to }],
    subject,
    text_content: text,
    html_content: html,
  };

  console.log("Sending email with AHAsend API payload:", JSON.stringify(payload, null, 2));

  try {
    console.log("🚀 Attempting to send email via AHAsend API v2");
    console.log("📧 Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("📡 AHAsend API Response Status:", response.status, response.statusText);

    let body;
    try {
      body = await response.json();
      console.log("📦 AHAsend API Response Body:", JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error("❌ Failed to parse AHAsend response as JSON:", parseError);
      body = { error: "Invalid JSON response from AHAsend" };
    }

    if (!response.ok) {
      console.error("❌ AHAsend API Error Details:", {
        status: response.status,
        statusText: response.statusText,
        url: url,
        requestPayload: payload,
        responseBody: body,
        timestamp: new Date().toISOString()
      });

      // Create a more detailed error message
      const errorMessage = body?.message || body?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`AHAsend API failed: ${errorMessage}`);
    }

    console.log("✅ Email successfully sent via AHAsend API:", body);
    return body;
  } catch (err) {
    console.error("💥 Critical error in sendEmail function:");
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    console.error("Error details:", {
      apiKeyLength: API_KEY ? API_KEY.length : 0,
      accountId: ACCOUNT_ID,
      fromEmail: FROM_EMAIL,
      payload: payload,
      timestamp: new Date().toISOString()
    });

    // Re-throw with additional context
    throw new Error(`Email sending failed: ${err.message}`);
  }
};

const sendVerificationEmail = async (toEmail, verificationLink) => {
  const subject = "CoStacked - Verify Your Email Address";
  const textMessage = `Welcome to CoStacked! Please click to verify:\n\n${verificationLink}`;
  const htmlMessage = `
    <p>Welcome to CoStacked! Please click the link below to verify your email:</p>
    <p><a href="${verificationLink}">Verify Email</a></p>
  `;

  return sendEmail({
    to: toEmail,
    subject,
    text: textMessage,
    html: htmlMessage,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
};
