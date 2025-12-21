// Test admin email verification
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function testAdminVerification() {
  console.log("🧪 TESTING ADMIN EMAIL VERIFICATION");
  console.log("===================================");

  await connectDB();

  try {
    // Find an admin user with verification token
    const adminUser = await User.findOne({
      isAdmin: true,
      emailVerificationToken: { $exists: true, $ne: null }
    });

    if (!adminUser) {
      console.log("❌ No admin user found with verification token");
      console.log("💡 Try registering an admin first, then run this test");
      return;
    }

    console.log("Found admin user:", adminUser.name, adminUser.email);
    console.log("Verification token:", adminUser.emailVerificationToken);
    console.log("Token expires:", adminUser.emailVerificationExpires);

    // Check if token is still valid
    const now = new Date();
    const expiresAt = new Date(adminUser.emailVerificationExpires);
    const isExpired = now > expiresAt;

    console.log("Token expired:", isExpired);
    console.log("Current time:", now);
    console.log("Expiry time:", expiresAt);

    if (isExpired) {
      console.log("❌ Token has expired - need to register again");
      return;
    }

    // Test the verification endpoint
    const fetch = require('node-fetch');
    const API_BASE = 'https://co-stacked-backend.onrender.com/api';

    console.log("\nTesting verification endpoint...");
    const response = await fetch(`${API_BASE}/users/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: adminUser.email,
        token: adminUser.emailVerificationToken
      })
    });

    console.log("Verification response status:", response.status);

    if (response.status === 200) {
      const result = await response.json();
      console.log("✅ VERIFICATION SUCCESSFUL!");
      console.log("Response:", JSON.stringify(result, null, 2));

      // Check if user is now verified
      const updatedUser = await User.findById(adminUser._id);
      console.log("User verified status:", updatedUser.isEmailVerified);
      console.log("Token cleared:", !updatedUser.emailVerificationToken);

    } else {
      const error = await response.json();
      console.log("❌ VERIFICATION FAILED:");
      console.log("Error:", JSON.stringify(error, null, 2));
    }

  } catch (error) {
    console.error("❌ Test error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testAdminVerification();