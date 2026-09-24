// =============================================================================
// ROUTE: ACTIVITIES (/api/activities)
// Log Aktivitas Audit Trail Kasir & Admin
// Cabang: Pecel Lele Cabe Ijo - Kantin SMB
// =============================================================================
const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');

const DEFAULT_SHEET = process.env.DEFAULT_SHEET || 'PLCI Kantin SMB';

// 1. GET ALL ACTIVITY LOGS
router.get('/', async (req, res) => {
  try {
    const { sheet, limit } = req.query;
    const filter = { sheet: sheet || DEFAULT_SHEET, isDeleted: false };
    const max = parseInt(limit) || 200;
    const data = await ActivityLog.find(filter).sort({ createdAt: -1 }).limit(max);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 2. CREATE MANUAL ACTIVITY LOG
router.post('/', async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.sheet) data.sheet = DEFAULT_SHEET;
    const newLog = new ActivityLog(data);
    await newLog.save();
    res.status(201).json({ status: 'success', data: newLog });
  } catch (error) {
    console.error('Error creating activity log:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 3. BULK DELETE (SOFT OR HARD)
router.delete('/bulk', async (req, res) => {
  try {
    const { ids, isHardDelete } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Tidak ada data log dipilih' });
    }

    if (isHardDelete) {
      await ActivityLog.deleteMany({ _id: { $in: ids } });
      res.status(200).json({ status: 'success', message: `${ids.length} log berhasil dihapus permanen` });
    } else {
      await ActivityLog.updateMany({ _id: { $in: ids } }, { $set: { isDeleted: true, deletedAt: new Date() } });
      res.status(200).json({ status: 'success', message: `${ids.length} log berhasil dipindahkan ke sampah` });
    }
  } catch (error) {
    console.error('Error bulk deleting logs:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 4. HARD DELETE (PERMANENT) SATUAN
router.delete('/hard/:id', async (req, res) => {
  try {
    const deleted = await ActivityLog.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ status: 'error', message: 'Log tidak ditemukan' });
    res.status(200).json({ status: 'success', message: 'Log dihapus permanen' });
  } catch (error) {
    console.error('Error hard deleting log:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 5. SOFT DELETE (SATUAN)
router.delete('/:id', async (req, res) => {
  try {
    const updated = await ActivityLog.findByIdAndUpdate(
      req.params.id, 
      { isDeleted: true, deletedAt: new Date() }, 
      { new: true }
    );
    if (!updated) return res.status(404).json({ status: 'error', message: 'Log tidak ditemukan' });
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    console.error('Error soft deleting log:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
