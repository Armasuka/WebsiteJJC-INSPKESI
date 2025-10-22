"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Inspeksi {
  id: string;
  kategoriKendaraan: string;
  nomorKendaraan: string;
  lokasiInspeksi: string;
  status: string;
  tanggalInspeksi: string;
  namaPetugas: string;
}

type PeriodFilter = "today" | "week" | "month" | "custom" | "all";

export default function RiwayatInspeksiPage() {
  const [inspeksi, setInspeksi] = useState<Inspeksi[]>([]);
  const [filteredInspeksi, setFilteredInspeksi] = useState<Inspeksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [kategoriFilter, setKategoriFilter] = useState("ALL");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  useEffect(() => {
    fetchInspeksi();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [inspeksi, statusFilter, kategoriFilter, periodFilter, customStartDate, customEndDate]);

  const fetchInspeksi = async () => {
    try {
      // Optimasi: Fetch dengan limit yang lebih besar untuk riwayat
      const response = await fetch("/api/inspeksi?limit=100");
      if (response.ok) {
        const result = await response.json();
        // Handle both old and new response format
        const data = result.data || result;
        setInspeksi(data);
      }
    } catch (error) {
      console.error("Error fetching inspeksi:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, nomorKendaraan: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus draft inspeksi kendaraan ${nomorKendaraan}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/inspeksi/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Draft berhasil dihapus!");
        fetchInspeksi(); // Refresh data
      } else {
        const error = await response.json();
        alert("Gagal menghapus draft: " + (error.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error deleting draft:", error);
      alert("Gagal menghapus draft");
    }
  };

  const applyFilters = () => {
    let filtered = [...inspeksi];

    // Filter by status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Filter by kategori
    if (kategoriFilter !== "ALL") {
      filtered = filtered.filter((item) => item.kategoriKendaraan === kategoriFilter);
    }

    // Filter by period
    if (periodFilter !== "all") {
      const now = new Date();
      
      if (periodFilter === "today") {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filtered = filtered.filter((item) => {
          const itemDate = new Date(item.tanggalInspeksi);
          const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
          return itemDay.getTime() === today.getTime();
        });
      } else if (periodFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((item) => {
          const itemDate = new Date(item.tanggalInspeksi);
          return itemDate >= weekAgo && itemDate <= now;
        });
      } else if (periodFilter === "month") {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = filtered.filter((item) => {
          const itemDate = new Date(item.tanggalInspeksi);
          return itemDate >= monthStart && itemDate <= now;
        });
      } else if (periodFilter === "custom" && customStartDate && customEndDate) {
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter((item) => {
          const itemDate = new Date(item.tanggalInspeksi);
          return itemDate >= startDate && itemDate <= endDate;
        });
      }
    }

    setFilteredInspeksi(filtered);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string; icon: string }> = {
      DRAFT: { color: "bg-gray-100 text-gray-800", text: "Draft", icon: "💾" },
      SUBMITTED: { color: "bg-yellow-100 text-yellow-800", text: "Menunggu Manager Traffic", icon: "⏳" },
      APPROVED_BY_TRAFFIC: { color: "bg-blue-100 text-blue-800", text: "Menunggu Manager Ops", icon: "🔵" },
      APPROVED_BY_OPERATIONAL: { color: "bg-green-100 text-green-800", text: "✓ APPROVED", icon: "✅" },
      REJECTED: { color: "bg-red-100 text-red-800", text: "✗ DITOLAK", icon: "❌" },
    };
    const badge = badges[status] || badges.DRAFT;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.icon} {badge.text}
      </span>
    );
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-blue-600 bg-clip-text text-transparent mb-2">
            Riwayat Inspeksi Kendaraan
          </h2>
          <p className="text-gray-600">Daftar lengkap semua inspeksi dengan filter periode & status</p>
        </div>
        <Link href="/dashboard/petugas-lapangan/inspeksi">
          <button className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition font-medium shadow-md">
            ➕ Inspeksi Baru
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md border-t-4 border-purple-600 p-6">
        <h3 className="font-bold text-purple-700 mb-4 flex items-center gap-2">
          <span className="text-xl">🔍</span> Filter & Pencarian
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Filter Periode
            </label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
              className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            >
              <option value="all">📋 Semua Waktu</option>
              <option value="today">📅 Hari Ini</option>
              <option value="week">📆 Minggu Ini (7 Hari Terakhir)</option>
              <option value="month">🗓️ Bulan Ini</option>
              <option value="custom">🔧 Custom Tanggal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📊 Filter Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Semua Status</option>
              <option value="DRAFT">💾 Draft</option>
              <option value="SUBMITTED">⏳ Menunggu Manager Traffic</option>
              <option value="APPROVED_BY_TRAFFIC">🔵 Menunggu Manager Ops</option>
              <option value="APPROVED_BY_OPERATIONAL">✅ Approved</option>
              <option value="REJECTED">❌ Ditolak</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🚗 Filter Kategori
            </label>
            <select
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value)}
              className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="PLAZA">🏢 Plaza</option>
              <option value="DEREK">🚚 Derek</option>
              <option value="KAMTIB">🛡️ Kamtib</option>
              <option value="RESCUE">🚒 Rescue</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range */}
        {periodFilter === "custom" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Dari Tanggal
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Sampai Tanggal
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="mt-4 pt-4 border-t border-purple-200">
          <p className="text-sm text-purple-800 font-medium">
            📊 Menampilkan <span className="text-lg font-bold">{filteredInspeksi.length}</span> dari{" "}
            <span className="text-lg font-bold">{inspeksi.length}</span> total inspeksi
          </p>
        </div>
      </div>

      {/* Summary per Kategori */}
      {filteredInspeksi.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center border-2 border-blue-200 shadow-sm">
            <div className="text-3xl mb-1">🏢</div>
            <p className="text-xs text-gray-600 font-medium">Plaza</p>
            <p className="text-2xl font-bold text-blue-700">
              {filteredInspeksi.filter(i => i.kategoriKendaraan === "PLAZA").length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3 text-center border-2 border-yellow-200 shadow-sm">
            <div className="text-3xl mb-1">🚚</div>
            <p className="text-xs text-gray-600 font-medium">Derek</p>
            <p className="text-2xl font-bold text-yellow-700">
              {filteredInspeksi.filter(i => i.kategoriKendaraan === "DEREK").length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center border-2 border-green-200 shadow-sm">
            <div className="text-3xl mb-1">🛡️</div>
            <p className="text-xs text-gray-600 font-medium">Kamtib</p>
            <p className="text-2xl font-bold text-green-700">
              {filteredInspeksi.filter(i => i.kategoriKendaraan === "KAMTIB").length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 text-center border-2 border-orange-200 shadow-sm">
            <div className="text-3xl mb-1">🚒</div>
            <p className="text-xs text-gray-600 font-medium">Rescue</p>
            <p className="text-2xl font-bold text-orange-700">
              {filteredInspeksi.filter(i => i.kategoriKendaraan === "RESCUE").length}
            </p>
          </div>
        </div>
      )}

      {/* Inspeksi Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto"></div>
          <p className="text-gray-600 mt-4">Memuat data...</p>
        </div>
      ) : filteredInspeksi.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {inspeksi.length === 0 ? "Belum Ada Inspeksi" : "Tidak Ada Data Sesuai Filter"}
          </h3>
          <p className="text-gray-600 mb-6">
            {inspeksi.length === 0 
              ? "Mulai buat inspeksi kendaraan pertama Anda" 
              : "Coba ubah filter atau periode waktu"}
          </p>
          {inspeksi.length === 0 && (
            <Link href="/dashboard/petugas-lapangan/inspeksi">
              <button className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition">
                Buat Inspeksi Baru
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-700 to-blue-700 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Kategori</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">No. Kendaraan</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Lokasi</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Tanggal</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredInspeksi.map((item, index) => (
                    <tr key={item.id} className="hover:bg-purple-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getKategoriIcon(item.kategoriKendaraan)}</span>
                          <span className="text-sm font-semibold text-gray-800">{item.kategoriKendaraan}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-blue-700">{item.nomorKendaraan}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.lokasiInspeksi || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(item.tanggalInspeksi).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center flex-wrap">
                          <Link href={`/dashboard/petugas-lapangan/inspeksi/${item.id}`}>
                            <button className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition">
                              👁️ Detail
                            </button>
                          </Link>
                          {item.status === "DRAFT" && (
                            <>
                              <Link href={`/dashboard/petugas-lapangan/inspeksi/${item.kategoriKendaraan.toLowerCase()}?draft=${item.id}`}>
                                <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition">
                                  📝 Lanjutkan
                                </button>
                              </Link>
                              <button 
                                onClick={() => handleDelete(item.id, item.nomorKendaraan)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition"
                              >
                                🗑️ Hapus
                              </button>
                            </>
                          )}
                          {item.status === "APPROVED_BY_OPERATIONAL" && (item as any).pdfUrl && (
                            <a href={(item as any).pdfUrl} target="_blank" rel="noopener noreferrer">
                              <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition">
                                📄 PDF
                              </button>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
              <p className="text-2xl font-bold text-gray-700">{filteredInspeksi.length}</p>
              <p className="text-xs text-gray-600 font-medium">Total Kendaraan</p>
            </div>
            <div className="text-center bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <p className="text-2xl font-bold text-green-700">
                {filteredInspeksi.filter(i => i.status === "APPROVED").length}
              </p>
              <p className="text-xs text-gray-600 font-medium">Disetujui</p>
            </div>
            <div className="text-center bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
              <p className="text-2xl font-bold text-yellow-700">
                {filteredInspeksi.filter(i => i.status === "SUBMITTED").length}
              </p>
              <p className="text-xs text-gray-600 font-medium">Pending</p>
            </div>
            <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <p className="text-2xl font-bold text-blue-700">
                {new Set(filteredInspeksi.map(i => i.kategoriKendaraan)).size}
              </p>
              <p className="text-xs text-gray-600 font-medium">Jenis Kendaraan</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
