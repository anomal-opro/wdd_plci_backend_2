// =============================================================================
// ROUTE: DAILY STOCKS (/api/daily-stocks)
// Data Stok Harian & Riwayat Penyesuaian (+ / -) untuk Audit Admin
// Cabang: Pecel Lele Cabe Ijo - Kantin SMB
// =============================================================================
const express = require('express');
const router = express.Router();
const DailyStock = require('../models/DailyStock');

const DEFAULT_SHEET = process.env.DEFAULT_SHEET || 'PLCI Kantin SMB';

// 1. GET DAILY STOCKS BY SHEET & TANGGAL
router.get('/', async (req, res) => {
  try {
    const { sheet, tanggal } = req.query;
    const targetSheet = sheet || DEFAULT_SHEET;

    const filter = { sheet: targetSheet };
    if (tanggal) {
      // Support flexible matching (e.g. "26 September 2026" matches "Sabtu, 26 September 2026" or "2026-09-26")
      const cleanDate = tanggal.replace(/^[^,]+,\s*/, '').trim(); // Remove "Sabtu, " if present
      filter.$or = [
        { tanggal: tanggal },
        { tanggal: { $regex: cleanDate.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), $options: 'i' } }
      ];
    }

    const data = await DailyStock.find(filter).sort({ category: 1, menuName: 1 });
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    console.error('Error fetching daily stocks:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 2. CREATE / UPSERT DAILY STOCKS (BULK OR SINGLE)
router.post('/', async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];

    for (const item of items) {
      const sheet = item.sheet || DEFAULT_SHEET;
      const tanggal = item.tanggal;
      const menuId = item.menuId;

      if (!tanggal || !menuId) {
        continue;
      }

      // Upsert: replace/update data dengan histori lengkap dari tablet
      const updateData = {
        sheet,
        tanggal,
        menuId,
        menuName: item.menuName || menuId,
        category: item.category || 'Satuan',
        stokAwal: Number(item.stokAwal) || 0,
        stokAwalTime: item.stokAwalTime || '',
        isConfirmed: item.isConfirmed !== undefined ? Boolean(item.isConfirmed) : true,
        history: Array.isArray(item.history) ? item.history : [],
        totalStokInput: Number(item.totalStokInput) || Number(item.stokAwal) || 0
      };

      const doc = await DailyStock.findOneAndUpdate(
        { sheet, tanggal, menuId },
        { $set: updateData },
        { new: true, upsert: true }
      );
      results.push(doc);
    }

    res.status(200).json({ status: 'success', data: results, count: results.length });
  } catch (error) {
    console.error('Error saving daily stocks:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
