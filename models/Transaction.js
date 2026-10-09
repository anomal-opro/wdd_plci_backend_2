// =============================================================================
// MODEL: TRANSACTION (PENJUALAN & PENDAPATAN KASIR POS HARIAN)
// Cabang: Pecel Lele Cabe Ijo - Kantin SMB
// Metode Pembayaran: CASH | BCA | QRIS (hanya ini yang aktif)
// =============================================================================
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  sheet: { 
    type: String, 
    required: true, 
    default: 'PLCI Kantin SMB',
    index: true 
  },
  // Tanggal akuntansi transaksi (format: YYYY-MM-DD)
  tanggal: { 
    type: String, 
    required: true, 
    index: true 
  },

  // =========================================================
  // METODE PEMBAYARAN (HANYA 3: Cash, BCA, QRIS)
  // GoPay / GoFood sudah tidak digunakan
  // =========================================================
  cash: { 
    type: Number, 
    default: 0 
  },
  bca: { 
    type: Number, 
    default: 0 
  },
  qris: { 
    type: Number, 
    default: 0 
  },

  // Total pendapatan (income) dari transaksi ini
  totalPendapatan: { 
    type: Number, 
    default: 0 
  },

  // =========================================================
  // FIELD LEGACY / OPERASIONAL
  // =========================================================
  // Rincian item yang dipesan (string lama / legacy POS)
  jenisPengeluaran: { 
    type: String, 
    default: "" 
  },
  // Pengeluaran operasional dari recurring (bukan income)
  totalPengeluaran: { 
    type: Number, 
    default: 0 
  },

  // =========================================================
  // METADATA & AUDIT
  // =========================================================
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
  },
  // Idempotency key dari kasir POS offline
  localId: {
    type: String,
    index: true,
    sparse: true
  },
  // Rincian item terstruktur dari kasir baru (menggantikan jenisPengeluaran string)
  items: [{
    menuId: { type: String },
    name: { type: String },
    qty: { type: Number, default: 1 },
    price: { type: Number, default: 0 }
  }],
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true 
  }
}, { 
  timestamps: { createdAt: false, updatedAt: true } 
});

// Compound index untuk query cepat per cabang + tanggal + status delete
transactionSchema.index({ sheet: 1, tanggal: 1, isDeleted: 1 });
// Index untuk query data hari ini tanpa memuat seluruh histori
transactionSchema.index({ sheet: 1, isDeleted: 1, createdAt: -1 });

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

