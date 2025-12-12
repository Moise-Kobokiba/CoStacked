// backend/utils/sendEmail.js   ← CommonJS version (works everywhere on Render right now)

const fetch = require('node-fetch');  // Make sure you have node-fetch@2 installed

const sendEmail = async ({ to, subject, text, html }) => {
  const API_KEY = process.env.AHASEND_API_KEY;
  const ACCOUNT_ID = process.env.AHASEND_ACCOUNT_ID;
  const FROM_EMAIL = process.env.AHA_FROM_EMAIL;
  const FROM_NAME = process.env.AHA_FROM_NAME || "CoStacked";

  if (!API_KEY || !ACCOUNT_ID || !FROM_EMAIL) {
    console.error("Missing AhaSend v2 config:", {
      hasKey: !!API_KEY,
      hasAccountId: !!ACCOUNT_ID,
      fromEmail: FROM_EMAIL,
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

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,   // v2 uses Bearer token
      },
      body: JSON.stringify(payload),
    });

    const body = await response.json();

    if (!response.ok) {
      console.error("AhaSend v2 API Error:", {
        status: response.status,
        statusText: response.statusText,
        body,
      });
      throw new Error(`AhaSend failed: ${body.error?.message || JSON.stringify(body)}`);
    }

    console.log("Email successfully sent via AhaSend v2 ✅", body);
    return body;
  } catch (err) {
    console.error("Critical fetch error in sendEmail:", err);
    throw err;
  }
};

module.exports = sendEmail;