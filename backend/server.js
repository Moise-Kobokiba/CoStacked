// backend/server.js

// --- 1. DEPENDENCY IMPORTS ---
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
// --- THIS IS THE FIX ---
// Import passport, but NOT the configuration file that causes the crash.
const passport = require('passport'); 
const passportConfig = require('./config/passport');
const connectDB = require('./config/db');

// Only load environment variables from the .env file if we are in development mode.
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// --- UPDATED DEBUGGING LOGS ---
console.log("--- Environment Variable Check ---");
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`MONGO_URI Loaded: ${!!process.env.MONGO_URI}`);
console.log(`AHA_API_KEY Loaded: ${!!process.env.AHA_API_KEY}`);
console.log(`AHA_FROM_EMAIL: ${process.env.AHA_FROM_EMAIL}`);
console.log("---------------------------------");


// --- 2. ROUTE IMPORTS ---
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

// --- 3. INITIAL CONFIGURATION ---
connectDB();


// --- 4. EXPRESS APP INITIALIZATION ---
const app = express();


// --- 5. CORE MIDDLEWARE ---
// Production-ready CORS configuration
const allowedOrigins = [
    'http://localhost:5173', // Local user-frontend
    'http://localhost:3000', // Local admin-dashboard
    // --- Production Domains ---
    'https://costacked.co.za',
    'https://www.costacked.co.za',
    'https://admin.costacked.co.za',
    'https://www.admin.costacked.co.za',
    // --- Render URLs (keep for backup) ---
    process.env.FRONTEND_URL, // e.g., 'https://co-stacked-userfrontend.onrender.com'
    process.env.ADMIN_URL     // e.g., 'https://co-stacked-admin.onrender.com'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        // If the origin is in our allowed list, allow it
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // Also check if origin matches any regex patterns
        for (let pattern of allowedOrigins) {
            if (pattern instanceof RegExp && pattern.test(origin)) {
                return callback(null, true);
            }
        }
        
        // Otherwise, block it
        callback(new Error(`The CORS policy for this site does not allow access from ${origin}`));
    },
    credentials: true
}));

app.use(express.json());

// --- THIS IS THE FIX ---
// The following lines are commented out to prevent the server from crashing due to
// the missing GitHub OAuth credentials. When you are ready to implement "Login with GitHub",
// you can uncomment these lines and provide the necessary environment variables.

// Session middleware (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
// --- END FIX ---


// --- 6. API ROUTE MOUNTING ---
app.get('/', (req, res) => {
  res.send('API is running successfully...');
});

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
app.use('/api/auth', authRoutes); // OAuth routes


// --- 7. SERVER STARTUP ---
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));