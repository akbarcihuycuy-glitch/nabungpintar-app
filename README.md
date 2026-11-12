# NabungPintar ✨ — FinTech Personal Finance & Smart Savings PWA

> **Aplikasi Perencanaan Keuangan Pribadi, Celengan Target Impian, dan Manajemen Arus Kas Modern bergaya *Futuristic Glassmorphism*.**

---

## 🌟 Fitur Unggulan

1. **Dynamic Mood Lamp & Futuristic Digital Bank Card**
   - Kartu saldo digital interaktif dengan pendaran lampu kaca otomatis sesuai rasio menabung (*Hijau Emerald saat Sehat, Kuning Solar saat Waspada, dan Merah Rose saat Defisit*).
   - Dilengkapi mikroprosesor EMV chip digital, indikator gelombang contactless, kilau kaca diagonal (*holographic glass sheen*), dan mode privasi sembunyikan nominal saldo (`Rp ••••••••••`).
   - Mendukung **Dark Mode** dan **Light Mode (Iridescent Pastel Glass)**.

2. **Neon Wave Canvas Cashflow Chart**
   - Grafik interaktif kurva melengkung (*monotone spline*) berlatar *Sapphire-Indigo Glass* dengan pendaran neon SVG drop-shadow.
   - Segmented toggle kapsul melayang (*sliding glowing pill*) untuk rentang 7 hari vs 30 hari.
   - Tooltip kaca melayang dengan rincian pemasukan, pengeluaran, dan arus kas bersih (*net cashflow*).

3. **Interactive Bento Split & Speedometer**
   - **Rasio Menabung**: Cincin *Glowing Liquid Ring Gauge* dengan gradien toska-sianit dinamis dan bola cahaya (*tip orb*) di ujung progres.
   - **Skor Kesehatan Finansial (0–100)**: Speedometer arc dengan 4 kapsul kaca interaktif (Rasio Tabungan Bobot 40, Dana Darurat Bobot 30, Tren Belanja Bobot 20, Disiplin Catat Bobot 10).

4. **3D Glass Vault Cards (Target Celengan Impian)**
   - Desain brankas kaca modern dengan foto cover berlapis overlay kaca gelap, ikon squircle bercahaya cincin neon, dan bilah progres cairan berkilau (*animated shimmer liquid bar*).
   - Tombol "+ Setor" kapsul neon dengan efek pantul (*spring bounce*).

5. **Pusat Lonceng Notifikasi & Alarm Suara Synthesizer**
   - Lonceng notifikasi di header dengan badge jumlah target jatuh tempo dan peringatan batas anggaran bulanan (*Budget Tracker*).
   - Suara chime arpeggio melodis (C5–E5–G5–C6) menggunakan **Web Audio API** sintetis tanpa dependensi file audio eksternal (*100% offline-ready*).

6. **Impor Mutasi Rekening Bank & Deteksi Duplikat Otomatis**
   - Mendukung format `.csv` dan `.xlsx` dari bank-bank besar Indonesia (BCA, Mandiri, BRI, BNI).
   - Deteksi hash transaksi otomatis untuk mencegah duplikasi catatan.

7. **Unduh Laporan Finansial PDF Rapi**
   - Pembuatan dokumen PDF resmi A4 siap cetak menggunakan **jsPDF** & **jsPDF-AutoTable**, mencakup ringkasan eksekutif, alokasi anggaran, status celengan, dan mutasi transaksi bulanan.

8. **Keamanan Finansial Berlapis**
   - Kunci PIN 6-digit dengan animasi getar (*error shake*).
   - Autentikasi biometrik sidik jari (*WebAuthn Platform Authenticator*).
   - Dukungan Google One-Tap Sign-In (*Google Identity Services SDK*) dan Email/Password via **Supabase Auth**.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **State & Caching**: TanStack React Query v5
- **Backend / Database**: Supabase Cloud (PostgreSQL 15, Row Level Security, Realtime WebSockets)
- **Visuals & Charts**: Recharts, Canvas-Confetti, Material Symbols
- **Export & Utility**: jsPDF, jsPDF-AutoTable, SheetJS (XLSX), PapaParse

---

## 🚀 Menjalankan di Lokal (Local Development)

1. **Clone repositori**:
   ```bash
   git clone https://github.com/akbarcihuycuy-glitch/nabungpintar-app.git
   cd nabungpintar-app
   ```

2. **Pasang dependensi**:
   ```bash
   npm install
   ```

3. **Salin file environment**:
   ```bash
   cp .env.example .env
   ```
   Isi `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, dan `VITE_GOOGLE_CLIENT_ID` sesuai akun Anda.

4. **Jalankan server pengembangan**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:5173`.

---

## 🌐 Panduan Deploy ke Render.com

Aplikasi ini sudah dilengkapi file blueprint `render.yaml` dan aturan rewrite `public/_redirects` untuk Single Page Application (SPA).

### Langkah-langkah Deploy:

1. Masuk ke dashboard [Render.com](https://dashboard.render.com/).
2. Klik tombol **New +** dan pilih **Static Site**.
3. Hubungkan akun GitHub Anda dan pilih repositori **`nabungpintar-app`**.
4. Isi konfigurasi build:
   - **Name**: `nabungpintar-app`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
5. Pada bagian **Environment Variables**, tambahkan 3 variabel berikut:
   | Key | Value | Keterangan |
   | --- | --- | --- |
   | `VITE_SUPABASE_URL` | `https://iiwgmjndtdvnlnfpetjp.supabase.co` | URL endpoint proyek Supabase |
   | `VITE_SUPABASE_ANON_KEY` | *(Salin Anon Public Key dari file `.env` Anda)* | Kunci anonim klien Supabase |
   | `VITE_GOOGLE_CLIENT_ID` | `1045859094349-ddr6et4oqt30m4iu00bhduesdomamt4b.apps.googleusercontent.com` | Client ID Google OAuth |
6. Klik **Create Static Site**.
7. Render akan otomatis mengunduh kode, melakukan build Vite production, dan meluncurkan aplikasi dengan HTTPS gratis!

---

## 📄 Lisensi
Hak Cipta © 2026 NabungPintar. Dibuat dengan cinta untuk kesehatan finansial yang lebih cerdas dan terukur.
