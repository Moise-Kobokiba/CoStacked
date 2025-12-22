// Test script for admin settings functionality
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

async function testSettingsEndpoints() {
  console.log("🧪 TESTING ADMIN SETTINGS ENDPOINTS");
  console.log("===================================");

  await connectDB();

  try {
    // Find an admin user for testing
    const adminUser = await User.findOne({ isAdmin: true });
    if (!adminUser) {
      console.log("❌ No admin user found for testing");
      return;
    }

    console.log("✅ Found admin user:", adminUser.email);

    // Test the settings endpoints by making HTTP requests
    const API_BASE = process.env.API_BASE || 'http://localhost:5001';

    console.log("\n1. Testing GET /api/admin/settings...");
    try {
      const response = await fetch(`${API_BASE}/api/admin/settings`, {
        headers: {
          'Authorization': `Bearer ${process.env.TEST_ADMIN_TOKEN || 'test-token'}`
        }
      });

      if (response.status === 401) {
        console.log("⚠️  Endpoint requires authentication (expected for protected route)");
      } else {
        const data = await response.json();
        console.log("✅ Settings endpoint response:", response.status);
        if (data.emailConfig) {
          console.log("✅ Email config returned");
        }
      }
    } catch (error) {
      console.log("⚠️  Could not test GET /api/admin/settings (server may not be running)");
    }

    console.log("\n2. Testing profile update validation...");
    // Test the admin email verification validation
    try {
      await User.create({
        name: "Test Admin No Email",
        email: "test-admin-no-email@example.com",
        password: "password123",
        role: "admin",
        isAdmin: true,
        isEmailVerified: false
      });
      console.log("❌ ERROR: Admin created without email verification!");
    } catch (error) {
      console.log("✅ SUCCESS: Admin creation blocked:", error.message);
    }

    console.log("\n3. Testing admin promotion blocking...");
    try {
      const regularUser = await User.create({
        name: "Regular User",
        email: "regular-user-settings@example.com",
        password: "password123",
        role: "developer",
        isAdmin: false,
        isEmailVerified: false
      });

      regularUser.isAdmin = true;
      await regularUser.save();
      console.log("❌ ERROR: User promoted to admin without verification!");
    } catch (error) {
      console.log("✅ SUCCESS: Admin promotion blocked:", error.message);

      // Clean up
      await User.deleteOne({ email: "regular-user-settings@example.com" });
    }

    console.log("\n🎉 Settings functionality tests completed!");

  } catch (error) {
    console.error("❌ Test error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testSettingsEndpoints();