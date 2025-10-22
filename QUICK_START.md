# Quick Start - Fitur Inspeksi Kendaraan

## 🎯 Akses Cepat

### Untuk Petugas Lapangan:

1. **Login** sebagai Petugas Lapangan
   - Email: petugas@jasamarga.com
   - Password: (sesuai database)

2. **Dashboard Petugas Lapangan**
   - URL: `/dashboard/petugas-lapangan`
   - Lihat statistik inspeksi
   - Akses menu inspeksi

3. **Buat Inspeksi Baru**
   - Klik tombol "➕ Buat Inspeksi Baru"
   - Atau akses: `/dashboard/petugas-lapangan/inspeksi`

4. **Lihat Riwayat**
   - Klik tombol "📋 Lihat Riwayat Inspeksi"
   - Atau akses: `/dashboard/petugas-lapangan/riwayat`

## 📝 Cara Mengisi Form Inspeksi

### STEP 1: Kategori Kendaraan (Wajib)
- Pilih salah satu: Ambulance, Plaza, Derek, Kamtib, atau Rescue
- Isi nomor plat kendaraan
- Isi lokasi inspeksi
- Klik "Lanjut →"

### STEP 2: Kelengkapan Petugas (Wajib)
- Nama petugas (auto-fill dari session)
- NIP petugas
- Upload foto ID Card
- Upload foto seragam (full body)
- Klik "Lanjut →"

### STEP 3: Data Kendaraan (Wajib)
- Merk kendaraan
- Tahun kendaraan
- Warna kendaraan
- Kondisi: Baik / Cukup / Perlu Perbaikan
- Kilometer kendaraan
- Upload foto bodi
- Upload foto interior
- **Checklist kelengkapan** (sesuai kategori yang dipilih)
- Klik "Lanjut →"

### STEP 4: Dokumen Kendaraan (Wajib STNK, Opsional lainnya)

**STNK (Wajib):**
- Nomor STNK
- Tanggal masa berlaku
- Upload foto STNK

**KIR (Opsional):**
- Nomor KIR
- Tanggal masa berlaku
- Upload foto KIR

**Asuransi (Opsional):**
- Nama perusahaan asuransi
- Tanggal masa berlaku
- Upload foto polis
- Klik "Lanjut →"

### STEP 5: Review & Submit
- Cek semua data yang sudah diisi
- Tambahkan catatan jika perlu
- Pilih:
  - **💾 Simpan Draft** = Simpan untuk dilanjutkan nanti
  - **📤 Kirim ke Manager Traffic** = Submit untuk approval

## 🎨 Kategori & Kelengkapan

Setiap kategori memiliki checklist kelengkapan berbeda:

### 🚑 AMBULANCE (10 item)
Fokus: Peralatan medis dan penyelamatan nyawa

### 🏢 PLAZA (10 item)
Fokus: Peralatan operasional gerbang tol

### 🚚 DEREK (10 item)
Fokus: Peralatan evakuasi kendaraan

### 🛡️ KAMTIB (10 item)
Fokus: Peralatan keamanan dan patroli

### 🚒 RESCUE (10 item)
Fokus: Peralatan penyelamatan darurat

## ✅ Status Inspeksi

| Status | Icon | Keterangan |
|--------|------|------------|
| DRAFT | 💾 | Tersimpan, bisa diedit |
| SUBMITTED | ⏳ | Menunggu approval Manager |
| APPROVED | ✅ | Disetujui Manager Traffic |
| REJECTED | ❌ | Ditolak dengan catatan |

## 🔍 Filter & Pencarian

Di halaman **Riwayat Inspeksi**:
- Filter berdasarkan **Status** (Draft, Submit, Approved, Rejected)
- Filter berdasarkan **Kategori** (Ambulance, Plaza, Derek, Kamtib, Rescue)
- Kombinasi filter untuk pencarian lebih spesifik

## 🎬 Workflow Lengkap

```
START
  ↓
1. Buka Dashboard Petugas Lapangan
  ↓
2. Klik "Buat Inspeksi Baru"
  ↓
3. Isi Form 5 Step
  ↓
4. Review Data
  ↓
5. Pilih: Draft atau Submit
  ↓
   ├─→ Draft: Bisa edit lagi nanti
   └─→ Submit: Kirim ke Manager Traffic
        ↓
     Manager Traffic Review
        ↓
        ├─→ Approve: Status = APPROVED ✅
        └─→ Reject: Status = REJECTED ❌
END
```

## 💡 Tips

1. **Simpan Draft** jika belum punya semua foto
2. **Upload foto yang jelas** untuk memudahkan approval
3. **Cek kelengkapan** sesuai kategori sebelum submit
4. **Isi catatan** jika ada kondisi khusus
5. **Perhatikan masa berlaku** dokumen agar tidak kadaluarsa

## 🐛 Troubleshooting

### "Tidak bisa upload foto"
- Pastikan file format: JPG, PNG, atau JPEG
- Ukuran foto tidak terlalu besar (max 5MB recommended)

### "Form tidak bisa next"
- Pastikan semua field wajib (*) sudah diisi
- Cek apakah foto sudah diupload

### "Data tidak tersimpan"
- Cek koneksi internet
- Pastikan session masih aktif (belum logout)

### "Tidak bisa edit inspeksi"
- Hanya DRAFT yang bisa diedit
- Inspeksi yang sudah SUBMITTED tidak bisa diedit

## 📞 Support

Jika ada kendala atau pertanyaan:
- Hubungi tim IT
- Laporkan bug ke developer
- Baca dokumentasi lengkap di `FITUR_INSPEKSI.md`

---

**Happy Inspecting! 🚗✨**
