// backend/utils/sendEmail.js   ← CommonJS version (works everywhere on Render right now)

const fetch = require('node-fetch');  // Make sure you have node-fetch@2 installed

const sendEmail = async ({ to, subject, text, html }) => {
  const API_KEY = process.env.AHA_API_KEY;
  const FROM_EMAIL = process.env.AHA_FROM_EMAIL;
  const FROM_NAME = process.env.AHA_FROM_NAME || "CoStacked";

  if (!API_KEY || !FROM_EMAIL) {
    console.error("Missing AhaSend/MailerSend config:", {
      hasKey: !!API_KEY,
      fromEmail: FROM_EMAIL,
      fromName: FROM_NAME,
    });
    throw new Error("Email service is not configured correctly.");
  }

  // Using MailerSend API (AHA Send service)
  const url = `https://api.mailersend.com/v1/email`;

  const payload = {
    from: { email: FROM_EMAIL, name: FROM_NAME },
    to: [{ email: to }],
    subject,
    text,
    html,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify(payload),
    });

    const body = await response.json();

    if (!response.ok) {
      console.error("MailerSend API Error:", {
        status: response.status,
        statusText: response.statusText,
        body,
      });
      throw new Error(`MailerSend failed: ${body.message || JSON.stringify(body)}`);
    }

    console.log("Email successfully sent via MailerSend ✅", body);
    return body;
  } catch (err) {
    console.error("Critical fetch error in sendEmail:", err);
    throw err;
  }
};

const sendVerificationEmail = async (toEmail, verificationLink) => {
  const subject = "CoStacked - Verify Your Email Address";
  const textMessage = `Welcome to CoStacked! Please click the link below to verify your email:\n\n${verificationLink}\n\nThis link will expire in 24 hours.`;
  const htmlMessage = `<p>Welcome to CoStacked! Please click the link below to verify your email:</p><p><a href="${verificationLink}">Verify Email</a></p><p>This link will expire in 24 hours.</p>`;

  return await sendEmail({
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