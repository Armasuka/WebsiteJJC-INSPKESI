"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface RekapItem {
  id: string;
  judulRekap: string;
  periodeType: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  kategoriKendaraan: string | null;
  totalInspeksi: number;
  dataStatistik: any;
  pengirimId: string;
  namaPengirim: string;
  isRead: boolean;
  readAt: string | null;
  catatan: string | null;
  createdAt: string;
}

const COLORS = {
  DEREK: "#FF6B6B",
  PLAZA: "#4ECDC4",
  KAMTIB: "#FFD93D",
  RESCUE: "#6C5CE7",
};

export default function RekapManagerOperationalPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"unread" | "all" | "chart">("unread");
  const [rekaps, setRekaps] = useState<RekapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRekap, setSelectedRekap] = useState<RekapItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Chart data
  const [chartData, setChartData] = useState<any[]>([]);
  const [totalAllInspeksi, setTotalAllInspeksi] = useState(0);

  useEffect(() => {
    fetchRekaps();
  }, []);

  const fetchRekaps = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/rekap-manager");
      if (response.ok) {
        const data = await response.json();
        setRekaps(data);
        calculateChartData(data);
      }
    } catch (error) {
      console.error("Error fetching rekaps:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateChartData = (rekapsData: RekapItem[]) => {
    // Aggregate data dari semua rekap yang sudah dibaca
    const aggregated: Record<string, number> = {};
    let total = 0;

    rekapsData.forEach((rekap) => {
      if (rekap.dataStatistik && rekap.dataStatistik.breakdown) {
        rekap.dataStatistik.breakdown.forEach((item: any) => {
          aggregated[item.kategori] = (aggregated[item.kategori] || 0) + item.count;
          total += item.count;
        });
      }
    });

    const chartDataArray = Object.entries(aggregated).map(([kategori, count]) => ({
      name: kategori,
      value: count,
      percentage: ((count / total) * 100).toFixed(1),
    }));

    setChartData(chartDataArray);
    setTotalAllInspeksi(total);
  };

  const handleMarkAsRead = async (rekapId: string) => {
    try {
      const response = await fetch("/api/rekap-manager", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rekapId }),
      });

      if (response.ok) {
        fetchRekaps();
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleViewDetail = (rekap: RekapItem) => {
    setSelectedRekap(rekap);
    setShowDetailModal(true);
    if (!rekap.isRead) {
      handleMarkAsRead(rekap.id);
    }
  };

  const unreadRekaps = rekaps.filter((r) => !r.isRead);
  const displayRekaps = activeTab === "unread" ? unreadRekaps : rekaps;

  const getPeriodeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      HARIAN: "📅 Harian",
      MINGGUAN: "📅 Mingguan",
      BULANAN: "📅 Bulanan",
      TAHUNAN: "📅 Tahunan",
      KUSTOM: "📅 Custom",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push("/dashboard/manager-operational")}
        className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 font-medium shadow-sm"
      >
        ← Kembali
      </button>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-600">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          📊 Rekap Laporan dari Inspector
        </h2>
        <p className="text-gray-600">
          Laporan rekap yang dikirim oleh petugas lapangan
        </p>
        {unreadRekaps.length > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
            {unreadRekaps.length} Rekap Belum Dibaca
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("unread")}
            className={`flex-1 px-6 py-4 font-medium transition-colors duration-200 relative ${
              activeTab === "unread"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Belum Dibaca
            {unreadRekaps.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {unreadRekaps.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 px-6 py-4 font-medium transition-colors duration-200 ${
              activeTab === "all"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Semua Rekap
          </button>
          <button
            onClick={() => setActiveTab("chart")}
            className={`flex-1 px-6 py-4 font-medium transition-colors duration-200 ${
              activeTab === "chart"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📈 Visualisasi Data
          </button>
        </div>

        {/* Content */}
        {activeTab !== "chart" ? (
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Memuat data...</p>
              </div>
            ) : displayRekaps.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-gray-600 font-medium">
                  {activeTab === "unread" ? "Tidak ada rekap baru" : "Belum ada rekap"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayRekaps.map((rekap) => (
                  <div
                    key={rekap.id}
                    className={`border rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer ${
                      !rekap.isRead ? "bg-green-50 border-green-300" : "bg-white border-gray-200"
                    }`}
                    onClick={() => handleViewDetail(rekap)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {!rekap.isRead && (
                            <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                          )}
                          <h3 className="font-bold text-lg text-gray-900">
                            {rekap.judulRekap}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-2">
                          <span className="flex items-center gap-1">
                            {getPeriodeTypeLabel(rekap.periodeType)}
                          </span>
                          <span className="flex items-center gap-1">
                            📦 {rekap.totalInspeksi} Inspeksi
                          </span>
                          {rekap.kategoriKendaraan && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-lg">
                              {rekap.kategoriKendaraan}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          📅{" "}
                          {new Date(rekap.tanggalMulai).toLocaleDateString("id-ID")} -{" "}
                          {new Date(rekap.tanggalSelesai).toLocaleDateString("id-ID")}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Dari: <strong>{rekap.namaPengirim}</strong> •{" "}
                          {new Date(rekap.createdAt).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <button
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetail(rekap);
                        }}
                      >
                        Lihat Detail
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Chart Tab
          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Total Inspeksi yang di-ACC
              </h3>
              <p className="text-4xl font-bold text-green-600">{totalAllInspeksi}</p>
              <p className="text-sm text-gray-600 mt-1">
                Dari {rekaps.length} laporan rekap
              </p>
            </div>

            {chartData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="font-bold text-lg mb-4 text-gray-900">
                    Distribusi per Kategori (Pie Chart)
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
                            fill={COLORS[entry.name as keyof typeof COLORS]}
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
                            backgroundColor: COLORS[item.name as keyof typeof COLORS],
                          }}
                        ></div>
                        <span className="text-sm text-gray-700">
                          {item.name}: {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h4 className="font-bold text-lg mb-4 text-gray-900">
                    Jumlah per Kategori (Bar Chart)
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#10B981" name="Jumlah Inspeksi" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-600">Belum ada data untuk divisualisasikan</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRekap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Detail Rekap</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-bold text-2xl text-gray-900 mb-2">
                  {selectedRekap.judulRekap}
                </h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm">
                    {getPeriodeTypeLabel(selectedRekap.periodeType)}
                  </span>
                  {selectedRekap.kategoriKendaraan && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-sm">
                      {selectedRekap.kategoriKendaraan}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-700">
                  <strong>Periode:</strong>{" "}
                  {new Date(selectedRekap.tanggalMulai).toLocaleDateString("id-ID")} -{" "}
                  {new Date(selectedRekap.tanggalSelesai).toLocaleDateString("id-ID")}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Total Inspeksi:</strong> {selectedRekap.totalInspeksi} data
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Pengirim:</strong> {selectedRekap.namaPengirim}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Dikirim pada:</strong>{" "}
                  {new Date(selectedRekap.createdAt).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Breakdown */}
              {selectedRekap.dataStatistik?.breakdown && (
                <div>
                  <h5 className="font-bold text-gray-900 mb-3">Breakdown per Kategori:</h5>
                  <div className="space-y-2">
                    {selectedRekap.dataStatistik.breakdown.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{
                              backgroundColor: COLORS[item.kategori as keyof typeof COLORS],
                            }}
                          ></div>
                          <span className="font-medium text-gray-900">{item.kategori}</span>
                        </div>
                        <span className="font-bold text-green-600">{item.count} inspeksi</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Catatan */}
              {selectedRekap.catatan && (
                <div>
                  <h5 className="font-bold text-gray-900 mb-2">Catatan:</h5>
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedRekap.catatan}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
