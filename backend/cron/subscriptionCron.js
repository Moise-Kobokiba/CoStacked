const cron = require('node-cron');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const AdminNotification = require('../models/AdminNotification');

const startSubscriptionCron = () => {
  // Run every day at midnight: 0 0 * * *
  cron.schedule('0 0 * * *', async () => {
    console.log('Running Subscription Renewal Cron Job...');
    
    try {
      const now = new Date();
      
      // Find users whose subscription has expired or is about to expire (today)
      // and who are currently verified.
      // We look for subscriptionExpiresAt <= now.
      const users = await User.find({
        isVerified: true,
        subscriptionExpiresAt: { $lte: now }
      });

      console.log(`Found ${users.length} users for subscription check.`);

      for (const user of users) {
        if (user.isSubscriptionAutoRenew) {
          // --- AUTO-RENEW ---
          try {
            // 1. Extend subscription by 30 days
            const newExpiry = new Date(now);
            newExpiry.setDate(newExpiry.getDate() + 30);
            
            user.subscriptionExpiresAt = newExpiry;
            await user.save();

            // 2. Create Transaction (Simulated Charge)
            await Transaction.create({
              userId: user._id,
              type: 'subscription',
              amountInCents: 20000, 
              status: 'succeeded',
              metadata: { mechanism: 'auto-renewal' }
            });

            // 3. Notify User
            await Notification.create({
              recipient: user._id,
              type: 'SUBSCRIPTION_RENEWED', // make sure frontend handles this or fallback
              message: 'Your verification subscription has been auto-renewed for another month.'
            });

            console.log(`Renewed subscription for user ${user._id}`);

          } catch (err) {
            console.error(`Failed to auto-renew user ${user._id}:`, err);
          }
        } else {
          // --- EXPIRE SUBSCRIPTION ---
          try {
            user.isVerified = false;
            // user.subscriptionExpiresAt remains as the past date
            await user.save();

            // Notify User
            await Notification.create({
              recipient: user._id,
              type: 'SUBSCRIPTION_EXPIRED',
              message: 'Your verification subscription has expired.'
            });

            // Notify Admin
            await AdminNotification.create({
                type: 'SUBSCRIPTION_EXPIRED',
                message: `User ${user.name}'s subscription expired.`,
                link: '/admin/users',
                refId: user._id
            });
            
            console.log(`Expired subscription for user ${user._id}`);

          } catch (err) {
            console.error(`Failed to expire user ${user._id}:`, err);
          }
        }
      }

    } catch (error) {
      console.error('Error in Subscription Cron Job:', error);
    }
  });
};

module.exports = startSubscriptionCron;
