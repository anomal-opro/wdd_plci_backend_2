// =============================================================================
// MODEL: TRANSACTION (PENJUALAN & TRANSAKSI KASIR / OPERASIONAL)
// =============================================================================
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  sheet: { 
    type: String, 
    required: true, 
    default: 'PLCI Kantin SMB',
    index: true 
  },
  tanggal: { 
    type: String, 
    required: true, 
    index: true 
  },
  cash: { 
    type: Number, 
    default: 0 
  },
  bca: { 
    type: Number, 
    default: 0 
  },
  gofood: { 
    type: Number, 
    default: 0 
  },
  qris: { 
    type: Number, 
    default: 0 
  },
  jenisPengeluaran: { 
    type: String, 
    default: "" 
  },
  totalPengeluaran: { 
    type: Number, 
    default: 0 
  },
  totalPendapatan: { 
    type: Number, 
    default: 0 
  },
  isDeleted: { 
    type: Boolean, 
    default: false,
    index: true 
  },
  deletedAt: { 
    type: Date, 
    default: null 
  },
  printCount: { 
    type: Number, 
    default: 0 
  }
}, { 
  timestamps: true 
});

transactionSchema.index({ sheet: 1, tanggal: 1, isDeleted: 1 });

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
