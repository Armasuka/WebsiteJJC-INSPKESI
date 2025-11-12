# 🎉 TOAST NOTIFICATION IMPLEMENTATION GUIDE

## ✅ Completed Files
1. ✅ **Manager Traffic** (`app/dashboard/manager-traffic/page.tsx`)
   - Import added
   - State added
   - All alerts replaced with toast
   - Toast component rendered

## 📝 Implementation Steps for Remaining Files

### Step 1: Add Import
```typescript
import ToastNotification from "@/app/components/ToastNotification";
```

### Step 2: Add State & Function (after other useState declarations)
```typescript
// Toast notification state
const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" | "info" } | null>(null);

const showToast = (message: string, type: "success" | "error" | "warning" | "info" = "success") => {
  setToast({ message, type });
};
```

### Step 3: Replace alert() calls

#### Before:
```typescript
alert("Laporan berhasil disetujui!");
alert("Gagal menyetujui laporan");
```

#### After:
```typescript
showToast("✓ Laporan berhasil disetujui!", "success");
showToast("Gagal menyetujui laporan", "error");
```

### Step 4: Add Toast Component (before closing </div> of main component)
```typescript
{/* Toast Notification */}
{toast && (
  <ToastNotification
    message={toast.message}
    type={toast.type}
    onClose={() => setToast(null)}
  />
)}
```

---

## 🎯 Files That Need Toast Implementation

### 1. Manager Operational (`app/dashboard/manager-operational/page.tsx`)
**Alerts to Replace:**
- Line 85: `alert("Gagal memuat data inspeksi")` → `showToast("Gagal memuat data inspeksi", "error")`
- Line 139: `alert("Mohon berikan alasan penolakan")` → `showToast("Mohon isi alasan penolakan", "warning")`
- Line 163: `alert("Laporan berhasil ditolak!")` → `showToast("✓ Laporan berhasil ditolak! Email notifikasi telah dikirim", "success")`
- Line 168: `alert(data.error || ...)` → `showToast(data.error || "Gagal menolak laporan", "error")`
- Line 172: `alert("Terjadi kesalahan...")` → `showToast("Terjadi kesalahan saat menolak laporan", "error")`
- Line 189: `alert("Mohon buat tanda tangan...")` → `showToast("Mohon buat tanda tangan terlebih dahulu", "warning")`
- Line 220: `alert("Laporan berhasil disetujui!")` → `showToast("✓ Laporan berhasil di-ACC! Inspeksi selesai", "success")`
- Line 225: `alert(data.error || ...)` → `showToast(data.error || "Gagal menyetujui laporan", "error")`
- Line 229: `alert("Terjadi kesalahan...")` → `showToast("Terjadi kesalahan saat menyetujui laporan", "error")`

### 2. Petugas - Rekap ACC (`app/dashboard/petugas-lapangan/rekap-acc/page.tsx`)
**Key Actions:**
- Kirim Rekap ke Manager
- Download PDF
- Export Excel

**Toast Messages:**
```typescript
// Success
showToast("✓ Rekap berhasil dikirim ke manager! Email notifikasi telah terkirim", "success");

// Error
showToast("Gagal mengirim rekap", "error");

// Warning
showToast("Tidak ada data dalam periode ini", "warning");

// Info
showToast("Mengunduh PDF...", "info");
```

### 3. Petugas - Form Inspeksi Pages
Files:
- `app/dashboard/petugas-lapangan/inspeksi/derek/page.tsx`
- `app/dashboard/petugas-lapangan/inspeksi/kamtib/page.tsx`
- `app/dashboard/petugas-lapangan/inspeksi/plaza/page.tsx`
- `app/dashboard/petugas-lapangan/inspeksi/rescue/page.tsx`

**Toast Messages:**
```typescript
// Submit success
showToast("✓ Laporan berhasil dikirim! Email notifikasi telah dikirim ke Manager Traffic", "success");

// Save draft
showToast("✓ Draft berhasil disimpan", "success");

// Validation errors
showToast("Mohon isi semua field yang wajib", "warning");
showToast("Mohon upload minimal 2 foto", "warning");

// Error
showToast("Gagal mengirim laporan", "error");
```

### 4. Manager Traffic - Rekap (`app/dashboard/manager-traffic/rekap/page.tsx`)
### 5. Manager Operational - Rekap (`app/dashboard/manager-operational/rekap/page.tsx`)

**Toast Messages:**
```typescript
// Mark as read
showToast("✓ Rekap ditandai sudah dibaca", "success");

// Download/Export
showToast("Mengunduh rekap...", "info");
showToast("✓ Rekap berhasil di-export", "success");
```

---

## 🎨 Toast Types & When to Use

### ✅ Success (Green)
**When:** Action completed successfully
**Examples:**
- "✓ Laporan berhasil disetujui!"
- "✓ Data berhasil disimpan"
- "✓ Email terkirim"

### ❌ Error (Red)
**When:** Action failed
**Examples:**
- "Gagal menyimpan data"
- "Koneksi terputus"
- "Terjadi kesalahan"

### ⚠️ Warning (Yellow)
**When:** User needs to fix something
**Examples:**
- "Mohon isi semua field"
- "Data tidak lengkap"
- "File terlalu besar"

### ℹ️ Info (Blue)
**When:** Informational message
**Examples:**
- "Sedang memproses..."
- "Mengunduh file..."
- "Tunggu sebentar"

---

## 🔧 Advanced Features

### Custom Duration
```typescript
<ToastNotification
  message="Pesan singkat"
  type="success"
  onClose={() => setToast(null)}
  duration={2000}  // 2 seconds (default: 4000)
/>
```

### Multiple Toasts (Queue)
For future implementation, you can create a toast queue:
```typescript
const [toasts, setToasts] = useState<Array<{id: string, message: string, type: string}>>([]);

const addToast = (message: string, type: string) => {
  const id = Date.now().toString();
  setToasts(prev => [...prev, { id, message, type }]);
};

// Render multiple toasts stacked
{toasts.map((toast, index) => (
  <div key={toast.id} style={{ top: `${20 + index * 80}px` }}>
    <ToastNotification ... />
  </div>
))}
```

---

## ✅ Testing Checklist

After implementing toast in each file, test:

1. **Success Cases**
   - [ ] Submit form successfully
   - [ ] Approve/Reject with signature
   - [ ] Send rekap to manager
   - [ ] Export data

2. **Error Cases**
   - [ ] Network error (disconnect internet)
   - [ ] Validation error (empty fields)
   - [ ] Server error (wrong endpoint)

3. **UI/UX**
   - [ ] Toast appears from top-right
   - [ ] Auto-closes after 4 seconds
   - [ ] Close button works
   - [ ] Progress bar animates
   - [ ] Multiple toasts don't overlap (if implemented)
   - [ ] Works on mobile (responsive)

---

## 📚 Reference

**Component Location:** `app/components/ToastNotification.tsx`
**Messages Library:** `lib/toastMessages.ts`
**Completed Example:** `app/dashboard/manager-traffic/page.tsx`

---

**Last Updated:** November 2, 2025
**Status:** In Progress - Manager Traffic ✅ Done
