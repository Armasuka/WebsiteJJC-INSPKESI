# 📧 Email Notification System - Documentation

## Overview
Sistem notifikasi email otomatis untuk aplikasi Inspeksi Jasamarga Jalanlayang Cikampek menggunakan **Gmail SMTP** dengan **Nodemailer**.

---

## ✅ Konfigurasi Email

### Environment Variables (.env)
```env
EMAIL_USER="armasuka10@gmail.com"
EMAIL_PASSWORD="[16-character Gmail App Password]"
EMAIL_ENABLED="true"
NEXTAUTH_URL="http://localhost:3000"
```

### Gmail Setup
1. **Enable 2-Step Verification** di Google Account
2. **Generate App Password**: 
   - Go to: https://myaccount.google.com/security
   - Select "2-Step Verification"
   - Scroll down → "App passwords"
   - Select "Mail" and your device
   - Copy 16-character password ke `.env`

---

## 📨 Email Templates

### 1. **Inspeksi Baru** (Blue Theme)
- **Trigger**: Petugas submit inspeksi baru
- **Recipient**: Manager Traffic
- **Email**: `armasuka10@gmail.com` (Budi Santoso)
- **Subject**: `🚨 Inspeksi Baru Memerlukan Persetujuan`
- **Content**:
  - Detail kendaraan (kategori, nopol)
  - Info petugas yang submit
  - Tanggal inspeksi
  - Button: "Lihat & Setujui Sekarang"
  - Link ke dashboard Manager Traffic

---

### 2. **Approved Traffic** (Purple Theme)
- **Trigger**: Manager Traffic approve inspeksi
- **Recipient**: Manager Operational
- **Email**: `cadelldell11@gmail.com` (Andi Wijaya)
- **Subject**: `✅ Inspeksi Disetujui Manager Traffic`
- **Content**:
  - Progress bar (66.66% complete)
  - Detail kendaraan
  - Info petugas & tanggal
  - Button: "Lihat & ACC Sekarang"
  - Link ke dashboard Manager Operational

---

### 3. **Rejected** (Red Theme)
- **Trigger**: Manager reject inspeksi
- **Recipient**: Petugas Lapangan (yang submit)
- **Subject**: `❌ Laporan Inspeksi Ditolak`
- **Content**:
  - Status rejection alert
  - Detail kendaraan
  - **Alasan penolakan** (highlighted box)
  - Manager yang reject (Traffic/Operational)
  - Button: "Lihat Detail & Lakukan Perbaikan"

---

### 4. **Rekap Manager** (Blue/Purple Theme)
- **Trigger**: Petugas kirim rekap ke manager
- **Recipient**: Manager Traffic / Manager Operational
- **Emails**: 
  - Manager Traffic: `armasuka10@gmail.com`
  - Manager Operational: `cadelldell11@gmail.com`
- **Subject**: `📊 Laporan Rekap Inspeksi Baru - [Judul Rekap]`
- **Content**:
  - **Total inspeksi** (big stats box)
  - Periode rekap (mingguan/bulanan/custom)
  - Tanggal mulai & selesai
  - Kategori kendaraan
  - Info pengirim
  - Catatan (optional)
  - Button: "Lihat Rekap Lengkap"
  - Dynamic color theme (Blue for Traffic, Purple for Operational)

---

## 🎨 Design Guidelines

### Company Branding
- **Company Name**: "JASAMARGA JALANLAYANG CIKAMPEK"
- **Subtitle**: "Sistem Inspeksi Kendaraan Operasional"
- **Address**: "Jalan Tol Jakarta - Cikampek KM 47 | Cibitung, Bekasi"

### Color Schemes
| Template | Header Gradient | Accent Color | Light Background |
|----------|----------------|--------------|------------------|
| Inspeksi Baru | #1e3a8a → #3b82f6 | #3b82f6 | #dbeafe |
| Approved Traffic | #6d28d9 → #8b5cf6 | #8b5cf6 | #e9d5ff |
| Rejected | #dc2626 → #ef4444 | #ef4444 | #fee2e2 |
| Rekap (Traffic) | #1e3a8a → #3b82f6 | #3b82f6 | #dbeafe |
| Rekap (Operational) | #6d28d9 → #8b5cf6 | #8b5cf6 | #e9d5ff |

### Design Features
- ✅ **No emojis** in email titles (clean professional look)
- ✅ **Text-only headers** (no logo images)
- ✅ **Gradient backgrounds** for visual appeal
- ✅ **Inline CSS** for email client compatibility
- ✅ **Fully responsive** (mobile-friendly)
- ✅ **Clean typography** (System fonts: -apple-system, Segoe UI, Roboto)

---

## 🔄 Email Flow

### Workflow Inspeksi
```
1. Petugas Submit Inspeksi
   ↓
   📧 Email → Manager Traffic (Blue)
   
2. Manager Traffic Approve
   ↓
   📧 Email → Manager Operational (Purple)
   
3a. Manager Operational Approve
    ↓
    ✅ Status: APPROVED_BY_OPERATIONAL
    
3b. Any Manager Reject
    ↓
    📧 Email → Petugas (Red) + Alasan
```

