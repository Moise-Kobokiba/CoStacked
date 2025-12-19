// Check what domains are verified in AHAsend account
require('dotenv').config();

const API_KEY = process.env.AHASEND_API_KEY;
const ACCOUNT_ID = process.env.AHASEND_ACCOUNT_ID;

async function checkDomains() {
  console.log("🔍 CHECKING AHASEND ACCOUNT DOMAINS");
  console.log("===================================");

  if (!API_KEY || !ACCOUNT_ID) {
    console.log("❌ Missing API credentials");
    return;
  }

  try {
    const response = await fetch(`https://api.ahasend.com/v2/accounts/${ACCOUNT_ID}/domains`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log("API Response Status:", response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log("📋 ACCOUNT DOMAINS:");
      console.log(JSON.stringify(data, null, 2));

      if (data.data && data.data.length > 0) {
        console.log("\n🔍 DOMAIN ANALYSIS:");
        data.data.forEach(domain => {
          const status = domain.verified ? "✅ VERIFIED" : "❌ NOT VERIFIED";
          console.log(`${status} - ${domain.name}`);
        });

        const costackedDomain = data.data.find(d => d.name === 'costacked.co.za');
        if (costackedDomain) {
          console.log(`\n🎯 costacked.co.za status: ${costackedDomain.verified ? "VERIFIED" : "NOT VERIFIED"}`);
          if (!costackedDomain.verified) {
            console.log("💡 This domain needs verification - check DNS records");
          }
        } else {
          console.log("\n❌ costacked.co.za not found in account domains");
          console.log("💡 Add costacked.co.za to your AHAsend account first");
        }
      } else {
        console.log("❌ No domains found in account");
      }
    } else {
      const error = await response.json();
      console.log("❌ API Error:", JSON.stringify(error, null, 2));
    }
  } catch (error) {
    console.log("❌ Network Error:", error.message);
  }
}

checkDomains();