"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<"unread" | "all">("unread");
  const [rekaps, setRekaps] = useState<RekapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRekap, setSelectedRekap] = useState<RekapItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetchRekaps();
    }
  }, [status]);

  const fetchRekaps = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/rekap-manager", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRekaps(data);
      } else {
        console.error("Failed to fetch rekaps:", response.status);
        setRekaps([]);
      }
    } catch (error) {
      console.error("Error fetching rekaps:", error);
      setRekaps([]);
    } finally {
      setLoading(false);
    }
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
      HARIAN: "Harian",
      MINGGUAN: "Mingguan",
      BULANAN: "Bulanan",
      TAHUNAN: "Tahunan",
      KUSTOM: "Custom",
    };
    return labels[type] || type;
  };
  
  const getPeriodeIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

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
        <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Rekap Laporan dari Inspector
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
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-700 mt-4 font-medium">Memuat data...</p>
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
              <p className="text-gray-800 font-semibold text-lg">
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
                          <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                        )}
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="font-bold text-lg text-gray-900">
                          {rekap.judulRekap}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-700 font-medium mb-2">
                        <span className="flex items-center gap-1">
                          {getPeriodeIcon()}
                            {getPeriodeTypeLabel(rekap.periodeType)}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            {rekap.totalInspeksi} Inspeksi
                          </span>
                          {rekap.kategoriKendaraan && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-lg">
                              {rekap.kategoriKendaraan}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 font-medium flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(rekap.tanggalMulai).toLocaleDateString("id-ID")} -{" "}
                          {new Date(rekap.tanggalSelesai).toLocaleDateString("id-ID")}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
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
                      <div className="flex flex-col gap-2">
                        <button
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors duration-200 flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/manager-operational/rekap/view/${rekap.id}`);
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Lihat Laporan
                        </button>
                        <button
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors duration-200 flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(rekap);
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Info Detail
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRekap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Detail Rekap</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-600 hover:text-gray-900 text-2xl font-bold"
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

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    router.push(`/dashboard/manager-operational/rekap/view/${selectedRekap.id}`);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Lihat Laporan Visual
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

