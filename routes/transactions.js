// =============================================================================
// ROUTE: TRANSACTIONS (/api/transactions)
// Penjualan, Pendapatan Kasir, & Transaksi Harian
// Cabang: Pecel Lele Cabe Ijo - Kantin SMB
// =============================================================================
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

const DEFAULT_SHEET = process.env.DEFAULT_SHEET || 'PLCI Kantin SMB';

// 1. GET ALL TRANSACTIONS
router.get('/', async (req, res) => {
  try {
    const { sheet, tanggal, includeDeleted } = req.query;

    let filter = {};
    filter.sheet = sheet || DEFAULT_SHEET;

    if (tanggal) {
      filter.tanggal = tanggal;
    }

    if (includeDeleted !== 'true') {
      // By default, only return active or non-deleted, or allow all if requested
      // For admin history, we include both but frontend flags isDeleted
    }

    const query = Transaction.find(filter).sort({ createdAt: 1 });
    if (tanggal) query.limit(500);
    else query.limit(2000);

    const data = await query.exec();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 2. CREATE / UPSERT TRANSACTION (SINGLE OR BULK WITH OVERRIDE SUPPORT & IDEMPOTENCY)
router.post('/', async (req, res) => {
  try {
    // A. Handle Array payload
    if (Array.isArray(req.body)) {
      const results = [];
      for (const item of req.body) {
        if (!item.sheet) item.sheet = DEFAULT_SHEET;

        if (item.overrideDbId) {
          const { overrideDbId, ...updateData } = item;
          const updated = await Transaction.findByIdAndUpdate(overrideDbId, updateData, { new: true, upsert: true });
          results.push(updated);
        } else if (item.localId) {
          // Idempotency: Jika transaksi dengan localId ini sudah ada di MongoDB, jangan buat duplikat!
          const existing = await Transaction.findOne({ localId: item.localId });
          if (existing) {
            results.push(existing);
          } else {
            const newTx = new Transaction(item);
            await newTx.save();
            results.push(newTx);
          }
        } else {
          const newTx = new Transaction(item);
          await newTx.save();
          results.push(newTx);
        }
      }
      return res.status(201).json({ status: 'success', data: results });
    }

    // B. Handle Single with overrideDbId
    if (req.body.overrideDbId) {
      const { overrideDbId, ...updateData } = req.body;
      if (!updateData.sheet) updateData.sheet = DEFAULT_SHEET;
      const updated = await Transaction.findByIdAndUpdate(overrideDbId, updateData, { new: true, upsert: true });
      return res.status(200).json({ status: 'success', data: updated });
    }

    // C. Handle Single with localId (Idempotent Check)
    if (req.body.localId) {
      const existing = await Transaction.findOne({ localId: req.body.localId });
      if (existing) {
        return res.status(200).json({ status: 'success', data: existing, idempotent: true });
      }
    }

    // D. Standard Single Create
    const txData = { ...req.body };
    if (!txData.sheet) txData.sheet = DEFAULT_SHEET;
    const newTransaction = new Transaction(txData);
    await newTransaction.save();
    res.status(201).json({ status: 'success', data: newTransaction });
  } catch (error) {
    console.error('Error saving transaction:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 3. BULK DELETE (PERMANENT HARD DELETE DARI MONGODB)
router.delete('/bulk', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Daftar ID transaksi tidak boleh kosong' });
    }

    await Transaction.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ status: 'success', message: `${ids.length} transaksi berhasil dihapus permanen dari database` });
  } catch (error) {
    console.error('Error bulk deleting transactions:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 4. HARD DELETE (PERMANENT) SATUAN
router.delete('/hard/:id', async (req, res) => {
  try {
    const deleted = await Transaction.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Transaksi tidak ditemukan' });
    }
    res.status(200).json({ status: 'success', message: 'Transaksi berhasil dihapus permanen dari database' });
  } catch (error) {
    console.error('Error hard deleting transaction:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 5. DELETE (SATUAN - PERMANENT HARD DELETE DARI MONGODB)
router.delete('/:id', async (req, res) => {
  try {
    let deleted = null;
    try {
      deleted = await Transaction.findByIdAndDelete(req.params.id);
    } catch (e) {
      deleted = null;
    }

    if (!deleted) {
      deleted = await Transaction.findOneAndDelete({ _id: req.params.id });
    }

    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Transaksi tidak ditemukan di database' });
    }
    res.status(200).json({ status: 'success', message: 'Transaksi berhasil dihapus permanen dari database' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 6. INCREMENT PRINT RECEIPT COUNT
router.patch('/:id/print', async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) {
      return res.status(404).json({ status: 'error', message: 'Transaksi tidak ditemukan' });
    }
    tx.printCount = (tx.printCount || 0) + 1;
    await tx.save();
    res.status(200).json({ status: 'success', printCount: tx.printCount });
  } catch (error) {
    console.error('Error updating print count:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
