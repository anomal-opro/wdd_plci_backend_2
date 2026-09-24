// =============================================================================
// MODEL: RECURRING (BIAYA TETAP / OPERASIONAL RUTIN OTOMATIS)
// =============================================================================
const mongoose = require('mongoose');

const recurringSchema = new mongoose.Schema({
  sheet: { 
    type: String, 
    required: true, 
    default: 'PLCI Kantin SMB',
    index: true 
  },
  nama: { 
    type: String, 
    required: true 
  },
  nominal: { 
    type: Number, 
    required: true 
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    default: null 
  },
  frekuensi: { 
    type: String, 
    enum: ['bulanan', 'tahunan', 'harian', 'Per Bulan', 'Tiap 15 Hari', 'Tiap 2 Bulan'], 
    default: 'bulanan' 
  },
  intervalHari: { 
    type: Number, 
    default: 0 
  },
  lastApplied: { 
    type: Date, 
    default: null 
  },
  isActive: { 
    type: Boolean, 
    default: true,
    index: true 
  },
  keterangan: { 
    type: String, 
    default: "" 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.models.Recurring || mongoose.model('Recurring', recurringSchema);
