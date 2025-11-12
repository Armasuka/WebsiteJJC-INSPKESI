// Email Service untuk notifikasi
import nodemailer from 'nodemailer';

interface EmailNotification {
  to: string;
  subject: string;
  html: string;
}

// Konfigurasi transporter (gunakan Gmail atau SMTP server lain)
const createTransporter = () => {
  // Untuk Gmail: https://support.google.com/mail/answer/185833?hl=en
  // Aktifkan "App Password" di Google Account
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Email pengirim
      pass: process.env.EMAIL_PASSWORD, // App Password dari Gmail
    },
  });
};

export async function sendEmail({ to, subject, html }: EmailNotification) {
  try {
    const transporter = createTransporter();
    
    const info = await transporter.sendMail({
      from: `"Sistem Inspeksi JJC" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error };
  }
}

// Template email untuk inspeksi baru
export function emailTemplateInspeksiBaru({
  managerName,
  kategoriKendaraan,
  nomorKendaraan,
  namaPetugas,
  tanggalInspeksi,
  inspeksiId,
}: {
  managerName: string;
  kategoriKendaraan: string;
  nomorKendaraan: string;
  namaPetugas: string;
  tanggalInspeksi: string;
  inspeksiId: string;
}) {
  const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard/manager-traffic`;
  const detailUrl = `${process.env.NEXTAUTH_URL}/dashboard/manager-traffic?open=${inspeksiId}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inspeksi Baru - Persetujuan Diperlukan</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #1f2937;
      background: #f3f4f6;
      padding: 20px;
    }
    .email-wrapper { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    .header-top {
      background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%);
      padding: 35px 30px;
      text-align: center;
      color: white;
    }
    .company-name {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 1.5px;
      margin-bottom: 6px;
      text-transform: uppercase;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .company-subtitle {
      font-size: 14px;
      font-weight: 500;
      opacity: 0.95;
      letter-spacing: 0.8px;
    }
    .header-title {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 25px 30px;
      text-align: center;
    }
    .header-title h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .header-title p {
      font-size: 14px;
      opacity: 0.95;
      font-weight: 500;
    }
    .content { 
      padding: 40px 30px;
      background: white;
    }
    .greeting {
      font-size: 16px;
      color: #374151;
      margin-bottom: 25px;
      line-height: 1.8;
    }
    .greeting strong {
      color: #1f2937;
      font-weight: 600;
    }
    .alert-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-left: 5px solid #f59e0b;
      padding: 20px;
      border-radius: 12px;
      margin: 25px 0;
    }
    .alert-text {
      color: #92400e;
      font-weight: 600;
      font-size: 15px;
      line-height: 1.7;
    }
    .card { 
      background: linear-gradient(to bottom, #f9fafb 0%, #ffffff 100%);
      padding: 25px;
      margin: 25px 0;
      border-radius: 12px;
      border: 2px solid #e5e7eb;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .card-title {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e5e7eb;
    }
    .info-grid {
      display: grid;
      gap: 12px;
    }
    .info-row { 
      display: grid;
      grid-template-columns: 140px 1fr;
      padding: 12px 0;
      align-items: center;
      gap: 15px;
    }
    .label { 
      font-weight: 600;
      color: #3b82f6;
      font-size: 14px;
    }
    .value {
      font-size: 15px;
      color: #1f2937;
      font-weight: 500;
    }
    .highlight {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      padding: 4px 14px;
      border-radius: 8px;
      font-weight: 700;
      color: #1e40af;
      display: inline-block;
      border: 1px solid #93c5fd;
    }
    .buttons { 
      text-align: center;
      margin: 35px 0 25px;
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .button { 
      display: inline-block;
      padding: 14px 30px;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 700;
      font-size: 14px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      min-width: 180px;
    }
    .button-primary {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white !important;
      border: 2px solid #2563eb;
    }
    .button-secondary {
      background: white;
      color: #3b82f6 !important;
      border: 2px solid #3b82f6;
    }
    .urgent-notice {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      border-left: 5px solid #ef4444;
      padding: 18px;
      border-radius: 12px;
      margin: 25px 0;
    }
    .urgent-notice p {
      color: #991b1b;
      font-weight: 600;
      font-size: 14px;
      margin: 0;
      line-height: 1.7;
    }
    .footer { 
      background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
      text-align: center;
      padding: 30px;
      color: white;
    }
    .footer-logo {
      font-size: 17px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .footer-subtitle {
      font-size: 13px;
      opacity: 0.9;
      margin-bottom: 15px;
      font-weight: 500;
    }
    .footer p { 
      font-size: 12px;
      margin: 5px 0;
      line-height: 1.6;
      opacity: 0.85;
    }
    .footer-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.2);
      margin: 18px 0;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper { border-radius: 0; }
      .content { padding: 25px 20px; }
      .header-top { padding: 25px 20px; }
      .header-title { padding: 20px; }
      .company-name { font-size: 20px; }
      .buttons { flex-direction: column; }
      .button { min-width: 100%; }
      .info-row { grid-template-columns: 1fr; gap: 5px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header-top">
      <div class="company-name">JASAMARGA JALANLAYANG CIKAMPEK</div>
      <div class="company-subtitle">Sistem Inspeksi Kendaraan Operasional</div>
    </div>
    
    <div class="header-title">
      <h1>Inspeksi Baru Memerlukan Persetujuan</h1>
      <p>Manager Traffic</p>
    </div>
    
    <div class="content">
      <p class="greeting">
        Yth. <strong>${managerName}</strong>,<br>
        Manager Traffic Jasamarga Jalanlayang Cikampek
      </p>
      
      <div class="alert-box">
        <div class="alert-text">
          Ada laporan inspeksi baru yang memerlukan tinjauan dan persetujuan Anda sebagai Manager Traffic
        </div>
      </div>
      
      <div class="card">
        <div class="card-title">
          Detail Laporan Inspeksi
        </div>
        <div class="info-grid">
          <div class="info-row">
            <span class="label">Kategori</span>
            <span class="value"><span class="highlight">${kategoriKendaraan}</span></span>
          </div>
          <div class="info-row">
            <span class="label">Nomor Polisi</span>
            <span class="value"><strong>${nomorKendaraan}</strong></span>
          </div>
          <div class="info-row">
            <span class="label">Petugas Lapangan</span>
            <span class="value">${namaPetugas}</span>
          </div>
          <div class="info-row">
            <span class="label">Tanggal Inspeksi</span>
            <span class="value">${tanggalInspeksi}</span>
          </div>
        </div>
      </div>

      <div class="buttons">
        <a href="${detailUrl}" class="button button-primary">
          Lihat & Setujui Sekarang
        </a>
        <a href="${dashboardUrl}" class="button button-secondary">
          Buka Dashboard
        </a>
      </div>

      <div class="urgent-notice">
        <p>
          Mohon segera melakukan review dan memberikan persetujuan agar proses dapat dilanjutkan ke Manager Operational
        </p>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-logo">JASAMARGA JALANLAYANG CIKAMPEK</div>
      <div class="footer-subtitle">Sistem Inspeksi Kendaraan Operasional</div>
      <div class="footer-divider"></div>
      <p>Jalan Tol Jakarta - Cikampek KM 47 | Cibitung, Bekasi</p>
      <p style="margin-top: 12px; font-size: 11px; opacity: 0.7;">
        Email ini dikirim secara otomatis oleh sistem. Mohon tidak membalas email ini.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// Template email untuk inspeksi yang disetujui Manager Traffic
export function emailTemplateApprovedTraffic({
  managerName,
  kategoriKendaraan,
  nomorKendaraan,
  namaPetugas,
  tanggalInspeksi,
  inspeksiId,
}: {
  managerName: string;
  kategoriKendaraan: string;
  nomorKendaraan: string;
  namaPetugas: string;
  tanggalInspeksi: string;
  inspeksiId: string;
}) {
  const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard/manager-operational`;
  const detailUrl = `${process.env.NEXTAUTH_URL}/dashboard/manager-operational?open=${inspeksiId}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inspeksi Disetujui Manager Traffic</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #1f2937;
      background: #f3f4f6;
      padding: 20px;
    }
    .email-wrapper { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    .header-top {
      background: linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #8b5cf6 100%);
      padding: 35px 30px;
      text-align: center;
      color: white;
    }
    .company-name {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 1.5px;
      margin-bottom: 6px;
      text-transform: uppercase;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .company-subtitle {
      font-size: 14px;
      font-weight: 500;
      opacity: 0.95;
      letter-spacing: 0.8px;
    }
    .header-title {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: white;
      padding: 25px 30px;
      text-align: center;
    }
    .header-title h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .header-title p {
      font-size: 14px;
      opacity: 0.95;
      font-weight: 500;
    }
    .content { 
      padding: 40px 30px;
      background: white;
    }
    .greeting {
      font-size: 16px;
      color: #374151;
      margin-bottom: 25px;
      line-height: 1.8;
    }
    .greeting strong {
      color: #1f2937;
      font-weight: 600;
    }
    .status-box {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      border-left: 5px solid #10b981;
      padding: 20px;
      border-radius: 12px;
      margin: 25px 0;
    }
    .status-text {
      color: #065f46;
      font-weight: 600;
      font-size: 15px;
      line-height: 1.7;
    }
    .progress-bar {
      background: #e9d5ff;
      height: 8px;
      border-radius: 20px;
      margin: 25px 0 15px;
      overflow: hidden;
    }
    .progress-fill {
      background: linear-gradient(90deg, #8b5cf6, #7c3aed);
      height: 100%;
      width: 66.66%;
      border-radius: 20px;
    }
    .progress-text {
      text-align: center;
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 25px;
      font-weight: 600;
    }
    .card { 
      background: linear-gradient(to bottom, #faf5ff 0%, #ffffff 100%);
      padding: 25px;
      margin: 25px 0;
      border-radius: 12px;
      border: 2px solid #e9d5ff;
      box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.1);
    }
    .card-title {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e9d5ff;
    }
    .info-grid {
      display: grid;
      gap: 12px;
    }
    .info-row { 
      display: grid;
      grid-template-columns: 140px 1fr;
      padding: 12px 0;
      align-items: center;
      gap: 15px;
    }
    .label { 
      font-weight: 600;
      color: #8b5cf6;
      font-size: 14px;
    }
    .value {
      font-size: 15px;
      color: #1f2937;
      font-weight: 500;
    }
    .highlight {
      background: linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 100%);
      padding: 4px 14px;
      border-radius: 8px;
      font-weight: 700;
      color: #6d28d9;
      display: inline-block;
      border: 1px solid #c4b5fd;
    }
    .buttons { 
      text-align: center;
      margin: 35px 0 25px;
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .button { 
      display: inline-block;
      padding: 14px 30px;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 700;
      font-size: 14px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      min-width: 180px;
    }
    .button-primary {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: white !important;
      border: 2px solid #7c3aed;
    }
    .button-secondary {
      background: white;
      color: #8b5cf6 !important;
      border: 2px solid #8b5cf6;
    }
    .action-notice {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-left: 5px solid #f59e0b;
      padding: 18px;
      border-radius: 12px;
      margin: 25px 0;
    }
    .action-notice p {
      color: #92400e;
      font-weight: 600;
      font-size: 14px;
      margin: 0;
      line-height: 1.7;
    }
    .footer { 
      background: linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%);
      text-align: center;
      padding: 30px;
      color: white;
    }
    .footer-logo {
      font-size: 17px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .footer-subtitle {
      font-size: 13px;
      opacity: 0.9;
      margin-bottom: 15px;
      font-weight: 500;
    }
    .footer p { 
      font-size: 12px;
      margin: 5px 0;
      line-height: 1.6;
      opacity: 0.85;
    }
    .footer-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.2);
      margin: 18px 0;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper { border-radius: 0; }
      .content { padding: 25px 20px; }
      .header-top { padding: 25px 20px; }
      .header-title { padding: 20px; }
      .company-name { font-size: 20px; }
      .buttons { flex-direction: column; }
      .button { min-width: 100%; }
      .info-row { grid-template-columns: 1fr; gap: 5px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header-top">
      <div class="company-name">JASAMARGA JALANLAYANG CIKAMPEK</div>
      <div class="company-subtitle">Sistem Inspeksi Kendaraan Operasional</div>
    </div>
    
    <div class="header-title">
      <h1>Inspeksi Disetujui Manager Traffic</h1>
      <p>Manager Operational</p>
    </div>
    
    <div class="content">
      <p class="greeting">
        Yth. <strong>${managerName}</strong>,<br>
        Manager Operational Jasamarga Jalanlayang Cikampek
      </p>
      
      <div class="status-box">
        <div class="status-text">
          Inspeksi telah disetujui oleh Manager Traffic dan sekarang menunggu persetujuan Anda sebagai Manager Operational
        </div>
      </div>

      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
      <div class="progress-text">
        Progress: Petugas ✓ → Manager Traffic ✓ → <strong>Manager Operational (Anda)</strong>
      </div>
      
      <div class="card">
        <div class="card-title">
          Detail Laporan Inspeksi
        </div>
        <div class="info-grid">
          <div class="info-row">
            <span class="label">Kategori</span>
            <span class="value"><span class="highlight">${kategoriKendaraan}</span></span>
          </div>
          <div class="info-row">
            <span class="label">Nomor Polisi</span>
            <span class="value"><strong>${nomorKendaraan}</strong></span>
          </div>
          <div class="info-row">
            <span class="label">Petugas Lapangan</span>
            <span class="value">${namaPetugas}</span>
          </div>
          <div class="info-row">
            <span class="label">Tanggal Inspeksi</span>
            <span class="value">${tanggalInspeksi}</span>
          </div>
        </div>
      </div>

      <div class="buttons">
        <a href="${detailUrl}" class="button button-primary">
          Lihat & ACC Sekarang
        </a>
        <a href="${dashboardUrl}" class="button button-secondary">
          Buka Dashboard
        </a>
      </div>

      <div class="action-notice">
        <p>
          Sebagai tahap persetujuan terakhir, mohon segera review untuk menyelesaikan proses inspeksi
        </p>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-logo">JASAMARGA JALANLAYANG CIKAMPEK</div>
      <div class="footer-subtitle">Sistem Inspeksi Kendaraan Operasional</div>
      <div class="footer-divider"></div>
      <p>Jalan Tol Jakarta - Cikampek KM 47 | Cibitung, Bekasi</p>
      <p style="margin-top: 12px; font-size: 11px; opacity: 0.7;">
        Email ini dikirim secara otomatis oleh sistem. Mohon tidak membalas email ini.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// Template email untuk inspeksi yang ditolak
export function emailTemplateRejected({
  petugasName,
  petugasEmail,
  kategoriKendaraan,
  nomorKendaraan,
  rejectedBy,
  rejectionNote,
  tanggalInspeksi,
  inspeksiId,
}: {
  petugasName: string;
  petugasEmail: string;
  kategoriKendaraan: string;
  nomorKendaraan: string;
  rejectedBy: string;
  rejectionNote: string;
  tanggalInspeksi: string;
  inspeksiId: string;
}) {
  const detailUrl = `${process.env.NEXTAUTH_URL}/dashboard/petugas-lapangan/inspeksi/${inspeksiId}`;
  const managerTitle = rejectedBy === 'TRAFFIC' ? 'Manager Traffic' : 'Manager Operational';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Inspeksi Ditolak</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #1f2937;
      background: #f3f4f6;
      padding: 20px;
    }
    .email-wrapper { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    .header-top {
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%);
      padding: 35px 30px;
      text-align: center;
      color: white;
    }
    .company-name {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 1.5px;
      margin-bottom: 6px;
      text-transform: uppercase;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .company-subtitle {
      font-size: 14px;
      font-weight: 500;
      opacity: 0.95;
      letter-spacing: 0.8px;
    }
    .header-title {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 25px 30px;
      text-align: center;
    }
    .header-title h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .header-title p {
      font-size: 14px;
      opacity: 0.95;
      font-weight: 500;
    }
    .content { 
      padding: 40px 30px;
      background: white;
    }
    .greeting {
      font-size: 16px;
      color: #374151;
      margin-bottom: 25px;
      line-height: 1.8;
    }
    .greeting strong {
      color: #1f2937;
      font-weight: 600;
    }
    .status-box {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      border-left: 5px solid #dc2626;
      padding: 20px;
      border-radius: 12px;
      margin: 25px 0;
    }
    .status-text {
      color: #991b1b;
      font-weight: 600;
      font-size: 15px;
      line-height: 1.7;
    }
    .card { 
      background: linear-gradient(to bottom, #fef2f2 0%, #ffffff 100%);
      padding: 25px;
      margin: 25px 0;
      border-radius: 12px;
      border: 2px solid #fecaca;
      box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.1);
    }
    .card-title {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #fecaca;
    }
    .info-grid {
      display: grid;
      gap: 12px;
    }
    .info-row { 
      display: grid;
      grid-template-columns: 140px 1fr;
      padding: 12px 0;
      align-items: center;
      gap: 15px;
    }
    .label { 
      font-weight: 600;
      color: #ef4444;
      font-size: 14px;
    }
    .value {
      font-size: 15px;
      color: #1f2937;
      font-weight: 500;
    }
    .highlight {
      background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
      padding: 4px 14px;
      border-radius: 8px;
      font-weight: 700;
      color: #991b1b;
      display: inline-block;
      border: 1px solid #fca5a5;
    }
    .reason-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-left: 5px solid #f59e0b;
      padding: 25px;
      border-radius: 12px;
      margin: 25px 0;
      box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.1);
    }
    .reason-title {
      font-size: 17px;
      font-weight: 700;
      color: #78350f;
      margin-bottom: 15px;
    }
    .reason-text {
      background: white;
      padding: 18px;
      border-radius: 8px;
      border: 2px solid #fbbf24;
      font-size: 15px;
      line-height: 1.8;
      color: #92400e;
      font-style: italic;
    }
    .buttons { 
      text-align: center;
      margin: 35px 0 25px;
    }
    .button { 
      display: inline-block;
      padding: 14px 35px;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 700;
      font-size: 14px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white !important;
      border: 2px solid #dc2626;
    }
    .action-notice {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      border-left: 5px solid #dc2626;
      padding: 18px;
      border-radius: 12px;
      margin: 25px 0;
    }
    .action-notice p {
      color: #991b1b;
      font-weight: 600;
      font-size: 14px;
      margin: 0;
      line-height: 1.7;
    }
    .footer { 
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      text-align: center;
      padding: 30px;
      color: white;
    }
    .footer-logo {
      font-size: 17px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .footer-subtitle {
      font-size: 13px;
      opacity: 0.9;
      margin-bottom: 15px;
      font-weight: 500;
    }
    .footer p { 
      font-size: 12px;
      margin: 5px 0;
      line-height: 1.6;
      opacity: 0.85;
    }
    .footer-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.2);
      margin: 18px 0;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper { border-radius: 0; }
      .content { padding: 25px 20px; }
      .header-top { padding: 25px 20px; }
      .header-title { padding: 20px; }
      .company-name { font-size: 20px; }
      .button { width: 100%; }
      .info-row { grid-template-columns: 1fr; gap: 5px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header-top">
      <div class="company-name">JASAMARGA JALANLAYANG CIKAMPEK</div>
      <div class="company-subtitle">Sistem Inspeksi Kendaraan Operasional</div>
    </div>
    
    <div class="header-title">
      <h1>Laporan Inspeksi Ditolak</h1>
      <p>Perbaikan Diperlukan</p>
    </div>
    
    <div class="content">
      <p class="greeting">
        Yth. <strong>${petugasName}</strong>,<br>
        Petugas Lapangan Jasamarga Jalanlayang Cikampek
      </p>
      
      <div class="status-box">
        <div class="status-text">
          Laporan inspeksi Anda telah <strong>DITOLAK</strong> oleh <strong>${managerTitle}</strong>. Mohon lakukan perbaikan sesuai catatan di bawah.
        </div>
      </div>
      
      <div class="card">
        <div class="card-title">
          Detail Laporan Inspeksi
        </div>
        <div class="info-grid">
          <div class="info-row">
            <span class="label">Kategori</span>
            <span class="value"><span class="highlight">${kategoriKendaraan}</span></span>
          </div>
          <div class="info-row">
            <span class="label">Nomor Polisi</span>
            <span class="value"><strong>${nomorKendaraan}</strong></span>
          </div>
          <div class="info-row">
            <span class="label">Tanggal Inspeksi</span>
            <span class="value">${tanggalInspeksi}</span>
          </div>
        </div>
      </div>

      <div class="reason-box">
        <div class="reason-title">
          Alasan Penolakan
        </div>
        <div class="reason-text">
          ${rejectionNote}
        </div>
      </div>

      <div class="buttons">
        <a href="${detailUrl}" class="button">
          Lihat Detail & Lakukan Perbaikan
        </a>
      </div>

      <div class="action-notice">
        <p>
          Mohon perbaiki laporan sesuai catatan ${managerTitle} dan submit ulang untuk persetujuan
        </p>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-logo">JASAMARGA JALANLAYANG CIKAMPEK</div>
      <div class="footer-subtitle">Sistem Inspeksi Kendaraan Operasional</div>
      <div class="footer-divider"></div>
      <p>Jalan Tol Jakarta - Cikampek KM 47 | Cibitung, Bekasi</p>
      <p style="margin-top: 12px; font-size: 11px; opacity: 0.7;">
        Email ini dikirim secara otomatis oleh sistem. Mohon tidak membalas email ini.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// Template email untuk notifikasi rekap manager
export function emailTemplateRekapManager({
  managerName,
  managerRole,
  judulRekap,
  periodeType,
  tanggalMulai,
  tanggalSelesai,
  kategoriKendaraan,
  totalInspeksi,
  namaPengirim,
  catatan,
}: {
  managerName: string;
  managerRole: 'TRAFFIC' | 'OPERATIONAL';
  judulRekap: string;
  periodeType: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  kategoriKendaraan: string | null;
  totalInspeksi: number;
  namaPengirim: string;
  catatan?: string;
}) {
  const dashboardUrl = managerRole === 'TRAFFIC' 
    ? `${process.env.NEXTAUTH_URL}/dashboard/manager-traffic/rekap`
    : `${process.env.NEXTAUTH_URL}/dashboard/manager-operational/rekap`;

  const roleTitle = managerRole === 'TRAFFIC' ? 'Manager Traffic' : 'Manager Operational';
  const themeColor = managerRole === 'TRAFFIC' ? '#3b82f6' : '#8b5cf6';
  const themeGradientStart = managerRole === 'TRAFFIC' ? '#1e3a8a' : '#6d28d9';
  const themeGradientMid = managerRole === 'TRAFFIC' ? '#1e40af' : '#7c3aed';
  const themeGradientEnd = managerRole === 'TRAFFIC' ? '#3b82f6' : '#8b5cf6';
  const lightBg = managerRole === 'TRAFFIC' ? '#dbeafe' : '#e9d5ff';
  const lightBorder = managerRole === 'TRAFFIC' ? '#93c5fd' : '#c4b5fd';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Rekap Inspeksi Baru</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #1f2937;
      background: #f3f4f6;
      padding: 20px;
    }
    .email-wrapper { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    .header-top {
      background: linear-gradient(135deg, ${themeGradientStart} 0%, ${themeGradientMid} 50%, ${themeGradientEnd} 100%);
      padding: 35px 30px;
      text-align: center;
      color: white;
    }
    .company-name {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 1.5px;
      margin-bottom: 6px;
      text-transform: uppercase;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .company-subtitle {
      font-size: 14px;
      font-weight: 500;
      opacity: 0.95;
      letter-spacing: 0.8px;
    }
    .header-title {
      background: linear-gradient(135deg, ${themeGradientEnd} 0%, ${themeGradientMid} 100%);
      color: white;
      padding: 25px 30px;
      text-align: center;
    }
    .header-title h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .header-title p {
      font-size: 14px;
      opacity: 0.95;
      font-weight: 500;
    }
    .content { 
      padding: 40px 30px;
      background: white;
    }
    .greeting {
      font-size: 16px;
      color: #374151;
      margin-bottom: 25px;
      line-height: 1.8;
    }
    .greeting strong {
      color: #1f2937;
      font-weight: 600;
    }
    .alert-box {
      background: linear-gradient(135deg, ${lightBg} 0%, ${lightBorder} 100%);
      border-left: 5px solid ${themeColor};
      padding: 20px;
      border-radius: 12px;
      margin: 25px 0;
    }
    .alert-text {
      color: ${themeGradientStart};
      font-weight: 600;
      font-size: 15px;
      line-height: 1.7;
    }
    .card { 
      background: linear-gradient(to bottom, #f9fafb 0%, #ffffff 100%);
      padding: 25px;
      margin: 25px 0;
      border-radius: 12px;
      border: 2px solid #e5e7eb;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .card-title {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e5e7eb;
    }
    .info-grid {
      display: grid;
      gap: 12px;
    }
    .info-row { 
      display: grid;
      grid-template-columns: 140px 1fr;
      padding: 12px 0;
      align-items: center;
      gap: 15px;
    }
    .label { 
      font-weight: 600;
      color: ${themeColor};
      font-size: 14px;
    }
    .value {
      font-size: 15px;
      color: #1f2937;
      font-weight: 500;
    }
    .highlight {
      background: linear-gradient(135deg, ${lightBg} 0%, ${lightBorder} 100%);
      padding: 4px 14px;
      border-radius: 8px;
      font-weight: 700;
      color: ${themeGradientStart};
      display: inline-block;
      border: 1px solid ${lightBorder};
    }
    .stats-box {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border-left: 5px solid #10b981;
      padding: 20px;
      border-radius: 12px;
      margin: 25px 0;
      text-align: center;
    }
    .stats-number {
      font-size: 42px;
      font-weight: 800;
      color: #065f46;
      margin-bottom: 8px;
    }
    .stats-label {
      font-size: 14px;
      font-weight: 600;
      color: #047857;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .note-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-left: 5px solid #f59e0b;
      padding: 18px;
      border-radius: 12px;
      margin: 25px 0;
    }
    .note-text {
      color: #92400e;
      font-size: 14px;
      line-height: 1.7;
      font-style: italic;
    }
    .buttons { 
      text-align: center;
      margin: 35px 0 25px;
    }
    .button { 
      display: inline-block;
      padding: 14px 35px;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 700;
      font-size: 14px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      background: linear-gradient(135deg, ${themeGradientEnd} 0%, ${themeGradientMid} 100%);
      color: white !important;
      border: 2px solid ${themeGradientMid};
    }
    .footer { 
      background: linear-gradient(135deg, ${themeGradientStart} 0%, ${themeGradientMid} 100%);
      text-align: center;
      padding: 30px;
      color: white;
    }
    .footer-logo {
      font-size: 17px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .footer-subtitle {
      font-size: 13px;
      opacity: 0.9;
      margin-bottom: 15px;
      font-weight: 500;
    }
    .footer p { 
      font-size: 12px;
      margin: 5px 0;
      line-height: 1.6;
      opacity: 0.85;
    }
    .footer-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.2);
      margin: 18px 0;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper { border-radius: 0; }
      .content { padding: 25px 20px; }
      .header-top { padding: 25px 20px; }
      .header-title { padding: 20px; }
      .company-name { font-size: 20px; }
      .button { width: 100%; }
      .info-row { grid-template-columns: 1fr; gap: 5px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header-top">
      <div class="company-name">JASAMARGA JALANLAYANG CIKAMPEK</div>
      <div class="company-subtitle">Sistem Inspeksi Kendaraan Operasional</div>
    </div>
    
    <div class="header-title">
      <h1>Laporan Rekap Inspeksi Baru</h1>
      <p>${roleTitle}</p>
    </div>
    
    <div class="content">
      <p class="greeting">
        Yth. <strong>${managerName}</strong>,<br>
        ${roleTitle} Jasamarga Jalanlayang Cikampek
      </p>
      
      <div class="alert-box">
        <div class="alert-text">
          Anda menerima laporan rekap inspeksi baru dari <strong>${namaPengirim}</strong>
        </div>
      </div>

      <div class="stats-box">
        <div class="stats-number">${totalInspeksi}</div>
        <div class="stats-label">Total Inspeksi</div>
      </div>
      
      <div class="card">
        <div class="card-title">
          ${judulRekap}
        </div>
        <div class="info-grid">
          <div class="info-row">
            <span class="label">Periode</span>
            <span class="value"><span class="highlight">${periodeType}</span></span>
          </div>
          <div class="info-row">
            <span class="label">Tanggal Mulai</span>
            <span class="value">${tanggalMulai}</span>
          </div>
          <div class="info-row">
            <span class="label">Tanggal Selesai</span>
            <span class="value">${tanggalSelesai}</span>
          </div>
          <div class="info-row">
            <span class="label">Kategori</span>
            <span class="value">${kategoriKendaraan || 'Semua Kategori'}</span>
          </div>
          <div class="info-row">
            <span class="label">Dari</span>
            <span class="value"><strong>${namaPengirim}</strong></span>
          </div>
        </div>
      </div>

      ${catatan ? `
      <div class="note-box">
        <div class="note-text">
          <strong>Catatan:</strong><br>
          ${catatan}
        </div>
      </div>
      ` : ''}

      <div class="buttons">
        <a href="${dashboardUrl}" class="button">
          Lihat Rekap Lengkap
        </a>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-logo">JASAMARGA JALANLAYANG CIKAMPEK</div>
      <div class="footer-subtitle">Sistem Inspeksi Kendaraan Operasional</div>
      <div class="footer-divider"></div>
      <p>Jalan Tol Jakarta - Cikampek KM 47 | Cibitung, Bekasi</p>
      <p style="margin-top: 12px; font-size: 11px; opacity: 0.7;">
        Email ini dikirim secara otomatis oleh sistem. Mohon tidak membalas email ini.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
