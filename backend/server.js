// --- 1. DEPENDENCY IMPORTS ---
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const connectDB = require('./config/db');
const { createServer } = require('http');
const { Server } = require('socket.io');

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
const authRoutes = require('./routes/authRoutes');
const emailRoutes = require('./routes/emailRoutes');

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
app.use('/api/auth', authRoutes);

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

      // Save the message to database
      const message = await Message.create({
        conversationId,
        sender: senderId,
        type,
        content,
      });

      // Update conversation timestamp
      conversation.updatedAt = new Date();
      await conversation.save();

      // Populate sender details for the response
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name avatarUrl');

      // Emit to all users in the conversation (including sender)
      io.to(conversationId).emit('receive_message', populatedMessage);

      console.log(`Message saved and sent in conversation ${conversationId} by user ${senderId}`);

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

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// --- 9. START SERVER ---
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));