// =============================================================================
// MODEL: MENU MASTER (NAMA MENU, HARGA, STOK HARIAN KASIR POS)
// =============================================================================
const mongoose = require('mongoose');

const menuMasterSchema = new mongoose.Schema({
  sheet: { 
    type: String, 
    required: true, 
    default: 'PLCI Kantin SMB',
    index: true 
  },
  menuId: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  stock: { 
    type: Number, 
    default: 0 
  },
  lastUpdatedDate: { 
    type: String, 
    required: true // Format: YYYY-MM-DD
  },
  lastRestockTime: { 
    type: String, 
    default: "" // WIB Jam:Menit:Detik
  }
}, { 
  timestamps: true 
});

menuMasterSchema.index({ sheet: 1, menuId: 1 });

module.exports = mongoose.models.MenuMaster || mongoose.model('MenuMaster', menuMasterSchema);
