# TerbaruBackend — Pecel Lele Cabe Ijo Kantin SMB

Backend all-in-one terkonsolidasi, efisien, dan siap pakai untuk sistem manajemen kuliner **Pecel Lele Cabe Ijo - Kantin SMB** (Admin Dashboard & Kasir POS).

---

## 🌟 Fitur & Modul Utama

1. **Transactions (`/api/transactions`)**
   - Pencatatan transaksi penjualan kasir (CASH, BCA, QRIS).
   - Filter per tanggal dan sheet cabang.
   - Idempotent upsert via `overrideDbId` untuk sinkronisasi POS offline-to-online.
   - Hapus sementara (soft-delete), hapus permanen, dan bulk delete.
   - Pelacakan jumlah cetak struk (`printCount`).

2. **Expenses (`/api/expenses`)**
   - Modul pencatatan 3 kategori pengeluaran:
     - **Biaya Bahan Baku** (kuantitas, satuan, harga satuan, supplier).
     - **Biaya Variabel** (gas, minyak, kemasan takeaway).
     - **Biaya Tetap** (sewa kios, gaji karyawan, utilitas).
   - Agregasi hierarkis waktu terstruktur: `/api/expenses/hierarchy` (Tahun -> Bulan -> Tanggal -> Rincian).
   - Dukungan lampiran bukti struk foto/SVG hingga 25MB.

3. **Recurring (`/api/recurring`)**
   - Penjadwalan biaya tetap operasional rutin (Bulanan, Tiap 15 Hari, Tahunan).
   - Auto-trigger generator: `/api/recurring/trigger` otomatis membuat entri pengeluaran dan transaksi biaya operasional saat jatuh tempo.

4. **Emergency Alert (`/api/emergency`)**
   - Sinyal darurat kasir real-time ke Dashboard Admin dengan alarm audio.
   - Status tracking (`ACTIVE` -> `SOLVED`).
   - Opsional: Penerusan pesan darurat ke Telegram Bot.

5. **Menu Master & Stok (`/api/menu`)**
   - Pengaturan nama menu, harga, dan stok realtime.
   - Lazy evaluation auto-reset stok harian tepat tengah malam WIB (Asia/Jakarta).
   - Otomatis mencatat sisa stok kemarin ke log audit trail.
   - Endpoint potong stok saat checkout (`/api/menu/deduct`) dan kembalikan stok saat batal (`/api/menu/restore`).

6. **Audit Activities (`/api/activities`)**
   - Rekam jejak perubahan harga, perubahan stok, restok manual, dan sistem log.

7. **Settings (`/api/settings`)**
   - Pengaturan toggle preferensi sistem admin dan kasir.

---

## 🛠️ Cara Menjalankan

### 1. Instalasi Dependensi
```bash
cd TerbaruBackend
npm install
```

### 2. Konfigurasi Lingkungan (`.env`)
Salin file `.env.example` ke `.env` dan isi variabel yang diperlukan:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/plci_db?retryWrites=true&w=majority
DEFAULT_SHEET=PLCI Kantin SMB
```

### 3. Menjalankan Server
```bash
# Mode Produksi
npm start

# Mode Pengembangan (Auto-reload)
npm run dev
```

---

## ☁️ Deployment ke Vercel

Folder ini sudah dilengkapi dengan `vercel.json` dan handler serverless. Anda cukup menghubungkan folder `TerbaruBackend` ke project Vercel dan mengatur Environment Variable `MONGO_URI`.