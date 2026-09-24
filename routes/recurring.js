// =============================================================================
// ROUTE: RECURRING (/api/recurring)
// Biaya Tetap Operasional Rutin & Auto-Trigger Generator
// Cabang: Pecel Lele Cabe Ijo - Kantin SMB
// =============================================================================
const express = require('express');
const router = express.Router();
const Recurring = require('../models/Recurring');
const Transaction = require('../models/Transaction');
const Expense = require('../models/Expense');
const { getIndoDateString } = require('../utils/timeHelper');

const DEFAULT_SHEET = process.env.DEFAULT_SHEET || 'PLCI Kantin SMB';

// 1. GET ALL RECURRING COMMITMENTS
router.get('/', async (req, res) => {
  try {
    const { sheet } = req.query;
    const filter = { sheet: sheet || DEFAULT_SHEET };
    const data = await Recurring.find(filter).sort({ createdAt: -1 });
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching recurring:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 2. CREATE RECURRING COMMITMENT
router.post('/', async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.sheet) data.sheet = DEFAULT_SHEET;
    const newRec = new Recurring(data);
    await newRec.save();
    res.status(201).json({ status: 'success', data: newRec });
  } catch (error) {
    console.error('Error creating recurring:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 3. UPDATE RECURRING COMMITMENT
router.put('/:id', async (req, res) => {
  try {
    const updated = await Recurring.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Data routine tidak ditemukan' });
    }
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    console.error('Error updating recurring:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 4. DELETE RECURRING COMMITMENT
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Recurring.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Data routine tidak ditemukan' });
    }
    res.status(200).json({ status: 'success', message: 'Data routine berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting recurring:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 5. TRIGGER AUTO-APPLY EXPENSES FOR DUE RECURRING RULES
router.post('/trigger', async (req, res) => {
  try {
    const rules = await Recurring.find({ isActive: true });
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let generatedCount = 0;

    for (const rule of rules) {
      let currentDate = rule.lastApplied ? new Date(rule.lastApplied) : new Date(rule.startDate);

      // Increment to next occurrence if previously applied
      if (rule.lastApplied) {
        if (rule.frekuensi === 'bulanan' || rule.frekuensi === 'Per Bulan') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (rule.frekuensi === 'tahunan') {
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        } else if (rule.frekuensi === 'Tiap 15 Hari') {
          currentDate.setDate(currentDate.getDate() + 15);
        } else if (rule.frekuensi === 'Tiap 2 Bulan') {
          currentDate.setMonth(currentDate.getMonth() + 2);
        } else {
          currentDate.setDate(currentDate.getDate() + (rule.intervalHari || 30));
        }
      }

      while (currentDate <= today) {
        // If expired by endDate, mark inactive and break
        if (rule.endDate && currentDate > new Date(rule.endDate)) {
          rule.isActive = false;
          await rule.save();
          break;
        }

        const dateIso = currentDate.toISOString().split('T')[0];
        const dateIndoStr = getIndoDateString(currentDate);

        // 1. Create Transaction entry for POS / Sales cost visibility
        await Transaction.create({
          sheet: rule.sheet || DEFAULT_SHEET,
          tanggal: dateIndoStr,
          cash: 0,
          bca: 0,
          gofood: 0,
          qris: 0,
          jenisPengeluaran: `[OPERASIONAL ROUTINE] ${rule.nama}`,
          totalPengeluaran: rule.nominal,
          totalPendapatan: 0
        });

        // 2. Create Expense entry in the 3-category expense system (Biaya Tetap)
        await Expense.create({
          sheet: rule.sheet || DEFAULT_SHEET,
          tanggal: dateIso,
          kategori: 'tetap',
          kategoriLabel: 'Biaya Tetap',
          nama_item: rule.nama,
          nominal: rule.nominal,
          karyawan: 'Sistem Rutin Otomatis',
          frekuensi: rule.frekuensi,
          keterangan: rule.keterangan || 'Biaya tetap operasional terjadwal otomatis'
        });

        rule.lastApplied = new Date(currentDate);
        await rule.save();
        generatedCount++;

        // Advance to next period
        if (rule.frekuensi === 'bulanan' || rule.frekuensi === 'Per Bulan') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (rule.frekuensi === 'tahunan') {
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        } else if (rule.frekuensi === 'Tiap 15 Hari') {
          currentDate.setDate(currentDate.getDate() + 15);
        } else if (rule.frekuensi === 'Tiap 2 Bulan') {
          currentDate.setMonth(currentDate.getMonth() + 2);
        } else {
          currentDate.setDate(currentDate.getDate() + (rule.intervalHari || 30));
        }
      }
    }

    res.status(200).json({ status: 'success', generated: generatedCount });
  } catch (error) {
    console.error('Error triggering recurring expenses:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
