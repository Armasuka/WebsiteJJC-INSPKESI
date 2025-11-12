"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from 'xlsx';
import ToastNotification from "@/app/components/ToastNotification";

interface InspeksiItem {
  id: string;
  kategoriKendaraan: string;
  nomorKendaraan: string;
  tanggalInspeksi: string;
  namaPetugas: string;
  nipPetugas: string;
  namaPetugas2: string | null;
  nipPetugas2: string | null;
  pdfUrl: string | null;
  approvedAtOperational: string;
  approvedAtTraffic: string | null;
  status: string;
}

export default function RekapAccPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [inspeksi, setInspeksi] = useState<InspeksiItem[]>([]);
  const [filteredInspeksi, setFilteredInspeksi] = useState<InspeksiItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [kategoriFilter, setKategoriFilter] = useState<string>("ALL");
  const [customDateFrom, setCustomDateFrom] = useState<string>("");
  const [customDateTo, setCustomDateTo] = useState<string>("");
  
  // State untuk modal kirim rekap
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [judulRekap, setJudulRekap] = useState("");
  const [receiverRole] = useState<string>("OPERATIONAL"); // Fixed to OPERATIONAL only
  const [catatan, setCatatan] = useState("");

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "warning" | "info" = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [inspeksi, periodFilter, kategoriFilter, customDateFrom, customDateTo]);

  const fetchData = async () => {
    try {
      // Fetch semua inspeksi yang sudah di-approve (baik oleh Traffic saja atau keduanya)
      const response = await fetch("/api/inspeksi?limit=1000");
      if (response.ok) {
        const result = await response.json();
        
        // API now returns { data: [...], pagination: {...} }
        const dataArray = result.data || [];
        
        // Filter hanya yang sudah di-ACC (minimal oleh Traffic)
        const approved = dataArray.filter((item: any) => 
          item.status === 'APPROVED_BY_TRAFFIC' || item.status === 'APPROVED_BY_OPERATIONAL'
        );
        
        // Sort by approval date (prioritas operational, fallback ke traffic)
        const sorted = approved.sort((a: any, b: any) => {
          const dateA = new Date(a.approvedAtOperational || a.approvedAtTraffic || a.tanggalInspeksi).getTime();
          const dateB = new Date(b.approvedAtOperational || b.approvedAtTraffic || b.tanggalInspeksi).getTime();
          return dateB - dateA;
        });
        
        setInspeksi(sorted);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...inspeksi];

    // Filter by period
    if (periodFilter !== "all") {
      const now = new Date();
      let startDate: Date;

      switch (periodFilter) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - now.getDay()));
          startDate.setHours(0, 0, 0, 0);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case "custom":
          if (customDateFrom && customDateTo) {
            const from = new Date(customDateFrom);
            const to = new Date(customDateTo);
            to.setHours(23, 59, 59, 999);
            
            filtered = filtered.filter((item) => {
              // Gunakan tanggal approval (operational atau traffic, fallback ke tanggal inspeksi)
              const itemDate = new Date(item.approvedAtOperational || item.approvedAtTraffic || item.tanggalInspeksi);
              return itemDate >= from && itemDate <= to;
            });
          }
          break;
        default:
          startDate = new Date(0);
      }

      if (periodFilter !== "custom") {
        filtered = filtered.filter((item) => {
          // Gunakan tanggal approval (operational atau traffic, fallback ke tanggal inspeksi)
          const itemDate = new Date(item.approvedAtOperational || item.approvedAtTraffic || item.tanggalInspeksi);
          return itemDate >= startDate;
        });
      }
    }

    // Filter by kategori
    if (kategoriFilter !== "ALL") {
      filtered = filtered.filter((item) => item.kategoriKendaraan === kategoriFilter);
    }

    setFilteredInspeksi(filtered);
  };

  const getKategoriIcon = (kategori: string) => {
    const icons: Record<string, React.ReactElement> = {
      PLAZA: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
      DEREK: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      KAMTIB: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
      RESCUE: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    };
    return icons[kategori] || <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>;
  };

  const exportToExcel = () => {
    const exportData = filteredInspeksi.map((item, index) => {
      // Gunakan tanggal approval yang sesuai
      const approvalDate = item.approvedAtOperational || item.approvedAtTraffic || item.tanggalInspeksi;
      const statusLabel = item.status === 'APPROVED_BY_OPERATIONAL' 
        ? 'FULLY APPROVED' 
        : 'APPROVED BY TRAFFIC';
      
      return {
        "No": index + 1,
        "Tanggal": new Date(approvalDate).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        "Kategori": item.kategoriKendaraan,
        "No. Polisi": item.nomorKendaraan,
        "Petugas 1": `${item.namaPetugas} (${item.nipPetugas})`,
        "Petugas 2": item.namaPetugas2 ? `${item.namaPetugas2} (${item.nipPetugas2})` : "-",
        "Status": statusLabel,
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap ACC");
    
    const fileName = `Rekap_Inspeksi_ACC_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleDownloadPDF = async (inspeksiId: string, nomorKendaraan: string) => {
    try {
      // Show loading indicator
      const button = document.querySelector(`button[data-pdf-id="${inspeksiId}"]`) as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = "⏳ Generating...";
      }

      const response = await fetch(`/api/inspeksi/${inspeksiId}/generate-pdf`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Inspeksi_${nomorKendaraan}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      if (button) {
        button.disabled = false;
        button.textContent = "Cetak PDF";
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Gagal mengunduh PDF. Silakan coba lagi.');
      
      const button = document.querySelector(`button[data-pdf-id="${inspeksiId}"]`) as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.textContent = "Cetak PDF";
      }
    }
  };

  const handleOpenSendModal = () => {
    // Auto-generate judul rekap berdasarkan periode
    let autoJudul = "Rekap Inspeksi ACC";
    
    if (periodFilter === "today") {
      autoJudul = `Rekap Harian - ${new Date().toLocaleDateString("id-ID")}`;
    } else if (periodFilter === "week") {
      autoJudul = `Rekap Mingguan - ${new Date().toLocaleDateString("id-ID")}`;
    } else if (periodFilter === "month") {
      const monthName = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });
      autoJudul = `Rekap Bulanan - ${monthName}`;
    } else if (periodFilter === "year") {
      autoJudul = `Rekap Tahunan - ${new Date().getFullYear()}`;
    } else if (periodFilter === "custom" && customDateFrom && customDateTo) {
      autoJudul = `Rekap Custom ${customDateFrom} s/d ${customDateTo}`;
    }
    
    if (kategoriFilter !== "ALL") {
      autoJudul += ` - ${kategoriFilter}`;
    }
    
    setJudulRekap(autoJudul);
    setShowSendModal(true);
  };

  const handleSendToManager = async () => {
    if (!judulRekap.trim()) {
      alert("Judul rekap harus diisi");
      return;
    }

    // Validate periode
    let tanggalMulai: Date;
    let tanggalSelesai: Date;
    let periodeType: string;

    const now = new Date();

    switch (periodFilter) {
      case "today":
        tanggalMulai = new Date(now.setHours(0, 0, 0, 0));
        tanggalSelesai = new Date(now.setHours(23, 59, 59, 999));
        periodeType = "HARIAN";
        break;
      case "week":
        tanggalMulai = new Date(now.setDate(now.getDate() - now.getDay()));
        tanggalMulai.setHours(0, 0, 0, 0);
        tanggalSelesai = new Date();
        tanggalSelesai.setHours(23, 59, 59, 999);
        periodeType = "MINGGUAN";
        break;
      case "month":
        tanggalMulai = new Date(now.getFullYear(), now.getMonth(), 1);
        tanggalSelesai = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        periodeType = "BULANAN";
        break;
      case "year":
        tanggalMulai = new Date(now.getFullYear(), 0, 1);
        tanggalSelesai = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        periodeType = "TAHUNAN";
        break;
      case "custom":
        if (!customDateFrom || !customDateTo) {
          showToast("Tanggal custom harus diisi", "warning");
          return;
        }
        tanggalMulai = new Date(customDateFrom);
        tanggalSelesai = new Date(customDateTo);
        tanggalSelesai.setHours(23, 59, 59, 999);
        periodeType = "KUSTOM";
        break;
      default:
        showToast("Pilih periode terlebih dahulu", "warning");
        return;
    }

    setSending(true);

    try {
      const response = await fetch("/api/rekap-manager", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          judulRekap,
          periodeType,
          tanggalMulai: tanggalMulai.toISOString(),
          tanggalSelesai: tanggalSelesai.toISOString(),
          kategoriKendaraan: kategoriFilter,
          receiverRole,
          catatan,
        }),
      });

      if (response.ok) {
        showToast("Rekap berhasil dikirim ke manager! Email notifikasi telah terkirim", "success");
        setShowSendModal(false);
        setJudulRekap("");
        setCatatan("");
      } else {
        const error = await response.json();
        showToast(`Gagal mengirim rekap: ${error.error || "Unknown error"}`, "error");
      }
    } catch (error) {
      console.error("Error sending rekap:", error);
      showToast("Gagal mengirim rekap", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/dashboard/petugas-lapangan')}
        className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 font-medium shadow-sm"
      >
        ← Kembali
      </button>

      <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-600">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Rekap Hasil ACC
        </h2>
        <p className="text-gray-600">
          Daftar inspeksi yang telah disetujui oleh Manager Traffic & Manager Operasional
        </p>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="font-bold text-gray-800 mb-4">Filter Data</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Period Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Periode
            </label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors duration-200"
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari ini</option>
              <option value="week">Minggu ini</option>
              <option value="month">Bulan ini</option>
              <option value="year">Tahun ini</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Kategori Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori Kendaraan
            </label>
            <select
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors duration-200"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="PLAZA">Plaza</option>
              <option value="DEREK">Derek</option>
              <option value="KAMTIB">Kamtib</option>
              <option value="RESCUE">Rescue</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range */}
        {periodFilter === "custom" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors duration-200"
              />
            </div>
          </div>
        )}

        {/* Export Button */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Menampilkan <span className="font-bold text-green-600">{filteredInspeksi.length}</span> dari{" "}
            <span className="font-bold">{inspeksi.length}</span> total inspeksi ACC
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleOpenSendModal}
              disabled={filteredInspeksi.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Kirim ke Manager
            </button>
            <button
              onClick={exportToExcel}
              disabled={filteredInspeksi.length === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              Export to Excel
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-700 mt-4 font-medium">Memuat data...</p>
        </div>
      ) : filteredInspeksi.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-800 font-semibold text-lg">Tidak ada data inspeksi ACC</p>
          <p className="text-sm text-gray-700 mt-2">
            {periodFilter !== "all" || kategoriFilter !== "ALL"
              ? "Coba ubah filter untuk melihat data lainnya"
              : "Belum ada inspeksi yang disetujui"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-green-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Tanggal ACC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    No. Polisi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Petugas 1
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Petugas 2
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInspeksi.map((item, index) => (
                  <tr key={item.id} className="hover:bg-green-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.approvedAtOperational || item.approvedAtTraffic || item.tanggalInspeksi).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-lg">
                        {item.kategoriKendaraan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.nomorKendaraan}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>{item.namaPetugas}</div>
                      <div className="text-xs text-gray-700 font-medium">NIP: {item.nipPetugas}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.namaPetugas2 ? (
                        <>
                          <div>{item.namaPetugas2}</div>
                          <div className="text-xs text-gray-700 font-medium">NIP: {item.nipPetugas2}</div>
                        </>
                      ) : (
                        <span className="text-gray-600 font-medium">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {item.status === 'APPROVED_BY_OPERATIONAL' ? (
                        <span className="px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-lg bg-green-100 text-green-800">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          FULLY APPROVED
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-lg bg-blue-100 text-blue-800">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          TRAFFIC
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/dashboard/petugas-lapangan/inspeksi/${item.id}`}>
                          <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-xs shadow-sm">
                            Detail
                          </button>
                        </Link>
                        <button
                          data-pdf-id={item.id}
                          onClick={() => handleDownloadPDF(item.id, item.nomorKendaraan)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 text-xs shadow-sm"
                        >
                          Cetak PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Kirim Rekap ke Manager */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Kirim Rekap ke Manager
              </h3>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-gray-600 hover:text-gray-900 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Info Rekap */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Total Inspeksi:</strong> {filteredInspeksi.length} data
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Periode:</strong>{" "}
                  {periodFilter === "today" && "Hari ini"}
                  {periodFilter === "week" && "Minggu ini"}
                  {periodFilter === "month" && "Bulan ini"}
                  {periodFilter === "year" && "Tahun ini"}
                  {periodFilter === "custom" && `${customDateFrom} s/d ${customDateTo}`}
                  {periodFilter === "all" && "Semua waktu"}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Kategori:</strong> {kategoriFilter === "ALL" ? "Semua Kategori" : kategoriFilter}
                </p>
              </div>

              {/* Judul Rekap */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul Rekap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={judulRekap}
                  onChange={(e) => setJudulRekap(e.target.value)}
                  placeholder="Contoh: Rekap Bulanan Oktober 2025"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent placeholder:text-gray-700 placeholder:font-medium text-gray-900 font-medium"
                />
              </div>

              {/* Info Penerima - Fixed to Manager Operational */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <strong>Penerima:</strong> Manager Operational
                </p>
                <p className="text-xs text-gray-600 mt-1 ml-7">
                  Rekap akan dikirim ke Manager Operational untuk review
                </p>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Tambahkan catatan untuk manager..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none placeholder:text-gray-700 placeholder:font-medium text-gray-900 font-medium"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  disabled={sending}
                >
                  Batal
                </button>
                <button
                  onClick={handleSendToManager}
                  disabled={sending || !judulRekap.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Kirim Rekap
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

