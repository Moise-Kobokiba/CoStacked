// Create a test user for notification testing
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function createTestUser() {
  console.log("👤 CREATING TEST USER: Gang Green");
  console.log("==================================");

  await connectDB();

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { name: "Gang Green" },
        { email: "gang.green@example.com" }
      ]
    });

    if (existingUser) {
      console.log("⚠️ User 'Gang Green' already exists:");
      console.log("- Name:", existingUser.name);
      console.log("- Email:", existingUser.email);
      console.log("- ID:", existingUser._id);
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("password123", salt);

    // Create new user
    const newUser = await User.create({
      name: "Gang Green",
      email: "gang.green@example.com",
      password: hashedPassword,
      role: "developer",
      bio: "Test user for notification system",
      isEmailVerified: true // Set as verified for testing
    });

    console.log("✅ User 'Gang Green' created successfully!");
    console.log("- Name:", newUser.name);
    console.log("- Email:", newUser.email);
    console.log("- ID:", newUser._id);
    console.log("- Role:", newUser.role);
    console.log("- Email Verified:", newUser.isEmailVerified);

    console.log("\n🔐 LOGIN CREDENTIALS:");
    console.log("- Email: gang.green@example.com");
    console.log("- Password: password123");

  } catch (error) {
    console.error("❌ Error creating user:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Database disconnected");
  }
}

createTestUser();