# Fitur Profil User & Manajemen Jabatan

## Overview
Fitur baru untuk memungkinkan user mengelola profil mereka sendiri dan Manager Operational dapat mengelola jabatan semua user.

## Fitur yang Ditambahkan

### 1. Halaman Profil User (`/dashboard/profile`)

**Lokasi File:** `app/dashboard/profile/page.tsx`

**Fitur:**
- ✅ User dapat mengakses profil mereka dengan klik nama di sidebar
- ✅ Edit nama lengkap
- ✅ Edit email
- ✅ Ganti password (dengan verifikasi password lama)
- ✅ Jabatan ditampilkan tapi **read-only** (tidak bisa diubah oleh user)
- ✅ Validasi form yang lengkap
- ✅ Toast notification untuk feedback
- ✅ Auto-redirect ke dashboard setelah update sukses

**Akses:**
- Semua user (Petugas Lapangan, Manager Traffic, Manager Operational)

**UI/UX:**
- Header dengan avatar dan info user
- Form yang user-friendly
- Toggle untuk show/hide password fields
- Info card dengan instruksi
- Responsive design

---

### 2. API Route - Update Profil

**Lokasi File:** `app/api/users/profile/route.ts`

**Endpoint:** `PUT /api/users/profile`

**Fungsi:**
- Update nama dan email user
- Update password (dengan verifikasi password lama)
- Validasi email unique
- Hash password dengan bcrypt
- Update session setelah perubahan

**Security:**
- Autentikasi dengan NextAuth session
- Verifikasi password lama sebelum ganti password
- Validasi input yang ketat

---

### 3. Update Sidebar - Link ke Profil

**Lokasi File:** `app/dashboard/layout.tsx`

**Perubahan:**
- User info di bottom sidebar sekarang clickable
- Hover effect dengan transisi smooth
- Icon arrow untuk indikasi clickable
- Link ke `/dashboard/profile`

---

### 4. Manajemen Jabatan oleh Manager Operational

**Lokasi File:** `app/dashboard/manager-operational/users/page.tsx`

**Fitur Baru:**
- ✅ Tampilkan **semua user** (tidak hanya Petugas Lapangan)
- ✅ Kolom "Jabatan" dengan badge berwarna:
  - 🟣 Purple = Manager Operational
  - 🟢 Green = Manager Traffic
  - 🔵 Blue = Petugas Lapangan
- ✅ Tombol "Edit" untuk mengubah jabatan user
- ✅ Modal edit jabatan dengan:
  - Info user yang akan diubah
  - Dropdown pilihan jabatan
  - Warning message
  - Validasi
- ✅ Tombol "Hapus" untuk menghapus user

**Aturan Bisnis:**
- Manager Operational tidak bisa mengubah jabatan sendiri
- Manager Operational tidak bisa menghapus akun sendiri
- Validasi role yang diinput

---

### 5. API Route - Update Jabatan User

**Lokasi File:** `app/api/users/[id]/route.ts`

**Endpoint Baru:** `PUT /api/users/[id]`

**Fungsi:**
- Update role/jabatan user
- Hanya bisa diakses oleh Manager Operational
- Validasi role (PETUGAS_LAPANGAN, MANAGER_TRAFFIC, MANAGER_OPERATIONAL)
- Prevent self-role update
- Logging untuk audit trail

**Security:**
- Authorization check (hanya Manager Operational)
- Validasi role yang valid
- Prevent self-modification

---

## Struktur File Baru

```
app/
├── dashboard/
│   ├── profile/
│   │   └── page.tsx          # ✨ BARU - Halaman profil user
│   └── layout.tsx            # ✏️ UPDATED - Link ke profil di sidebar
│
├── api/
│   └── users/
│       ├── profile/
│       │   └── route.ts      # ✨ BARU - API update profil
│       └── [id]/
│           └── route.ts      # ✏️ UPDATED - Tambah PUT endpoint
```

---

## Flow Penggunaan

### A. User Edit Profil Sendiri

1. User klik nama mereka di sidebar
2. Redirect ke `/dashboard/profile`
3. User dapat edit:
   - Nama
   - Email
   - Password (optional)
4. User klik "Simpan Perubahan"
5. Sistem validasi dan update data
6. Toast notification muncul
7. Auto-redirect ke dashboard

