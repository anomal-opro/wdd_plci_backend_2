// =============================================================================
// MODEL: DAILY STOCK (DATA STOK HARIAN & AUDIT HISTORI STOK KASIR)
// Cabang: Pecel Lele Cabe Ijo - Kantin SMB
// =============================================================================
const mongoose = require('mongoose');

const stockAdjustmentSchema = new mongoose.Schema({
  delta: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['penambahan', 'pengurangan'],
    required: true
  },
  time: {
    type: String,
    required: true // Format: "14:20" atau "14:20:15"
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  currentStockAfter: {
    type: Number,
    default: 0
  },
  note: {
    type: String,
    default: ''
  }
}, { _id: false });

const dailyStockSchema = new mongoose.Schema({
  sheet: {
    type: String,
    required: true,
    default: 'PLCI Kantin SMB',
    index: true
  },
  tanggal: {
    type: String,
    required: true, // Format: YYYY-MM-DD
    index: true
  },
  menuId: {
    type: String,
    required: true,
    index: true
  },
  menuName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'Satuan'
  },
  stokAwal: {
    type: Number,
    default: 0
  },
  stokAwalTime: {
    type: String,
    default: ''
  },
  isConfirmed: {
    type: Boolean,
    default: false
  },
  history: [stockAdjustmentSchema],
  totalStokInput: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound unique index per cabang, tanggal, dan menu item
dailyStockSchema.index({ sheet: 1, tanggal: 1, menuId: 1 }, { unique: true });

module.exports = mongoose.models.DailyStock || mongoose.model('DailyStock', dailyStockSchema);
