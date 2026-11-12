# NabungPintar - Master PRD (Versi Google Stitch & Spesifikasi Sistem Live)

Versi 1.0 - 10 November 2026 - Untuk dipakai merancang layar di Google Stitch, lalu mengoding sistem live di tahap berikutnya.

## 0. Asumsi & Keputusan Awal

Asumsi ini saya tetapkan supaya PRD bisa langsung dipakai. Kalau ada yang salah, koreksi sebelum masuk tahap coding.

- **Mata uang dasar: IDR.** Semua transaksi disimpan sebagai bilangan bulat (bigint) dalam satuan terkecil IDR, tanpa desimal. Mata uang lain hanya mengubah tampilan, plus catatan mata uang asal pada transaksi.
- **Zona waktu: Asia/Jakarta (WIB).** Semua batas hari (7/30 hari) dihitung di zona ini, bukan UTC.
- **Mobile-first**, lebar acuan 390 px, lalu responsif ke desktop (max-width konten 1120 px).
- **Stack bangun:** hasil HTML/Tailwind dari Stitch dipecah menjadi komponen di Vite + React + Tailwind, PWA lewat vite-plugin-pwa. Kalau kamu lebih suka vanilla JS, bagian 4 tetap berlaku.
- **Prompt Stitch ditulis dalam bahasa Inggris** (hasil Stitch biasanya lebih konsisten), tetapi seluruh teks UI yang tampil memakai bahasa Indonesia. Kalau mau prompt versi Indonesia, tinggal minta.
- **Tidak ada data dummy.** Semua layar harus punya state kosong yang rapi karena akun baru memang kosong.
- **Transfer ke kantong target bukan pengeluaran.** Top up tabungan memindahkan uang dari Saldo Kas ke Total Tabungan.

---

## 1. Arsitektur Desain & Elemen UI/UX

### 1.1 Daftar Layar

| ID | Layar | Fase | Tipe |
| --- | --- | --- | --- |
| S01 | Dashboard Keuangan | 1 | Halaman |
| S02 | Catat Transaksi (bottom sheet cepat) | 1 | Sheet |
| S03 | Riwayat & Pencarian | 1 | Halaman |
| S04 | Kelola Kategori | 1 | Halaman/Sheet |
| S05 | Daftar Kantong Target | 2 | Halaman |
| S06 | Detail Target + Proyeksi | 2 | Halaman |
| S07 | Buat/Ubah Target | 2 | Sheet |
| S08 | Top Up / Tarik Tabungan | 2 | Sheet |
| S09 | Impor 1: Unggah File | 2 | Halaman (stepper) |
| S10 | Impor 2: Petakan Kolom | 2 | Halaman (stepper) |
| S11 | Impor 3: Pratinjau & Simpan | 2 | Halaman (stepper) |
| S12 | Pengaturan Mata Uang & Kurs | 2 | Halaman |
| S13 | Masuk / Daftar (Google + Email) | 3 | Halaman penuh |
| S14 | Status Sinkron (indikator + sheet detail) | 3 | Komponen global |
| S15 | Pengaturan Tema | 4 | Halaman/Sheet |
| S16 | Pasang Aplikasi (PWA) | 4 | Banner + Sheet |

Navigasi utama (bottom tab bar, 4 item): **Beranda** (S01), **Riwayat** (S03), **Target** (S05), **Pengaturan** (S12, S15, S04, impor). Tombol aksi mengambang (FAB) **+ Catat** di tengah selalu membuka S02.

### 1.2 Hierarki Komponen per Layar

**S01 Dashboard**

1. App bar: sapaan + avatar, indikator sinkron (titik status), pemilih periode.
2. Kartu hero **Total Saldo** (Saldo Kas + Total Tabungan), di bawahnya dua chip: Pemasukan dan Pengeluaran periode terpilih, masing-masing dengan badge persentase perubahan vs periode sebelumnya.
3. Segmented control **7 Hari | 30 Hari**.
4. Kartu **Grafik Tren**: area/line chart dua seri (pemasukan hijau, pengeluaran merah), tooltip saat disentuh.
5. Kartu **Rasio Menabung**: gauge atau progress ring + badge indikator + satu kalimat saran.
6. Kartu **Skor Kesehatan Keuangan**: angka 0-100, label, dan 4 sub-skor yang bisa dibuka.
7. Daftar **Transaksi Terbaru** (5 item) + tautan Lihat semua.
8. Ringkasan **Target Aktif** (maks 2 kartu mini).

