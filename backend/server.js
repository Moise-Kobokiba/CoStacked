// --- 1. DEPENDENCY IMPORTS ---
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const connectDB = require('./config/db');
const { createServer } = require('http');
const { Server } = require('socket.io');
const validationTipRoutes = require('./routes/validationTipRoutes');

app.use('/api/validation-tips', validationTipRoutes);
const startSubscriptionCron = require('./cron/subscriptionCron'); // Import Cron

// --- 1.5. MODEL IMPORTS (Ensure models are registered) ---
require('./models/User');
require('./models/Project');
require('./models/Interest');
require('./models/Message');
require('./models/Conversation');
require('./models/Notification');
require('./models/AdminNotification');
require('./models/Report');
require('./models/Review');
require('./models/Transaction');
require('./models/TempRegistration');
require('./models/Article');
require('./models/Idea');

// Start the subscription renewal cron job
startSubscriptionCron();

// Load env variables
if (process.env.NODE_ENV !== 'production') dotenv.config();

// --- 2. CONNECT DATABASE ---
connectDB();

// --- 3. EXPRESS APP ---
const app = express();

// --- 4. CORE MIDDLEWARE ---
app.use(express.json());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://costacked.co.za',
  'https://www.costacked.co.za',
  'https://admin.costacked.co.za',
  'https://www.admin.costacked.co.za',
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS not allowed from ${origin}`));
  },
  credentials: true
}));

// Session + Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));
app.use(passport.initialize());
app.use(passport.session());

// --- 5. ROUTES ---
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const interestRoutes = require('./routes/interestRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const conversationRoutes = require('./routes/conversationRoutes'); // <-- IMPORT NEW ROUTE
const authRoutes = require('./routes/authRoutes');
const emailRoutes = require('./routes/emailRoutes');
const articleRoutes = require('./routes/articleRoutes');
const ideaRoutes = require('./routes/ideaRoutes');

// Mount API routes
app.use('/api/email', emailRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/interests', interestRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payments', paymentRoutes); 
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/conversations', conversationRoutes); // <-- MOUNT NEW ROUTE
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/ideas', ideaRoutes);

// --- 6. DEFAULT ROUTE ---
app.get('/', (req, res) => res.send('API is running successfully...'));

// --- 7. CREATE HTTP SERVER & SOCKET.IO ---
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// --- 8. SOCKET.IO CONNECTION HANDLING ---
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join conversation room
  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation ${conversationId}`);
  });

  // Leave conversation room
  socket.on('leaveConversation', (conversationId) => {
    socket.leave(conversationId);
    console.log(`User ${socket.id} left conversation ${conversationId}`);
  });

  // Handle sending messages
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, senderId, content, type = 'text' } = data;

      // Validate required fields
      if (!conversationId || !senderId || !content) {
        socket.emit('messageError', { error: 'Missing required fields' });
        return;
      }

      // Import Message model dynamically to avoid circular dependencies
      const Message = require('./models/Message');
      const Conversation = require('./models/Conversation');

      // Verify the conversation exists and user is authorized
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.includes(senderId)) {
        socket.emit('messageError', { error: 'Not authorized to send messages to this conversation' });
        return;
      }

      // Save the message to database with delivered status
      const message = await Message.create({
        conversationId,
        sender: senderId,
        type,
        content,
        status: 'delivered', // Mark as delivered when successfully saved
      });

      // Update conversation timestamp
      conversation.updatedAt = new Date();
      await conversation.save();

      // Create notifications for other participants (same as HTTP API)
      const Notification = require('./models/Notification');
      const recipients = conversation.participants.filter(p => p.toString() !== senderId.toString());

      for (const recipientId of recipients) {
        await Notification.create({
          recipient: recipientId,
          sender: senderId,
          type: 'NEW_MESSAGE',
          conversationId: conversation._id,
          projectId: conversation.projectId
        });
      }

      // Populate sender details for the response
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name avatarUrl');

      // Emit to all users in the conversation (including sender)
      io.to(conversationId).emit('receive_message', populatedMessage);

      // Emit delivery status update to sender
      socket.emit('message_status_update', {
        messageId: message._id,
        conversationId,
        status: 'delivered'
      });

      console.log(`Message saved, notifications created, and delivered in conversation ${conversationId} by user ${senderId}`);

    } catch (error) {
      console.error('Error sending message via socket:', error);
      socket.emit('messageError', { error: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { conversationId, userId, isTyping } = data;
    socket.to(conversationId).emit('userTyping', { userId, isTyping });
  });

  // Handle marking messages as read
  socket.on('mark_messages_read', async (data) => {
    try {
      const { conversationId, userId } = data;

      if (!conversationId || !userId) {
        socket.emit('messageError', { error: 'Missing required fields' });
        return;
      }

      // Import Message model dynamically
      const Message = require('./models/Message');
      const Conversation = require('./models/Conversation');

      // Verify the conversation exists and user is authorized
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.includes(userId)) {
        socket.emit('messageError', { error: 'Not authorized to access this conversation' });
        return;
      }

      // Find messages in this conversation that are not from the current user and not already read
      const messagesToMarkRead = await Message.find({
        conversationId,
        sender: { $ne: userId }, // Messages not sent by current user
        status: { $ne: 'read' }   // Messages not already read
      });

      if (messagesToMarkRead.length > 0) {
        // Update all these messages to 'read' status
        await Message.updateMany(
          {
            conversationId,
            sender: { $ne: userId },
            status: { $ne: 'read' }
          },
          { status: 'read' }
        );

        // Get the updated messages
        const updatedMessages = await Message.find({
          conversationId,
          sender: { $ne: userId }
        }).select('_id status');

        // Notify all participants in the conversation about the read status update
        io.to(conversationId).emit('messages_read', {
          conversationId,
          readerId: userId,
          updatedMessages: updatedMessages.map(msg => ({ messageId: msg._id, status: msg.status }))
        });

        console.log(`Marked ${messagesToMarkRead.length} messages as read in conversation ${conversationId} by user ${userId}`);
      }

    } catch (error) {
      console.error('Error marking messages as read:', error);
      socket.emit('messageError', { error: 'Failed to mark messages as read' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// --- 9. START SERVER ---
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));