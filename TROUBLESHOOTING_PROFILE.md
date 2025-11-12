# Troubleshooting Profile Update

## Status Check ✅

### Database Connection
- ✅ Database file exists: `prisma/dev.db`
- ✅ Database accessible via Prisma
- ✅ Update operation works correctly
- ✅ 6 users found in database

### Server
- ✅ Node.js processes running
- ✅ Server likely running on port 3000

---

## Cara Test & Debug

### 1. Test Langsung di Browser

1. **Login** ke aplikasi
2. Buka browser **Developer Tools** (F12)
3. Ke tab **Console**
4. Klik nama user di sidebar → masuk ke profil
5. Ubah nama/email
6. Klik **Simpan Perubahan**
7. **Lihat Console** untuk log:
   ```
   📤 Sending update request: { name, email, changingPassword }
   📥 Response: { status, data }
   ✅ Profile updated successfully
   ```

### 2. Cek Log Server

**Terminal yang menjalankan `npm run dev`:**
- Cari log: `[PROFILE UPDATE] User: email attempting to update profile`
- Cari log: `[PROFILE UPDATE] Success: email - Updated fields: ...`
- Jika ada error, akan muncul di sini

### 3. Cek Database Manual

**Jalankan script:**
```bash
node check-users.js
```

Akan menampilkan semua user dan `Last Updated` timestamp.

### 4. Test Update Database

**Jalankan script:**
```bash
node test-update.js
```

Akan test update langsung ke database (auto-revert).

---

## Kemungkinan Masalah & Solusi

### ❌ Masalah: "Data tidak berubah di database"

**Penyebab & Solusi:**

#### 1. Session Issue
**Gejala:** Error 401 Unauthorized atau "Email tidak ditemukan di session"

**Solusi:**
```bash
# Hapus cookies browser dan login ulang
# Atau restart dev server
```

#### 2. API Route Tidak Terpanggil
**Gejala:** Tidak ada log di console browser atau server

**Cek:**
- Browser console ada error?
- Network tab di DevTools, ada request ke `/api/users/profile`?
- Response status code berapa? (200 = success, 4xx = client error, 5xx = server error)

**Solusi:**
```bash
# Restart dev server
Ctrl+C (di terminal npm run dev)
npm run dev
```

#### 3. Email Duplicate
**Gejala:** Error "Email sudah digunakan"

**Solusi:**
- Gunakan email yang berbeda
- Atau tetap pakai email yang sama (tidak diubah)

#### 4. Password Lama Salah
**Gejala:** Error "Password lama tidak sesuai"

**Solusi:**
- Masukkan password lama yang benar
- Atau jangan ganti password (toggle off)

#### 5. Prisma Client Out of Sync
**Gejala:** Error "Unknown field" atau type mismatch

**Solusi:**
```bash
# Stop dev server dulu (Ctrl+C)
npx prisma generate
npm run dev
```

---

## Testing Steps (Lengkap)

### Test 1: Update Nama Saja
1. Login sebagai user apapun
2. Klik nama di sidebar
3. Ubah nama: "Test User" → "Test User Updated"
4. Jangan centang "Ganti Password"
5. Klik "Simpan Perubahan"
6. **Expected:**
   - ✅ Toast: "Profil berhasil diupdate"
   - ✅ Redirect ke dashboard setelah 2 detik
   - ✅ Nama di sidebar berubah
   - ✅ Database updated (cek dengan `node check-users.js`)

### Test 2: Update Email Saja
1. Login sebagai user
2. Klik nama di sidebar
3. Ubah email ke email baru yang belum dipakai
4. Klik "Simpan Perubahan"
5. **Expected:**
   - ✅ Toast: "Profil berhasil diupdate"
   - ✅ Email di profil berubah
   - ✅ Bisa login dengan email baru

### Test 3: Update Password
1. Login sebagai user
2. Klik nama di sidebar
3. Klik "Ganti Password"
4. Isi:
   - Password Lama: (password saat ini)
   - Password Baru: "newpassword123"
   - Konfirmasi: "newpassword123"
5. Klik "Simpan Perubahan"
6. **Expected:**
   - ✅ Toast: "Profil berhasil diupdate"
   - ✅ Logout
   - ✅ Login dengan password baru berhasil

### Test 4: Update Nama + Email + Password
1. Login sebagai user
2. Update semuanya sekaligus
3. **Expected:** Semuanya tersimpan

---

## Debug Checklist

Jika masih tidak berfungsi, cek:

- [ ] Server `npm run dev` masih running?
- [ ] Browser console ada error?
- [ ] Network tab menunjukkan request ke `/api/users/profile` dengan method PUT?
- [ ] Response status code berapa?
- [ ] Response body berisi apa?
- [ ] Server terminal ada log error?
- [ ] File `.env` ada dan `DATABASE_URL` benar?
- [ ] User sudah login dengan benar? (cek session di console: `console.log(session)`)

---

## Command Reference

```bash
# Cek users di database
node check-users.js

# Test update database
node test-update.js

# Restart dev server
# (Di terminal npm run dev, tekan Ctrl+C lalu)
npm run dev

# Generate Prisma Client (kalau ada error Prisma)
# PENTING: Stop dev server dulu!
npx prisma generate

# Cek Prisma schema
npx prisma db pull
npx prisma studio  # Buka GUI untuk lihat database
```

---

## File yang Diupdate

### API Route: `app/api/users/profile/route.ts`
- Menggunakan email untuk cari user (bukan ID)
- Ada logging untuk debug
- Error handling yang jelas

### Frontend: `app/dashboard/profile/page.tsx`
- Ada console.log untuk debug request/response
- Error message yang jelas
- Session di-update setelah perubahan

---

## Next Steps

1. **Buka aplikasi di browser**
2. **Buka Developer Tools (F12)**
3. **Ke tab Console**
4. **Test update profil**
5. **Lihat console log**:
   - 📤 Request sent
   - 📥 Response received
   - ✅ Success atau ❌ Error
6. **Cek server terminal** untuk log dari backend
7. **Jalankan `node check-users.js`** untuk verify database

---

## Support

Jika masih ada masalah, cek:
1. Screenshot console browser (ada error?)
2. Screenshot network tab (request/response)
3. Copy log dari server terminal
4. Jalankan test scripts dan share hasilnya
