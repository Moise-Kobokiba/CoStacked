// Test script to verify admin email verification validation
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

async function testAdminValidation() {
  console.log("🧪 TESTING ADMIN EMAIL VERIFICATION VALIDATION");
  console.log("==============================================");

  await connectDB();

  try {
    console.log("\n1. Testing creation of admin user WITHOUT email verification...");
    try {
      await User.create({
        name: "Test Admin",
        email: "test-admin-validation@example.com",
        password: "password123",
        role: "admin",
        isAdmin: true,
        isEmailVerified: false // This should fail
      });
      console.log("❌ ERROR: Admin user was created without email verification!");
    } catch (error) {
      console.log("✅ SUCCESS: Admin user creation was blocked:", error.message);
    }

    console.log("\n2. Testing creation of admin user WITH email verification...");
    try {
      const verifiedAdmin = await User.create({
        name: "Verified Admin",
        email: "verified-admin@example.com",
        password: "password123",
        role: "admin",
        isAdmin: true,
        isEmailVerified: true // This should succeed
      });
      console.log("✅ SUCCESS: Verified admin user created");
      console.log("- Name:", verifiedAdmin.name);
      console.log("- Email:", verifiedAdmin.email);
      console.log("- Is Admin:", verifiedAdmin.isAdmin);
      console.log("- Email Verified:", verifiedAdmin.isEmailVerified);

      // Clean up
      await User.deleteOne({ _id: verifiedAdmin._id });
      console.log("✅ Test admin user cleaned up");
    } catch (error) {
      console.log("❌ ERROR: Verified admin user creation failed:", error.message);
    }

    console.log("\n3. Testing promotion of existing user to admin without verification...");
    try {
      // First create a regular user
      const regularUser = await User.create({
        name: "Regular User",
        email: "regular-user@example.com",
        password: "password123",
        role: "developer",
        isAdmin: false,
        isEmailVerified: false
      });
      console.log("✅ Regular user created");

      // Now try to promote to admin
      regularUser.isAdmin = true;
      await regularUser.save();
      console.log("❌ ERROR: User was promoted to admin without email verification!");
    } catch (error) {
      console.log("✅ SUCCESS: Admin promotion was blocked:", error.message);

      // Clean up the regular user
      await User.deleteOne({ email: "regular-user@example.com" });
      console.log("✅ Test user cleaned up");
    }

  } catch (error) {
    console.error("❌ Test error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testAdminValidation();