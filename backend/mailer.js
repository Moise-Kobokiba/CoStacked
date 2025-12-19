// mailer.js - Using AhaSend
const fetch = require('node-fetch');

async function sendVerificationEmail(toEmail, verificationLink) {
  try {
    const response = await fetch('https://api.ahasend.com/v2/accounts/91f3ec7d-f931-464d-952e-82ee894ee90e/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AHASEND_API_KEY}`
      },
      body: JSON.stringify({
        from: { 
          email: process.env.AHASEND_FROM_EMAIL,
          name: 'CoStacked'
        },
        recipients: [{ email: toEmail }],
        subject: 'Verify your email',
        html_content: `
          <h2>Welcome to CoStacked!</h2>
          <p>Click the link below to verify your email:</p>
          <a href="${verificationLink}">Verify Email</a>
        `
      })
    });

    const data = await response.json();
    console.log('Email sent via AhaSend:', data);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

module.exports = { sendVerificationEmail };