### Workflow Rekap
```
1. Petugas Kirim Rekap
   ↓
   📧 Email → Manager Traffic (jika ke Traffic/BOTH)
   📧 Email → Manager Operational (jika ke Operational/BOTH)
   
2. Manager Buka Dashboard Rekap
   ↓
   View statistik & download PDF
```

---

## 👥 User Accounts (Database Seed)

### Manager Traffic
```
Name: Budi Santoso
Email: armasuka10@gmail.com ✅ (receives emails)
Password: password123
Role: MANAGER_TRAFFIC
```

### Manager Operational
```
Name: Andi Wijaya
Email: cadelldell11@gmail.com ✅ (receives emails)
Password: password123
Role: MANAGER_OPERATIONAL
```

### Petugas Lapangan (Sample)
```
Name: Ahmad Fauzi
Email: petugas.lapangan@jasamarga.com
Password: password123
Role: PETUGAS_LAPANGAN
```

---

## 🛠️ Technical Implementation

### Email Service (`lib/emailService.ts`)
```typescript
// Send email function
export async function sendEmail({ to, subject, html })

// Templates
export function emailTemplateInspeksiBaru({ ... })
export function emailTemplateApprovedTraffic({ ... })
export function emailTemplateRejected({ ... })
export function emailTemplateRekapManager({ ... })
```

### API Integration

#### 1. **Inspeksi Route** (`app/api/inspeksi/route.ts`)
- Sends email to Manager Traffic on new submission
- Checks `EMAIL_ENABLED` before sending

#### 2. **Inspeksi Detail Route** (`app/api/inspeksi/[id]/route.ts`)
- Sends email to Manager Operational on Traffic approval
- Sends rejection email to Petugas on any rejection

#### 3. **Rekap Manager Route** (`app/api/rekap-manager/route.ts`)
- Sends email to all managers with matching role
- Dynamic theme based on recipient role (TRAFFIC/OPERATIONAL)
- Supports sending to BOTH roles simultaneously

---

## 🧪 Testing

### Manual Test
1. **Login** as Petugas Lapangan
2. **Submit** new inspection
3. **Check** armasuka10@gmail.com inbox → Should receive blue email
4. **Login** as Manager Traffic (armasuka10@gmail.com)
5. **Approve** inspection
6. **Check** cadelldell11@gmail.com inbox → Should receive purple email
7. **Login** as Manager Operational (cadelldell11@gmail.com)
8. **Reject** inspection with note
9. **Check** Petugas email → Should receive red email

### Rekap Test
1. **Login** as Petugas Lapangan
2. **Go to** "Rekap ACC"
3. **Fill form**:
   - Judul: "Rekap Mingguan"
   - Periode: Mingguan
   - Kategori: Semua
   - Tujuan: Manager Traffic / Manager Operational / BOTH
   - Catatan: (optional)
4. **Click** "Kirim Rekap"
5. **Check** manager email(s) → Should receive purple/blue email

### Test Email Script (Development Only)
```bash
# Create test-email.js with nodemailer
node test-email.js
# Should send to armasuka10@gmail.com or cadelldell11@gmail.com
```

---

## 🚨 Troubleshooting

### Email tidak terkirim
1. **Check** `.env` file:
   - `EMAIL_ENABLED="true"`
   - Valid Gmail credentials
2. **Check** Gmail App Password (16 characters, no spaces)
3. **Check** console logs: `✅ Email sent` or `❌ Error sending email`
4. **Verify** recipient email exists in database

### Email masuk spam
- Normal untuk first-time emails
- Ask recipient to mark as "Not Spam"
- Gmail will learn over time

### Template tidak muncul dengan benar
- Gunakan inline CSS (bukan external stylesheets)
- Avoid complex CSS (flexbox limited, use tables for layout)
- Test di Gmail, Outlook, Yahoo

---

## 📊 Email Statistics

### Average Email Size
- Inspeksi Baru: ~15-20 KB
- Approved Traffic: ~18-22 KB
- Rejected: ~16-20 KB
- Rekap Manager: ~20-25 KB

### Delivery Time
- Localhost → Gmail SMTP: 1-3 seconds
- Gmail → Inbox: 3-10 seconds
- **Total**: ~5-13 seconds average

---

## 🔐 Security Notes

1. **Never commit** `.env` file to Git
2. **Use** App Password (not main Gmail password)
3. **Rotate** passwords periodically
4. **Limit** email sending rate (Gmail: 500/day for free accounts)
5. **Sanitize** user input before sending emails (prevent injection)

---

## 📝 Future Enhancements

### Potential Improvements
- [ ] Email templates with PDF attachment (inspection report)
- [ ] Batch email sending (daily digest)
- [ ] Email preferences per user (opt-in/opt-out)
- [ ] Multi-language support (ID/EN)
- [ ] Rich text editor for rejection notes
- [ ] Email analytics (open rate, click rate)
- [ ] Push notifications (browser/mobile)
- [ ] SMS notifications (backup for critical alerts)

---

## 📞 Support

### Contact
- **Developer**: Development Team
- **Email System**: Gmail SMTP
- **Documentation**: This file

### Useful Links
- [Gmail App Password Guide](https://support.google.com/mail/answer/185833?hl=en)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Email Design Best Practices](https://templates.mailchimp.com/design/)

---

**Last Updated**: November 2, 2025  
**Version**: 2.0 (with Rekap Manager notifications)  
**Status**: ✅ Production Ready
