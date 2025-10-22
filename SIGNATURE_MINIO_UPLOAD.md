# Signature Upload to MinIO - Implementation Guide

## Overview
Semua tanda tangan (signature) sekarang otomatis diupload ke MinIO storage, sama seperti foto-foto lainnya. Ini mengurangi ukuran database dan meningkatkan performa aplikasi.

## Changes Summary

### 1. ✅ Helper Function Baru
**File**: `lib/uploadUtils.ts`

Ditambahkan function `uploadSignatureToMinio()`:
```typescript
export async function uploadSignatureToMinio(
  signatureBase64: string,
  signatureType: string
): Promise<string>
```

**Features**:
- Upload signature (base64 PNG) ke MinIO
- Auto-generate filename dengan timestamp
- Fallback ke base64 jika MinIO gagal
- Support signature yang sudah berupa URL (skip upload)

---

### 2. ✅ Form Inspeksi Petugas Lapangan

#### A. Plaza (2 Petugas)
**File**: `app/dashboard/petugas-lapangan/inspeksi/plaza/page.tsx`

**Changes**:
- Import `uploadSignatureToMinio`
- Upload `ttdPetugas1` → MinIO dengan nama `ttd-petugas1-plaza-{timestamp}.png`
- Upload `ttdPetugas2` → MinIO dengan nama `ttd-petugas2-plaza-{timestamp}.png`

```typescript
// Upload signatures to MinIO
const ttdPetugas1Uploaded = formData.ttdPetugas1 
  ? await uploadSignatureToMinio(formData.ttdPetugas1, 'ttd-petugas1-plaza') 
  : null;
const ttdPetugas2Uploaded = formData.ttdPetugas2 
  ? await uploadSignatureToMinio(formData.ttdPetugas2, 'ttd-petugas2-plaza') 
  : null;
```

#### B. Derek (2 Petugas)
**File**: `app/dashboard/petugas-lapangan/inspeksi/derek/page.tsx`

**Changes**:
- Import `uploadSignatureToMinio`
- Upload `ttdPetugas1` → MinIO dengan nama `ttd-petugas1-derek-{timestamp}.png`
- Upload `ttdPetugas2` → MinIO dengan nama `ttd-petugas2-derek-{timestamp}.png`

#### C. Kamtib (2 Petugas)
**File**: `app/dashboard/petugas-lapangan/inspeksi/kamtib/page.tsx`

**Changes**:
- Import `uploadSignatureToMinio`
- Upload `ttdPetugas1` → MinIO dengan nama `ttd-petugas1-kamtib-{timestamp}.png`
- Upload `ttdPetugas2` → MinIO dengan nama `ttd-petugas2-kamtib-{timestamp}.png`

#### D. Rescue (1 Petugas)
**File**: `app/dashboard/petugas-lapangan/inspeksi/rescue/page.tsx`

**Changes**:
- Import `uploadSignatureToMinio`
- Upload `ttdPetugas1` → MinIO dengan nama `ttd-petugas1-rescue-{timestamp}.png`

---

### 3. ✅ Approval Manager Traffic
**File**: `app/dashboard/manager-traffic/page.tsx`

**Changes**:
- Import `uploadSignatureToMinio`
- Upload `ttdManagerTraffic` → MinIO dengan nama `ttd-manager-traffic-{timestamp}.png`

```typescript
// Upload signature to MinIO
const ttdManagerTrafficUploaded = await uploadSignatureToMinio(
  signatureData, 
  'ttd-manager-traffic'
);
```

---

### 4. ✅ Approval Manager Operational
**File**: `app/dashboard/manager-operational/page.tsx`

**Changes**:
- Import `uploadSignatureToMinio`
- Upload `ttdManagerOperasional` → MinIO dengan nama `ttd-manager-operational-{timestamp}.png`

```typescript
// Upload signature to MinIO
const ttdManagerOperasionalUploaded = await uploadSignatureToMinio(
  signatureData, 
  'ttd-manager-operational'
);
```

---

## Benefits

### 1. **Reduced Database Size**
- Signatures disimpan di MinIO, bukan di database
- Database hanya menyimpan URL kecil (contoh: `https://minio.example.com/arya-pl/ttd-petugas1-plaza-1729584000000.png`)
- Base64 signature ~20-50KB → URL ~100 bytes

### 2. **Better Performance**
- Query database lebih cepat (tidak perlu fetch large base64 strings)
- Response API lebih kecil
- Lebih mudah di-cache oleh browser