**S02 Catat Transaksi (sheet, target selesai dalam 3 ketukan)** Toggle Pengeluaran/Pemasukan, input nominal besar dengan numpad kustom, grid kategori (ikon + nama, maks 8 + Lainnya), tanggal (default hari ini, chip Hari ini / Kemarin / Pilih), catatan opsional, tombol **Simpan**.

**S03 Riwayat & Pencarian** Search bar, chip filter (Semua, Pemasukan, Pengeluaran, Kategori, Rentang tanggal), daftar dikelompokkan per tanggal dengan subtotal harian, geser kiri untuk hapus, ketuk untuk ubah.

**S04 Kelola Kategori** Dua tab (Pengeluaran | Pemasukan), daftar dengan ikon, warna, jumlah transaksi, tombol tambah; sheet pembuat kategori berisi nama, pemilih ikon, pemilih warna.

**S05-S08 Target Tabungan** Kartu target (nama, ikon, progress bar, terkumpul/target, perkiraan tanggal tercapai). Detail: ring progress besar, riwayat top up, grafik proyeksi (garis aktual + garis putus-putus proyeksi + penanda tenggat), tombol Top Up dan Tarik.

**S09-S11 Impor Mutasi** Stepper 3 langkah. Langkah 1: dropzone .csv/.xlsx/.xls. Langkah 2: tabel pratinjau 5 baris + dropdown pemetaan kolom (Tanggal, Keterangan, Debit, Kredit atau Jumlah tunggal, Kategori opsional) + pilihan format tanggal. Langkah 3: tabel pratinjau semua baris dengan penanda baris valid/duplikat/error, ringkasan jumlah, tombol **Simpan Sekaligus**.

**S12 Mata Uang** Daftar mata uang (pencarian), kartu status kurs (nilai, sumber, waktu pembaruan terakhir, badge Live/Cadangan), tombol Perbarui sekarang.

**S13-S16** lihat prompt Layar 5.

### 1.3 Micro-interactions

- Angka saldo dan persentase: animasi count-up 400 ms saat data berubah, hormati prefers-reduced-motion.
- Simpan transaksi: tombol berubah jadi centang 600 ms, sheet turun, baris baru muncul di daftar dengan highlight lembut 1,2 detik.
- Update realtime dari perangkat lain: kartu terkait berkedip halus satu kali dan titik status sinkron berdenyut sekali.
- Progress target: bar terisi dengan easing 500 ms; saat 100% muncul konfeti ringan satu kali dan badge Tercapai.
- Geser untuk hapus: tampil toast Batalkan selama 5 detik sebelum benar-benar dihapus.
- Haptic ringan (navigator.vibrate 10 ms) saat simpan, bila didukung.

### 1.4 State Kosong / Loading / Error

| Layar | Kosong | Loading | Error |
| --- | --- | --- | --- |
| Dashboard | Ilustrasi sederhana + 'Belum ada transaksi. Catat yang pertama' + tombol Catat | Skeleton kartu hero, chart, 3 baris transaksi | Kartu dengan pesan 'Gagal memuat data' + tombol Coba lagi, data terakhir di cache tetap tampil dengan label 'Data tersimpan' |
| Riwayat | 'Tidak ada transaksi cocok' + tombol Hapus filter | Skeleton 8 baris | Banner error di atas daftar |
| Target | 'Belum ada target. Buat kantong pertamamu' | Skeleton 2 kartu | Banner + Coba lagi |
| Impor | Dropzone default | Spinner 'Membaca file...' dengan progres | Pesan spesifik: format tidak didukung, file kosong, kolom tanggal tidak terbaca, ukuran maks 5 MB |
| Kurs | - | Skeleton kartu kurs | Badge 'Kurs Cadangan' + keterangan terakhir diperbarui |
| Login | - | Tombol Google dengan spinner | 'Login gagal, coba lagi' di bawah tombol |

Aturan umum: tanpa data palsu, tanpa layar kosong putih, setiap error punya tindakan lanjutan yang jelas.

### 1.5 Design Tokens

**Warna - Mode Gelap**

