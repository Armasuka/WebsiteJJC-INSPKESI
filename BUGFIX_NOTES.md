# Bug Fixes - Manager Dashboard & Rekap

## 🆕 Fitur Baru

### 📧 Sistem Notifikasi Email Real-time
**Fitur:** Notifikasi email otomatis untuk Manager dan Petugas tentang status inspeksi
**Implementasi:**
- Email notifikasi ke Manager Traffic saat ada inspeksi baru
- Email notifikasi ke Manager Operational saat inspeksi sudah approved Traffic
- Email notifikasi ke Petugas saat inspeksi ditolak (dengan alasan penolakan)
- Template email profesional dengan styling yang menarik
- Support untuk multiple managers (semua manager akan dapat email)

**File yang Dibuat:**
- `lib/emailService.ts` - Service untuk mengirim email dengan template
  - `sendEmail()` - Fungsi utama untuk kirim email
  - `emailTemplateInspeksiBaru()` - Template untuk inspeksi baru
  - `emailTemplateApprovedTraffic()` - Template untuk approved by Traffic
  - `emailTemplateRejected()` - Template untuk inspeksi ditolak
- `EMAIL_SETUP.md` - Dokumentasi lengkap cara setup email (Gmail)

**File yang Diubah:**
- `app/api/inspeksi/route.ts`
  - Import email service
  - Kirim email ke Manager Traffic saat inspeksi submitted
- `app/api/inspeksi/[id]/route.ts`
  - Import email service
  - Kirim email ke Manager Operational saat approved by Traffic
  - Kirim email ke Petugas saat rejected by Traffic
  - Kirim email ke Petugas saat rejected by Operational
- `.env`
  - Tambah konfigurasi `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_ENABLED`
- `package.json`
  - Install `nodemailer` dan `@types/nodemailer`

**Cara Mengaktifkan:**
1. Setup App Password di Gmail (lihat `EMAIL_SETUP.md`)
2. Update `.env` dengan email dan password
3. Set `EMAIL_ENABLED="true"`
4. Restart development server

**Fitur Email:**
- ✅ Design responsif dan modern
- ✅ Warna berbeda per jenis notifikasi (biru=traffic, ungu=ops, merah=reject)
- ✅ Tombol langsung ke dashboard atau detail inspeksi
- ✅ Info lengkap: kategori, nomor kendaraan, petugas, tanggal
- ✅ Untuk reject: tampilkan alasan penolakan dengan jelas
- ✅ Footer profesional dengan disclaimer
- ✅ Emoji untuk visual yang friendly
- ✅ Error handling - email gagal tidak mempengaruhi proses utama
- ✅ Logging lengkap untuk monitoring

**Manfaat:**
- Manager langsung tahu ada inspeksi baru tanpa harus cek dashboard
- Petugas langsung tahu jika laporan ditolak beserta alasannya
- Mempercepat proses approval
- Meningkatkan responsiveness tim
- Notifikasi real-time via email (tidak perlu refresh halaman)

## Masalah yang Diperbaiki

### 1. ✅ Fitur Tolak (Reject) untuk Manager Operational
**Masalah:** Manager Operational tidak memiliki opsi untuk menolak laporan yang sudah disetujui Manager Traffic
**Perbaikan:**
- Menambahkan tombol "❌ Tolak Laporan" di modal preview Manager Operational
- Menambahkan modal konfirmasi reject dengan form input alasan penolakan
- Menambahkan handler `reject_operational` di API endpoint
- Laporan yang ditolak akan berubah status menjadi REJECTED dengan penanda "OPERATIONAL"
- Petugas akan melihat alasan penolakan dan bisa memperbaiki laporan
- **UPDATE:** Status card di dashboard petugas sekarang menampilkan "DITOLAK" untuk Manager Operational

**File yang Diubah:**
- `app/dashboard/manager-operational/page.tsx`
  - Tambah state: `showRejectModal`, `rejectionNote`, `rejecting`
  - Tambah fungsi: `handleOpenRejectModal()`, `handleCloseRejectModal()`, `handleRejectInspeksi()`
  - Tambah tombol "Tolak Laporan" di modal preview
  - Tambah modal konfirmasi reject dengan textarea untuk alasan
- `app/api/inspeksi/[id]/route.ts`
  - Tambah handler untuk action `reject_operational`
  - Validasi bahwa laporan sudah disetujui Manager Traffic
  - Update status ke REJECTED dengan rejectedBy "OPERATIONAL"
- `app/dashboard/petugas-lapangan/page.tsx`
  - Tambah field `rejectedBy`, `rejectedAt`, `rejectionNote` ke interface
  - Update logika card Manager Traffic untuk menampilkan status "DITOLAK" jika ditolak
  - Update logika card Manager Operational untuk menampilkan status "DITOLAK" jika ditolak
  - Tampilkan tanggal penolakan

