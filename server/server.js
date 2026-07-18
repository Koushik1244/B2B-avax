require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://smart-invoicing-assistant.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Smart Invoicing API running' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/reminders', require('./routes/reminderRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/voice',          require('./routes/voiceRoutes'));
app.use('/api/insights',       require('./routes/insightsRoutes'));
app.use('/api/notifications',  require('./routes/notificationRoutes'));
app.use('/api/payments',       require('./routes/paymentRoutes'));
app.use('/api/raw-materials',  require('./routes/rawMaterialRoutes'));
app.use('/api/inventory',      require('./routes/inventoryRoutes'));
app.use('/api/suppliers',      require('./routes/supplierRoutes'));
app.use('/api/ocr',            require('./routes/ocrRoutes'));
app.use('/api/automation',     require('./routes/automationRoutes'));

// ─── Scheduled automation (every 60 seconds) ─────────────────────────────────
const { autoRunAllUsers } = require('./services/automationEngine');
//autoRunAllUsers(); // run once immediately on startup
//setInterval(autoRunAllUsers, 60 * 1000);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
