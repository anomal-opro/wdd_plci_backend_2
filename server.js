// =============================================================================
// TERBARU BACKEND - ALL-IN-ONE CONSOLIDATED BACKEND SERVER
// Pecel Lele Cabe Ijo - Kantin SMB (Admin & POS)
// =============================================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import Modular Routes
const transactionsRouter = require('./routes/transactions');
const expensesRouter = require('./routes/expenses');
const recurringRouter = require('./routes/recurring');
const emergencyRouter = require('./routes/emergency');
const menuRouter = require('./routes/menu');
const activitiesRouter = require('./routes/activities');
const settingsRouter = require('./routes/settings');

const app = express();

// Global Middlewares
app.use(cors());
// Set JSON limit to 25MB to easily accommodate receipt image/SVG attachments
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Database Connection Middleware
app.use(async (req, res, next) => {
  try {
    if (process.env.MONGO_URI) {
      await connectDB();
    }
    next();
  } catch (err) {
    console.error('❌ Database Connection Middleware Error:', err.message);
    res.status(500).json({ 
      status: 'error', 
      message: 'Koneksi ke Database MongoDB gagal. Pastikan MONGO_URI terkonfigurasi dengan benar.' 
    });
  }
});

// Health Check & Root Endpoints
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'TerbaruBackend — Pecel Lele Cabe Ijo Kantin SMB',
    branch: process.env.DEFAULT_SHEET || 'PLCI Kantin SMB',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount API Modules
app.use('/api/transactions', transactionsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/recurring', recurringRouter);
app.use('/api/emergency', emergencyRouter);
app.use('/api/menu', menuRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/settings', settingsRouter);

// 404 Handler for Undefined Routes
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Endpoint '${req.method} ${req.originalUrl}' tidak ditemukan pada server TerbaruBackend.`
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('💥 Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Terjadi kesalahan internal pada server backend'
  });
});

// Start Server for Local Development / Container (only when executed directly)
const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 TerbaruBackend aktif di http://localhost:${PORT}`);
    console.log(`📍 Cabang: ${process.env.DEFAULT_SHEET || 'PLCI Kantin SMB'}`);
    console.log(`📦 Status: Production-Ready & Clean Architecture`);
    console.log(`====================================================`);
  });
}

// Export for Vercel Serverless Function Handler
module.exports = app;
