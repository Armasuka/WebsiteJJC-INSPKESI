# Perubahan Alur Rekapan - Manager Operational Only

## 📋 Ringkasan Perubahan

Sistem telah diubah sehingga **rekapan inspeksi hanya dapat diterima oleh Manager Operational**. Sebelumnya, petugas lapangan dapat mengirim rekap ke:
- Manager Traffic saja
- Manager Operational saja  
- Kedua Manager sekaligus

Sekarang, **semua rekapan otomatis dikirim ke Manager Operational**.

---

## 🔄 File yang Diubah

### 1. **Frontend - Halaman Rekap Petugas**
**File:** `app/dashboard/petugas-lapangan/rekap-acc/page.tsx`

#### Perubahan:
- ❌ **Dihapus:** Dropdown pilihan penerima (Traffic/Operational/Both)
- ✅ **Ditambahkan:** Info box tetap yang menunjukkan penerima adalah Manager Operational
- ✅ **Hardcoded:** State `receiverRole` selalu bernilai `"OPERATIONAL"`

```typescript
// Sebelum:
const [receiverRole, setReceiverRole] = useState<string>("BOTH");

// Sesudah:
const [receiverRole] = useState<string>("OPERATIONAL"); // Fixed to OPERATIONAL only
```

#### UI yang Diubah:
```tsx
{/* Info Penerima - Fixed to Manager Operational */}
<div className="bg-green-50 border border-green-200 rounded-lg p-4">
  <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
    <strong>Penerima:</strong> Manager Operational
  </p>
  <p className="text-xs text-gray-600 mt-1 ml-7">
    Rekap akan dikirim ke Manager Operational untuk review
  </p>
</div>
```

---

### 2. **Backend - API Rekap Manager**
**File:** `app/api/rekap-manager/route.ts`

#### Perubahan:
- ✅ **Force receiverRole:** Selalu set ke `"OPERATIONAL"` terlepas dari input
- ✅ **Single receiver:** Array receivers hanya berisi `["OPERATIONAL"]`
- ✅ **Email notification:** Hanya dikirim ke `MANAGER_OPERATIONAL`

```typescript
// Force receiverRole to OPERATIONAL only
const finalReceiverRole = "OPERATIONAL";

// Determine which managers to send to - Always OPERATIONAL only
const receivers = ["OPERATIONAL"] as const;

// Create rekap for each receiver
const createdRekaps = await Promise.all(
  receivers.map((role) =>
    prisma.rekapManager.create({
      data: {
        // ... other fields
        receiverRole: "OPERATIONAL", // Always OPERATIONAL
        // ...
      },
    })
  )
);

// Send email notifications to managers
if (process.env.EMAIL_ENABLED === "true") {
  for (const rekap of createdRekaps) {
    try {
      // Get manager email - always MANAGER_OPERATIONAL
      const managers = await prisma.user.findMany({
        where: { role: "MANAGER_OPERATIONAL" },
        select: { email: true, name: true },
      });
      // ...
    }
  }
}
```

---

### 3. **UI - Dashboard Manager Traffic**
**File:** `app/dashboard/manager-traffic/page.tsx`

#### Perubahan:
- ❌ **Dihapus:** Link/button "Lihat Rekap Laporan" dari header
- ✅ **Alasan:** Manager Traffic tidak lagi menerima rekapan

```typescript
// Sebelum: Ada button "Lihat Rekap Laporan"
<div className="flex justify-between items-start">
  <div>...</div>
  <a href="/dashboard/manager-traffic/rekap">Lihat Rekap Laporan</a>
</div>

// Sesudah: Hanya header sederhana
<div>
  <h2>Dashboard Manager Traffic</h2>
  <p>Selamat datang, {session?.user?.name}!</p>
</div>
```

---

## 🎯 Dampak Perubahan

### ✅ Yang Masih Berfungsi:
- ✅ Petugas lapangan dapat membuat dan mengirim rekap
- ✅ Manager Operational menerima semua rekap di halaman `/dashboard/manager-operational/rekap`
- ✅ Email notification tetap dikirim ke Manager Operational (jika diaktifkan)
- ✅ Alur approval inspeksi tidak berubah (Traffic → Operational)

### ⚠️ Yang Berubah:
- ⚠️ Manager Traffic **tidak lagi** menerima rekapan
- ⚠️ Halaman `/dashboard/manager-traffic/rekap` masih ada tapi tidak akan menerima data baru
- ⚠️ Petugas tidak bisa memilih penerima rekap (otomatis ke Operational)

### ❌ Yang Dihapus:
- ❌ Opsi mengirim rekap ke Manager Traffic
- ❌ Opsi mengirim rekap ke kedua Manager sekaligus
- ❌ Link "Lihat Rekap Laporan" di dashboard Manager Traffic

