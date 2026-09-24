// =============================================================================
// ROUTE: EXPENSES (/api/expenses)
// Modul Sistem Pencatatan Pengeluaran (Bahan Baku, Variabel, Tetap)
// Cabang: Pecel Lele Cabe Ijo - Kantin SMB
// =============================================================================
const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

const DEFAULT_SHEET = process.env.DEFAULT_SHEET || 'PLCI Kantin SMB';

// 1. GET ALL EXPENSES
router.get('/', async (req, res) => {
  try {
    const { sheet, kategori, tanggal, startDate, endDate, includeDeleted } = req.query;

    let filter = {};
    filter.sheet = sheet || DEFAULT_SHEET;

    if (kategori) {
      filter.kategori = kategori;
    }

    if (tanggal) {
      filter.tanggal = tanggal;
    } else if (startDate || endDate) {
      filter.tanggal = {};
      if (startDate) filter.tanggal.$gte = startDate;
      if (endDate) filter.tanggal.$lte = endDate;
    }

    if (includeDeleted !== 'true') {
      filter.isDeleted = false;
    }

    const data = await Expense.find(filter).sort({ tanggal: -1, createdAt: -1 });
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 2. GET HIERARCHICAL TIME-BASED AGGREGATION (YEAR -> MONTH -> DAY -> LOGS)
router.get('/hierarchy', async (req, res) => {
  try {
    const { sheet } = req.query;
    const targetSheet = sheet || DEFAULT_SHEET;

    const list = await Expense.find({ sheet: targetSheet, isDeleted: false }).sort({ tanggal: -1 });

    const monthsNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const yearsMap = {};

    list.forEach(item => {
      const dateObj = new Date(item.tanggal);
      const year = isNaN(dateObj.getFullYear()) ? '2026' : String(dateObj.getFullYear());
      const monthIdx = isNaN(dateObj.getMonth()) ? 8 : dateObj.getMonth();
      const monthName = monthsNames[monthIdx];
      const dayStr = item.tanggal || '2026-09-24';
      const nominal = Number(item.nominal) || 0;

      // 1. Year level
      if (!yearsMap[year]) {
        yearsMap[year] = {
          year,
          grandTotal: 0,
          bahanBaku: 0,
          tetap: 0,
          variabel: 0,
          count: 0,
          months: {}
        };
      }
      yearsMap[year].grandTotal += nominal;
      yearsMap[year].count += 1;
      if (item.kategori === 'bahan_baku') yearsMap[year].bahanBaku += nominal;
      else if (item.kategori === 'tetap') yearsMap[year].tetap += nominal;
      else yearsMap[year].variabel += nominal;

      // 2. Month level
      if (!yearsMap[year].months[monthName]) {
        yearsMap[year].months[monthName] = {
          month: monthName,
          monthIndex: monthIdx,
          year,
          grandTotal: 0,
          bahanBaku: 0,
          tetap: 0,
          variabel: 0,
          count: 0,
          days: {}
        };
      }
      yearsMap[year].months[monthName].grandTotal += nominal;
      yearsMap[year].months[monthName].count += 1;
      if (item.kategori === 'bahan_baku') yearsMap[year].months[monthName].bahanBaku += nominal;
      else if (item.kategori === 'tetap') yearsMap[year].months[monthName].tetap += nominal;
      else yearsMap[year].months[monthName].variabel += nominal;

      // 3. Day level
      if (!yearsMap[year].months[monthName].days[dayStr]) {
        yearsMap[year].months[monthName].days[dayStr] = {
          dateStr: dayStr,
          dayNumber: dateObj.getDate() || 1,
          month: monthName,
          year,
          grandTotal: 0,
          bahanBaku: 0,
          tetap: 0,
          variabel: 0,
          count: 0,
          logs: []
        };
      }
      yearsMap[year].months[monthName].days[dayStr].grandTotal += nominal;
      yearsMap[year].months[monthName].days[dayStr].count += 1;
      if (item.kategori === 'bahan_baku') yearsMap[year].months[monthName].days[dayStr].bahanBaku += nominal;
      else if (item.kategori === 'tetap') yearsMap[year].months[monthName].days[dayStr].tetap += nominal;
      else yearsMap[year].months[monthName].days[dayStr].variabel += nominal;

      // 4. Granular log
      yearsMap[year].months[monthName].days[dayStr].logs.push(item);
    });

    const sortedYears = Object.values(yearsMap).sort((a, b) => parseInt(b.year) - parseInt(a.year));
    res.status(200).json(sortedYears);
  } catch (error) {
    console.error('Error calculating hierarchy:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 3. CREATE EXPENSE
router.post('/', async (req, res) => {
  try {
    const { 
      tanggal, 
      kategori, 
      nama_item, 
      nominal, 
      karyawan, 
      attachment, 
      keterangan, 
      kuantitas, 
      satuan, 
      harga_satuan, 
      supplier, 
      frekuensi, 
      durasi, 
      endDate, 
      status,
      sheet 
    } = req.body;

    if (!nama_item) {
      return res.status(400).json({ status: 'error', message: 'Nama item pengeluaran wajib diisi' });
    }

    let calculatedNominal = Number(nominal) || 0;
    if (calculatedNominal === 0 && kuantitas && harga_satuan) {
      calculatedNominal = Number(kuantitas) * Number(harga_satuan);
    }

    let kategoriLabel = 'Biaya Variabel';
    if (kategori === 'bahan_baku') kategoriLabel = 'Biaya Bahan Baku';
    else if (kategori === 'tetap') kategoriLabel = 'Biaya Tetap';

    const newExpense = new Expense({
      sheet: sheet || DEFAULT_SHEET,
      tanggal: tanggal || new Date().toISOString().split('T')[0],
      kategori: kategori || 'variabel',
      kategoriLabel,
      nama_item: nama_item.trim(),
      nominal: calculatedNominal,
      karyawan: (karyawan || 'Staff Karyawan').trim(),
      attachment: attachment || null,
      keterangan: (keterangan || '').trim(),
      kuantitas: kuantitas ? Number(kuantitas) : null,
      satuan: (satuan || null),
      harga_satuan: harga_satuan ? Number(harga_satuan) : null,
      supplier: (supplier || null),
      frekuensi: frekuensi || (kategori === 'tetap' ? 'Per Bulan' : null),
      durasi: durasi || (kategori === 'tetap' ? 'Berkelanjutan' : null),
      endDate: endDate || null,
      status: status || 'aktif'
    });

    await newExpense.save();
    res.status(201).json({ status: 'success', data: newExpense });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 4. UPDATE EXPENSE
router.put('/:id', async (req, res) => {
  try {
    const updated = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Data pengeluaran tidak ditemukan' });
    }
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 5. DELETE EXPENSE (SOFT DELETE)
router.delete('/:id', async (req, res) => {
  try {
    const { hard } = req.query;
    if (hard === 'true') {
      const deleted = await Expense.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ status: 'error', message: 'Data tidak ditemukan' });
      return res.status(200).json({ status: 'success', message: 'Data pengeluaran dihapus permanen' });
    }

    const updated = await Expense.findByIdAndUpdate(
      req.params.id, 
      { isDeleted: true, deletedAt: new Date() }, 
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Data tidak ditemukan' });
    }
    res.status(200).json({ status: 'success', message: 'Data pengeluaran berhasil dihapus', data: updated });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
