// =============================================================================
// SCRIPT MIGRASI: gofood → qris (ONE-TIME MIGRATION)
// Tujuan: Pindahkan nilai field gofood ke field qris pada seluruh transaksi
//         yang tersimpan di MongoDB (data historis sebelum fix dilakukan).
//
// CARA PAKAI:
//   1. Pastikan MONGO_URI sudah di-set di environment (.env atau Vercel env)
//   2. node utils/migratGofoodToQris.js
//
// JALANKAN SEKALI SAJA. Setelah selesai, script ini tidak perlu dijalankan lagi.
// =============================================================================

require('dotenv').config();
const mongoose = require('mongoose');

async function migrate() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI tidak ditemukan di environment!');
    process.exit(1);
  }

  console.log('🔌 Menghubungkan ke MongoDB...');
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log('✅ Terhubung ke MongoDB!');

  const db = mongoose.connection.db;
  const collection = db.collection('transactions');

  // Cari semua transaksi yang punya nilai gofood > 0
  const toMigrate = await collection.find({ gofood: { $gt: 0 } }).toArray();
  console.log(`📊 Ditemukan ${toMigrate.length} transaksi dengan nilai gofood > 0`);

  if (toMigrate.length === 0) {
    console.log('✅ Tidak ada data yang perlu dimigrasikan. Selesai!');
    await mongoose.disconnect();
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const tx of toMigrate) {
    try {
      const currentQris = Number(tx.qris) || 0;
      const currentGofood = Number(tx.gofood) || 0;
      const mergedQris = currentQris + currentGofood;

      await collection.updateOne(
        { _id: tx._id },
        {
          $set: { qris: mergedQris },
          $unset: { gofood: '' }  // Hapus field gofood setelah dipindahkan
        }
      );

      successCount++;
      if (successCount % 100 === 0) {
        console.log(`  ✅ Berhasil migrasi ${successCount}/${toMigrate.length}...`);
      }
    } catch (err) {
      errorCount++;
      console.error(`  ❌ Error migrasi transaksi ${tx._id}:`, err.message);
    }
  }

  console.log('');
  console.log('===================================================');
  console.log(`✅ Migrasi selesai!`);
  console.log(`   Berhasil : ${successCount} transaksi`);
  console.log(`   Gagal    : ${errorCount} transaksi`);
  console.log('===================================================');

  await mongoose.disconnect();
  console.log('🔌 Koneksi MongoDB ditutup.');
}

migrate().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
