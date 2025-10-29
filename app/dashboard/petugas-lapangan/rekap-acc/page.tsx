"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from 'xlsx';

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
  const [receiverRole, setReceiverRole] = useState<string>("BOTH");
  const [catatan, setCatatan] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [inspeksi, periodFilter, kategoriFilter, customDateFrom, customDateTo]);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/inspeksi?status=APPROVED_BY_OPERATIONAL&limit=1000");
      if (response.ok) {
        const result = await response.json();
        
        // API now returns { data: [...], pagination: {...} }
        const dataArray = result.data || [];
        
        // Sort by approval date
        const approved = dataArray.sort((a: any, b: any) => 
          new Date(b.approvedAtOperational || b.tanggalInspeksi).getTime() - 
          new Date(a.approvedAtOperational || a.tanggalInspeksi).getTime()
        );
        
        setInspeksi(approved);
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
              const itemDate = new Date(item.approvedAtOperational || item.tanggalInspeksi);
              return itemDate >= from && itemDate <= to;
            });
          }
          break;
        default:
          startDate = new Date(0);
      }

      if (periodFilter !== "custom") {
        filtered = filtered.filter((item) => {
          const itemDate = new Date(item.approvedAtOperational || item.tanggalInspeksi);
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
    const icons: Record<string, string> = {
      PLAZA: "🏢",
      DEREK: "🚚",
      KAMTIB: "🛡️",
      RESCUE: "🚒",
    };
    return icons[kategori] || "🚗";
  };

  const exportToExcel = () => {
    const exportData = filteredInspeksi.map((item, index) => ({
      "No": index + 1,
      "Tanggal": new Date(item.approvedAtOperational).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      "Kategori": item.kategoriKendaraan,
      "No. Polisi": item.nomorKendaraan,
      "Petugas 1": `${item.namaPetugas} (${item.nipPetugas})`,
      "Petugas 2": item.namaPetugas2 ? `${item.namaPetugas2} (${item.nipPetugas2})` : "-",
      "Status": "APPROVED",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap ACC");
    
    const fileName = `Rekap_Inspeksi_ACC_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
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
          alert("Tanggal custom harus diisi");
          return;
        }
        tanggalMulai = new Date(customDateFrom);
        tanggalSelesai = new Date(customDateTo);
        tanggalSelesai.setHours(23, 59, 59, 999);
        periodeType = "KUSTOM";
        break;
      default:
        alert("Pilih periode terlebih dahulu");
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
        alert("Rekap berhasil dikirim ke manager!");
        setShowSendModal(false);
        setJudulRekap("");
        setCatatan("");
      } else {
        const error = await response.json();
        alert(`Gagal mengirim rekap: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error sending rekap:", error);
      alert("Gagal mengirim rekap");
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
              📤 Kirim ke Manager
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
          <p className="text-gray-500 mt-4">Memuat data...</p>
        </div>
      ) : filteredInspeksi.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 font-medium">Tidak ada data inspeksi ACC</p>
          <p className="text-sm text-gray-500 mt-2">
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
                      {new Date(item.approvedAtOperational).toLocaleDateString("id-ID", {
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
                      <div className="text-xs text-gray-500">NIP: {item.nipPetugas}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.namaPetugas2 ? (
                        <>
                          <div>{item.namaPetugas2}</div>
                          <div className="text-xs text-gray-500">NIP: {item.nipPetugas2}</div>
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-lg bg-green-100 text-green-800">
                        APPROVED
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/dashboard/petugas-lapangan/inspeksi/${item.id}`}>
                          <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-xs shadow-sm">
                            Detail
                          </button>
                        </Link>
                        <Link href={`/dashboard/petugas-lapangan/inspeksi/${item.id}`}>
                          <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 text-xs shadow-sm">
                            Cetak PDF
                          </button>
                        </Link>
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
              <h3 className="text-xl font-bold text-gray-900">
                📤 Kirim Rekap ke Manager
              </h3>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              {/* Penerima */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kirim ke Manager <span className="text-red-500">*</span>
                </label>
                <select
                  value={receiverRole}
                  onChange={(e) => setReceiverRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="BOTH">Kedua Manager (Traffic & Operational)</option>
                  <option value="TRAFFIC">Manager Traffic Saja</option>
                  <option value="OPERATIONAL">Manager Operational Saja</option>
                </select>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
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
                      📤 Kirim Rekap
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
