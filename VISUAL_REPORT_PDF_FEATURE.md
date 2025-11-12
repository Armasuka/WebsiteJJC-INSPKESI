# Fitur Visualisasi Laporan Rekap dengan PDF Export

## 📋 Overview

Fitur ini memungkinkan Manager Operational untuk melihat laporan rekap inspeksi dalam format **visual yang interaktif** dengan diagram, chart, dan tabel yang profesional. Laporan bisa langsung di-convert ke **PDF** untuk dibagikan atau dicetak.

---

## ✨ Fitur Utama

### 1. **Halaman Laporan Visual**
Tampilan lengkap dengan berbagai visualisasi:

#### **Header Laporan**
- Logo Jasa Marga
- Judul laporan resmi
- Informasi periode dan kategori
- Total inspeksi (highlight)
- Informasi pengirim dan tanggal

#### **Chart & Diagram**

**1. Distribusi per Kategori (Pie Chart & Bar Chart)**
- Pie chart menampilkan persentase per kategori
- Bar chart menampilkan jumlah per kategori
- Color-coded untuk setiap kategori:
  - 🔴 DEREK - Red (#FF6B6B)
  - 🔵 PLAZA - Cyan (#4ECDC4)
  - 🟡 KAMTIB - Yellow (#FFD93D)
  - 🟣 RESCUE - Purple (#6C5CE7)
- Legend table dengan detail angka dan persentase

**2. Top 10 Petugas Lapangan (Horizontal Bar Chart)**
- Menampilkan petugas dengan inspeksi terbanyak
- Sorted dari tertinggi ke terendah
- Membantu evaluasi kinerja petugas

**3. Status Approval (Bar Chart)**
- Breakdown inspeksi berdasarkan status approval
- Approved by Traffic vs Approved by Operational

**4. Tabel Detail Inspeksi**
- Daftar lengkap semua inspeksi dalam periode
- Kolom: No, Tanggal, Kategori, Nomor Kendaraan, Lokasi, Petugas, Status
- Sortable dan searchable

### 2. **PDF Export**
Satu klik untuk convert seluruh laporan ke PDF:
- Capture halaman dengan resolusi tinggi (scale 2x)
- Format A4 professional
- Multi-page jika konten panjang
- Include semua chart dan tabel
- Footer dengan timestamp cetak

### 3. **Responsive Design**
- Optimal untuk desktop viewing
- Chart responsif dan scalable
- Print-friendly CSS

---

## 🔧 Implementasi Teknis

### 1. **API Endpoint**
**File:** `app/api/rekap-manager/[id]/view/route.ts`

**Endpoint:** `GET /api/rekap-manager/{rekapId}/view`

**Response:**
```typescript
{
  rekap: {
    id: string;
    judulRekap: string;
    periodeType: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    kategoriKendaraan: string | null;
    totalInspeksi: number;
    namaPengirim: string;
    catatan: string | null;
    createdAt: string;
  },
  inspeksiList: Array<InspeksiDetail>,
  statistics: {
    totalInspeksi: number;
    byKategori: Record<string, number>;
    byStatus: Record<string, number>;
    byPetugas: Record<string, number>;
  }
}
```

**Security:**
- Hanya Manager Operational bisa akses
- Return 403 Forbidden untuk role lain
- Return 404 jika rekap tidak ditemukan

### 2. **Frontend Page**
**File:** `app/dashboard/manager-operational/rekap/view/[id]/page.tsx`

**Route:** `/dashboard/manager-operational/rekap/view/{rekapId}`

**Libraries Used:**
- `recharts` - Chart visualization (Pie, Bar, Line)
- `html2canvas` - Capture HTML to canvas
- `jspdf` - Generate PDF from canvas

**State Management:**
```typescript
const [data, setData] = useState<RekapData | null>(null);
const [loading, setLoading] = useState(true);
const [generating, setGenerating] = useState(false);
const contentRef = useRef<HTMLDivElement>(null);
```

**PDF Generation Function:**
```typescript
const handleGeneratePDF = async () => {
  // Capture content as canvas
  const canvas = await html2canvas(contentRef.current, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  // Calculate dimensions
  const imgWidth = 210; // A4 width
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Create PDF
  const pdf = new jsPDF("p", "mm", "a4");
  const imgData = canvas.toDataURL("image/png");
  
  // Handle multi-page
  if (imgHeight > 297) {
    // Add multiple pages
  } else {
    // Single page
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
  }

  // Save
  pdf.save(filename);
};
```

### 3. **Chart Configuration**

**Pie Chart:**
```tsx
<PieChart>
  <Pie
    data={kategoriChartData}
    cx="50%"
    cy="50%"
    labelLine={false}
    label={(entry) => `${entry.name}: ${entry.percentage}%`}
    outerRadius={100}
    dataKey="value"
  >
    {kategoriChartData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
    ))}
  </Pie>
  <Tooltip />
</PieChart>
```

**Bar Chart:**
```tsx
<BarChart data={kategoriChartData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="value" fill="#10B981">
    {kategoriChartData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
    ))}
  </Bar>
</BarChart>
```

---

## 🎯 User Flow

### Manager Operational:

1. **Buka Halaman Rekap**
   - Navigate ke `/dashboard/manager-operational/rekap`

2. **Pilih Rekap untuk Dilihat**
   - Klik tombol **"Lihat Laporan"** 📊 (warna biru) di card rekap
   - ATAU klik "Info Detail" kemudian "Lihat Laporan Visual"

3. **View Laporan Visual**
   - Halaman baru terbuka dengan visualisasi lengkap
   - Scroll untuk melihat semua chart dan tabel
   - Interact dengan chart (hover untuk detail)

4. **Generate PDF**
   - Klik tombol **"Download PDF"** di kanan atas
   - Wait untuk proses capture dan generate (2-5 detik)
   - File PDF otomatis terunduh

5. **Share atau Print**
   - Buka PDF di PDF reader
   - Share via email atau cloud storage
   - Print untuk dokumentasi fisik

---

## 📊 Struktur Laporan Visual

```
┌─────────────────────────────────────────────────────────┐
│                    HEADER                               │
│  [Logo Jasa Marga]                                      │
│  LAPORAN REKAP INSPEKSI KENDARAAN                       │
│  Jasa Marga - Sistem Inspeksi Kendaraan                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              INFORMASI REKAP                            │
│  Judul: Rekap Bulanan Oktober 2025                      │
│  Periode: Bulanan                                       │
│  Tanggal: 01 Oktober - 31 Oktober 2025                  │
│  Kategori: Semua Kategori                               │
│  Total Inspeksi: 45                                     │
│  Dikirim oleh: Budi Santoso • 11 Nov 2025, 10:30       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│    DISTRIBUSI INSPEKSI PER KATEGORI KENDARAAN           │
│                                                          │
│  [Pie Chart]              [Bar Chart]                   │
│   DEREK: 26.7%             ║████████ DEREK (12)         │
│   PLAZA: 33.3%             ║██████████ PLAZA (15)       │
│   KAMTIB: 22.2%            ║███████ KAMTIB (10)         │
│   RESCUE: 17.8%            ║██████ RESCUE (8)           │
│                                                          │
│  [Legend Cards]                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│  │ DEREK  │ │ PLAZA  │ │ KAMTIB │ │ RESCUE │          │
│  │   12   │ │   15   │ │   10   │ │    8   │          │
│  │ 26.7%  │ │ 33.3%  │ │ 22.2%  │ │ 17.8%  │          │
│  └────────┘ └────────┘ └────────┘ └────────┘          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│          TOP 10 PETUGAS LAPANGAN                        │
│                                                          │
│  Budi Santoso      ║████████████ (12)                   │
│  Ani Wijaya        ║██████████ (10)                     │
│  Joko Susilo       ║████████ (8)                        │
│  Siti Nurhaliza    ║██████ (6)                          │
│  ...                                                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              STATUS APPROVAL                            │
│                                                          │
│  [Bar Chart]                                            │
│  Approved Traffic      ║██████████ (20)                 │
│  Approved Operational  ║█████████████████ (25)          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│         DETAIL INSPEKSI (45 data)                       │
│                                                          │
│  No | Tanggal    | Kategori | Nomor | Lokasi | Petugas │
│  ---|------------|----------|-------|--------|---------- │
│  1  | 01/10/2025 | DEREK    | B1234 | Km 25  | Budi    │
│  2  | 02/10/2025 | PLAZA    | B5678 | Km 30  | Ani     │
│  ... (full table)                                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   CATATAN                               │
│  (jika ada catatan dari pengirim)                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   FOOTER                                │
│  Dokumen dibuat otomatis oleh Sistem Inspeksi Jasa Marga│
│  Tanggal cetak: 11 November 2025, 14:30                │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Design & UX

### Color Scheme:
- **Primary:** Green (#10B981) - untuk header dan highlight
- **Secondary:** Blue (#3B82F6) - untuk action buttons
- **Kategori Colors:**
  - DEREK: Red (#FF6B6B)
  - PLAZA: Cyan (#4ECDC4)
  - KAMTIB: Yellow (#FFD93D)
  - RESCUE: Purple (#6C5CE7)

### Typography:
- **Headings:** Bold, 2xl - 3xl
- **Body:** Medium, sm - base
- **Data:** Bold for emphasis

### Layout:
- Max-width: 7xl (1280px)
- Padding: 6 (24px)
- Card spacing: 8 (32px)
- Responsive grid untuk charts

---

## 🔒 Security & Access

| Role | View Laporan | Generate PDF |
|------|--------------|--------------|
| **Petugas Lapangan** | ❌ Tidak | ❌ Tidak |
| **Manager Traffic** | ❌ **403 Forbidden** | ❌ Tidak |
| **Manager Operational** | ✅ **Bisa** | ✅ **Bisa** |

---

## 🧪 Testing

### Test Case 1: View Laporan
1. Login sebagai Manager Operational
2. Navigate ke Rekap Laporan
3. Klik "Lihat Laporan" pada salah satu rekap
4. **Expected:** 
   - Halaman visual terbuka dengan chart lengkap
   - Data sesuai dengan periode rekap
   - All charts rendered properly

### Test Case 2: Generate PDF
1. Buka laporan visual
2. Klik "Download PDF"
3. **Expected:**
   - Loading indicator muncul
   - PDF ter-generate dalam 2-5 detik
   - File PDF terunduh dengan nama yang benar
   - Content PDF sesuai dengan tampilan web

### Test Case 3: Multi-page PDF
1. Buka rekap dengan banyak data (>50 inspeksi)
2. Generate PDF
3. **Expected:**
   - PDF memiliki multiple pages
   - Content tidak terpotong
   - All pages properly formatted

### Test Case 4: Access Control
1. Login sebagai Manager Traffic
2. Try access: `/dashboard/manager-operational/rekap/view/{id}`
3. **Expected:** Redirect atau 403 error

---

## 📱 Button Locations

### 1. **Card Rekap (List View)**
Tombol "Lihat Laporan" (Blue) ditambahkan di samping tombol lain:
```
┌─────────────────────────────────┐
│ [Rekap Card]                    │
│                                 │
│ ┌─────────────────┐             │
│ │ Lihat Laporan   │ (Blue)      │
│ │ Info Detail     │ (Green)     │
│ │ Excel           │ (Emerald)   │
│ └─────────────────┘             │
└─────────────────────────────────┘
```

### 2. **Modal Detail**
Tombol "Lihat Laporan Visual" di footer modal:
```
┌─────────────────────────────────────────┐
│ [Detail Modal]                          │
│ ...content...                           │
│                                         │
│ [Tutup] [Lihat Laporan] [Excel]        │
└─────────────────────────────────────────┘
```

---

## 📦 Dependencies

All required libraries already installed:
```json
{
  "recharts": "^3.3.0",        // ✅ Chart library
  "html2canvas": "^1.4.1",     // ✅ HTML to canvas
  "jspdf": "^3.0.3"            // ✅ PDF generation
}
```

---

## 🚀 Future Enhancements

1. **Custom Chart Selection** - User pilih chart mana yang mau ditampilkan
2. **Print Preview** - Preview sebelum generate PDF
3. **Email PDF** - Kirim PDF langsung via email
4. **Comparison View** - Compare multiple rekap side-by-side
5. **Drill-down** - Klik chart untuk detail breakdown
6. **Export to Image** - Export individual charts as PNG
7. **Dark Mode** - Dark theme untuk viewing

---

## 📝 Notes

1. **Performance:** Chart rendering ~1-2 detik, PDF generation ~2-5 detik
2. **File Size:** PDF typically 500KB - 2MB depending on content
3. **Browser Support:** Modern browsers with Canvas API support
4. **Mobile View:** Optimized for desktop, limited mobile support
5. **Print CSS:** Proper styling for direct browser print (Ctrl+P)

---

## ✅ Status: COMPLETED

**Tanggal Implementasi:** 11 November 2025

Fitur visualisasi laporan rekap dengan PDF export telah berhasil diimplementasikan dan siap digunakan oleh Manager Operational untuk melihat dan membagikan laporan inspeksi dalam format yang profesional dan visual.