| Token | Hex | Kegunaan |
| --- | --- | --- |
| bg | #0B1120 | Latar halaman |
| surface | #111A2E | Kartu |
| surface-2 | #18233D | Kartu bersarang, input |
| border | #24304D | Garis tipis |
| text | #E8EEF9 | Teks utama |
| text-muted | #8FA0BF | Teks sekunder |
| primary | #2DD4A7 | Aksi utama, tab aktif |
| income | #34D399 | Pemasukan, naik baik |
| expense | #F87171 | Pengeluaran |
| warning | #FBBF24 | Peringatan |
| info | #60A5FA | Informasi, kurs |

**Warna - Mode Terang**

| Token | Hex |
| --- | --- |
| bg | #F6F8FB |
| surface | #FFFFFF |
| surface-2 | #EEF2F7 |
| border | #E3E8F0 |
| text | #0F172A |
| text-muted | #5B6B85 |
| primary | #0F9F7A |
| income | #059669 |
| expense | #DC2626 |
| warning | #B45309 |
| info | #2563EB |

Pastikan kontras teks minimal 4,5:1. Jangan pernah mengandalkan warna saja; selalu sertakan ikon panah atau tanda +/-.

**Tipografi**

- Font UI: Plus Jakarta Sans (fallback Inter, system-ui).
- Semua angka uang: font-variant-numeric: tabular-nums, weight 600, agar digit sejajar.
- Skala: hero 36/40 bold, judul kartu 16/24 semibold, nilai sekunder 20/28 semibold, isi 14/20, keterangan 12/16.
- Format uang: 'Rp 1.250.000' (pemisah titik, tanpa desimal untuk IDR); mata uang lain memakai Intl.NumberFormat sesuai locale id-ID.

**Badge indikator rasio & skor**

| Status | Rasio Menabung | Skor Kesehatan | Warna |
| --- | --- | --- | --- |
| Sangat Baik | 30% ke atas | 80-100 | income |
| Baik | 20-29,9% | 60-79 | primary |
| Cukup | 10-19,9% | 40-59 | warning |
| Rendah | di bawah 10% | 20-39 | expense (lembut) |
| Kritis / Defisit | negatif | 0-19 | expense (tegas) |

Badge perubahan persen: pill dengan panah. Untuk pengeluaran, naik = merah dan turun = hijau (kebalikan pemasukan).

**Ikonografi:** Lucide atau Material Symbols Rounded, stroke 1,75 px, ukuran 20/24 px. Kategori default: Makanan, Transportasi, Belanja, Tagihan, Hiburan, Kesehatan, Pendidikan, Lainnya; pemasukan: Gaji, Bonus, Usaha, Lainnya.

**Bentuk:** radius kartu 16 px, input 12 px, pill 999 px; jarak 4/8/12/16/24; bayangan hanya di mode terang, mode gelap memakai border.

---

## 2. Kumpulan Prompt Lanjutan untuk Google Stitch

Cara pakai: tempel **Blok Global** di awal setiap prompt agar semua layar konsisten, lalu tambahkan prompt layar. Generate satu layar per prompt, lalu pakai fitur edit/variasi Stitch untuk revisi kecil.

### Blok Global (tempel di awal semua prompt)

```
App: 'NabungPintar', a personal finance and savings tracker for Indonesian users. Mobile-first (390px), all UI text in Indonesian. Style: clean, modern, trustworthy fintech; generous whitespace; 16px rounded cards; no stock photos. Font: Plus Jakarta Sans. All money amounts use tabular numbers, format 'Rp 1.250.000'. Dark mode palette: background #0B1120, card #111A2E, nested #18233D, border #24304D, text #E8EEF9, muted #8FA0BF, primary mint #2DD4A7, income green #34D399, expense red #F87171, warning amber #FBBF24. Icons: Lucide-style outline, 1.75px stroke. Bottom tab bar: Beranda, Riwayat, Target, Pengaturan, with a centered floating action button '+ Catat'. Use realistic Indonesian placeholder text only as layout sample.
```

### a. Layar 1: Dashboard Keuangan & Analitik 7/30 Hari

