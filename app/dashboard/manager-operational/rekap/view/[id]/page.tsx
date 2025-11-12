"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

const STATUS_COLORS = {
  APPROVED_BY_TRAFFIC: "#3B82F6",
  APPROVED_BY_OPERATIONAL: "#10B981",
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

      // Get all elements and force standard colors (avoid LAB colors)
      const elements = contentRef.current.querySelectorAll('*');
      const originalColors: Array<{element: HTMLElement, color: string, bgColor: string}> = [];
      
      elements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const computed = window.getComputedStyle(htmlEl);
        const color = computed.color;
        const bgColor = computed.backgroundColor;
        
        // Store original colors
        originalColors.push({
          element: htmlEl,
          color: color,
          bgColor: bgColor
        });
        
        // Convert LAB colors to RGB temporarily
        if (color && color.includes('lab')) {
          htmlEl.style.color = '#000000';
        }
        if (bgColor && bgColor.includes('lab')) {
          htmlEl.style.backgroundColor = '#ffffff';
        }
      });

      // Capture the content as canvas
      const canvas = await html2canvas(contentRef.current, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        removeContainer: true,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Additional cleanup in cloned document
          const clonedElements = clonedDoc.querySelectorAll('*');
          clonedElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            const computed = window.getComputedStyle(htmlEl);
            
            if (computed.color && computed.color.includes('lab')) {
              htmlEl.style.color = '#000000';
            }
            if (computed.backgroundColor && computed.backgroundColor.includes('lab')) {
              htmlEl.style.backgroundColor = '#ffffff';
            }
          });
        }
      });

      // Restore original colors
      originalColors.forEach(({element, color, bgColor}) => {
        element.style.color = color;
        element.style.backgroundColor = bgColor;
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

  const statusChartData = Object.entries(statistics.byStatus).map(([name, value]) => ({
    name: name === "APPROVED_BY_TRAFFIC" ? "Approved Traffic" : "Approved Operational",
    value,
  }));

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

      {/* Content - Will be converted to PDF */}
      <div ref={contentRef} className="bg-white" style={{ colorScheme: 'light' }}>
        <div className="max-w-7xl mx-auto px-6 py-8" style={{ color: '#000000' }}>
          {/* Header */}
          <div className="text-center mb-8 border-b-4 border-green-600 pb-6" style={{ borderBottomColor: '#10B981' }}>
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
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 mb-8 border-2 border-green-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{rekap.judulRekap}</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">Periode</p>
                <p className="text-lg font-bold text-gray-900">{getPeriodeTypeLabel(rekap.periodeType)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 font-medium">Tanggal</p>
                <p className="text-lg font-bold text-gray-900">
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
                <p className="text-sm text-gray-600 font-medium">Kategori Kendaraan</p>
                <p className="text-lg font-bold text-gray-900">
                  {rekap.kategoriKendaraan || "Semua Kategori"}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Inspeksi</p>
                <p className="text-3xl font-bold text-green-600">{statistics.totalInspeksi}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-sm text-gray-600">
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
            <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-8 bg-green-600 rounded"></span>
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
                  <div key={item.name} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[item.name as keyof typeof COLORS] }}
                      ></div>
                      <span className="font-bold text-gray-900">{item.name}</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{item.value}</p>
                    <p className="text-sm text-gray-600">{item.percentage}% dari total</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Petugas */}
            <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-8 bg-blue-600 rounded"></span>
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

            {/* Status Approval */}
            <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-8 bg-purple-600 rounded"></span>
                Status Approval
              </h3>
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-8 bg-gray-800 rounded"></span>
              Detail Inspeksi ({inspeksiList.length} data)
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-4 py-3 text-left font-bold text-gray-900">No</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-900">Tanggal</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-900">Kategori</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-900">Nomor Kendaraan</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-900">Lokasi</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-900">Petugas</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inspeksiList.map((inspeksi, index) => (
                    <tr key={inspeksi.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3 text-gray-900">
                        {new Date(inspeksi.tanggalInspeksi).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          {inspeksi.kategoriKendaraan}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">{inspeksi.nomorKendaraan}</td>
                      <td className="px-4 py-3 text-gray-900">{inspeksi.lokasiInspeksi}</td>
                      <td className="px-4 py-3 text-gray-900">{inspeksi.petugas.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            inspeksi.status === "APPROVED_BY_OPERATIONAL"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {inspeksi.status === "APPROVED_BY_OPERATIONAL" ? "✓ Operational" : "✓ Traffic"}
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
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Catatan
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{rekap.catatan}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 mt-8 pt-6 border-t border-gray-200">
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
