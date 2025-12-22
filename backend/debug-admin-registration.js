// Debug admin registration 500 error
require('dotenv').config();
const mongoose = require('mongoose');
const TempRegistration = require('./models/TempRegistration');
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

async function debugAdminRegistration() {
  console.log("🔍 DEBUGGING ADMIN REGISTRATION 500 ERROR");
  console.log("==========================================");

  await connectDB();

  try {
    // Test data
    const testData = {
      name: "Test Admin Debug",
      email: `admin-debug-${Date.now()}@example.com`,
      password: "password123",
      role: "admin",
      secretKey: process.env.ADMIN_SECRET_KEY
    };

    console.log("Test data:", {
      name: testData.name,
      email: testData.email,
      role: testData.role,
      hasSecretKey: !!testData.secretKey
    });

    // Step 1: Check secret key
    console.log("\n1. Checking secret key...");
    if (testData.secretKey !== process.env.ADMIN_SECRET_KEY) {
      console.log("❌ Secret key mismatch");
      return;
    }
    console.log("✅ Secret key valid");

    // Step 2: Check for existing users
    console.log("\n2. Checking for existing users...");
    const existingUser = await User.findOne({ email: testData.email });
    const existingTemp = await TempRegistration.findOne({ email: testData.email });

    if (existingUser) {
      console.log("❌ User already exists");
      return;
    }
    if (existingTemp) {
      console.log("❌ Temp registration already exists");
      return;
    }
    console.log("✅ No existing users found");

    // Step 3: Generate token
    console.log("\n3. Generating verification token...");
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("✅ Token generated:", verificationToken);

    // Step 4: Test TempRegistration creation (without email)
    console.log("\n4. Testing TempRegistration creation...");
    try {
      const tempReg = await TempRegistration.create({
        name: testData.name,
        email: testData.email,
        password: testData.password,
        role: testData.role,
        verificationToken,
        isAdmin: true,
      });
      console.log("✅ TempRegistration created successfully");
      console.log("ID:", tempReg._id);

      // Clean up test data
      await TempRegistration.deleteOne({ _id: tempReg._id });
      console.log("✅ Test data cleaned up");

    } catch (dbError) {
      console.log("❌ TempRegistration creation failed:");
      console.log("Error:", dbError.message);
      console.log("Stack:", dbError.stack);

      // Check if it's a validation error
      if (dbError.name === 'ValidationError') {
        console.log("Validation errors:");
        for (let field in dbError.errors) {
          console.log(`- ${field}: ${dbError.errors[field].message}`);
        }
      }

      // Check if it's a duplicate key error
      if (dbError.code === 11000) {
        console.log("Duplicate key error - email already exists");
      }
    }

    // Step 5: Test email sending (optional)
    console.log("\n5. Testing email configuration...");
    try {
      const { sendEmail } = require('./utils/sendEmail');
      await sendEmail({
        to: testData.email,
        subject: 'Admin Registration Debug Test',
        text: 'This is a test email for debugging admin registration.',
        html: '<p>This is a test email for debugging admin registration.</p>'
      });
      console.log("✅ Email sending works");
    } catch (emailError) {
      console.log("⚠️ Email sending failed (but this might not be the 500 error):");
      console.log("Error:", emailError.message);
    }

  } catch (error) {
    console.error("❌ Debug script error:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await mongoose.disconnect();
  }

  console.log("\n📋 POSSIBLE CAUSES OF 500 ERROR:");
  console.log("1. ❌ TempRegistration model validation error");
  console.log("2. ❌ Database connection issue");
  console.log("3. ❌ Missing environment variables");
  console.log("4. ❌ Email service configuration issue");
  console.log("5. ❌ Mongoose model registration issue");

  console.log("\n💡 NEXT STEPS:");
  console.log("1. Check Render.com logs for detailed error stack trace");
  console.log("2. Verify all environment variables are set");
  console.log("3. Test email configuration: node test-ahasend.js");
  console.log("4. Check MongoDB connection");
}

debugAdminRegistration();