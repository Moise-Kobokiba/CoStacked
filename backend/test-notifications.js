// Test notification creation and retrieval
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const Notification = require('./models/Notification');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ MongoDB Connected for testing');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function testNotifications() {
  console.log("🧪 TESTING NOTIFICATION SYSTEM");
  console.log("================================");

  await connectDB();

  try {
    // Find some existing users and conversations
    const users = await User.find({}).limit(2);
    if (users.length < 2) {
      console.log("❌ Need at least 2 users for testing");
      return;
    }

    const user1 = users[0];
    const user2 = users[1];
    console.log(`Testing with users: ${user1.name} and ${user2.name}`);

    // Find or create a conversation between them
    let conversation = await Conversation.findOne({
      participants: { $all: [user1._id, user2._id] }
    });

    if (!conversation) {
      console.log("Creating test conversation...");
      conversation = await Conversation.create({
        participants: [user1._id, user2._id],
        projectId: null
      });
    }

    console.log(`Using conversation: ${conversation._id}`);

    // Create a test message (this should create a notification)
    console.log("Creating test message...");
    const message = await Message.create({
      conversationId: conversation._id,
      sender: user1._id,
      type: 'text',
      content: 'Test notification message',
      status: 'delivered'
    });

    // Manually create notification (simulating what the message controller does)
    await Notification.create({
      recipient: user2._id,
      sender: user1._id,
      type: 'NEW_MESSAGE',
      conversationId: conversation._id,
      projectId: conversation.projectId
    });

    console.log("✅ Test notification created");

    // Test fetching notifications for user2
    console.log(`\nFetching notifications for ${user2.name}...`);
    const notifications = await Notification.find({
      recipient: user2._id,
      isRead: false
    })
    .populate('sender', 'name avatarUrl')
    .sort({ createdAt: -1 });

    console.log(`Found ${notifications.length} unread notifications:`);
    notifications.forEach(notif => {
      console.log(`- ${notif.type}: ${notif.sender?.name || 'Unknown'} - ${notif.createdAt}`);
    });

    // Clean up test data
    console.log("\n🧹 Cleaning up test data...");
    await Message.deleteOne({ _id: message._id });
    await Notification.deleteMany({
      recipient: user2._id,
      type: 'NEW_MESSAGE',
      createdAt: { $gte: new Date(Date.now() - 60000) } // Last minute
    });

    console.log("✅ Test completed successfully");

  } catch (error) {
    console.error("❌ Test error:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

testNotifications();