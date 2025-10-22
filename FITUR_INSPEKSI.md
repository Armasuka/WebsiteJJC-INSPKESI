# Fitur Inspeksi Kendaraan - Petugas Lapangan

## 📋 Deskripsi
Fitur inspeksi kendaraan untuk Petugas Lapangan Jasa Marga dengan 5 kategori kendaraan: **Ambulance**, **Plaza**, **Derek**, **Kamtib**, dan **Rescue**.

## 🚗 Kategori Kendaraan

### 1. 🚑 Ambulance
Kendaraan medis untuk penanganan darurat kesehatan
**Kelengkapan:**
- Tabung Oksigen (min 2 unit)
- Brankar/Tandu
- Kotak P3K Lengkap
- Alat Resusitasi (Ambu Bag)
- Defibrillator
- Sirene dan Lampu Rotator
- Tanda Ambulance
- Alat Pengukur Tekanan Darah
- Stetoskop
- Selimut Steril

### 2. 🏢 Plaza
Kendaraan untuk operasional gerbang tol
**Kelengkapan:**
- Radio Komunikasi
- Alat Tulis Kantor
- Komputer/Tablet Genggam
- Printer Receipt
- Uang Kembalian
- Rompi Keselamatan
- Tanda Plaza
- CCTV Operasional
- Pembaca Kartu E-Toll
- Sistem Palang Otomatis

### 3. 🚚 Derek
Kendaraan untuk evakuasi kendaraan mogok/kecelakaan
**Kelengkapan:**
- Kabel Derek (Towing Cable)
- Dongkrak Hidrolik
- Roda Ganjal
- Lampu Strobo/Warning Light
- Rambu Peringatan
- Safety Cone (min 5 unit)
- Tali Pengikat Kendaraan
- Sarung Tangan Safety
- Radio Komunikasi
- Tool Kit Lengkap

### 4. 🛡️ Kamtib
Kendaraan untuk keamanan dan ketertiban
**Kelengkapan:**
- Radio Komunikasi HT
- Rompi Reflektif
- Tongkat Lalu Lintas
- Peluit
- Senter LED
- Buku Catatan Patroli
- Alat Pengaman Diri
- Tanda Pengenal
- Rambu Pengamanan
- Kamera Dokumentasi

### 5. 🚒 Rescue
Kendaraan penyelamatan untuk situasi darurat
**Kelengkapan:**
- Peralatan Cutting/Pemotong
- Alat Pemadam Kebakaran (APAR)
- Tali Kernmantle
- Safety Harness
- Helmet Safety
- Kotak P3K
- Lampu Sorot Portable
- Radio Komunikasi
- Safety Cone
- Tool Kit Emergency

## 📝 Form Inspeksi

### Step 1: Kategori & Informasi Dasar
- Kategori Kendaraan
- Nomor Kendaraan (Plat)
- Lokasi Inspeksi

### Step 2: Kelengkapan Petugas
- Nama Petugas
- NIP Petugas
- **Foto ID Card** (wajib)
- **Foto Seragam** Full Body (wajib)

### Step 3: Data Kendaraan
- Merk Kendaraan
- Tahun Kendaraan
- Warna Kendaraan
- Kondisi Kendaraan (Baik/Cukup/Perlu Perbaikan)
- Kilometer Kendaraan
- **Foto Bodi Kendaraan** (wajib)
- **Foto Interior Kendaraan** (wajib)
- **Checklist Kelengkapan** sesuai kategori

### Step 4: Masa Berlaku Dokumen

#### STNK (Wajib)
- Nomor STNK
- Masa Berlaku STNK
- **Foto STNK**

#### KIR (Opsional - untuk kendaraan umum)
- Nomor KIR
- Masa Berlaku KIR
- **Foto KIR**

#### Asuransi (Opsional)
- Nama Perusahaan Asuransi
- Masa Berlaku Asuransi
- **Foto Polis Asuransi**

### Step 5: Review & Submit
- Ringkasan semua data
- Catatan tambahan
- Pilihan: Simpan Draft atau Kirim ke Manager Traffic

## 🔄 Alur Kerja

