# Migration Notes - MinIO to Database Storage

## Tanggal Perubahan
29 Oktober 2025

## Alasan Migrasi
MinIO sekarang berbayar, sehingga sistem penyimpanan gambar dipindahkan dari MinIO ke penyimpanan langsung di database sebagai base64 string.

## Perubahan yang Dilakukan

### 1. File yang Dihapus
- `lib/minio.ts` - File konfigurasi dan fungsi MinIO tidak diperlukan lagi

### 2. Dependencies yang Dihapus
- Package `minio` dihapus dari `package.json`

### 3. File yang Dimodifikasi

#### a. `lib/uploadUtils.ts`
- Fungsi `uploadFileToMinio()` sekarang hanya mengkonversi file ke base64 dan mengembalikan string tersebut
- Fungsi `uploadSignatureToMinio()` sekarang hanya mengembalikan base64 string tanpa upload
- Tidak ada lagi API call ke MinIO atau server eksternal

#### b. `app/api/upload/route.ts`
- Endpoint sekarang hanya mengembalikan base64 string yang diterima
- Tidak ada lagi proses upload ke MinIO
- Lebih sederhana dan lebih cepat

#### c. Form Inspeksi (Plaza, Derek, Kamtib, Rescue)
- Update komentar dari "Upload to MinIO" menjadi "Process file for database storage"
- Fungsionalitas tetap sama, hanya penyimpanan yang berubah

#### d. Dashboard Manager (Traffic & Operational)
- Update komentar dari "Upload signature to MinIO" menjadi "Process signature for database storage"
- Fungsionalitas tetap sama

### 4. Schema Database
- Tidak ada perubahan pada schema Prisma
- Field-field foto sudah menggunakan `String?` yang dapat menyimpan base64

## Keuntungan Perubahan

### ✅ Pros
1. **Gratis** - Tidak perlu biaya untuk MinIO
2. **Sederhana** - Tidak perlu setup server MinIO
3. **Cepat** - Tidak ada network latency untuk upload
4. **Portabel** - Database bisa dipindah dengan mudah termasuk gambarnya

### ⚠️ Cons
1. **Ukuran Database** - Database akan lebih besar karena menyimpan gambar sebagai base64
2. **Performance** - Query bisa lebih lambat jika banyak gambar
3. **Backup** - Backup database akan lebih besar

## Rekomendasi untuk Production

Untuk aplikasi production dengan banyak data, pertimbangkan:

1. **Cloud Storage** - Gunakan cloud storage seperti:
   - AWS S3
   - Google Cloud Storage
   - Azure Blob Storage
   - Cloudflare R2 (murah dan kompatibel dengan S3)

2. **Image Optimization**
   - Compress gambar sebelum disimpan
   - Resize gambar ke ukuran yang sesuai
   - Gunakan format WebP untuk ukuran lebih kecil

3. **CDN** - Gunakan CDN untuk serving gambar jika menggunakan cloud storage

## Cara Rollback (jika diperlukan)

Jika perlu kembali ke MinIO:
1. Restore `lib/minio.ts` dari git history
2. Tambahkan kembali package `minio` ke dependencies
3. Restore versi lama `lib/uploadUtils.ts` dan `app/api/upload/route.ts`
4. Setup environment variables untuk MinIO

## Environment Variables (Tidak Diperlukan Lagi)

Environment variables berikut tidak diperlukan lagi:
- `MINIO_ENDPOINT`
- `MINIO_PORT`
- `MINIO_USE_SSL`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `MINIO_BUCKET`
- `MINIO_ENABLED`
- `MINIO_REGION`

Anda bisa menghapus atau mengabaikan variabel-variabel ini dari file `.env`.

## Testing

Setelah perubahan ini, pastikan untuk test:
1. ✅ Upload foto dari form inspeksi
2. ✅ Preview foto yang sudah diupload
3. ✅ Submit form inspeksi
4. ✅ Lihat foto di halaman detail/riwayat
5. ✅ Generate PDF dengan foto
6. ✅ TTD digital dari manager
7. ✅ Export ke Excel dengan data lengkap

## Support

Jika ada masalah atau pertanyaan, silakan hubungi tim developer.
