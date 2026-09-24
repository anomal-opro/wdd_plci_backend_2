// =============================================================================
// MODEL: SETTING (PENGATURAN FITUR SISTEM ADMIN & KASIR)
// =============================================================================
const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  settingKey: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: false 
  },
  description: { 
    type: String, 
    default: "" 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.models.Setting || mongoose.model('Setting', settingSchema);
