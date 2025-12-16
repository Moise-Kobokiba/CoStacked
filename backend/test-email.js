// backend/utils/sendEmail.js

const sendEmail = async (options) => {
  // Use the API Key, not the SMTP credentials
  const AHASEND_API_KEY = process.env.AHA_API_KEY;
  const AHASEND_FROM_EMAIL = process.env.AHA_FROM_EMAIL;
  const AHASEND_FROM_NAME = process.env.AHA_FROM_NAME;
  
  // According to AhaSend docs, the API endpoint is api.ahasend.com/v1/email
  const AHASEND_API_URL = "https://api.ahasend.com/v1/email"; 

  if (!AHASEND_API_KEY || !AHASEND_FROM_EMAIL) {
    console.error("FATAL: AhaSend API environment variables (AHA_API_KEY, AHA_FROM_EMAIL) are missing!");
    throw new Error("Email service is not configured correctly on the server.");
  }
  
  const emailPayload = {
    from: {
      email: AHASEND_FROM_EMAIL,
      name: AHASEND_FROM_NAME || 'CoStacked',
    },
    to: [
      { email: options.to }
    ],
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    // Use the native fetch function to call the HTTP API
    const response = await fetch(AHASEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AHASEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error("AhaSend API Error Response:", errorBody);
      throw new Error(`AhaSend API failed with status ${response.status}`);
    }
    
    console.log(`Email sent successfully to ${options.to} via AhaSend API.`);
    return await response.json();

  } catch (error) {
    console.error("Critical error in sendEmail utility:", error.message);
    throw new Error('Email could not be sent via API.');
  }
};

module.exports = sendEmail;