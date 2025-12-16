// mailer.js
import MailerSend from "@mailersend/mailersend";

// Initialize MailerSend with your API key
const mailer = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY, // stored as secret in GitHub or .env
});

/**
 * Sends a verification email to a new user
 * @param {string} toEmail - The recipient's email address
 * @param {string} verificationLink - The unique verification URL
 */
export async function sendVerificationEmail(toEmail, verificationLink) {
  try {
    const response = await mailer.email.send({
      from: "clement03jr@gmail.com", // must be verified in MailerSend
      to: [toEmail],
      subject: "Please verify your email",
      html: `
        <h2>Welcome to CoStacked!</h2>
        <p>Click the link below to verify your email:</p>
        <a href="${verificationLink}">Verify Email</a>
      `,
    });

    console.log("Verification email sent:", response);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
}