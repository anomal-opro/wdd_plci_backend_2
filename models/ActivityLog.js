// =============================================================================
// MODEL: ACTIVITY LOG (AUDIT TRAIL OPERASIONAL MENU, HARGA, & STOK)
// =============================================================================
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  sheet: { 
    type: String, 
    required: true, 
    default: 'PLCI Kantin SMB',
    index: true 
  },
  actionCategory: { 
    type: String, 
    required: true, 
    enum: ['UBAH_NAMA', 'UBAH_HARGA', 'UBAH_STOK', 'INFO_STOK', 'SISTEM'] 
  },
  menuName: { 
    type: String, 
    required: true 
  },
  detailAction: { 
    type: String, 
    required: true 
  },
  timestamp: { 
    type: String, 
    required: true 
  },
  dateString: { 
    type: String, 
    required: true 
  },
  isDeleted: { 
    type: Boolean, 
    default: false,
    index: true 
  },
  deletedAt: { 
    type: Date, 
    default: null 
  }
}, { 
  timestamps: true 
});

activityLogSchema.index({ sheet: 1, isDeleted: 1, createdAt: -1 });

module.exports = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);
