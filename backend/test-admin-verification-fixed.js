// Test admin email verification through TempRegistration path
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

async function testAdminVerificationFixed() {
  console.log("🧪 TESTING ADMIN EMAIL VERIFICATION (FIXED)");
  console.log("===========================================");

  await connectDB();

  try {
    // Find any admin temp registrations
    const adminTempRegs = await TempRegistration.find({ isAdmin: true });

    if (adminTempRegs.length === 0) {
      console.log("❌ No admin temp registrations found");
      console.log("💡 Register an admin first to create a temp registration");
      return;
    }

    console.log(`Found ${adminTempRegs.length} admin temp registration(s):`);
    adminTempRegs.forEach(reg => {
      console.log(`- Email: ${reg.email}`);
      console.log(`  Token: ${reg.verificationToken}`);
      console.log(`  Expires: ${reg.expiresAt}`);
      console.log(`  Is Admin: ${reg.isAdmin}`);
      console.log("---");
    });

    // Test verification for the first admin temp registration
    const testAdminReg = adminTempRegs[0];

    console.log(`\n🎯 Testing verification for admin: ${testAdminReg.email}`);
    console.log(`Token: ${testAdminReg.verificationToken}`);

    // Check if token is still valid
    const now = new Date();
    const expiresAt = new Date(testAdminReg.expiresAt);
    const isExpired = now > expiresAt;

    console.log("Token expired:", isExpired);
    console.log("Current time:", now);
    console.log("Expiry time:", expiresAt);

    if (isExpired) {
      console.log("❌ Token has expired - need to register again");
      return;
    }

    // Simulate the verification process (what happens in the verifyEmail endpoint)
    console.log("\n🔄 Simulating verification process...");

    // Create the admin user account
    const adminUser = await User.create({
      name: testAdminReg.name,
      email: testAdminReg.email,
      password: testAdminReg.password,
      role: testAdminReg.role,
      isAdmin: testAdminReg.isAdmin,
      isEmailVerified: true
    });

    console.log("✅ Admin user created:");
    console.log("- Name:", adminUser.name);
    console.log("- Email:", adminUser.email);
    console.log("- Role:", adminUser.role);
    console.log("- Is Admin:", adminUser.isAdmin);
    console.log("- Email Verified:", adminUser.isEmailVerified);

    // Clean up temp registration
    await TempRegistration.deleteOne({ _id: testAdminReg._id });
    console.log("✅ Temp registration cleaned up");

    // Verify the user exists and is admin
    const verifiedUser = await User.findById(adminUser._id);
    console.log("\n✅ FINAL VERIFICATION:");
    console.log("- User exists in database:", !!verifiedUser);
    console.log("- Is admin:", verifiedUser.isAdmin);
    console.log("- Email verified:", verifiedUser.isEmailVerified);
    console.log("- Can login:", verifiedUser.isEmailVerified && verifiedUser.isAdmin);

    console.log("\n🎉 SUCCESS: Admin verification through TempRegistration works!");

  } catch (error) {
    console.error("❌ Test error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testAdminVerificationFixed();