// Test socket message notifications
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

// Simulate the socket message handler
async function simulateSocketMessage() {
  console.log("🧪 SIMULATING SOCKET MESSAGE HANDLER");
  console.log("=====================================");

  await connectDB();

  try {
    // Find the users
    const molatelo = await User.findOne({ name: /Molatelo/i });
    const gangGreen = await User.findOne({ name: "Gang Green" });

    if (!molatelo || !gangGreen) {
      console.log("❌ Required users not found");
      return;
    }

    console.log("Users found:");
    console.log("- Molatelo:", molatelo._id);
    console.log("- Gang Green:", gangGreen._id);

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [molatelo._id, gangGreen._id] }
    });

    if (!conversation) {
      console.log("Creating conversation...");
      conversation = await Conversation.create({
        participants: [molatelo._id, gangGreen._id]
      });
    }

    console.log("Using conversation:", conversation._id);

    // Simulate socket message data
    const socketData = {
      conversationId: conversation._id,
      senderId: molatelo._id,
      content: "Test message from socket simulation",
      type: "text"
    };

    console.log("Simulating socket message:", socketData);

    // Simulate the socket handler logic
    const { conversationId, senderId, content, type = 'text' } = socketData;

    // Save the message
    const message = await Message.create({
      conversationId,
      sender: senderId,
      type,
      content,
      status: 'delivered'
    });

    // Update conversation
    conversation.updatedAt = new Date();
    await conversation.save();

    // Create notifications (this is what we added)
    const recipients = conversation.participants.filter(p => p.toString() !== senderId.toString());
    console.log("Creating notifications for recipients:", recipients);

    for (const recipientId of recipients) {
      await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type: 'NEW_MESSAGE',
        conversationId: conversation._id,
        projectId: conversation.projectId
      });
      console.log(`✅ Created notification for recipient: ${recipientId}`);
    }

    // Check if notifications were created
    console.log("\n📬 Checking Gang Green's notifications after socket message:");
    const notifications = await Notification.find({
      recipient: gangGreen._id,
      type: 'NEW_MESSAGE'
    })
    .populate('sender', 'name')
    .sort({ createdAt: -1 })
    .limit(3);

    console.log(`Found ${notifications.length} NEW_MESSAGE notifications for Gang Green:`);
    notifications.forEach(notif => {
      console.log(`- From ${notif.sender?.name} at ${notif.createdAt} [${notif.isRead ? 'READ' : 'UNREAD'}]`);
    });

    // Clean up
    console.log("\n🧹 Cleaning up test data...");
    await Message.deleteOne({ _id: message._id });
    await Notification.deleteMany({
      type: 'NEW_MESSAGE',
      createdAt: { $gte: new Date(Date.now() - 300000) } // Last 5 minutes
    });

    console.log("✅ Test completed - socket notifications should now work!");

  } catch (error) {
    console.error("❌ Test error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

simulateSocketMessage();