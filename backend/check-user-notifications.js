// Check notifications for specific users
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
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

async function checkUserNotifications() {
  console.log("🔍 CHECKING USER NOTIFICATIONS");
  console.log("================================");

  await connectDB();

  try {
    // Find the specific users
    const user1 = await User.findOne({ name: /Molatelo/i });
    const user2 = await User.findOne({ name: /Kane/i });

    console.log("Users found:");
    console.log("- Molatelo:", user1 ? user1._id + " (" + user1.name + ")" : "NOT FOUND");
    console.log("- Kane:", user2 ? user2._id + " (" + user2.name + ")" : "NOT FOUND");

    // If Kane not found, show all available users
    if (!user2) {
      console.log("\n🔍 User 'Kane Keed' not found. Available users:");
      const allUsers = await User.find({}).select('name _id').limit(15);
      allUsers.forEach(user => {
        console.log(`- ${user.name} (${user._id})`);
      });
      console.log("\n💡 Please check the exact username and try again");
      return;
    }

    if (!user1) {
      console.log("❌ Molatelo user not found");
      return;
    }

    // Check notifications for each user
    console.log("\n📋 Kane's notifications:");
    const kaneNotifications = await Notification.find({
      recipient: user2._id
    }).populate('sender', 'name').sort({ createdAt: -1 }).limit(5);

    if (kaneNotifications.length === 0) {
      console.log("❌ No notifications found for Kane");
    } else {
      kaneNotifications.forEach(notif => {
        console.log(`- ${notif.type}: ${notif.sender?.name || 'Unknown'} (${notif.createdAt}) [${notif.isRead ? 'READ' : 'UNREAD'}]`);
      });
    }

    console.log("\n📋 Molatelo's notifications (sent):");
    const molateloNotifications = await Notification.find({
      sender: user1._id
    }).populate('recipient', 'name').sort({ createdAt: -1 }).limit(5);

    if (molateloNotifications.length === 0) {
      console.log("❌ No notifications sent by Molatelo");
    } else {
      molateloNotifications.forEach(notif => {
        console.log(`- ${notif.type} to ${notif.recipient?.name || 'Unknown'} (${notif.createdAt})`);
      });
    }

    // Check recent messages between these users
    console.log("\n💬 Recent messages between users:");
    const Message = require('./models/Message');
    const Conversation = require('./models/Conversation');

    const conversations = await Conversation.find({
      participants: { $all: [user1._id, user2._id] }
    });

    if (conversations.length === 0) {
      console.log("❌ No conversation found between these users");
    } else {
      for (const conv of conversations) {
        console.log(`Conversation: ${conv._id}`);
        const messages = await Message.find({ conversationId: conv._id })
          .populate('sender', 'name')
          .sort({ createdAt: -1 })
          .limit(3);

        messages.forEach(msg => {
          console.log(`  - ${msg.sender.name}: "${msg.content}" (${msg.createdAt}) [${msg.status}]`);
        });
      }
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkUserNotifications();