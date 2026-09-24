// =============================================================================
// MODEL: EXPENSE (SISTEM PENCATATAN PENGELUARAN 3 KATEGORI)
// Kategori: Bahan Baku | Biaya Variabel | Biaya Tetap
// =============================================================================
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  sheet: { 
    type: String, 
    required: true, 
    default: 'PLCI Kantin SMB',
    index: true 
  },
  tanggal: { 
    type: String, 
    required: true, 
    index: true // Format: YYYY-MM-DD
  },
  kategori: { 
    type: String, 
    required: true, 
    enum: ['bahan_baku', 'variabel', 'tetap'],
    index: true 
  },
  kategoriLabel: { 
    type: String, 
    default: 'Biaya Variabel' 
  },
  nama_item: { 
    type: String, 
    required: true 
  },
  nominal: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  karyawan: { 
    type: String, 
    default: 'Staff Karyawan' 
  },
  attachment: { 
    type: String, 
    default: null // Base64 data URL / image URL bukti struk
  },
  keterangan: { 
    type: String, 
    default: "" 
  },
  // Khusus Bahan Baku & Variabel (Kuantitas & Satuan)
  kuantitas: { 
    type: Number, 
    default: null 
  },
  satuan: { 
    type: String, 
    default: null 
  },
  harga_satuan: { 
    type: Number, 
    default: null 
  },
  supplier: { 
    type: String, 
    default: null 
  },
  // Khusus Biaya Tetap / Rutin
  frekuensi: { 
    type: String, 
    default: null // e.g. 'Per Bulan', 'Tiap 15 Hari', 'Tiap 2 Bulan'
  },
  durasi: { 
    type: String, 
    default: null // e.g. 'Berkelanjutan', '6 Bulan Lagi'
  },
  endDate: { 
    type: String, 
    default: null // YYYY-MM-DD
  },
  status: { 
    type: String, 
    enum: ['aktif', 'selesai', 'ditangguhkan'], 
    default: 'aktif' 
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

expenseSchema.index({ sheet: 1, kategori: 1, tanggal: 1, isDeleted: 1 });

module.exports = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
