// backend/utils/sendEmail.js

const fetch = require('node-fetch'); // v2 syntax

const sendEmail = async ({ to, subject, text, html }) => {
  const API_KEY = process.env.AHA_API_KEY;
  const ACCOUNT_ID = process.env.AHA_ACCOUNT_ID; // Add this
  const FROM_EMAIL = process.env.AHA_FROM_EMAIL;
  const FROM_NAME = process.env.AHA_FROM_NAME || "CoStacked";

  if (!API_KEY || !FROM_EMAIL || !ACCOUNT_ID) {
    console.error("Missing AhaSend config:", {
      hasKey: !!API_KEY,
      fromEmail: FROM_EMAIL,
      accountId: ACCOUNT_ID,
    });
    throw new Error("Email service is not configured correctly.");
  }

  const url = `https://api.ahasend.com/v2/accounts/d4e5e453-a555-4f80-a1e2-2da7941b1012/messages`;

  const payload = {
    from: { email: FROM_EMAIL, name: FROM_NAME },
    recipients: [{ email: to }],
    subject,
    text_content: text,
    html_content: html,
  };

  console.log("Sending email with AhaSend payload:", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const body = await response.json();

    if (!response.ok) {
      console.error("AhaSend API Error:", {
        status: response.status,
        statusText: response.statusText,
        body,
      });
      throw new Error(`AhaSend failed: ${JSON.stringify(body)}`);
    }

    console.log("Email successfully sent via AhaSend ✅", body);
    return body;
  } catch (err) {
    console.error("Critical fetch error in sendEmail:", err);
    throw err;
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