```
[Blok Global] Design the home dashboard 'Beranda'. Top app bar: greeting 'Halo, Rina' with avatar, and a small sync status dot. Hero card 'Total Saldo' with a large amount and two chips below: 'Pemasukan' and 'Pengeluaran' for the selected period, each with a percentage change pill vs the previous period (arrow icon; for expenses, increase is red and decrease is green). Below, a segmented control '7 Hari | 30 Hari'. Then a card 'Tren Arus Kas' with a two-series area chart (income green, expense red), light gridlines, x-axis dates, touch tooltip. Then a card 'Rasio Menabung' with a progress ring showing a percentage, a status badge ('Baik'), and one short advice sentence. Then a card 'Kesehatan Keuangan' with a score 0-100, a label badge, and four small sub-score bars (Rasio Menabung, Tren Pengeluaran, Dana Darurat, Konsistensi). Then 'Transaksi Terbaru' list of 5 rows (category icon, name, date, amount colored with + or - sign) and a 'Lihat semua' link. Then 'Target Aktif' with two mini progress cards. Also generate a loading skeleton variant and an empty state variant ('Belum ada transaksi. Catat yang pertama' with a primary button).
```

### b. Layar 2: Catat Transaksi Cepat, Kategori Kustom & Pencarian

```
[Blok Global] Design three screens. (1) A bottom sheet 'Catat Transaksi' over the dimmed dashboard: a two-option toggle 'Pengeluaran | Pemasukan', a huge amount input 'Rp 0' with a custom numeric keypad, a grid of 8 category tiles (icon + label) plus 'Lainnya', date chips 'Hari ini | Kemarin | Pilih tanggal', an optional note field, and a full-width primary button 'Simpan'. (2) A 'Riwayat' screen: search bar 'Cari transaksi...', filter chips (Semua, Pemasukan, Pengeluaran, Kategori, Tanggal), transaction list grouped by date with a daily subtotal on each group header, swipe-left reveals a red delete action, plus an empty state 'Tidak ada transaksi cocok' with 'Hapus filter'. (3) A 'Kategori Saya' screen with tabs 'Pengeluaran | Pemasukan', category rows (icon, name, transaction count), and a bottom sheet 'Kategori Baru' with name input, an icon picker grid and a color swatch picker, button 'Simpan Kategori'.
```

### c. Layar 3: Kantong Target Tabungan & Proyeksi Nabung

```
[Blok Global] Design three screens. (1) 'Target Tabungan' list: cards for each savings pocket with icon, name, progress bar, 'Rp terkumpul / Rp target', percentage, and a line 'Perkiraan tercapai: 14 Agu 2027' with a small status pill ('Sesuai jalur' green, 'Terlambat' amber). Include an empty state 'Belum ada target' and a floating button 'Buat Target'. (2) 'Detail Target': a large progress ring with percentage, key figures (terkumpul, sisa, tenggat, setoran per bulan yang dibutuhkan), a projection chart with a solid line for actual savings, a dashed line for projection and a vertical marker for the deadline, two buttons 'Top Up' and 'Tarik', and a history list of top ups. (3) Bottom sheets: 'Buat Target' (name, target amount, optional deadline date, icon and color picker) and 'Top Up Tabungan' (amount input, source note, quick chips +50rb, +100rb, +500rb, button 'Simpan Top Up').
```

### d. Layar 4: Impor Mutasi CSV/Excel (Column Mapping) & Kurs Mata Uang Live

```
[Blok Global] Design a 3-step import flow with a top stepper 'Unggah > Petakan > Simpan'. Step 1: a large dashed dropzone 'Tarik file ke sini atau pilih file' accepting .csv, .xlsx, .xls, with a note 'Maks 5 MB' and a link 'Lihat contoh format'. Step 2: 'Petakan Kolom': a preview table of the first 5 rows of the uploaded file, above each column a dropdown to map it to 'Tanggal', 'Keterangan', 'Debit (keluar)', 'Kredit (masuk)', 'Jumlah', 'Kategori', or 'Abaikan'; a date format selector ('DD/MM/YYYY', 'YYYY-MM-DD'); button 'Lanjut'. Step 3: 'Pratinjau & Simpan': summary chips ('120 valid', '4 duplikat', '2 error'), a table where rows carry status icons, error rows highlighted with a reason, a toggle 'Lewati duplikat', and a sticky button 'Simpan Sekaligus'. Also design 'Mata Uang' settings: search field, a list of currencies with flag, code and name with the selected one checked, and a status card showing 'Kurs 1 USD = Rp 16.250', a green 'Live' badge, 'Diperbarui 5 menit lalu', plus a variant with an amber 'Kurs Cadangan - terakhir diperbarui kemarin 21.00' badge for offline, and a button 'Perbarui sekarang'.
```

