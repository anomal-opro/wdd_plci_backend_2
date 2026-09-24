// =============================================================================
// ROUTE: EMERGENCY (/api/emergency)
// Sinyal Darurat Kasir & Alarm Notifikasi Real-time Admin
// Cabang: Pecel Lele Cabe Ijo - Kantin SMB
// =============================================================================
const express = require('express');
const router = express.Router();
const Emergency = require('../models/Emergency');

const DEFAULT_SHEET = process.env.DEFAULT_SHEET || 'PLCI Kantin SMB';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// 1. GET ALL ACTIVE EMERGENCIES (FOR ADMIN ALARM POLLING)
router.get('/active', async (req, res) => {
  try {
    const { sheet } = req.query;
    const filter = { 
      status: 'ACTIVE',
      sheet: sheet || DEFAULT_SHEET
    };
    const data = await Emergency.find(filter).sort({ createdAt: -1 });
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching active emergencies:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 2. CREATE EMERGENCY ALERT (KASIR TRIGGERS EMERGENCY)
router.post('/', async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.sheet) data.sheet = DEFAULT_SHEET;

    const newEmergency = new Emergency(data);
    await newEmergency.save();

    // Optional: Telegram Bot Notification if configured
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const pesanTelegram = `🚨 *PANGGILAN DARURAT KASIR!* 🚨\n\n📍 *Cabang:* ${data.sheet}\n⏰ *Waktu:* ${data.timestamp}\n💬 *Pesan:* ${data.message || 'Sistem Error / Butuh Bantuan'}\n\nSegera cek Dashboard Admin lu bos!`;
      const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

      try {
        await fetch(telegramUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: pesanTelegram,
            parse_mode: 'Markdown'
          })
        });
      } catch (tgErr) {
        console.warn('Gagal mengirim notifikasi Telegram:', tgErr.message);
      }
    }

    res.status(201).json({ status: 'success', data: newEmergency });
  } catch (error) {
    console.error('Error saving emergency:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 3. MARK EMERGENCY AS SOLVED
router.put('/solve/:id', async (req, res) => {
  try {
    const updated = await Emergency.findByIdAndUpdate(
      req.params.id, 
      { status: 'SOLVED' }, 
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Laporan darurat tidak ditemukan' });
    }
    res.status(200).json({ status: 'success', message: 'Masalah telah diselesaikan' });
  } catch (error) {
    console.error('Error solving emergency:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
