// --- 1. DEPENDENCY IMPORTS ---
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const connectDB = require('./config/db');

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

// --- 7. START SERVER ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));