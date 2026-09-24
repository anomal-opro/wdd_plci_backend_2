// =============================================================================
// MODEL: EMERGENCY (LAPORAN DARURAT KASIR & ALARM ADMIN)
// =============================================================================
const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  sheet: { 
    type: String, 
    required: true, 
    default: 'PLCI Kantin SMB' 
  },
  message: { 
    type: String, 
    default: "Sistem Error / Butuh Bantuan Kasir" 
  },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'SOLVED'], 
    default: 'ACTIVE',
    index: true 
  },
  timestamp: { 
    type: String, 
    required: true 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.models.Emergency || mongoose.model('Emergency', emergencySchema);
