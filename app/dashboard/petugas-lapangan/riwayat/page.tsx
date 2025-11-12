"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Inspeksi {
  id: string;
  kategoriKendaraan: string;
  nomorKendaraan: string;
  lokasiInspeksi: string;
  status: string;
  tanggalInspeksi: string;
  approvedAtOperational?: string;
  namaPetugas: string;
}

type PeriodFilter = "today" | "week" | "month" | "year" | "custom" | "all";
type ActiveTab = "list" | "visualization";

const COLORS = {
  DEREK: "#FF6B6B",
  PLAZA: "#4ECDC4",
  KAMTIB: "#FFD93D",
  RESCUE: "#6C5CE7",
};

export default function RiwayatInspeksiPage() {
  const router = useRouter();
  const [inspeksi, setInspeksi] = useState<Inspeksi[]>([]);
  const [filteredInspeksi, setFilteredInspeksi] = useState<Inspeksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [kategoriFilter, setKategoriFilter] = useState("ALL");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("list");
  
  // Visualization data
  const [chartData, setChartData] = useState<any[]>([]);
  const [totalApprovedInspeksi, setTotalApprovedInspeksi] = useState(0);

  useEffect(() => {
    fetchInspeksi();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [inspeksi, statusFilter, kategoriFilter, periodFilter, customStartDate, customEndDate, searchQuery]);

  useEffect(() => {
    calculateVisualizationData();
  }, [filteredInspeksi]);

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

    // Search by nomor kendaraan
    if (searchQuery.trim()) {
      filtered = filtered.filter((item) => 
        item.nomorKendaraan.toLowerCase().includes(searchQuery.toLowerCase())
      );
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
      } else if (periodFilter === "year") {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        filtered = filtered.filter((item) => {
          const itemDate = new Date(item.tanggalInspeksi);
          return itemDate >= yearStart && itemDate <= now;
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

  const calculateVisualizationData = () => {
    // Hitung data untuk approved inspeksi saja
    const approvedInspeksi = filteredInspeksi.filter(i => i.status === "APPROVED_BY_OPERATIONAL");
    
    const aggregated: Record<string, number> = {};
    approvedInspeksi.forEach((item) => {
      aggregated[item.kategoriKendaraan] = (aggregated[item.kategoriKendaraan] || 0) + 1;
    });

    const total = approvedInspeksi.length;
    const chartDataArray = Object.entries(aggregated).map(([kategori, count]) => ({
      name: kategori,
      value: count,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0",
    }));

    setChartData(chartDataArray);
    setTotalApprovedInspeksi(total);
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    
    if (statusFilter !== "ALL") params.append("status", statusFilter);
    if (kategoriFilter !== "ALL") params.append("kategori", kategoriFilter);
    if (searchQuery) params.append("search", searchQuery);
    if (customStartDate) params.append("startDate", customStartDate);
    if (customEndDate) params.append("endDate", customEndDate);
    
    const url = `/api/inspeksi/export?${params.toString()}`;
    window.open(url, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      DRAFT: { color: "bg-gray-100 text-gray-800", text: "Draft" },
      SUBMITTED: { color: "bg-yellow-100 text-yellow-800", text: "Menunggu Manager Traffic" },
      APPROVED_BY_TRAFFIC: { color: "bg-blue-100 text-blue-800", text: "Menunggu Manager Ops" },
      APPROVED_BY_OPERATIONAL: { color: "bg-green-100 text-green-800", text: "APPROVED" },
      REJECTED: { color: "bg-red-100 text-red-800", text: "DITOLAK" },
    };
    const badge = badges[status] || badges.DRAFT;
    return (
      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
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

      <div className="flex items-center justify-between">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-600 flex-1 mr-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Riwayat Inspeksi Kendaraan
          </h2>
          <p className="text-gray-800 font-medium">Daftar lengkap semua inspeksi dengan filter periode & status</p>
        </div>
        <Link href="/dashboard/petugas-lapangan/inspeksi">
          <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium shadow-sm">
            Inspeksi Baru
          </button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("list")}
            className={`flex-1 px-6 py-4 font-medium transition-colors duration-200 relative ${
              activeTab === "list"
                ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            📋 Daftar Riwayat
          </button>
          <button
            onClick={() => setActiveTab("visualization")}
            className={`flex-1 px-6 py-4 font-medium transition-colors duration-200 ${
              activeTab === "visualization"
                ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            📊 Visualisasi Data ACC
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-purple-600 flex items-center gap-2">
            🔍 Filter & Pencarian
          </h3>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium shadow-sm flex items-center gap-2"
          >
            📥 Export Excel
          </button>
        </div>
        
        {/* Search Box */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🔎 Cari Nomor Kendaraan / Plat Nomor
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Contoh: B 1234 XYZ"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white transition-colors duration-200 text-gray-900 font-medium"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Periode
            </label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white transition-colors duration-200 text-gray-900 font-medium"
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="week">Minggu Ini (7 Hari Terakhir)</option>
              <option value="month">Bulan Ini</option>
              <option value="year">Tahun Ini</option>
              <option value="custom">Custom Tanggal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-colors duration-200 text-gray-900 font-medium"
            >
              <option value="ALL">Semua Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Menunggu Manager Traffic</option>
              <option value="APPROVED_BY_TRAFFIC">Menunggu Manager Ops</option>
              <option value="APPROVED_BY_OPERATIONAL">Approved</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Kategori
            </label>
            <select
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-colors duration-200 text-gray-900 font-medium"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-colors duration-200 text-gray-900 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-colors duration-200 text-gray-900 font-medium"
              />
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-purple-600 font-medium">
            Menampilkan <span className="text-lg font-bold">{filteredInspeksi.length}</span> dari{" "}
            <span className="text-lg font-bold">{inspeksi.length}</span> total inspeksi
          </p>
        </div>
      </div>

      {/* Content berdasarkan tab aktif */}
      {activeTab === "visualization" ? (
        /* VISUALISASI DATA ACC */
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Total Inspeksi yang di-ACC
            </h3>
            <p className="text-5xl font-bold text-purple-600">{totalApprovedInspeksi}</p>
            <p className="text-sm text-gray-700 font-medium mt-2">
              Dari total {filteredInspeksi.length} inspeksi yang ditampilkan (filter aktif)
            </p>
            <p className="text-xs text-gray-700 mt-1">
              Periode: {periodFilter === "all" && "Semua Waktu"}
              {periodFilter === "today" && "Hari Ini"}
              {periodFilter === "week" && "Minggu Ini"}
              {periodFilter === "month" && "Bulan Ini"}
              {periodFilter === "year" && "Tahun Ini"}
              {periodFilter === "custom" && `${customStartDate} s/d ${customEndDate}`}
              {kategoriFilter !== "ALL" && ` • ${kategoriFilter}`}
            </p>
          </div>

          {chartData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h4 className="font-bold text-lg mb-4 text-gray-900">
                  📊 Distribusi per Kategori (Pie Chart)
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[entry.name as keyof typeof COLORS] || "#8884d8"}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {chartData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{
                          backgroundColor: COLORS[item.name as keyof typeof COLORS] || "#8884d8",
                        }}
                      ></div>
                      <span className="text-sm text-gray-700">
                        {item.name}: {item.value} ({item.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bar Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h4 className="font-bold text-lg mb-4 text-gray-900">
                  📈 Jumlah per Kategori (Bar Chart)
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#9333EA" name="Jumlah Inspeksi ACC" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-800 font-semibold text-lg">Tidak ada data inspeksi ACC untuk divisualisasikan</p>
              <p className="text-sm text-gray-700 mt-2">
                Coba ubah filter periode atau kategori untuk melihat data yang sudah di-ACC
              </p>
            </div>
          )}

          {/* Detailed Breakdown */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h4 className="font-bold text-lg mb-4 text-gray-900">📋 Detail per Kategori</h4>
              <div className="space-y-2">
                {chartData.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded"
                        style={{
                          backgroundColor: COLORS[item.name as keyof typeof COLORS] || "#8884d8",
                        }}
                      ></div>
                      <span className="font-semibold text-gray-900">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-purple-600 text-xl">{item.value}</span>
                      <span className="text-sm text-gray-700 font-medium ml-2">inspeksi</span>
                      <span className="text-xs text-gray-700 ml-2">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* DAFTAR RIWAYAT */
        <div className="space-y-6">
          {/* Summary per Kategori */}
          {filteredInspeksi.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200 shadow-sm">
            <p className="text-xs text-gray-800 font-semibold mb-1">Plaza</p>
            <p className="text-2xl font-bold text-blue-600">
              {filteredInspeksi.filter(i => i.kategoriKendaraan === "PLAZA").length}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200 shadow-sm">
            <p className="text-xs text-gray-800 font-semibold mb-1">Derek</p>
            <p className="text-2xl font-bold text-yellow-600">
              {filteredInspeksi.filter(i => i.kategoriKendaraan === "DEREK").length}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200 shadow-sm">
            <p className="text-xs text-gray-800 font-semibold mb-1">Kamtib</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredInspeksi.filter(i => i.kategoriKendaraan === "KAMTIB").length}
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200 shadow-sm">
            <p className="text-xs text-gray-800 font-semibold mb-1">Rescue</p>
            <p className="text-2xl font-bold text-orange-600">
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
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
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
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-sm">
                Buat Inspeksi Baru
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-600 text-white">
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
                    <tr key={item.id} className="hover:bg-purple-50 transition-colors duration-200">
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">{index + 1}</td>
                      <td className="px-4 py-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-lg">
                          {item.kategoriKendaraan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-blue-600">{item.nomorKendaraan}</span>
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
                            <button className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors duration-200 shadow-sm">
                              Detail
                            </button>
                          </Link>
                          {item.status === "DRAFT" && (
                            <>
                              <Link href={`/dashboard/petugas-lapangan/inspeksi/${item.kategoriKendaraan.toLowerCase()}?draft=${item.id}`}>
                                <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors duration-200 shadow-sm">
                                  Lanjutkan
                                </button>
                              </Link>
                              <button 
                                onClick={() => handleDelete(item.id, item.nomorKendaraan)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors duration-200 shadow-sm"
                              >
                                Hapus
                              </button>
                            </>
                          )}
                          {(item.status === "APPROVED_BY_OPERATIONAL" || item.status === "APPROVED_BY_TRAFFIC" || item.status === "SUBMITTED") && (
                            <Link href={`/dashboard/petugas-lapangan/inspeksi/${item.id}`}>
                              <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors duration-200 shadow-sm">
                                PDF
                              </button>
                            </Link>
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
            <div className="text-center bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-2xl font-bold text-gray-700">{filteredInspeksi.length}</p>
              <p className="text-xs text-gray-800 font-semibold">Total Kendaraan</p>
            </div>
            <div className="text-center bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-2xl font-bold text-green-600">
                {filteredInspeksi.filter(i => i.status === "APPROVED").length}
              </p>
              <p className="text-xs text-gray-800 font-semibold">Disetujui</p>
            </div>
            <div className="text-center bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <p className="text-2xl font-bold text-yellow-600">
                {filteredInspeksi.filter(i => i.status === "SUBMITTED").length}
              </p>
              <p className="text-xs text-gray-800 font-semibold">Pending</p>
            </div>
            <div className="text-center bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-2xl font-bold text-blue-700">
                {new Set(filteredInspeksi.map(i => i.kategoriKendaraan)).size}
              </p>
              <p className="text-xs text-gray-800 font-semibold">Jenis Kendaraan</p>
            </div>
          </div>
        </div>
          )}
        </div>
      )}
    </div>
  );
}



