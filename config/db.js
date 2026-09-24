// =============================================================================
// DATABASE CONNECTION CONFIGURATION (MONGODB VIA MONGOOSE)
// Optimized for both persistent Node.js servers and Serverless (Vercel)
// =============================================================================
const mongoose = require('mongoose');

let cachedDb = null;

async function connectDB() {
  // If already connected, reuse existing connection
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.warn('⚠️  MONGO_URI is not defined in environment variables! Database operations will fail unless set.');
    return null;
  }

  try {
    cachedDb = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    });
    console.log('✅ Berhasil terhubung ke MongoDB (Database PLCI Kantin SMB)!');
    return cachedDb;
  } catch (err) {
    console.error('❌ Gagal menyambungkan ke MongoDB:', err.message);
    throw err;
  }
}

module.exports = connectDB;
