// Script to help find the correct account ID for new AHAsend credentials
require('dotenv').config();

async function findAccountInfo() {
  console.log("🔍 FINDING AHASEND ACCOUNT INFORMATION");
  console.log("======================================");

  const API_KEY = process.env.AHASEND_API_KEY;

  if (!API_KEY) {
    console.log("❌ No API key found");
    return;
  }

  console.log("📋 Current API Key ends with:", API_KEY.slice(-10));
  console.log("");

  // Try to get account information
  const fetch = require('node-fetch');

  try {
    console.log("🔄 Attempting to get account domains (this may fail if account ID is wrong)...");

    // This will fail if account ID is wrong, but let's try with the current one first
    const response = await fetch(`https://api.ahasend.com/v2/accounts/${process.env.AHASEND_ACCOUNT_ID}/domains`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log("✅ Current account ID works with new API key!");
      const data = await response.json();
      console.log("Account has", data.data?.length || 0, "domains");

      // Look for costacked.co.za
      const costackedDomain = data.data?.find(d => d.domain === 'costacked.co.za');
      if (costackedDomain) {
        console.log("✅ costacked.co.za domain found!");
        console.log("Domain verified:", costackedDomain.dns_valid ? "YES" : "NO");
      } else {
        console.log("❌ costacked.co.za domain NOT found in this account");
      }
    } else {
      console.log("❌ Current account ID doesn't work with new API key");
      console.log("Response:", response.status, response.statusText);

      if (response.status === 401) {
        console.log("🔍 SOLUTION: Find your account ID from AHAsend dashboard:");
        console.log("1. Log into https://dash.ahasend.com with the new API key credentials");
        console.log("2. Look at the URL: https://dash.ahasend.com/accounts/YOUR_ACCOUNT_ID/... ");
        console.log("3. Copy the YOUR_ACCOUNT_ID part");
        console.log("4. Update AHASEND_ACCOUNT_ID in your .env file");
      }
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
    console.log("💡 This is expected if account ID is wrong. Please check your AHAsend dashboard.");
  }

  console.log("");
  console.log("📝 MANUAL STEPS:");
  console.log("1. Go to https://dash.ahasend.com");
  console.log("2. Log in with the new credentials");
  console.log("3. Check the URL for your account ID");
  console.log("4. Update .env file: AHASEND_ACCOUNT_ID=your_actual_account_id");
  console.log("5. Run: node check-domains.js");
}

findAccountInfo();