**Alur Reject:**
1. Manager Operational buka detail laporan yang sudah approved Manager Traffic
2. Klik tombol "❌ Tolak Laporan"
3. Muncul modal untuk input alasan penolakan (wajib diisi)
4. Setelah submit, laporan berubah status menjadi REJECTED
5. Petugas dapat melihat alasan di halaman detail inspeksi
6. **Card status di dashboard petugas menampilkan "DITOLAK" dengan tanggal**

**Manfaat:**
- Manager Operational bisa memberikan feedback detail tentang kesalahan
- Petugas tahu persis apa yang harus diperbaiki
- Meningkatkan kualitas laporan inspeksi
- Status penolakan jelas terlihat di dashboard petugas

### 2. ✅ Fitur Komentar untuk Manager Traffic dan Manager Operational
**Masalah:** Fitur komentar hanya tersedia di halaman detail inspeksi petugas, tidak ada di modal preview manager
**Perbaikan:**
- Menambahkan komponen `KomentarSection` ke dalam modal preview Manager Traffic
- Menambahkan komponen `KomentarSection` ke dalam modal preview Manager Operational
- Sekarang manager bisa berkomunikasi dengan petugas melalui komentar saat review laporan
- Komentar muncul di antara preview laporan dan form tanda tangan
- **PENTING:** Komentar TIDAK ditampilkan di PDF/Print, hanya di layar web untuk komunikasi internal

**File yang Diubah:**
- `app/dashboard/manager-traffic/page.tsx`
  - Import `KomentarSection`
  - Tambahkan section komentar dalam modal preview
- `app/dashboard/manager-operational/page.tsx`
  - Import `KomentarSection`
  - Tambahkan section komentar dalam modal preview
- `app/components/PreviewInspeksi.tsx`
  - Hapus section komentar dari preview (tidak perlu di PDF/Print)
  - Hapus interface `Komentar` yang tidak digunakan

**Manfaat:**
- Manager bisa memberikan komentar/feedback langsung saat review laporan
- Komunikasi 2-arah antara petugas dan manager
- Tidak perlu membuka halaman terpisah untuk berkomentar
- Komentar tidak mengotori dokumen resmi (PDF/Print) - hanya untuk komunikasi internal

### 3. ✅ Diagram Statistik di Halaman Rekap Manager
**Masalah:** Diagram tidak menampilkan data inspeksi yang sudah di-ACC
**Perbaikan:**
- Memperbaiki query di API `/api/rekap-manager` untuk menghitung inspeksi dengan status `APPROVED_BY_OPERATIONAL`
- Menambahkan logging untuk debugging
- Memperbaiki range tanggal agar termasuk waktu hingga 23:59:59

**File yang Diubah:**
- `app/api/rekap-manager/route.ts`

### 3. ✅ Chart Data di Tab Visualisasi
**Masalah:** Chart hanya menampilkan data rekap yang sudah dibaca
**Perbaikan:**
- Mengubah logika `calculateChartData()` untuk menggunakan semua rekap (bukan hanya yang sudah dibaca)
- Sekarang menampilkan semua data inspeksi yang pernah di-ACC

**File yang Diubah:**
- `app/dashboard/manager-operational/rekap/page.tsx`
- `app/dashboard/manager-traffic/rekap/page.tsx`

### 4. ✅ Tombol "Lihat" di Halaman Manager Tidak Berfungsi
**Masalah:** Tombol menggunakan anchor tag yang mengarah ke halaman lain, tidak membuka modal preview
**Perbaikan:**
- Mengubah tombol "Lihat" dari anchor tag menjadi button dengan onClick
- Tombol sekarang membuka modal preview yang sama dengan tombol "Setujui"
- Berlaku untuk kedua tab (Pending & Approved)

**File yang Diubah:**
- `app/dashboard/manager-operational/page.tsx` (2 lokasi)
- `app/dashboard/manager-traffic/page.tsx` (2 lokasi)

### 5. ✅ Tombol "Cetak PDF" di Halaman Rekap ACC
**Masalah:** Tombol hanya link ke halaman detail, tidak benar-benar generate PDF
**Perbaikan:**
- Menambahkan fungsi `handleDownloadPDF()` yang memanggil API generate-pdf
- Tombol sekarang langsung download PDF tanpa buka halaman baru
- Menampilkan loading state saat generate PDF
- Menggunakan nama file yang deskriptif: `Inspeksi_{NoPolisi}_{Tanggal}.pdf`

**File yang Diubah:**
- `app/dashboard/petugas-lapangan/rekap-acc/page.tsx`

### 6. ✅ **CRITICAL BUG**: Laporan ACC Tidak Muncul di Form Petugas
**Masalah:** Laporan yang sudah di-ACC oleh kedua manager tidak muncul di halaman Rekap ACC petugas
**Root Cause:**
- Query hanya mengambil status `APPROVED_BY_OPERATIONAL` (sudah di-ACC oleh keduanya)
- Ketika hanya di-ACC oleh Manager Traffic, status masih `APPROVED_BY_TRAFFIC` sehingga tidak muncul

