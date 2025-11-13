"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

interface RekapData {
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
  };
  inspeksiList: any[];
  statistics: {
    totalInspeksi: number;
    byKategori: Record<string, number>;
    byStatus: Record<string, number>;
    byPetugas: Record<string, number>;
  };
}

const COLORS = {
  DEREK: "#FF6B6B",
  PLAZA: "#4ECDC4",
  KAMTIB: "#FFD93D",
  RESCUE: "#6C5CE7",
};

export default function ViewRekapPage() {
  const router = useRouter();
  const params = useParams();
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [data, setData] = useState<RekapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchRekapData(params.id as string);
    }
  }, [params.id]);

  const fetchRekapData = async (rekapId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rekap-manager/${rekapId}/view`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch rekap data");
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching rekap:", error);
      alert("Gagal memuat data rekap");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!contentRef.current || !data) return;

    try {
      setGenerating(true);

      // Wait for charts to fully render
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Capture the content as canvas with proper color handling
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        removeContainer: true,
        imageTimeout: 15000,
        ignoreElements: (element) => {
          // Skip elements that might cause issues
          return element.tagName === 'IFRAME' || element.tagName === 'VIDEO';
        },
        onclone: (clonedDoc) => {
          // Force standard RGB colors in cloned document
          const clonedContent = clonedDoc.querySelector('[data-pdf-content]');
          if (clonedContent) {
            const allElements = clonedContent.querySelectorAll('*');
            allElements.forEach((el) => {
              const htmlEl = el as HTMLElement;
              const computed = window.getComputedStyle(htmlEl);
              
              // Force inline styles to override any LAB colors
              if (computed.color) {
                const rgb = computed.color.match(/rgba?\([\d,\s.]+\)/);
                if (rgb) {
                  htmlEl.style.color = rgb[0];
                } else if (!computed.color.startsWith('#') && !computed.color.startsWith('rgb')) {
                  htmlEl.style.color = '#000000';
                }
              }
              
              if (computed.backgroundColor) {
                const rgb = computed.backgroundColor.match(/rgba?\([\d,\s.]+\)/);
                if (rgb) {
                  htmlEl.style.backgroundColor = rgb[0];
                } else if (!computed.backgroundColor.startsWith('#') && !computed.backgroundColor.startsWith('rgb')) {
                  htmlEl.style.backgroundColor = 'transparent';
                }
              }
            });
          }
        }
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      
      // Add image to PDF with proper pagination
      if (imgHeight <= pageHeight) {
        // Single page
        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
      } else {
        // Multiple pages
        let heightLeft = imgHeight;
        let position = 0;
        
        // First page
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Additional pages
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }

      // Save PDF
      const filename = `Laporan_Rekap_${data.rekap.judulRekap.replace(/[^a-z0-9]/gi, "_")}_${new Date().getTime()}.pdf`;
      pdf.save(filename);

      console.log("✅ PDF generated successfully");
      alert("✅ PDF berhasil diunduh!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`❌ Gagal membuat PDF.\n\nError: ${errorMessage}\n\nSilakan coba lagi atau hubungi administrator.`);
    } finally {
      setGenerating(false);
    }
  };

  const handleExportExcel = () => {
    if (!data) return;

    try {
      const { rekap, inspeksiList, statistics } = data;

      // === SHEET 1: RINGKASAN ===
      const ringkasanData = [
        ["LAPORAN REKAP INSPEKSI KENDARAAN"],
        ["Jasa Marga - Sistem Inspeksi Kendaraan"],
        [],
        ["INFORMASI REKAP"],
        ["Judul Rekap", rekap.judulRekap],
        ["Periode", getPeriodeTypeLabel(rekap.periodeType)],
        [
          "Tanggal",
          `${new Date(rekap.tanggalMulai).toLocaleDateString("id-ID")} - ${new Date(rekap.tanggalSelesai).toLocaleDateString("id-ID")}`
        ],
        ["Kategori Kendaraan", rekap.kategoriKendaraan || "Semua Kategori"],
        ["Total Inspeksi", statistics.totalInspeksi],
        ["Dikirim oleh", rekap.namaPengirim],
        [
          "Tanggal Dibuat",
          new Date(rekap.createdAt).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        ],
        [],
        ["DISTRIBUSI PER KATEGORI KENDARAAN"],
        ["Kategori", "Jumlah", "Persentase"],
      ];

      Object.entries(statistics.byKategori).forEach(([kategori, jumlah]) => {
        const persentase = ((jumlah / statistics.totalInspeksi) * 100).toFixed(1) + "%";
        ringkasanData.push([kategori, jumlah, persentase]);
      });

      ringkasanData.push([]);
      ringkasanData.push(["TOP 10 PETUGAS LAPANGAN"]);
      ringkasanData.push(["Nama Petugas", "Jumlah Inspeksi"]);

      Object.entries(statistics.byPetugas)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .forEach(([nama, jumlah]) => {
          ringkasanData.push([nama, jumlah]);
        });

      if (rekap.catatan) {
        ringkasanData.push([]);
        ringkasanData.push(["CATATAN"]);
        ringkasanData.push([rekap.catatan]);
      }

      // === SHEET 2: DETAIL INSPEKSI ===
      const detailInspeksiData = [
        ["DETAIL INSPEKSI KENDARAAN"],
        [],
        [
          "No",
          "Tanggal Inspeksi",
          "Kategori",
          "Nomor Kendaraan",
          "Lokasi Inspeksi",
          "Nama Petugas",
          "Status",
          "Catatan"
        ],
      ];

      inspeksiList.forEach((inspeksi, index) => {
        detailInspeksiData.push([
          index + 1,
          new Date(inspeksi.tanggalInspeksi).toLocaleDateString("id-ID"),
          inspeksi.kategoriKendaraan,
          inspeksi.nomorKendaraan,
          inspeksi.lokasiInspeksi,
          inspeksi.petugas.name,
          "Approved",
          inspeksi.catatan || "-"
        ]);
      });

      // === SHEET 3: DOKUMEN & SERVICE ===
      const dokumenServiceData = [
        ["DOKUMEN & SERVICE KENDARAAN"],
        [],
        [
          "No",
          "Nomor Kendaraan",
          "Kategori",
          "STNK",
          "Asuransi",
          "KIR",
          "Pajak Tahunan",
          "Service Rutin",
          "Ganti Oli",
          "Ganti Ban"
        ],
      ];

      inspeksiList.forEach((inspeksi, index) => {
        dokumenServiceData.push([
          index + 1,
          inspeksi.nomorKendaraan,
          inspeksi.kategoriKendaraan,
          inspeksi.stnk === true ? "✓ Ya" : "✗ Tidak",
          inspeksi.asuransi === true ? "✓ Ya" : "✗ Tidak",
          inspeksi.kir === true ? "✓ Ya" : "✗ Tidak",
          inspeksi.pajakTahunan === true ? "✓ Ya" : "✗ Tidak",
          inspeksi.serviceRutin === true ? "✓ Ya" : "✗ Tidak",
          inspeksi.gantiOli === true ? "✓ Ya" : "✗ Tidak",
          inspeksi.gantiBan === true ? "✓ Ya" : "✗ Tidak"
        ]);
      });

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Add sheets
      const wsRingkasan = XLSX.utils.aoa_to_sheet(ringkasanData);
      const wsDetailInspeksi = XLSX.utils.aoa_to_sheet(detailInspeksiData);
      const wsDokumenService = XLSX.utils.aoa_to_sheet(dokumenServiceData);

      // Set column widths for better readability
      wsRingkasan["!cols"] = [
        { wch: 25 },
        { wch: 40 },
        { wch: 15 }
      ];

      wsDetailInspeksi["!cols"] = [
        { wch: 5 },  // No
        { wch: 15 }, // Tanggal
        { wch: 12 }, // Kategori
        { wch: 18 }, // Nomor Kendaraan
        { wch: 20 }, // Lokasi
        { wch: 20 }, // Petugas
        { wch: 12 }, // Status
        { wch: 30 }  // Catatan
      ];

      wsDokumenService["!cols"] = [
        { wch: 5 },  // No
        { wch: 18 }, // Nomor Kendaraan
        { wch: 12 }, // Kategori
        { wch: 10 }, // STNK
        { wch: 10 }, // Asuransi
        { wch: 10 }, // KIR
        { wch: 14 }, // Pajak Tahunan
        { wch: 14 }, // Service Rutin
        { wch: 12 }, // Ganti Oli
        { wch: 12 }  // Ganti Ban
      ];

      // Append sheets to workbook
      XLSX.utils.book_append_sheet(wb, wsRingkasan, "Ringkasan");
      XLSX.utils.book_append_sheet(wb, wsDetailInspeksi, "Detail Inspeksi");
      XLSX.utils.book_append_sheet(wb, wsDokumenService, "Dokumen & Service");

      // Generate filename
      const filename = `Rekap_Inspeksi_${rekap.judulRekap.replace(/[^a-z0-9]/gi, "_")}_${new Date().getTime()}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      alert("✅ File Excel berhasil diunduh!");
    } catch (error) {
      console.error("Error generating Excel:", error);
      alert("❌ Gagal membuat file Excel. Silakan coba lagi.");
    }
  };

  const getPeriodeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      HARIAN: "Harian",
      MINGGUAN: "Mingguan",
      BULANAN: "Bulanan",
      TAHUNAN: "Tahunan",
      KUSTOM: "Custom",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Memuat data rekap...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-medium">Data rekap tidak ditemukan</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const { rekap, inspeksiList, statistics } = data;

  // Prepare chart data
  const kategoriChartData = Object.entries(statistics.byKategori).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / statistics.totalInspeksi) * 100).toFixed(1),
  }));

  const petugasChartData = Object.entries(statistics.byPetugas)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 petugas

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Action Bar - Not included in PDF */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </button>

            <button
              onClick={handleGeneratePDF}
              disabled={generating}
              className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Membuat PDF...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content - Will be converted to PDF */}
      <div ref={contentRef} className="bg-white" style={{ colorScheme: 'light', backgroundColor: '#FFFFFF' }} data-pdf-content>
        <div className="max-w-7xl mx-auto px-6 py-8" style={{ color: '#000000' }}>
          {/* Header */}
          <div className="text-center mb-8 pb-6" style={{ borderBottom: '4px solid #10B981' }}>
            <div className="mb-4">
              <img 
                src="/logo/jasa-marga.png" 
                alt="Logo Jasa Marga" 
                className="h-16 mx-auto mb-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                crossOrigin="anonymous"
              />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#111827' }}>
              LAPORAN REKAP INSPEKSI KENDARAAN
            </h1>
            <p className="text-lg" style={{ color: '#4B5563' }}>Jasa Marga - Sistem Inspeksi Kendaraan</p>
          </div>

          {/* Informasi Rekap */}
          <div className="rounded-lg p-6 mb-8 border-2" style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#111827' }}>{rekap.judulRekap}</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: '#4B5563' }}>Periode</p>
                <p className="text-lg font-bold" style={{ color: '#111827' }}>{getPeriodeTypeLabel(rekap.periodeType)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium" style={{ color: '#4B5563' }}>Tanggal</p>
                <p className="text-lg font-bold" style={{ color: '#111827' }}>
                  {new Date(rekap.tanggalMulai).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  -{" "}
                  {new Date(rekap.tanggalSelesai).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium" style={{ color: '#4B5563' }}>Kategori Kendaraan</p>
                <p className="text-lg font-bold" style={{ color: '#111827' }}>
                  {rekap.kategoriKendaraan || "Semua Kategori"}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium" style={{ color: '#4B5563' }}>Total Inspeksi</p>
                <p className="text-3xl font-bold" style={{ color: '#10B981' }}>{statistics.totalInspeksi}</p>
              </div>
            </div>

            <div className="mt-4 pt-4" style={{ borderTop: '1px solid #A7F3D0' }}>
              <p className="text-sm" style={{ color: '#4B5563' }}>
                <strong>Dikirim oleh:</strong> {rekap.namaPengirim} •{" "}
                {new Date(rekap.createdAt).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="space-y-8 mb-8">
            {/* Distribusi per Kategori */}
            <div className="rounded-lg border-2 p-6" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#111827' }}>
                <span className="w-2 h-8 rounded" style={{ backgroundColor: '#10B981' }}></span>
                Distribusi Inspeksi per Kategori Kendaraan
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={kategoriChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.percentage}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {kategoriChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar Chart */}
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={kategoriChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10B981">
                        {kategoriChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Legend Table */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {kategoriChartData.map((item) => (
                  <div key={item.name} className="rounded-lg p-4 border" style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[item.name as keyof typeof COLORS] }}
                      ></div>
                      <span className="font-bold" style={{ color: '#111827' }}>{item.name}</span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: '#10B981' }}>{item.value}</p>
                    <p className="text-sm" style={{ color: '#4B5563' }}>{item.percentage}% dari total</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Petugas */}
            <div className="rounded-lg border-2 p-6" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#111827' }}>
                <span className="w-2 h-8 rounded" style={{ backgroundColor: '#3B82F6' }}></span>
                Top 10 Petugas Lapangan
              </h3>
              
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={petugasChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* Data Table */}
          <div className="rounded-lg border-2 p-6 mb-8" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#111827' }}>
              <span className="w-2 h-8 rounded" style={{ backgroundColor: '#1F2937' }}></span>
              Detail Inspeksi ({inspeksiList.length} data)
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#F3F4F6', borderBottom: '2px solid #D1D5DB' }}>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#111827' }}>No</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#111827' }}>Tanggal</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#111827' }}>Kategori</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#111827' }}>Nomor Kendaraan</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#111827' }}>Lokasi</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#111827' }}>Petugas</th>
                    <th className="px-4 py-3 text-left font-bold" style={{ color: '#111827' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inspeksiList.map((inspeksi, index) => (
                    <tr key={inspeksi.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td className="px-4 py-3" style={{ color: '#111827' }}>{index + 1}</td>
                      <td className="px-4 py-3" style={{ color: '#111827' }}>
                        {new Date(inspeksi.tanggalInspeksi).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                          {inspeksi.kategoriKendaraan}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold" style={{ color: '#111827' }}>{inspeksi.nomorKendaraan}</td>
                      <td className="px-4 py-3" style={{ color: '#111827' }}>{inspeksi.lokasiInspeksi}</td>
                      <td className="px-4 py-3" style={{ color: '#111827' }}>{inspeksi.petugas.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                          ✓ Approved
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Catatan */}
          {rekap.catatan && (
            <div className="rounded-lg border-2 p-6 mb-8" style={{ backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }}>
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2" style={{ color: '#111827' }}>
                <svg className="w-6 h-6" style={{ color: '#D97706' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Catatan
              </h3>
              <p className="whitespace-pre-wrap" style={{ color: '#374151' }}>{rekap.catatan}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm mt-8 pt-6" style={{ color: '#6B7280', borderTop: '1px solid #E5E7EB' }}>
            <p>
              Dokumen ini dibuat secara otomatis oleh Sistem Inspeksi Kendaraan Jasa Marga
            </p>
            <p className="mt-1">
              Tanggal cetak: {new Date().toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