### 3. **Scalability**
- MinIO bisa di-scale independently
- Lebih mudah backup dan restore
- Bisa pakai CDN untuk serve signatures

### 4. **Consistency**
- Semua assets (foto + signature) di satu tempat (MinIO)
- Unified upload/download logic
- Easier maintenance

---

## File Changes Summary

| File | Type | Changes |
|------|------|---------|
| `lib/uploadUtils.ts` | New Function | Added `uploadSignatureToMinio()` |
| `app/dashboard/petugas-lapangan/inspeksi/plaza/page.tsx` | Modified | Upload 2 signatures to MinIO |
| `app/dashboard/petugas-lapangan/inspeksi/derek/page.tsx` | Modified | Upload 2 signatures to MinIO |
| `app/dashboard/petugas-lapangan/inspeksi/kamtib/page.tsx` | Modified | Upload 2 signatures to MinIO |
| `app/dashboard/petugas-lapangan/inspeksi/rescue/page.tsx` | Modified | Upload 1 signature to MinIO |
| `app/dashboard/manager-traffic/page.tsx` | Modified | Upload manager signature to MinIO |
| `app/dashboard/manager-operational/page.tsx` | Modified | Upload manager signature to MinIO |

**Total Files Modified**: 7 files

---

## How It Works

### Flow Diagram
```
User draws signature on canvas
        ↓
Canvas converts to base64 (data:image/png;base64,...)
        ↓
uploadSignatureToMinio() called
        ↓
POST to /api/upload with base64 + filename
        ↓
API converts base64 → Buffer
        ↓
Upload to MinIO bucket (arya-pl)
        ↓
Return public URL
        ↓
Store URL in database (not base64)
```

---

## Testing Checklist

### Petugas Lapangan Forms
- [ ] Test Plaza form - buat 2 signatures, submit, verify uploaded to MinIO
- [ ] Test Derek form - buat 2 signatures, submit, verify uploaded to MinIO
- [ ] Test Kamtib form - buat 2 signatures, submit, verify uploaded to MinIO
- [ ] Test Rescue form - buat 1 signature, submit, verify uploaded to MinIO

### Manager Approvals
- [ ] Manager Traffic - approve dengan signature, verify uploaded to MinIO
- [ ] Manager Operational - approve dengan signature, verify uploaded to MinIO

### Verification
- [ ] Check MinIO bucket for uploaded signature files
- [ ] Verify database stores URLs (not base64)
- [ ] Test PDF generation - signatures should load from MinIO URLs
- [ ] Test rekap/export - signatures should be accessible

---

## MinIO Configuration

Ensure these environment variables are set in `.env`:

```env
MINIO_ENABLED=true
MINIO_ENDPOINT=your-minio-endpoint.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET=arya-pl
MINIO_REGION=us-east-1
```

---

## Fallback Behavior

If MinIO upload fails:
1. Function logs error to console
2. Returns original base64 string as fallback
3. Database will store base64 (same as before)
4. Application continues to work normally

**This ensures backward compatibility and zero downtime.**

---

## Naming Convention

Signature files in MinIO follow this pattern:
```
{signatureType}-{timestamp}.png
```

Examples:
- `ttd-petugas1-plaza-1729584000000.png`
- `ttd-petugas2-derek-1729584123456.png`
- `ttd-manager-traffic-1729584234567.png`
- `ttd-manager-operational-1729584345678.png`

This makes files:
- Easy to identify
- Sortable by time
- Traceable to source

---

## Migration Notes

### Existing Data
- Old inspections with base64 signatures: Will continue to work
- New inspections: Will use MinIO URLs
- No migration script needed (graceful transition)

### Future Improvements
- [ ] Batch migrate old base64 signatures to MinIO
- [ ] Add signature compression before upload
- [ ] Implement signature versioning
- [ ] Add signature expiry/cleanup policy

---

## Troubleshooting

### Issue: Signature not uploading
**Solution**: 
1. Check MinIO is enabled: `MINIO_ENABLED=true`
2. Verify MinIO credentials in `.env`
3. Check browser console for errors
4. Test `/api/upload` endpoint directly

### Issue: Signature shows broken image
**Solution**:
1. Verify MinIO bucket is public or has correct ACL
2. Check CORS settings on MinIO
3. Verify file was uploaded: Check MinIO admin panel
4. Test URL directly in browser

### Issue: Large database size
**Solution**:
1. Check if MinIO upload is working (should reduce new entries)
2. Consider migrating old base64 signatures
3. Monitor database growth

---

*Last Updated: October 22, 2025*
*Implementation: All signature uploads now use MinIO*