**Perbaikan:**
1. **Halaman Rekap ACC Petugas (`app/dashboard/petugas-lapangan/rekap-acc/page.tsx`)**:
   - Mengubah query untuk mengambil semua laporan dengan status `APPROVED_BY_TRAFFIC` atau `APPROVED_BY_OPERATIONAL`
   - Menambahkan field `approvedAtTraffic` dan `status` di interface `InspeksiItem`
   - Memperbaiki logika filter berdasarkan tanggal approval (gunakan operational atau traffic)
   - Menampilkan status yang lebih jelas: "✓ FULLY APPROVED" atau "✓ TRAFFIC"
   - Memperbaiki export Excel untuk menampilkan tanggal dan status yang sesuai

2. **API Rekap Manager (`app/api/rekap-manager/route.ts`)**:
   - Mengubah query menghitung inspeksi untuk include kedua status (APPROVED_BY_TRAFFIC & APPROVED_BY_OPERATIONAL)
   - Menggunakan OR condition untuk filter tanggal (cek approvedAtTraffic atau approvedAtOperational)
   - Memastikan rekap yang dikirim ke manager menghitung semua laporan yang ter-ACC

**File yang Diubah:**
- `app/dashboard/petugas-lapangan/rekap-acc/page.tsx`
- `app/api/rekap-manager/route.ts`

**Impact:** Petugas sekarang bisa melihat laporan yang ter-ACC bahkan jika baru di-approve oleh Manager Traffic

### 6. ✅ **CRITICAL BUG**: Status "Menunggu Persetujuan" Tidak Update di Dashboard
**Masalah:** Di dashboard petugas, status badge sudah menunjukkan "FULLY APPROVED", tetapi kotak Manager Traffic & Manager Operational masih menampilkan "Menunggu Persetujuan" meskipun sudah di-approve
**Root Cause:**
1. API `/api/inspeksi` tidak mengembalikan field `approvedByTraffic` dan `approvedByOperational` (hanya mengembalikan `approvedAtTraffic` dan `approvedAtOperational`)
2. Logika kondisional di dashboard mengecek field yang tidak ada dalam response
3. Status badge mengecek enum status yang salah (`'APPROVED'` vs `'APPROVED_BY_OPERATIONAL'`)

**Perbaikan:**
1. **API Inspeksi (`app/api/inspeksi/route.ts`)**:
   - Menambahkan field `approvedByTraffic` dan `approvedByOperational` ke dalam select query
   - Sekarang response API lengkap dengan semua field approval yang dibutuhkan

2. **Dashboard Petugas (`app/dashboard/petugas-lapangan/page.tsx`)**:
   - Memperbaiki logika status badge untuk mengecek `APPROVED_BY_TRAFFIC` dan `APPROVED_BY_OPERATIONAL` (bukan `'APPROVED'`)
   - Status badge sekarang menampilkan:
     - **"FULLY APPROVED"** (hijau) untuk `APPROVED_BY_OPERATIONAL`
     - **"APPROVED BY TRAFFIC"** (biru) untuk `APPROVED_BY_TRAFFIC`
     - **"MENUNGGU APPROVAL"** (kuning) untuk `SUBMITTED`
     - **"DRAFT"** (abu-abu) untuk `DRAFT`

**File yang Diubah:**
- `app/api/inspeksi/route.ts`
- `app/dashboard/petugas-lapangan/page.tsx`

**Impact:** Dashboard petugas sekarang menampilkan status approval yang akurat untuk setiap manager

## Cara Testing

### Test 1: Kirim Rekap ke Manager
1. Login sebagai Petugas Lapangan
2. Pergi ke "Rekap Hasil ACC"
3. Pilih periode (misal: Bulan ini)
4. Klik "Kirim ke Manager"
5. Isi form dan kirim

### Test 2: Lihat Diagram di Manager
1. Login sebagai Manager Traffic atau Manager Operational
2. Klik "Lihat Rekap Laporan"
3. Buka tab "Visualisasi Data"
4. Diagram seharusnya menampilkan data inspeksi yang sudah di-ACC

### Test 3: Tombol Lihat di Manager
1. Login sebagai Manager
2. Di dashboard utama, klik tombol "Lihat" pada salah satu inspeksi
3. Modal preview seharusnya muncul dengan detail lengkap
4. Coba di tab "Pending" dan "Approved"

### Test 4: Download PDF
1. Login sebagai Petugas Lapangan
2. Pergi ke "Rekap Hasil ACC"
3. Klik tombol "Cetak PDF" pada salah satu inspeksi
4. PDF seharusnya ter-download otomatis

## Catatan Tambahan

### Keamanan
- Package `xlsx` versi 0.18.5 memiliki vulnerability HIGH severity
- Pertimbangkan untuk upgrade ke versi terbaru atau gunakan alternatif seperti `exceljs`

### Performance
- API rekap sekarang memiliki logging yang bisa membantu debugging
- Pertimbangkan untuk menambahkan caching untuk chart data jika data besar

### Future Improvements
1. Tambahkan filter tanggal di halaman rekap manager
2. Tambahkan fitur export chart ke gambar
3. Tambahkan notifikasi real-time saat ada rekap baru
4. Implementasi pagination untuk rekap yang banyak
