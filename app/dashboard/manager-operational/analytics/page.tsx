"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface AnalyticsData {
  stats: {
    total: number;
    approved: number;
    rejected: number;
    approvedByTraffic: number;
    approvedByOperational: number;
  };
  byKategori: {
    approved: Record<string, number>;
    rejected: Record<string, number>;
  };
  topPetugasApproved: Array<{ name: string; email: string; count: number }>;
  topPetugasRejected: Array<{ name: string; email: string; count: number }>;
  monthlyData: Record<string, { approved: number; rejected: number }>;
  approvedList: any[];
  rejectedList: any[];
}

const COLORS = {
  DEREK: "#FF6B6B",
  PLAZA: "#4ECDC4",
  KAMTIB: "#FFD93D",
  RESCUE: "#6C5CE7",
  APPROVED: "#10B981",
  REJECTED: "#EF4444",
};

export default function AnalyticsPage() {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [kategori, setKategori] = useState("ALL");

  useEffect(() => {
    // Set default date range (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setStartDate(firstDay.toISOString().split("T")[0]);
    setEndDate(lastDay.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchAnalytics();
    }
  }, [startDate, endDate, kategori]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate,
        endDate,
        kategori,
      });

      const response = await fetch(`/api/analytics?${params}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch analytics:", response.status);
        setData(null);
        return;
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!contentRef.current || !data) return;
    
    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const confirmDownload = async () => {
    setShowConfirmModal(false);
    
    if (!contentRef.current || !data) return;

    try {
      setGenerating(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Preprocess colors - detect and replace LAB/OKLCH colors
      const elements = contentRef.current.querySelectorAll("*");
      const originalStyles: Array<{
        element: HTMLElement;
        color: string;
        bgColor: string;
        borderColor: string;
      }> = [];

      elements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const computed = window.getComputedStyle(htmlEl);
        const color = computed.color;
        const bgColor = computed.backgroundColor;
        const borderColor = computed.borderColor;

        // Save original styles
        originalStyles.push({
          element: htmlEl,
          color: color,
          bgColor: bgColor,
          borderColor: borderColor,
        });

        // Replace LAB/OKLCH colors with safe RGB fallbacks
        if (color && (color.includes("lab") || color.includes("oklch"))) {
          htmlEl.style.color = "#000000";
        }
        if (bgColor && (bgColor.includes("lab") || bgColor.includes("oklch"))) {
          htmlEl.style.backgroundColor = "#ffffff";
        }
        if (borderColor && (borderColor.includes("lab") || borderColor.includes("oklch"))) {
          htmlEl.style.borderColor = "#e5e7eb";
        }
      });

      // Generate canvas with safe colors
      const canvas = await html2canvas(contentRef.current, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        removeContainer: true,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Additional preprocessing on cloned document
          const clonedElements = clonedDoc.querySelectorAll("*");
          clonedElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            const computed = window.getComputedStyle(htmlEl);
            
            if (computed.color && (computed.color.includes("lab") || computed.color.includes("oklch"))) {
              htmlEl.style.color = "#000000";
            }
            if (computed.backgroundColor && (computed.backgroundColor.includes("lab") || computed.backgroundColor.includes("oklch"))) {
              htmlEl.style.backgroundColor = "#ffffff";
            }
            if (computed.borderColor && (computed.borderColor.includes("lab") || computed.borderColor.includes("oklch"))) {
              htmlEl.style.borderColor = "#e5e7eb";
            }
          });
        },
      });

      // Restore original styles
      originalStyles.forEach(({ element, color, bgColor, borderColor }) => {
        element.style.color = color;
        element.style.backgroundColor = bgColor;
        element.style.borderColor = borderColor;
      });

      // Load logo
      const logoImg = new Image();
      logoImg.src = "/logo/logo_jjc.png";
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const headerHeight = 35; // Height for header/kop surat
      const contentStartY = headerHeight + 5; // Start content after header with some margin
      const availableHeight = pageHeight - contentStartY - 10; // Available height for content per page
      
      const scaledContentHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      // Helper function to add header/kop surat
      const addHeader = () => {
        // Calculate logo dimensions with precise aspect ratio
        const logoWidth = 35; // mm - slightly bigger
        const logoHeight = logoWidth / (logoImg.width / logoImg.height);
        const logoY = 12; // Move down from top (was 8)
        
        // Add logo on the left
        pdf.addImage(logoImg, "PNG", 10, logoY, logoWidth, logoHeight);
        
        // Add company name and address in the center
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        const companyName = "Jasa Marga Jalanlayang Cikampek";
        const companyNameWidth = pdf.getTextWidth(companyName);
        pdf.text(companyName, (imgWidth - companyNameWidth) / 2, 18);
        
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        const address = "Jl. Teuku Umar No.1, RT.002/RW.001, Sepanjang Jaya,";
        const address2 = "Kec. Rawalumbu, Kota Bks, Jawa Barat 17114";
        const addressWidth = pdf.getTextWidth(address);
        const address2Width = pdf.getTextWidth(address2);
        pdf.text(address, (imgWidth - addressWidth) / 2, 24);
        pdf.text(address2, (imgWidth - address2Width) / 2, 29);
        
        // Add line separator
        pdf.setLineWidth(0.5);
        pdf.line(15, headerHeight, imgWidth - 15, headerHeight);
      };

      // Add first page with header
      addHeader();

      if (scaledContentHeight <= availableHeight) {
        // Content fits in one page
        pdf.addImage(imgData, "JPEG", 0, contentStartY, imgWidth, scaledContentHeight);
      } else {
        // Content spans multiple pages - need to split the canvas
        const pageCanvas = document.createElement("canvas");
        const pageCtx = pageCanvas.getContext("2d");
        if (!pageCtx) throw new Error("Failed to get canvas context");

        const pxPerMm = canvas.width / imgWidth;
        const availableHeightPx = availableHeight * pxPerMm;
        
        pageCanvas.width = canvas.width;
        pageCanvas.height = availableHeightPx;

        let srcY = 0;
        let isFirstPage = true;

        while (srcY < canvas.height) {
          if (!isFirstPage) {
            pdf.addPage();
            addHeader();
          }
          isFirstPage = false;

          const heightToCopy = Math.min(availableHeightPx, canvas.height - srcY);
          pageCanvas.height = heightToCopy;
          
          // Clear canvas
          pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
          
          // Copy portion of original canvas
          pageCtx.drawImage(
            canvas,
            0, srcY, canvas.width, heightToCopy,
            0, 0, canvas.width, heightToCopy
          );

          const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.95);
          const pageImgHeight = (heightToCopy * imgWidth) / canvas.width;
          
          pdf.addImage(pageImgData, "JPEG", 0, contentStartY, imgWidth, pageImgHeight);

          srcY += availableHeightPx;
        }
      }

      const filename = `Analitik_Inspeksi_${new Date().getTime()}.pdf`;
      pdf.save(filename);

      // Show success notification
      setTimeout(() => {
        const notification = document.createElement("div");
        notification.className = "fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3 animate-slide-in";
        notification.innerHTML = `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <div>
            <p class="font-bold">Berhasil!</p>
            <p class="text-sm">PDF telah berhasil diunduh</p>
          </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.style.animation = "slide-out 0.3s ease-out";
          setTimeout(() => notification.remove(), 300);
        }, 3000);
      }, 100);
    } catch (error) {
      console.error("Error generating PDF:", error);
      
      // Show error notification
      const notification = document.createElement("div");
      notification.className = "fixed top-4 right-4 bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3 animate-slide-in";
      notification.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        <div>
          <p class="font-bold">Gagal!</p>
          <p class="text-sm">Gagal membuat PDF: ${error instanceof Error ? error.message : "Unknown error"}</p>
        </div>
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = "slide-out 0.3s ease-out";
        setTimeout(() => notification.remove(), 300);
      }, 4000);
    } finally {
      setGenerating(false);
    }
  };

  const cancelDownload = () => {
    setShowConfirmModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Memuat data analitik...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600 font-medium">Data tidak ditemukan</p>
      </div>
    );
  }

  // Prepare chart data
  const statusChartData = [
    { name: "Di-ACC", value: data.stats.approved, color: COLORS.APPROVED },
    { name: "Ditolak", value: data.stats.rejected, color: COLORS.REJECTED },
  ];

  const kategoriApprovedData = Object.entries(data.byKategori.approved).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  const kategoriRejectedData = Object.entries(data.byKategori.rejected).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Action Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
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
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Selesai
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="DEREK">DEREK</option>
                <option value="PLAZA">PLAZA</option>
                <option value="KAMTIB">KAMTIB</option>
                <option value="RESCUE">RESCUE</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="bg-white"
        style={{ colorScheme: "light" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-8" style={{ color: "#000000" }}>
          {/* Header */}
          <div
            className="text-center mb-8 border-b-4 pb-6"
            style={{ borderBottomColor: "#10B981" }}
          >
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#111827" }}>
              ANALITIK INSPEKSI KENDARAAN
            </h1>
            <p className="text-lg" style={{ color: "#4B5563" }}>
              Laporan ACC & Ditolak - Jasa Marga
            </p>
            <p className="text-sm mt-2" style={{ color: "#6B7280" }}>
              Periode: {new Date(startDate).toLocaleDateString("id-ID")} -{" "}
              {new Date(endDate).toLocaleDateString("id-ID")}
            </p>
          </div>

          {/* Charts Section */}
          <div className="space-y-8">
            {/* Status Overview */}
            <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
              <h3
                className="text-xl font-bold mb-4 flex items-center gap-2"
                style={{ color: "#111827" }}
              >
                <span
                  className="w-2 h-8 rounded"
                  style={{ backgroundColor: "#10B981" }}
                ></span>
                Status Inspeksi: ACC vs Ditolak
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) =>
                          `${entry.name}: ${((entry.value / data.stats.total) * 100).toFixed(1)}%`
                        }
                        outerRadius={100}
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar Chart */}
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={statusChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value">
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Kategori Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ACC per Kategori */}
              <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
                <h3
                  className="text-xl font-bold mb-4"
                  style={{ color: "#111827" }}
                >
                  ACC per Kategori
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={kategoriApprovedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill={COLORS.APPROVED}>
                      {kategoriApprovedData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.APPROVED}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Ditolak per Kategori */}
              <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
                <h3
                  className="text-xl font-bold mb-4"
                  style={{ color: "#111827" }}
                >
                  Ditolak per Kategori
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={kategoriRejectedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill={COLORS.REJECTED}>
                      {kategoriRejectedData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.REJECTED}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Petugas - ACC */}
            <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
              <h3
                className="text-xl font-bold mb-4 flex items-center gap-2"
                style={{ color: "#111827" }}
              >
                <span
                  className="w-2 h-8 rounded"
                  style={{ backgroundColor: "#10B981" }}
                ></span>
                Top 10 Petugas dengan Inspeksi Di-ACC
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.topPetugasApproved} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS.APPROVED} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Petugas - Ditolak */}
            {data.topPetugasRejected.length > 0 && (
              <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
                <h3
                  className="text-xl font-bold mb-4 flex items-center gap-2"
                  style={{ color: "#111827" }}
                >
                  <span
                    className="w-2 h-8 rounded"
                    style={{ backgroundColor: "#EF4444" }}
                  ></span>
                  Top 10 Petugas dengan Inspeksi Ditolak
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={data.topPetugasRejected} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS.REJECTED} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-sm mt-8 pt-6 border-t border-gray-200" style={{ color: "#6B7280" }}>
            <p>
              Laporan Analitik Inspeksi Kendaraan - Jasa Marga
            </p>
            <p className="mt-1">
              Dicetak: {new Date().toLocaleDateString("id-ID", {
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scale-in">
            <div className="p-6">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="bg-blue-100 rounded-full p-4">
                  <svg
                    className="w-12 h-12 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">
                Download PDF?
              </h3>

              {/* Description */}
              <p className="text-center text-gray-600 mb-6">
                Apakah Anda yakin ingin mengunduh laporan analitik inspeksi dalam format PDF?
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={cancelDownload}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors duration-200"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDownload}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Ya, Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