### B. Manager Operational Edit Jabatan User

1. Manager Operational masuk ke menu "Kelola Petugas"
2. Lihat tabel semua user dengan kolom jabatan
3. Klik tombol "Edit" pada user yang ingin diubah
4. Modal edit jabatan muncul
5. Pilih jabatan baru dari dropdown
6. Klik "Simpan Perubahan"
7. Sistem validasi dan update role
8. Toast notification muncul
9. Tabel di-refresh dengan data terbaru

---

## Validasi & Keamanan

### Validasi Form Profil:
- ✅ Nama dan email wajib diisi
- ✅ Email harus format valid
- ✅ Email harus unique (belum digunakan user lain)
- ✅ Password lama wajib jika ganti password
- ✅ Password baru minimal 6 karakter
- ✅ Password baru harus match dengan konfirmasi

### Validasi Edit Jabatan:
- ✅ Role harus salah satu dari: PETUGAS_LAPANGAN, MANAGER_TRAFFIC, MANAGER_OPERATIONAL
- ✅ Manager Operational tidak bisa ubah jabatan sendiri
- ✅ User harus exist di database

### Security:
- ✅ Semua endpoint protected dengan NextAuth
- ✅ Authorization check berdasarkan role
- ✅ Password di-hash dengan bcrypt
- ✅ SQL injection protected (Prisma ORM)
- ✅ XSS protection (React escaping)

---

## UI/UX Highlights

### Halaman Profil:
- 🎨 Gradient header dengan avatar
- 📝 Form yang clean dan terstruktur
- 🔐 Toggle untuk show/hide password fields
- ℹ️ Info card dengan panduan
- ✅ Success/error messages yang jelas
- 📱 Responsive untuk mobile

### Manajemen User:
- 🏷️ Badge berwarna untuk jabatan
- 🔍 Search bar untuk cari user
- ✏️ Modal edit yang informatif
- ⚠️ Warning message untuk perubahan penting
- 🎯 Button states yang jelas (loading, disabled)

---

## Testing Checklist

### User Edit Profil:
- [ ] User bisa akses profil dari sidebar
- [ ] Update nama berhasil
- [ ] Update email berhasil (jika unique)
- [ ] Validasi email duplicate
- [ ] Ganti password dengan password lama yang benar
- [ ] Reject password lama yang salah
- [ ] Password baru harus match konfirmasi
- [ ] Session di-update setelah perubahan
- [ ] Jabatan tidak bisa diubah oleh user

### Manager Operational Edit Jabatan:
- [ ] Tampil semua user (semua role)
- [ ] Badge jabatan tampil dengan warna yang benar
- [ ] Modal edit muncul dengan data yang benar
- [ ] Dropdown berisi semua pilihan jabatan
- [ ] Update jabatan berhasil
- [ ] Manager Operational tidak bisa ubah jabatan sendiri
- [ ] Toast notification muncul
- [ ] Tabel di-refresh setelah update

---

## Notes

1. **Jabatan User:**
   - User biasa **TIDAK BISA** mengubah jabatan mereka sendiri
   - Hanya Manager Operational yang bisa mengubah jabatan user lain
   - Manager Operational tidak bisa mengubah jabatan mereka sendiri

2. **Email Unique:**
   - Sistem mencegah email duplicate
   - Validasi dilakukan di backend

3. **Password Security:**
   - Password lama wajib diverifikasi sebelum ganti password
   - Password baru di-hash sebelum disimpan
   - Minimum 6 karakter

4. **Session Management:**
   - Session di-update setelah perubahan profil
   - Nama dan email di navbar langsung ter-update

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PUT | `/api/users/profile` | All Users | Update profil sendiri (nama, email, password) |
| PUT | `/api/users/[id]` | Manager Operational | Update jabatan user lain |
| DELETE | `/api/users/[id]` | Manager Operational | Hapus user |

---

## Implementasi Selesai ✅

Semua fitur telah diimplementasikan dengan:
- ✅ Security yang proper
- ✅ Validasi yang lengkap
- ✅ UI/UX yang user-friendly
- ✅ Error handling yang baik
- ✅ Toast notifications
- ✅ Responsive design
- ✅ Type-safe dengan TypeScript