### e. Layar 5: Autentikasi, Status Sinkronisasi Cloud & Install PWA

```
[Blok Global] Design five items. (1) Welcome/login screen: logo, tagline 'Nabung jadi lebih pintar', a prominent white 'Masuk dengan Google' button with the Google logo, a divider 'atau', email and password fields, 'Masuk' button, and a link 'Belum punya akun? Daftar'. Also a 'Daftar' variant with name, email, password, confirm password. (2) A sync status indicator for the app bar with three states: 'Tersimpan' (green check), 'Menyinkronkan...' (animated spinner), 'Offline - perubahan menunggu' (amber cloud-off). (3) A bottom sheet 'Status Sinkron' listing last synced time, number of pending changes, connected devices, and a button 'Sinkronkan sekarang'. (4) 'Pengaturan Tema' with three large preview cards 'Terang', 'Gelap', 'Ikuti Sistem', the selected one outlined in primary. (5) A 'Pasang Aplikasi' banner at the top of the dashboard with an app icon, text 'Pasang NabungPintar di layar utama', buttons 'Pasang' and 'Nanti', plus a bottom sheet with short iOS instructions ('Ketuk Bagikan, lalu Tambah ke Layar Utama').
```

Catatan untuk Stitch: bila hasil melenceng, perbaiki dengan prompt pendek seperti 'Make the hero amount larger and use tabular numbers' daripada generate ulang dari awal. Setelah mode gelap oke, minta variasi mode terang dengan token di bagian 1.5.

---

## 3. Sistem Kalkulasi & Rumus Data Live

### 3.1 Definisi Dasar

Periode dihitung dalam WIB. Hari ini = tanggal WIB saat ini. Semua nilai dalam IDR (amount\_base).

- **Pemasukan(P)** = jumlah semua transaksi bertipe income pada periode P.
- **Pengeluaran(P)** = jumlah semua transaksi bertipe expense pada periode P.
- **Arus Bersih(P)** = Pemasukan(P) - Pengeluaran(P).

### 3.2 Saldo & Total Tabungan

```
Saldo Kas       = SUM(income) - SUM(expense) - SUM(topup) + SUM(withdraw)   (seluruh waktu)
Total Tabungan  = SUM(topup) - SUM(withdraw)                                (seluruh kantong)
Total Saldo     = Saldo Kas + Total Tabungan = SUM(income) - SUM(expense)
```

Top up dan tarik berasal dari tabel savings\_entries. Saldo Kas tidak boleh dibiarkan minus tanpa peringatan: saat top up membuat Saldo Kas negatif, tampilkan konfirmasi 'Saldo kas akan minus. Lanjutkan?'.

### 3.3 Rasio Menabung (%)

```
Rasio Menabung = (Pemasukan - Pengeluaran) / Pemasukan x 100
```

- Jika Pemasukan = 0: tampilkan '-' dan label 'Belum ada pemasukan' (jangan bagi nol).
- Boleh negatif (defisit); tampilkan apa adanya dengan badge Kritis, tetapi ring progress dipotong di 0-100.
- Periode default: 30 hari terakhir; ikut segmented control Dashboard.

### 3.4 Persentase Perubahan

```
Perubahan % = (Nilai Sekarang - Nilai Sebelumnya) / Nilai Sebelumnya x 100
```

Jendela waktu (inklusif, WIB), dengan t = hari ini:

| Perbandingan | Sekarang | Sebelumnya |
| --- | --- | --- |
| 7 vs 7 | t-6 sampai t | t-13 sampai t-7 |
| 30 vs 30 | t-29 sampai t | t-59 sampai t-30 |

Berlaku sama untuk pengeluaran dan pemasukan. Jika Sebelumnya = 0 dan Sekarang > 0: tampilkan badge 'Baru'. Jika keduanya 0: tampilkan '-'. Bulatkan satu desimal. Untuk pengeluaran, kenaikan diberi warna merah; untuk pemasukan, kenaikan diberi warna hijau.

### 3.5 Skor Kesehatan Keuangan (0-100)

