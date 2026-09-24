// =============================================================================
// ROUTE: MENU & STOK (/api/menu)
// Manajemen Menu Master, Harga, Stok Kasir POS, & Auto-Reset Harian
// Cabang: Pecel Lele Cabe Ijo - Kantin SMB
// =============================================================================
const express = require('express');
const router = express.Router();
const MenuMaster = require('../models/MenuMaster');
const ActivityLog = require('../models/ActivityLog');
const { 
  getWibTodayDate, 
  getIndoTimeString, 
  getIndoDateString, 
  formatRupiah 
} = require('../utils/timeHelper');

const DEFAULT_SHEET = process.env.DEFAULT_SHEET || 'PLCI Kantin SMB';

// 1. GET ALL MENU ITEMS (WITH LAZY EVALUATION AUTO-RESET AT MIDNIGHT WIB)
router.get('/', async (req, res) => {
  try {
    const { sheet } = req.query;
    const targetSheet = sheet || DEFAULT_SHEET;

    const todayDate = getWibTodayDate();
    const menus = await MenuMaster.find({ sheet: targetSheet });

    let updatedMenus = [];

    // Lazy evaluation auto-reset check
    for (let menu of menus) {
      if (menu.lastUpdatedDate !== todayDate) {
        // Different day detected: Log yesterday's leftover stock to activity audit trail
        const detailSisa = `SISA STOK KEMARIN: Tersisa ${menu.stock} porsi`;

        await ActivityLog.create({
          sheet: menu.sheet,
          actionCategory: 'INFO_STOK',
          menuName: menu.name,
          detailAction: detailSisa,
          timestamp: '23:59:59',
          dateString: 'Rekap Stok Otomatis'
        });

        // Reset stock for new business day
        menu.stock = 0;
        menu.lastUpdatedDate = todayDate;
        await menu.save();
      }
      updatedMenus.push(menu);
    }

    res.status(200).json(updatedMenus);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 2. UPDATE MENU & STOCK (WITH AUTOMATIC AUDIT TRAIL)
router.put('/', async (req, res) => {
  try {
    const { sheet, menuId, name, price, stock, currentLiveStock, isPaketan } = req.body;
    const targetSheet = sheet || DEFAULT_SHEET;
    const todayDate = getWibTodayDate();
    const now = new Date();
    const timeStr = getIndoTimeString(now, true);
    const dateStr = getIndoDateString(now);

    let menu = await MenuMaster.findOne({ sheet: targetSheet, menuId });
    let logs = [];
    const newStockNum = parseInt(stock) || 0;
    const isPaketanItem = isPaketan || (menuId && (menuId.startsWith('paket-') || menuId.startsWith('pkt-')));

    if (!menu) {
      // Create new menu
      menu = new MenuMaster({
        sheet: targetSheet,
        menuId,
        name,
        price,
        stock: newStockNum,
        lastUpdatedDate: todayDate,
        lastRestockTime: newStockNum > 0 ? timeStr : ""
      });

      if (!isPaketanItem && newStockNum > 0) {
        logs.push({
          sheet: targetSheet,
          actionCategory: 'UBAH_STOK',
          menuName: name,
          detailAction: `MANUAL UPDATE: Mengubah Stok dari [HABIS (0)] menjadi [${newStockNum}] porsi.`,
          timestamp: timeStr,
          dateString: dateStr
        });
      }
    } else {
      const oldStockNum = (currentLiveStock !== undefined && currentLiveStock !== null)
        ? parseInt(currentLiveStock) || 0
        : (menu.stock || 0);

      // 1. Detect Stock Change
      if (!isPaketanItem && oldStockNum !== newStockNum) {
        const statusLama = oldStockNum === 0 ? "HABIS (0)" : oldStockNum;
        logs.push({
          sheet: targetSheet,
          actionCategory: 'UBAH_STOK',
          menuName: name,
          detailAction: `MANUAL UPDATE: Mengubah Stok dari [${statusLama}] menjadi [${newStockNum}] porsi.`,
          timestamp: timeStr,
          dateString: dateStr
        });
        menu.stock = newStockNum;
        menu.lastRestockTime = timeStr;
      }

      // 2. Detect Price Change
      if (menu.price !== price) {
        logs.push({
          sheet: targetSheet,
          actionCategory: 'UBAH_HARGA',
          menuName: name,
          detailAction: `Ubah Harga: ${formatRupiah(menu.price)} -> ${formatRupiah(price)}`,
          timestamp: timeStr,
          dateString: dateStr
        });
        menu.price = price;
      }

      // 3. Detect Name Change
      if (menu.name !== name) {
        logs.push({
          sheet: targetSheet,
          actionCategory: 'UBAH_NAMA',
          menuName: name,
          detailAction: `Ubah Nama: [${menu.name}] -> [${name}]`,
          timestamp: timeStr,
          dateString: dateStr
        });
        menu.name = name;
      }

      menu.lastUpdatedDate = todayDate;
    }

    if (logs.length > 0) {
      await Promise.all([
        menu.save(),
        ActivityLog.insertMany(logs)
      ]);
    } else {
      await menu.save();
    }

    res.status(200).json({ status: 'success', data: menu });
  } catch (error) {
    console.error('Error updating menu:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 3. DEDUCT STOCK ON POS CHECKOUT
router.post('/deduct', async (req, res) => {
  try {
    const sheet = req.body.sheet || req.body.sheetName || DEFAULT_SHEET;
    const cartItems = req.body.cartItems || req.body.items || [];
    const now = new Date();
    const timeStr = getIndoTimeString(now);
    const dateStr = getIndoDateString(now);

    if (!Array.isArray(cartItems)) {
      return res.status(400).json({ status: 'error', message: 'cartItems harus berupa array' });
    }

    const stockUpdates = cartItems.map(async (item) => {
      let baseId = item.id ? item.id.split('-')[0] : item.menuId;
      let menu = await MenuMaster.findOne({ sheet, menuId: baseId });
      if (!menu) return null;

      menu.stock -= (item.qty || 1);
      let logEntry = null;
      if (menu.stock <= 0) {
        menu.stock = 0;
        logEntry = {
          sheet,
          actionCategory: 'INFO_STOK',
          menuName: menu.name,
          detailAction: `STOK HABIS! ${menu.name} habis terjual pada jam ${timeStr}`,
          timestamp: timeStr,
          dateString: dateStr
        };
      }
      await menu.save();
      return logEntry;
    });

    const results = await Promise.all(stockUpdates);
    const logs = results.filter(log => log !== null);
    if (logs.length > 0) await ActivityLog.insertMany(logs);

    const emptyStockLogs = logs.map(l => `[LAPORAN SISTEM] ${l.detailAction}`);
    res.status(200).json({ status: 'success', systemMessages: emptyStockLogs });
  } catch (error) {
    console.error('Error deducting stock:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 4. RESTORE STOCK ON VOID / CANCELLED ORDERS
router.post('/restore', async (req, res) => {
  try {
    const sheet = req.body.sheet || req.body.sheetName || DEFAULT_SHEET;
    const cartItems = req.body.cartItems || req.body.items || [];
    const now = new Date();
    const timeStr = getIndoTimeString(now);
    const dateStr = getIndoDateString(now);

    if (!Array.isArray(cartItems)) {
      return res.status(400).json({ status: 'error', message: 'cartItems harus berupa array' });
    }

    const restoreUpdates = cartItems.map(async (item) => {
      const safeName = (item.name || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let menu = await MenuMaster.findOne({ sheet, name: new RegExp(`^${safeName}$`, 'i') });
      if (!menu) return null;

      menu.stock += (item.qty || 1);
      await menu.save();
      return {
        sheet,
        actionCategory: 'INFO_STOK',
        menuName: menu.name,
        detailAction: `RESTORE STOK: ${menu.name} dikembalikan ${item.qty || 1} porsi (Batal Pesanan)`,
        timestamp: timeStr,
        dateString: dateStr
      };
    });

    const logs = (await Promise.all(restoreUpdates)).filter(log => log !== null);
    if (logs.length > 0) await ActivityLog.insertMany(logs);

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error restoring stock:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
