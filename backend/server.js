// --- 1. DEPENDENCY IMPORTS ---
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const connectDB = require('./config/db');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const validationTipRoutes = require('./routes/validationTipRoutes');
const startSubscriptionCron = require('./cron/subscriptionCron');

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
require('./models/StackPost');
require('./models/Showcase');
require('./models/CollabThread');
require('./models/StackComment');
require('./models/SavedItem');

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
  'https://co-stacked-frontend.onrender.com',
  'https://co-stacked-admin.onrender.com',
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
const statsRoutes = require('./routes/stats');
const savedItemRoutes = require('./routes/savedItemRoutes');
const stackSuiteRoutes = require('./routes/stackSuiteRoutes');

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
app.use('/api/conversations', conversationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/validation-tips', validationTipRoutes);
app.use('/api/saved-items', savedItemRoutes);
app.use('/api/stack-suite', stackSuiteRoutes);

// --- Rate limiters for high-traffic / abuse-prone endpoints ---
const voteLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: 'Too many votes, slow down.' });
const commentLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: 'Too many comments, slow down.' });
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: 'Too many authentication attempts, slow down.' });

// Apply limiters to specific route patterns
app.use('/api/ideas/:id/vote', voteLimiter);
app.use('/api/ideas/:id/comments', commentLimiter);
app.use('/api/auth', authLimiter);

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

// Expose io instance to controllers via utils/socket
const socketUtil = require('./utils/socket');
socketUtil.init(io);

// --- 8. SOCKET.IO CONNECTION HANDLING ---
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  // --- Authenticate socket if token provided in handshake ---
  (async () => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return; // no auth provided, keep as anonymous socket

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      if (!decoded || !decoded.id) return;

      const userId = decoded.id;
      socket.userId = userId;
      socket.join(userId);

      const User = require('./models/User');
      await User.findByIdAndUpdate(userId, { isOnline: true, lastActiveAt: new Date() });

      // Broadcast presence change to clients subscribed to presence
      io.to('presence').emit('user_status_changed', { userId, isOnline: true, lastActiveAt: new Date() });
      console.log(`Authenticated socket for user ${userId} (Socket: ${socket.id})`);
    } catch (err) {
      console.log('Socket auth failed or no token provided for', socket.id);
    }
  })();

  // Join conversation room
  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation ${conversationId}`);
  });

  // Generic join/leave handlers for client-side requested rooms
  socket.on('joinRoom', (room) => {
    try {
      if (!room) return;

      // Prevent joining arbitrary user rooms — only allow joining your own user room
      const isObjectIdLike = (s) => typeof s === 'string' && /^[0-9a-fA-F]{24}$/.test(s);
      if (isObjectIdLike(room)) {
        if (!socket.userId || socket.userId.toString() !== room.toString()) {
          console.log(`Socket ${socket.id} attempted to join user room ${room} but is not authorized`);
          return;
        }
      }

      // Allow client rooms for stacksuite feed and content (no special auth required)
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    } catch (e) { console.error('joinRoom error:', e); }
  });

  socket.on('leaveRoom', (room) => {
    try {
      if (!room) return;
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);
    } catch (e) { console.error('leaveRoom error:', e); }
  });

  // Leave conversation room
  socket.on('leaveConversation', (conversationId) => {
    socket.leave(conversationId);
    console.log(`User ${socket.id} left conversation ${conversationId}`);
  });

  // Handle sending messages
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, content, type = 'text' } = data;

      // Require authenticated socket user
      const senderId = socket.userId;
      if (!senderId) {
        socket.emit('messageError', { error: 'Authentication required to send messages' });
        return;
      }

      if (!conversationId || !content) {
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
        status: 'delivered',
      });

      // Update conversation timestamp
      conversation.updatedAt = new Date();
      await conversation.save();

      // Create notifications for other participants (same as HTTP API)
      const Notification = require('./models/Notification');
      const recipients = conversation.participants.filter(p => p.toString() !== senderId.toString());

      for (const recipientId of recipients) {
        const notif = await Notification.create({
          recipient: recipientId,
          sender: senderId,
          type: 'NEW_MESSAGE',
          conversationId: conversation._id,
          projectId: conversation.projectId
        });
        try {
          if (io) io.to(recipientId.toString()).emit('notification_created', notif);
        } catch (e) { console.error('Socket emit error (message notification):', e); }
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

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.userId) {
      try {
        const User = require('./models/User');
        const lastActiveAt = new Date();
        
        await User.findByIdAndUpdate(socket.userId, { 
          isOnline: false,
          lastActiveAt
        });
        
        // Broadcast to clients subscribed to presence that this user is now offline
        io.to('presence').emit('user_status_changed', {
          userId: socket.userId,
          isOnline: false,
          lastActiveAt
        });
        
        console.log(`User ${socket.userId} is now offline`);
      } catch (error) {
        console.error('Error in socket disconnect:', error);
      }
    }
  });
});

// --- 9. START SERVER ---
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));