Periode dasar: 30 hari terakhir, kecuali disebutkan lain.

| Komponen | Bobot | Rumus poin |
| --- | --- | --- |
| Rasio Menabung | 40 | MIN(MAX(rasio, 0) / 20, 1) x 40 |
| Dana Darurat | 30 | MIN(Total Tabungan / (rata-rata pengeluaran bulanan 3 bulan x 6), 1) x 30 |
| Tren Pengeluaran | 20 | Jika perubahan 30 vs 30 <= 0: 20; jika naik, 20 x MAX(0, 1 - perubahan/50) |
| Konsistensi Pencatatan | 10 | (jumlah hari berbeda yang punya transaksi dalam 30 hari / 30) x 10, maks 10 |

Skor = jumlah poin, dibulatkan ke bilangan bulat. Label mengikuti tabel badge di bagian 1.5. Bila data kurang dari 7 hari, tampilkan 'Data belum cukup' dan sembunyikan skor, supaya skor tidak menyesatkan. Bobot ini asumsi awal yang wajar; mudah diubah karena dihitung di satu fungsi.

### 3.6 Algoritma Proyeksi Tanggal Tercapai Target

```
sisa      = target_amount - saldo_kantong
laju_hari = (SUM(topup) - SUM(withdraw)) pada 60 hari terakhir / MIN(60, hari sejak entri pertama kantong)
```

1. Jika sisa <= 0: status 'Tercapai'.
2. Jika kantong belum punya entri atau laju\_hari <= 0: tampilkan 'Belum bisa diproyeksikan' dan sarankan setoran per bulan.
3. Hari dibutuhkan = CEIL(sisa / laju\_hari).
4. Tanggal proyeksi = hari ini + hari dibutuhkan (WIB). Bila lebih dari 10 tahun, tampilkan 'Lebih dari 10 tahun'.
5. Jika ada tenggat: setoran\_dibutuhkan\_per\_bulan = sisa / (hari ke tenggat / 30). Status 'Sesuai jalur' bila tanggal proyeksi <= tenggat, selain itu 'Terlambat' beserta selisih hari.
6. Syarat minimal data: butuh setidaknya 14 hari sejak entri pertama atau 2 entri; di bawah itu beri label 'Perkiraan awal'.

Titik grafik proyeksi: garis aktual dari entri, lalu garis putus-putus dari titik terakhir dengan kemiringan laju\_hari sampai nilai target.

### 3.7 Konversi Mata Uang

```
amount_base (IDR) = ROUND(amount_original x fx_rate_to_idr)   -- kurs dikunci saat transaksi dibuat
nilai_tampil = amount_base / kurs_IDR_per_mata_uang_tampil     -- hanya untuk tampilan
```

Kurs transaksi dikunci (snapshot) agar laporan lama tidak berubah saat kurs bergerak; kurs live hanya memengaruhi tampilan dan transaksi baru.

---

## 4. Arsitektur Data Live & Skema Database

### 4.1 Gambaran Alur

```
Stitch (HTML/Tailwind) -> komponen React -> TanStack Query -> Supabase JS client
                                                  |                    |
                                         cache + optimistic    PostgreSQL (RLS)
                                                  |                    |
                                          Realtime (WebSocket) <------+
Kurs: API kurs -> fetch -> cache LocalStorage (TTL) -> fallback kurs cadangan
Impor: PapaParse / SheetJS di browser -> validasi -> insert batch ke Supabase
```

### 4.2 Menghubungkan Hasil Stitch ke Data Live

1. Ekspor kode dari Stitch (HTML + Tailwind) per layar, lalu simpan di folder /stitch-export sebagai acuan visual.
2. Pecah menjadi komponen React: AppShell, BalanceHero, TrendChart, RatioCard, HealthScoreCard, TransactionRow, GoalCard, dst. Pindahkan nilai warna ke CSS variables sesuai token bagian 1.5 sehingga mode gelap/terang cukup mengganti atribut data-theme di html.
3. Ganti seluruh teks contoh dengan props. Aturan keras: tidak ada angka hardcode; komponen menerima data atau menampilkan skeleton/empty state.
4. Buat lapisan data tunggal (hooks): useTransactions, useGoals, useSummary(period), useFx. Komponen UI tidak memanggil Supabase langsung.
5. Chart: Chart.js atau Recharts dengan warna dari CSS variables.

