# Dokumentasi Upload Foto ke MinIO

## Ringkasan
Sistem upload foto telah diupdate untuk menyimpan file ke MinIO Object Storage. Foto tidak lagi disimpan sebagai base64 dalam database, melainkan diupload ke MinIO dan URL-nya yang disimpan.

## Konfigurasi Environment

Pastikan file `.env` memiliki konfigurasi MinIO berikut:

```env
# Storage Object
MINIO_ENDPOINT=minio-ukkkkgswskkgw040gg8c8wc0.coolify.fauziniko.my.id
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=O92finCWcd7RIwG8yobp
MINIO_SECRET_KEY=fjuA3VS84CuZnZXfZwFuGFFDIPcij81UcO8Cwuad
MINIO_BUCKET_NAME=arya-pl
MINIO_BUCKET=arya-pl
MINIO_REGION=jakarta
MINIO_ENABLED=true
```

## Komponen yang Diupdate

### 1. Library MinIO (`lib/minio.ts`)
File baru yang berisi:
- **minioClient**: Client untuk koneksi ke MinIO
- **uploadToMinio()**: Function untuk upload file ke MinIO
- **deleteFromMinio()**: Function untuk hapus file dari MinIO
- **base64ToBuffer()**: Helper untuk konversi base64 ke Buffer
- **getContentTypeFromBase64()**: Helper untuk mendapatkan MIME type dari base64

### 2. Upload Utilities (`lib/uploadUtils.ts`)
File baru yang berisi:
- **uploadFileToMinio()**: Function wrapper untuk upload yang handle File object atau base64 string
- **fileToBase64()**: Helper untuk konversi File ke base64 (untuk preview lokal)

### 3. API Route Upload (`app/api/upload/route.ts`)
Endpoint baru:
- **POST /api/upload**: Menerima base64 file dan filename, mengembalikan URL MinIO

Request body:
```json
{
  "file": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "fileName": "foto-stnk.jpg"
}
```

Response:
```json
{
  "url": "https://minio-xxx.coolify.fauziniko.my.id/arya-pl/1234567890-foto-stnk.jpg"
}
```

### 4. Halaman Inspeksi yang Diupdate
Semua halaman inspeksi telah diupdate untuk menggunakan MinIO:
- `app/dashboard/petugas-lapangan/inspeksi/rescue/page.tsx`
- `app/dashboard/petugas-lapangan/inspeksi/plaza/page.tsx`
- `app/dashboard/petugas-lapangan/inspeksi/derek/page.tsx`
- `app/dashboard/petugas-lapangan/inspeksi/kamtib/page.tsx`

**Perubahan pada function `uploadFile()`:**
```typescript
// Sebelumnya: Hanya konversi ke base64
const uploadFile = (file: File | string): Promise<string> => {
  // Convert to base64...
};

// Sekarang: Upload ke MinIO
const uploadFile = async (file: File | string, customFileName?: string): Promise<string> => {
  try {
    return await uploadFileToMinio(file, customFileName);
  } catch (error) {
    // Fallback ke base64 jika MinIO gagal
    return base64String;
  }
};
```

## Cara Kerja

### 1. User Upload Foto
1. User memilih foto dari file atau kamera
2. Foto di-preview sebagai base64 (untuk tampilan lokal)
3. Saat auto-save atau submit, foto diupload ke MinIO via API `/api/upload`
4. API mengembalikan URL MinIO
5. URL disimpan ke database (bukan base64)

### 2. Fallback Mechanism
Jika upload ke MinIO gagal (network issue, server error, dll):
- System akan otomatis fallback ke base64
- Foto tetap bisa disimpan (walaupun dalam bentuk base64)
- User tidak akan melihat error

### 3. Keuntungan MinIO
- ✅ Database lebih kecil (hanya menyimpan URL)
- ✅ Performance lebih baik (tidak ada base64 besar)
- ✅ Skalabilitas lebih baik (file storage terpisah)
- ✅ CDN-ready (bisa dikombinasikan dengan CDN)
- ✅ Backup lebih mudah (object storage)

## Testing

### Test Upload Manual
1. Buka halaman inspeksi (contoh: Rescue)
2. Upload foto di salah satu field
3. Cek Network tab di DevTools:
   - Harus ada request POST ke `/api/upload`
   - Response harus berisi URL MinIO
4. Submit form
5. Cek database - field foto harus berisi URL MinIO (bukan base64)

### Test Fallback
1. Matikan MinIO atau ubah `MINIO_ENABLED=false`
2. Upload foto
3. System harus tetap bekerja dengan base64 fallback

## Troubleshooting

### Error: "MinIO is not enabled"
**Solusi**: Set `MINIO_ENABLED=true` di file `.env`

### Error: "Failed to upload to MinIO"
**Kemungkinan penyebab**:
1. Credentials salah - cek `MINIO_ACCESS_KEY` dan `MINIO_SECRET_KEY`
2. Endpoint tidak bisa diakses - cek `MINIO_ENDPOINT`
3. Bucket tidak ada - bucket akan dibuat otomatis jika belum ada
4. Network issue - cek koneksi internet

**Debug**:
- Cek console browser untuk error detail
- Cek server logs
- Test koneksi ke MinIO endpoint langsung

### Foto tidak muncul setelah submit
**Kemungkinan penyebab**:
1. URL MinIO tidak public - pastikan bucket policy allow public read
2. CORS issue - pastikan MinIO allow CORS dari domain aplikasi

## Migrasi Data Lama

Jika ada data lama dengan base64, Anda bisa buat script migrasi:

```typescript
// Script migrasi (contoh)
const migrateOldData = async () => {
  const oldRecords = await prisma.inspeksi.findMany({
    where: {
      fotoSTNK: { startsWith: 'data:image' } // Base64
    }
  });

  for (const record of oldRecords) {
    // Upload base64 ke MinIO
    const url = await uploadFileToMinio(
      record.fotoSTNK, 
      `stnk-${record.id}.jpg`
    );
    
    // Update database
    await prisma.inspeksi.update({
      where: { id: record.id },
      data: { fotoSTNK: url }
    });
  }
};
```

## Security

- ✅ Upload hanya bisa dilakukan oleh user yang sudah login (cek di API route)
- ✅ File name di-generate dengan timestamp untuk avoid collision
- ✅ Content-Type validation dari base64 header
- ⚠️ TODO: Tambahkan file size limit
- ⚠️ TODO: Tambahkan file type validation (hanya image)

## Next Steps

1. **Set MinIO Bucket Policy** untuk public read access
2. **Tambahkan compression** sebelum upload (resize image)
3. **Implementasi delete** file lama saat update
4. **Setup CDN** di depan MinIO untuk performance
5. **Monitoring** storage usage
