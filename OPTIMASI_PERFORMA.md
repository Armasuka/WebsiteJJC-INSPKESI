# Optimasi Performa Web - Jasamarga Inspect

## Masalah yang Ditemukan
Web memuat data terlalu lama karena:
1. Query database tidak efisien (fetch semua data sekaligus)
2. Tidak ada pagination
3. Tidak ada caching
4. Tidak ada index pada database
5. Error pada Next.js 15 async params

## Solusi yang Diterapkan

### 1. ✅ Fix Next.js 15 Async Params Error
**File**: `app/api/inspeksi/[id]/generate-pdf/route.ts`

**Perubahan**:
```typescript
// SEBELUM
{ params }: { params: { id: string } }
const { id } = params;

// SESUDAH
{ params }: { params: Promise<{ id: string }> }
const { id } = await params;
```

### 2. ✅ Tambahkan Pagination di API
**File**: `app/api/inspeksi/route.ts`

**Fitur baru**:
- Pagination dengan parameter `page` dan `limit`
- Default limit: 50 items
- Response format baru dengan metadata pagination:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

**Query yang dioptimasi**:
- Menggunakan `select` untuk hanya mengambil field yang diperlukan
- Menambahkan `take` dan `skip` untuk pagination
- Menambahkan cache header: `Cache-Control: private, max-age=10, stale-while-revalidate=30`

### 3. ✅ Update Client Components
**Files yang diupdate**:
- `app/dashboard/petugas-lapangan/page.tsx` - limit 5 untuk dashboard
- `app/dashboard/petugas-lapangan/riwayat/page.tsx` - limit 100 untuk riwayat
- `app/dashboard/manager-traffic/page.tsx` - limit 50
- `app/dashboard/manager-operational/page.tsx` - limit 50

**Backward compatibility**: Support untuk response format lama dan baru

### 4. ✅ Database Indexes
**File**: `prisma/schema.prisma`

**Indexes yang ditambahkan**:
```prisma
@@index([status])                    // Filter by status
@@index([petugasId])                 // Filter by petugas
@@index([createdAt])                 // Sort by date
@@index([kategoriKendaraan])         // Filter by kategori
@@index([tanggalInspeksi])           // Filter by tanggal
@@index([petugasId, status])         // Composite filter
@@index([status, createdAt])         // Composite sort
```

**Migration**: `prisma/migrations/20251022000000_add_performance_indexes/migration.sql`

## Cara Menerapkan Optimasi

### Step 1: Apply Database Migration
```bash
npx prisma migrate deploy
```

### Step 2: Generate Prisma Client
```bash
npx prisma generate
```

### Step 3: Restart Development Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

## Peningkatan Performa yang Diharapkan

### Sebelum Optimasi:
- ❌ Load semua data (bisa ratusan record)
- ❌ No pagination
- ❌ No caching
- ❌ No database indexes
- ❌ Query time: 2-5 detik untuk 100+ records

### Setelah Optimasi:
- ✅ Load hanya data yang diperlukan (5-50 records)
- ✅ Pagination support
- ✅ Cache headers (10 second cache)
- ✅ Database indexes untuk query cepat
- ✅ Estimated query time: 100-500ms

## API Usage Examples

### Dashboard (5 items)
```javascript
fetch("/api/inspeksi?limit=5")
```

### Riwayat (100 items)
```javascript
fetch("/api/inspeksi?limit=100")
```

### Pagination
```javascript
// Page 1
fetch("/api/inspeksi?page=1&limit=20")

// Page 2
fetch("/api/inspeksi?page=2&limit=20")
```

### Filter dengan Pagination
```javascript
fetch("/api/inspeksi?status=SUBMITTED&limit=50")
fetch("/api/inspeksi?kategori=PLAZA&page=1&limit=20")
```

## Monitoring & Testing

### Test Query Performance
```sql
-- Check if indexes are being used
EXPLAIN ANALYZE 
SELECT * FROM inspeksi 
WHERE status = 'SUBMITTED' 
ORDER BY "createdAt" DESC 
LIMIT 50;
```

### Monitor Loading Time
```javascript
const start = performance.now();
const response = await fetch("/api/inspeksi?limit=50");
const end = performance.now();
console.log(`Load time: ${end - start}ms`);
```

## Optimasi Tambahan (Opsional)

### 1. Redis Caching
Untuk performa lebih baik, gunakan Redis:
```bash
npm install redis
```

### 2. Image Optimization
Untuk foto yang besar, pertimbangkan:
- Compress image sebelum upload
- Lazy loading untuk foto
- Thumbnail untuk list view

### 3. Service Worker
Untuk offline capability dan caching:
```bash
npm install next-pwa
```

### 4. Database Connection Pooling
Pastikan connection pool di Prisma optimal:
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=10"
```

## Troubleshooting

### Jika masih lambat:
1. Check database connection
2. Verify indexes dengan `EXPLAIN ANALYZE`
3. Monitor network tab di browser DevTools
4. Check server resources (CPU, Memory)
5. Pertimbangkan CDN untuk static assets

### Jika error setelah migration:
```bash
# Reset database (DEV ONLY!)
npx prisma migrate reset

# Atau rollback migration tertentu
npx prisma migrate resolve --rolled-back 20251022000000_add_performance_indexes
```

## Catatan Penting

⚠️ **Jangan** run `prisma migrate reset` di production!
✅ Selalu test di development terlebih dahulu
✅ Backup database sebelum migration
✅ Monitor performa setelah deployment

---

**Last Updated**: October 22, 2025
**Author**: GitHub Copilot
**Version**: 1.0.0