### 4.3 Skema Database (Supabase PostgreSQL)

```sql
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income','expense')),
  icon text not null default 'tag',
  color text not null default '#8FA0BF',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, kind, name)
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('income','expense')),
  amount_original bigint not null check (amount_original > 0),
  currency char(3) not null default 'IDR',
  fx_rate_to_idr numeric(18,6) not null default 1,
  amount_base bigint not null check (amount_base > 0),
  category_id uuid references categories(id) on delete set null,
  note text,
  occurred_on date not null,
  import_batch_id uuid,
  import_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on transactions (user_id, occurred_on desc);
create unique index on transactions (user_id, import_hash) where import_hash is not null;

create table savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount bigint not null check (target_amount > 0),
  deadline date,
  icon text not null default 'piggy-bank',
  color text not null default '#2DD4A7',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table savings_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references savings_goals(id) on delete cascade,
  kind text not null check (kind in ('topup','withdraw')),
  amount bigint not null check (amount > 0),
  note text,
  occurred_on date not null default (now() at time zone 'Asia/Jakarta')::date,
  created_at timestamptz not null default now()
);
create index on savings_entries (goal_id, occurred_on);

create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_currency char(3) not null default 'IDR',
  theme text not null default 'system' check (theme in ('light','dark','system')),
  updated_at timestamptz not null default now()
);

create table import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  rows_saved int not null default 0,
  created_at timestamptz not null default now()
);
```

**Row Level Security (wajib, ulangi untuk setiap tabel):**

```sql
alter table transactions enable row level security;
create policy own_rows on transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
```

Tambahkan trigger untuk mengisi kategori default saat akun baru dibuat, dan trigger updated\_at. Aktifkan Realtime pada transactions, savings\_entries, savings\_goals, categories. Fungsi ringkasan (RPC) disarankan untuk dashboard agar rumus bagian 3 dihitung di server dalam satu panggilan, mis. dashboard\_summary(p\_days int) yang mengembalikan pemasukan, pengeluaran, nilai periode sebelumnya, saldo kas, dan total tabungan. Ini menjaga angka di semua perangkat identik.

### 4.4 Realtime & Sinkron Antar Perangkat

```js
const channel = supabase.channel('rt-' + userId)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: 'user_id=eq.' + userId },
      () => queryClient.invalidateQueries({ queryKey: ['summary'] }))
  .on('postgres_changes', { event: '*', schema: 'public', table: 'savings_entries', filter: 'user_id=eq.' + userId },
      () => queryClient.invalidateQueries({ queryKey: ['goals'] }))
  .subscribe(status => setSyncState(status === 'SUBSCRIBED' ? 'saved' : 'syncing'));
```

- Tulis dengan optimistic update; bila gagal, rollback dan tampilkan toast.
- Indikator sinkron: Tersimpan (channel SUBSCRIBED dan antrean kosong), Menyinkronkan (ada mutasi berjalan), Offline (navigator.onLine false atau channel putus).
- Offline: mutasi ditaruh di antrean LocalStorage/IndexedDB dan dikirim ulang saat online. Untuk v1, konflik diselesaikan last-write-wins berdasarkan updated\_at.
- Saat tab kembali aktif (visibilitychange), lakukan refetch penuh sebagai jaring pengaman bila ada event terlewat.

### 4.5 Impor CSV/Excel

1. **Baca:** PapaParse untuk .csv (header: false, skipEmptyLines), SheetJS untuk .xlsx/.xls (sheet pertama, cellDates: true). Batas 5 MB dan 5.000 baris per impor.
2. **Petakan:** simpan pemetaan terakhir di LocalStorage agar impor berikutnya dari bank yang sama otomatis terisi. Dukung dua pola: kolom Debit/Kredit terpisah, atau satu kolom Jumlah (negatif = pengeluaran).
3. **Validasi:** tanggal terbaca sesuai format terpilih; nominal numerik setelah membersihkan 'Rp', titik ribuan, dan koma desimal; baris tidak valid ditandai, bukan dibuang diam-diam.
4. **Duplikat:** import\_hash = sha256(user\_id + tanggal + nominal + keterangan yang dinormalkan + nomor urut baris pada hari itu). Unique index di bagian 4.3 mencegah dobel saat impor ulang.
5. **Simpan Sekaligus:** buat satu import\_batches, lalu insert batch 500 baris per permintaan; tampilkan progres. Beri tombol 'Batalkan impor' yang menghapus semua baris dengan import\_batch\_id tersebut.

