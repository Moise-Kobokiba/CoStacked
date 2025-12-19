// Debug message notifications for Molatelo and Gang Green
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Notification = require('./models/Notification');
const Message = require('./models/Message');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function debugMessageNotifications() {
  console.log("🔍 DEBUGGING MESSAGE NOTIFICATIONS");
  console.log("===================================");

  await connectDB();

  try {
    // Find the users
    const molatelo = await User.findOne({ name: /Molatelo/i });
    const gangGreen = await User.findOne({ name: "Gang Green" });

    console.log("Users found:");
    console.log("- Molatelo:", molatelo ? molatelo._id : "NOT FOUND");
    console.log("- Gang Green:", gangGreen ? gangGreen._id : "NOT FOUND");

    if (!molatelo || !gangGreen) {
      console.log("❌ Required users not found");
      return;
    }

    // Check recent messages from Molatelo to Gang Green
    console.log("\n💬 Recent messages from Molatelo to Gang Green:");
    const recentMessages = await Message.find({
      sender: molatelo._id
    })
    .populate('conversationId')
    .sort({ createdAt: -1 })
    .limit(5);

    if (recentMessages.length === 0) {
      console.log("❌ No messages found from Molatelo");
    } else {
      recentMessages.forEach(msg => {
        const recipients = msg.conversationId?.participants?.filter(p =>
          p.toString() !== molatelo._id.toString()
        ) || [];
        const recipientNames = recipients.map(r => {
          if (r.toString() === gangGreen._id.toString()) return "Gang Green";
          return "Other";
        });
        console.log(`- "${msg.content}" to [${recipientNames.join(', ')}] at ${msg.createdAt}`);
      });
    }

    // Check notifications for Gang Green
    console.log("\n🔔 Gang Green's notifications:");
    const notifications = await Notification.find({
      recipient: gangGreen._id
    })
    .populate('sender', 'name')
    .populate('conversationId')
    .sort({ createdAt: -1 })
    .limit(10);

    console.log(`Found ${notifications.length} total notifications for Gang Green:`);

    const messageNotifications = notifications.filter(n => n.type === 'NEW_MESSAGE');
    const connectionNotifications = notifications.filter(n => n.type === 'NEW_CONNECTION_REQUEST' || n.type === 'CONNECTION_ACCEPTED');

    console.log(`- ${messageNotifications.length} message notifications`);
    console.log(`- ${connectionNotifications.length} connection notifications`);

    console.log("\n📋 MESSAGE NOTIFICATIONS:");
    messageNotifications.forEach(notif => {
      console.log(`- From ${notif.sender?.name} (${notif.createdAt}) [${notif.isRead ? 'READ' : 'UNREAD'}]`);
      console.log(`  Type: ${notif.type}, Conversation: ${notif.conversationId?._id}`);
    });

    console.log("\n🔗 CONNECTION NOTIFICATIONS:");
    connectionNotifications.forEach(notif => {
      console.log(`- ${notif.type} from ${notif.sender?.name} (${notif.createdAt}) [${notif.isRead ? 'READ' : 'UNREAD'}]`);
    });

    // Check if there are any unread notifications
    const unreadNotifications = notifications.filter(n => !n.isRead);
    console.log(`\n📊 SUMMARY:`);
    console.log(`- Total notifications: ${notifications.length}`);
    console.log(`- Unread notifications: ${unreadNotifications.length}`);
    console.log(`- Message notifications: ${messageNotifications.length}`);
    console.log(`- Connection notifications: ${connectionNotifications.length}`);

    if (messageNotifications.length === 0 && recentMessages.length > 0) {
      console.log("❌ ISSUE: Messages exist but no message notifications created!");
      console.log("💡 This means the notification creation in messageController.js is not working");
    }

    if (messageNotifications.length > 0 && unreadNotifications.length === 0) {
      console.log("⚠️ All notifications are read - they may have been marked as read already");
    }

  } catch (error) {
    console.error("❌ Debug error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

debugMessageNotifications();