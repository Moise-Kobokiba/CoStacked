// Test notifications between Molatelo and Gang Green
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const Notification = require('./models/Notification');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function testGangGreenNotifications() {
  console.log("🧪 TESTING GANG GREEN NOTIFICATIONS");
  console.log("====================================");

  await connectDB();

  try {
    // Find the users
    const molatelo = await User.findOne({ name: /Molatelo/i });
    const gangGreen = await User.findOne({ name: "Gang Green" });

    console.log("Users found:");
    console.log("- Molatelo:", molatelo ? molatelo.name + " (" + molatelo._id + ")" : "NOT FOUND");
    console.log("- Gang Green:", gangGreen ? gangGreen.name + " (" + gangGreen._id + ")" : "NOT FOUND");

    if (!molatelo || !gangGreen) {
      console.log("❌ Required users not found");
      return;
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [molatelo._id, gangGreen._id] }
    });

    if (!conversation) {
      console.log("Creating conversation between Molatelo and Gang Green...");
      conversation = await Conversation.create({
        participants: [molatelo._id, gangGreen._id],
        projectId: null
      });
    }

    console.log("Using conversation:", conversation._id);

    // Send a test message (simulating the socket message creation)
    console.log("Sending test message from Molatelo to Gang Green...");
    const message = await Message.create({
      conversationId: conversation._id,
      sender: molatelo._id,
      type: 'text',
      content: 'Test message from Molatelo to Gang Green for notification testing',
      status: 'delivered'
    });

    // Create notification manually (simulating what the message controller does)
    await Notification.create({
      recipient: gangGreen._id,
      sender: molatelo._id,
      type: 'NEW_MESSAGE',
      conversationId: conversation._id,
      projectId: conversation.projectId
    });

    console.log("✅ Test message and notification created");

    // Check Gang Green's notifications
    console.log("\n📬 Gang Green's notifications:");
    const notifications = await Notification.find({
      recipient: gangGreen._id,
      isRead: false
    }).populate('sender', 'name').sort({ createdAt: -1 });

    console.log(`Found ${notifications.length} unread notifications:`);
    notifications.forEach(notif => {
      console.log(`- ${notif.type}: from ${notif.sender?.name || 'Unknown'} at ${notif.createdAt}`);
    });

    console.log("\n🎯 NOTIFICATION SYSTEM TEST COMPLETE");
    console.log("===================================");
    console.log("✅ Gang Green user exists");
    console.log("✅ Conversation created/found");
    console.log("✅ Message created");
    console.log("✅ Notification created");
    console.log(`✅ ${notifications.length} unread notifications found`);

    // Clean up test data (optional)
    console.log("\n🧹 Cleaning up test data...");
    await Message.deleteOne({ _id: message._id });
    await Notification.deleteMany({
      recipient: gangGreen._id,
      type: 'NEW_MESSAGE',
      createdAt: { $gte: new Date(Date.now() - 300000) } // Last 5 minutes
    });

    console.log("✅ Test cleanup complete");

  } catch (error) {
    console.error("❌ Test error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testGangGreenNotifications();