### 4.6 Kurs Mata Uang Live + Cache Offline

- **Sumber:** gunakan satu API kurs gratis tanpa API key yang mendukung IDR, misalnya Frankfurter (data bank sentral) atau Open Exchange Rates versi gratis. Sebelum coding, kita verifikasi dulu bahwa pilihan itu mendukung IDR dan mata uang yang kamu butuhkan, karena ketersediaan dan batas pemakaian bisa berubah.
- **Cache LocalStorage:**

```js
const KEY = 'np_fx_v1';
const TTL_MS = 6 * 60 * 60 * 1000; // 6 jam
async function getRates() {
  const cached = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return { ...cached, source: 'live' };
  try {
    const rates = await fetchFromApi();            // { USD: 16250, EUR: 17600, ... } dalam IDR
    const fresh = { rates, fetchedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(fresh));
    return { ...fresh, source: 'live' };
  } catch (e) {
    if (cached) return { ...cached, source: 'cache' };   // Kurs Cadangan
    return { rates: null, fetchedAt: null, source: 'none' };
  }
}
```

- Badge UI: 'Live' bila baru diambil atau cache masih dalam TTL, 'Kurs Cadangan' bila API gagal dan memakai cache lama, dan bila tidak ada cache sama sekali, tampilan tetap IDR dengan pesan 'Kurs belum tersedia'.
- Jangan pernah menampilkan kurs tebakan. Waktu pembaruan selalu berasal dari fetchedAt yang nyata.

### 4.7 PWA

- manifest.webmanifest (nama, short\_name 'NabungPintar', ikon 192/512 maskable, theme\_color mengikuti tema, display standalone, start\_url '/').
- Service worker (vite-plugin-pwa): precache aset aplikasi, network-first untuk API, jangan cache respons Supabase yang berisi data pribadi di cache bersama.
- Banner Pasang: tangkap event beforeinstallprompt, tampilkan banner kita sendiri, panggil prompt() saat 'Pasang' diketuk; di iOS tampilkan petunjuk manual karena event ini tidak ada.

### 4.8 Autentikasi

- Supabase Auth: Google OAuth + email/password. Redirect URL didaftarkan untuk domain produksi dan localhost.
- Rute dilindungi: tanpa sesi, arahkan ke S13. Sesi disegarkan otomatis oleh klien Supabase.
- Keluar menghapus cache query lokal agar data akun sebelumnya tidak tersisa di perangkat.

---

## 5. Urutan Kerja yang Disarankan

Setiap langkah punya verifikasi supaya bisa dicek sebelum lanjut.

1. **Desain di Stitch**: generate Layar 1-5 dengan Blok Global, lalu verifikasi semua token warna dan state kosong/loading muncul.
2. **Fondasi proyek**: Vite + React + Tailwind + token CSS, lalu verifikasi mode gelap/terang berpindah dengan satu atribut.
3. **Supabase**: jalankan skema 4.3 beserta RLS, lalu verifikasi dua akun uji tidak bisa saling membaca data.
4. **Fase 1**: transaksi dan dashboard dengan rumus bagian 3, lalu verifikasi angka dengan tes unit berisi contoh hitungan manual (termasuk pembagi nol dan periode sebelumnya kosong).
5. **Fase 2**: target + proyeksi, impor, kurs, lalu verifikasi impor ulang file yang sama tidak membuat duplikat dan kurs offline memakai badge Cadangan.
6. **Fase 3-4**: auth, realtime, tema, PWA, lalu verifikasi perubahan di satu perangkat muncul di perangkat lain dalam beberapa detik dan aplikasi bisa dipasang.

## 6. Pertanyaan Terbuka (jawab singkat sebelum coding)

1. Apakah bobot Skor Kesehatan di 3.5 sudah sesuai, atau mau pendekatan yang lebih sederhana?
2. Apakah Top Up memang harus mengurangi Saldo Kas (seperti asumsi di 3.2), atau tabungan dicatat terpisah dari saldo?
3. Mata uang mana saja yang wajib didukung di versi pertama?
