// Create User X and send message to Molatelo
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const Notification = require('./models/Notification');
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

async function createUserXAndSendMessage() {
  console.log("👤 CREATING USER X AND SENDING MESSAGE");
  console.log("======================================");

  await connectDB();

  try {
    // Check if User X already exists
    const existingUser = await User.findOne({ name: "User X" });

    let userX;
    if (existingUser) {
      console.log("⚠️ User X already exists");
      userX = existingUser;
    } else {
      // Create User X
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("password123", salt);

      userX = await User.create({
        name: "User X",
        email: "user.x@example.com",
        password: hashedPassword,
        role: "developer",
        bio: "Test user for messaging",
        isEmailVerified: true
      });

      console.log("✅ User X created successfully!");
    }

    console.log("- Name:", userX.name);
    console.log("- Email:", userX.email);
    console.log("- ID:", userX._id);

    // Find Molatelo Ramusi
    const molatelo = await User.findOne({ name: /Molatelo/i });
    if (!molatelo) {
      console.log("❌ Molatelo Ramusi not found");
      return;
    }

    console.log("Found Molatelo:", molatelo.name, molatelo._id);

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [userX._id, molatelo._id] }
    });

    if (!conversation) {
      console.log("Creating conversation between User X and Molatelo...");
      conversation = await Conversation.create({
        participants: [userX._id, molatelo._id]
      });
      console.log("✅ Conversation created:", conversation._id);
    } else {
      console.log("Using existing conversation:", conversation._id);
    }

    // Send message from User X to Molatelo
    console.log("Sending message from User X to Molatelo...");

    const message = await Message.create({
      conversationId: conversation._id,
      sender: userX._id,
      type: 'text',
      content: 'hi friend, long time',
      status: 'delivered'
    });

    console.log("✅ Message created:", message._id);

    // Update conversation timestamp
    conversation.updatedAt = new Date();
    await conversation.save();

    // Create notification for Molatelo
    await Notification.create({
      recipient: molatelo._id,
      sender: userX._id,
      type: 'NEW_MESSAGE',
      conversationId: conversation._id,
      projectId: conversation.projectId
    });

    console.log("✅ Notification created for Molatelo");

    // Verify everything was created
    console.log("\n📊 VERIFICATION:");

    // Check message
    const savedMessage = await Message.findById(message._id).populate('sender', 'name');
    console.log("Message:", savedMessage.sender.name, "->", savedMessage.content);

    // Check notification
    const notification = await Notification.findOne({
      recipient: molatelo._id,
      sender: userX._id,
      type: 'NEW_MESSAGE'
    }).populate('sender', 'name').sort({ createdAt: -1 });

    console.log("Notification: New message from", notification.sender.name);

    console.log("\n🎯 SUCCESS: User X created and message sent to Molatelo!");
    console.log("📧 Message content: 'hi friend, long time'");
    console.log("🔔 Notification created for Molatelo");
    console.log("💾 Data NOT cleaned up - message persists");

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Database disconnected");
  }
}

createUserXAndSendMessage();