---

## 📊 Alur Sistem Baru

```
┌─────────────────┐
│ Petugas Lapangan │
│   (Rekap ACC)    │
└────────┬─────────┘
         │
         │ Kirim Rekap
         │ (Auto ke Operational)
         ↓
┌─────────────────────┐
│ Manager Operational │
│  (Terima & Review)  │
└─────────────────────┘
```

### Alur Lama (Sebelum Perubahan):
```
┌─────────────────┐
│ Petugas Lapangan │
│   (Rekap ACC)    │
└────────┬─────────┘
         │
         │ Pilih Penerima:
         │ • Traffic
         │ • Operational  
         │ • Both
         ↓
┌──────────────┬──────────────────────┐
│              │                      │
│ Manager      │  Manager             │
│ Traffic      │  Operational         │
│              │                      │
└──────────────┴──────────────────────┘
```

---

## 🔍 Testing Checklist

### Frontend Testing:
- [ ] Buka halaman `/dashboard/petugas-lapangan/rekap-acc`
- [ ] Klik button "Kirim Rekap ke Manager"
- [ ] Verifikasi **tidak ada dropdown** pilihan penerima
- [ ] Verifikasi ada **info box hijau** yang menunjukkan "Penerima: Manager Operational"
- [ ] Kirim rekap dan pastikan berhasil

### Backend Testing:
- [ ] Check database `rekap_manager` setelah mengirim rekap
- [ ] Verifikasi field `receiverRole` selalu bernilai `"OPERATIONAL"`
- [ ] Tidak ada entry dengan `receiverRole = "TRAFFIC"`

### Manager Testing:
- [ ] Login sebagai Manager Operational
- [ ] Buka `/dashboard/manager-operational/rekap`
- [ ] Verifikasi rekap baru muncul di daftar
- [ ] Login sebagai Manager Traffic
- [ ] Verifikasi **tidak ada link "Lihat Rekap Laporan"** di header
- [ ] Buka `/dashboard/manager-traffic/rekap` (jika masih ada)
- [ ] Verifikasi tidak ada rekap baru yang masuk

### Email Testing (jika enabled):
- [ ] Set `EMAIL_ENABLED=true` di `.env`
- [ ] Kirim rekap dari petugas
- [ ] Verifikasi email dikirim **hanya** ke Manager Operational
- [ ] Manager Traffic **tidak** menerima email

---

## 🛠️ Rollback (Jika Diperlukan)

Jika perlu kembali ke sistem lama:

1. **Revert file `page.tsx` (Petugas):**
   ```typescript
   const [receiverRole, setReceiverRole] = useState<string>("BOTH");
   
   // Tambahkan kembali dropdown:
   <select value={receiverRole} onChange={(e) => setReceiverRole(e.target.value)}>
     <option value="BOTH">Kedua Manager</option>
     <option value="TRAFFIC">Manager Traffic</option>
     <option value="OPERATIONAL">Manager Operational</option>
   </select>
   ```

2. **Revert file `route.ts` (API):**
   ```typescript
   const receivers = receiverRole === "BOTH" 
     ? ["TRAFFIC", "OPERATIONAL"] 
     : [receiverRole];
   
   const managerRole = rekap.receiverRole === "TRAFFIC" 
     ? "MANAGER_TRAFFIC" 
     : "MANAGER_OPERATIONAL";
   ```

3. **Revert file `page.tsx` (Manager Traffic):**
   ```typescript
   <a href="/dashboard/manager-traffic/rekap">Lihat Rekap Laporan</a>
   ```

---

## 📝 Catatan Tambahan

### Database Schema:
- Schema `RekapManager` tidak berubah
- Enum `ManagerRole` masih memiliki nilai `TRAFFIC` dan `OPERATIONAL`
- Data rekap lama dengan `receiverRole = "TRAFFIC"` masih ada di database

### Halaman Manager Traffic Rekap:
- Halaman `/dashboard/manager-traffic/rekap` **tidak dihapus**
- Bisa diakses langsung via URL
- Berguna jika Manager Traffic masih ingin melihat data rekap lama
- Tidak akan ada data baru yang masuk ke sana

### Future Enhancement:
Jika ingin benar-benar menghapus akses Manager Traffic ke rekap:
1. Tambahkan route protection di `middleware.ts`
2. Atau hapus folder `app/dashboard/manager-traffic/rekap/`
3. Update role authorization di API `GET /api/rekap-manager`

---

## ✅ Status: COMPLETED

Tanggal Implementasi: 4 November 2025

Perubahan ini memastikan semua rekapan inspeksi hanya dikirim dan diterima oleh Manager Operational, menyederhanakan alur pelaporan dan memfokuskan tanggung jawab review rekap pada satu role.
