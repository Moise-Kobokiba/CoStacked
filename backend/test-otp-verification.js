// Test OTP verification process
require('dotenv').config();
const mongoose = require('mongoose');
const TempRegistration = require('./models/TempRegistration');
const User = require('./models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ MongoDB Connected for testing');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function testOTPVerification() {
  console.log("🧪 TESTING OTP VERIFICATION PROCESS");
  console.log("====================================");

  await connectDB();

  try {
    // Check if there are any temp registrations
    console.log("\n1. Checking for existing temp registrations...");
    const tempRegs = await TempRegistration.find({});
    console.log(`Found ${tempRegs.length} temporary registrations`);

    if (tempRegs.length > 0) {
      console.log("\nTemp registration details:");
      tempRegs.forEach(reg => {
        console.log(`- Email: ${reg.email}`);
        console.log(`- Token: ${reg.verificationToken}`);
        console.log(`- Expires: ${reg.expiresAt}`);
        console.log(`- Created: ${reg.createdAt}`);
        console.log("---");
      });

      // Test verification with the first one
      const testReg = tempRegs[0];
      console.log(`\n2. Testing verification for: ${testReg.email}`);

      // Simulate the verification process
      const verifiedReg = await TempRegistration.findOne({
        email: testReg.email,
        verificationToken: testReg.verificationToken,
        expiresAt: { $gt: new Date() }
      });

      if (verifiedReg) {
        console.log("✅ Token validation successful");

        // Create user account
        console.log("3. Creating user account...");
        const user = await User.create({
          name: verifiedReg.name,
          email: verifiedReg.email,
          password: verifiedReg.password,
          role: verifiedReg.role,
          bio: verifiedReg.bio,
          skills: verifiedReg.skills,
          location: verifiedReg.location,
          availability: verifiedReg.availability,
          portfolioLink: verifiedReg.portfolioLink,
          isEmailVerified: true
        });

        console.log(`✅ User created: ${user.email}`);

        // Clean up temp registration
        await TempRegistration.deleteOne({ _id: verifiedReg._id });
        console.log("✅ Temp registration cleaned up");

        console.log("\n🎉 OTP VERIFICATION TEST SUCCESSFUL!");

      } else {
        console.log("❌ Token validation failed - token may be expired or invalid");
      }

    } else {
      console.log("❌ No temp registrations found");
      console.log("💡 Try registering a user first to create a temp registration");
    }

  } catch (error) {
    console.error("❌ Test error:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Database disconnected");
  }
}

testOTPVerification();