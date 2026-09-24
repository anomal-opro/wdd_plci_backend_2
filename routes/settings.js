// =============================================================================
// ROUTE: SETTINGS (/api/settings)
// Konfigurasi Fitur & Preferensi Sistem Admin & Kasir POS
// Cabang: Pecel Lele Cabe Ijo - Kantin SMB
// =============================================================================
const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');

// Default initial settings
const DEFAULT_SETTINGS = [
  { 
    settingKey: 'pin_table_column', 
    name: 'Bekukan Kolom Tabel (Pin Header)', 
    description: 'Membekukan kolom Aksi dan Total di laporan agar tidak ikut tergeser saat di-scroll menyamping (Cocok untuk Layar Tablet/HP).', 
    isActive: true 
  },
  { 
    settingKey: 'multi_delete', 
    name: 'Fitur Hapus Masal (Multi-Delete)', 
    description: 'Mengaktifkan kotak centang (checkbox) pada tabel laporan admin untuk menghapus banyak data sekaligus (Sementara / Permanen).', 
    isActive: true 
  },
  { 
    settingKey: 'auto_sync_stock', 
    name: 'Auto-Sync Stok Kasir', 
    description: 'Menyinkronkan stok otomatis saat transaksi checkout di kasir.', 
    isActive: true 
  }
];

// 1. GET ALL SETTINGS (AUTO-INITIALIZES IF EMPTY)
router.get('/', async (req, res) => {
  try {
    let settings = await Setting.find();
    if (settings.length === 0) {
      settings = await Setting.insertMany(DEFAULT_SETTINGS);
    }
    res.status(200).json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 2. UPDATE SETTING
router.put('/:id', async (req, res) => {
  try {
    const updated = await Setting.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Pengaturan tidak ditemukan' });
    }
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