```
1. Petugas Lapangan → Buat Inspeksi
   ↓
2. Lengkapi Form 5 Step
   ↓
3. Review Data
   ↓
4. Pilihan:
   - 💾 Simpan Draft (untuk dilanjutkan nanti)
   - 📤 Kirim ke Manager Traffic
   ↓
5. Manager Traffic → Review & Tanda Tangan
   ↓
6. Status:
   - ✅ Disetujui
   - ❌ Ditolak (dengan catatan)
```

## 📊 Status Inspeksi

- **DRAFT** (💾): Tersimpan tapi belum dikirim
- **SUBMITTED** (⏳): Menunggu approval Manager Traffic
- **APPROVED** (✅): Disetujui oleh Manager Traffic
- **REJECTED** (❌): Ditolak oleh Manager Traffic

## 🎯 Fitur

### Dashboard Petugas Lapangan
- ✅ Statistik inspeksi (Total, Draft, Menunggu, Disetujui, Ditolak)
- ✅ Tombol cepat untuk inspeksi baru
- ✅ Lihat kategori kendaraan
- ✅ Link ke riwayat inspeksi

### Form Inspeksi
- ✅ Multi-step form (5 langkah)
- ✅ Progress indicator
- ✅ Upload foto untuk setiap bukti
- ✅ Checklist kelengkapan sesuai kategori
- ✅ Validasi input
- ✅ Simpan sebagai draft
- ✅ Submit ke Manager Traffic

### Riwayat Inspeksi
- ✅ Daftar semua inspeksi
- ✅ Filter berdasarkan status
- ✅ Filter berdasarkan kategori
- ✅ Lihat detail inspeksi
- ✅ Edit draft
- ✅ Badge status warna-warni

## 🗂️ Struktur File

```
app/
├── dashboard/
│   └── petugas-lapangan/
│       ├── page.tsx                 # Dashboard utama
│       ├── inspeksi/
│       │   └── page.tsx             # Form inspeksi kendaraan
│       └── riwayat/
│           └── page.tsx             # Riwayat inspeksi
├── api/
│   └── inspeksi/
│       ├── route.ts                 # API GET & POST inspeksi
│       └── [id]/
│           └── route.ts             # API GET, PATCH, DELETE by ID
prisma/
└── schema.prisma                    # Model Inspeksi
types/
└── next-auth.d.ts                   # TypeScript definitions
```

## 🛠️ Instalasi & Setup

### 1. Migrasi Database
```bash
npx prisma migrate dev --name add_inspeksi_model
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Run Development Server
```bash
npm run dev
```

## 🔐 Permissions

### Petugas Lapangan dapat:
- ✅ Membuat inspeksi baru
- ✅ Menyimpan draft
- ✅ Mengedit draft
- ✅ Menghapus draft
- ✅ Submit inspeksi ke Manager Traffic
- ✅ Melihat riwayat inspeksi sendiri

### Manager Traffic dapat:
- ✅ Melihat semua inspeksi yang disubmit
- ✅ Menyetujui inspeksi
- ✅ Menolak inspeksi (dengan catatan)
- ✅ Melihat detail lengkap termasuk foto

## 📱 Tampilan

### Dashboard
- Card statistik dengan warna berbeda per status
- Tombol aksi cepat
- Info kategori kendaraan

### Form Inspeksi
- Progress bar 5 step
- Form field yang sesuai per step
- Upload foto dengan preview
- Checklist interaktif
- Review sebelum submit

### Riwayat
- Card per inspeksi dengan info lengkap
- Badge status berwarna
- Icon kategori
- Tombol detail dan edit

## 🚀 Fitur Mendatang (Opsional)

- [ ] Upload foto ke cloud storage (S3/Cloudinary)
- [ ] Preview foto sebelum upload
- [ ] Export PDF laporan inspeksi
- [ ] Notifikasi real-time
- [ ] Signature pad untuk tanda tangan digital
- [ ] Timeline history approval
- [ ] Dashboard Manager Traffic
- [ ] Statistik dan analitik
- [ ] Reminder masa berlaku dokumen

## 📞 Kontak

Untuk pertanyaan atau masukan terkait fitur ini, silakan hubungi tim development.

---
**Dibuat oleh:** AI Assistant  
**Tanggal:** Oktober 2025  
**Versi:** 1.0
