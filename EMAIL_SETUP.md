# 📧 Setup Email Notifikasi

Sistem ini menggunakan email notifikasi otomatis untuk memberitahu Manager dan Petugas tentang status inspeksi.

## 🚀 Cara Setup Email (Gmail)

### 1. Aktifkan 2-Step Verification di Google Account

1. Buka https://myaccount.google.com/security
2. Cari **"2-Step Verification"**
3. Klik dan ikuti langkah-langkah untuk mengaktifkannya

### 2. Generate App Password

1. Setelah 2-Step Verification aktif, kembali ke https://myaccount.google.com/security
2. Scroll ke bawah, cari **"App passwords"** atau **"App-specific passwords"**
3. Klik dan pilih:
   - **Select app:** Mail
   - **Select device:** Other (Custom name)
   - Beri nama: "Sistem Inspeksi JJC"
4. Klik **Generate**
5. Copy password yang muncul (16 karakter tanpa spasi)

### 3. Update File .env

Buka file `.env` dan update:

```bash
# Email Configuration (Gmail)
EMAIL_USER="alamat-email-anda@gmail.com"
EMAIL_PASSWORD="xxxx xxxx xxxx xxxx"  # App password dari langkah 2
EMAIL_ENABLED="true"  # Ubah ke "true" untuk mengaktifkan
```

**PENTING:**
- Jangan gunakan password Gmail biasa, harus App Password!
- Jangan commit file `.env` ke Git (sudah ada di `.gitignore`)
- Untuk disable email, set `EMAIL_ENABLED="false"`

### 4. Restart Development Server

```bash
npm run dev
```

## 📨 Jenis Notifikasi Email

### 1. Inspeksi Baru (ke Manager Traffic)
**Trigger:** Petugas submit inspeksi baru  
**Penerima:** Semua Manager Traffic  
**Subject:** 🚨 Inspeksi Baru: [Kategori] - [Nomor Kendaraan]  
**Isi:** Detail inspeksi + tombol approve

### 2. Approved by Traffic (ke Manager Operational)
**Trigger:** Manager Traffic approve inspeksi  
**Penerima:** Semua Manager Operational  
**Subject:** ✅ Inspeksi Perlu Persetujuan: [Kategori] - [Nomor Kendaraan]  
**Isi:** Detail inspeksi + info sudah approved Traffic + tombol approve

### 3. Rejected (ke Petugas)
**Trigger:** Manager Traffic atau Operational reject inspeksi  
**Penerima:** Petugas yang buat laporan  
**Subject:** ❌ Laporan Ditolak: [Kategori] - [Nomor Kendaraan]  
**Isi:** Detail inspeksi + alasan penolakan + tombol perbaiki

## 🔧 Troubleshooting

### Email tidak terkirim?

1. **Cek console log:**
   ```
   ✅ Email sent: <message-id>  ← Berhasil
   ❌ Error sending email: ...   ← Gagal
   ```

2. **Pastikan EMAIL_ENABLED="true"**
   ```bash
   # Di file .env
   EMAIL_ENABLED="true"  # Bukan "false"
   ```

3. **Cek App Password:**
   - Pastikan tidak ada spasi di password
   - Pastikan 2-Step Verification aktif
   - Generate ulang App Password jika perlu

4. **Cek email di user database:**
   ```bash
   npx prisma studio
   # Buka tabel User, pastikan email sudah benar
   ```

5. **Gmail Security:**
   - Pastikan "Less secure app access" tidak diblokir
   - Cek email untuk notifikasi login baru dari Google

### Error: "Invalid login"

- App Password salah atau expired
- 2-Step Verification belum aktif
- Regenerate App Password

### Error: "Connection refused"

- Internet connection issue
- Gmail SMTP server down (jarang)
- Coba lagi beberapa saat

## 🔐 Keamanan

⚠️ **JANGAN:**
- Commit file `.env` ke Git
- Share App Password ke orang lain
- Gunakan password Gmail biasa
- Simpan password di code

✅ **LAKUKAN:**
- Gunakan App Password khusus
- Simpan di `.env` (sudah di `.gitignore`)
- Regenerate password jika tercurigai bocor
- Gunakan email khusus untuk sistem (bukan email pribadi)

## 📊 Monitor Email

Lihat log di terminal untuk memantau email:

```bash
📧 Sending email notifications to 2 Manager Traffic users
✅ Email sent: <message-id-1>
✅ Email sent: <message-id-2>
✅ Email notifications sent successfully
```

## 🌐 Alternatif Selain Gmail

Jika ingin menggunakan email provider lain, update `lib/emailService.ts`:

```typescript
// Untuk SMTP custom
return nodemailer.createTransporter({
  host: "smtp.example.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
```

Provider yang didukung:
- Gmail ✅ (Recommended)
- Outlook/Hotmail
- Yahoo Mail
- SMTP Server custom
- SendGrid
- Mailgun
- AWS SES

## 📝 Testing Email

Untuk testing email tanpa mengirim ke user asli, bisa gunakan:

1. **Mailtrap** (https://mailtrap.io) - Fake SMTP untuk development
2. **Ethereal Email** (https://ethereal.email) - Free fake SMTP
3. **Gmail Test Account** - Buat akun Gmail khusus untuk testing

---

**Need Help?**  
Jika masih ada masalah, cek:
- Console log di terminal
- Browser console (Network tab)
- Prisma Studio (user emails)
- Google Account Security settings
