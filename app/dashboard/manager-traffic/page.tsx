"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import PreviewInspeksi from "@/app/components/PreviewInspeksi";
import { uploadSignatureToMinio } from "@/lib/uploadUtils";

interface Inspeksi {
  id: string;
  kategoriKendaraan: string;
  nomorKendaraan: string;
  lokasiInspeksi: string;
  tanggalInspeksi: string;
  namaPetugas: string;
  nipPetugas: string;
  namaPetugas2?: string | null;
  nipPetugas2?: string | null;
  status: string;
  dataKhusus: any;
  createdAt: string;
}

export default function ManagerTrafficDashboard() {
  const { data: session } = useSession();
  const [inspeksiList, setInspeksiList] = useState<Inspeksi[]>([]);
  const [approvedList, setApprovedList] = useState<Inspeksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInspeksi, setSelectedInspeksi] = useState<Inspeksi | null>(null);
  const [inspeksiDetail, setInspeksiDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signing, setSigning] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
  const sigCanvas = useRef<SignatureCanvas>(null);

  const fetchInspeksi = async () => {
    try {
      setLoading(true);
      // Optimasi: Fetch hanya data yang diperlukan dengan limit
      const response = await fetch("/api/inspeksi?limit=50");
      if (response.ok) {
        const result = await response.json();
        // Handle both old and new response format
        const data = result.data || result;
        
        const pending = data.filter(
          (item: Inspeksi) => item.status === "SUBMITTED"
        );
        const approved = data.filter(
          (item: Inspeksi) => item.status === "APPROVED_BY_TRAFFIC" || item.status === "APPROVED_BY_OPERATIONAL"
        );
        setInspeksiList(pending);
        setApprovedList(approved);
      }
    } catch (error) {
      console.error("Error fetching inspeksi:", error);
      alert("Gagal memuat data inspeksi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspeksi();
  }, []);

  const handleOpenSignature = async (inspeksi: Inspeksi) => {
    setSelectedInspeksi(inspeksi);
    setShowSignatureModal(true);
    setLoadingDetail(true);
    
    try {
      const response = await fetch(`/api/inspeksi/${inspeksi.id}`);
      if (response.ok) {
        const detail = await response.json();
        setInspeksiDetail(detail);
      }
    } catch (error) {
      console.error("Error fetching inspeksi detail:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseSignature = () => {
    setShowSignatureModal(false);
    setSelectedInspeksi(null);
    setInspeksiDetail(null);
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };

  const handleClearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };

  const handleApproveWithSignature = async () => {
    if (!selectedInspeksi || !sigCanvas.current) return;

    if (sigCanvas.current.isEmpty()) {
      alert("Mohon buat tanda tangan terlebih dahulu");
      return;
    }

    try {
      setSigning(true);
      const signatureData = sigCanvas.current.toDataURL();
      
      // Upload signature to MinIO
      const ttdManagerTrafficUploaded = await uploadSignatureToMinio(signatureData, 'ttd-manager-traffic');

      const response = await fetch(`/api/inspeksi/${selectedInspeksi.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve_traffic",
          ttdManagerTraffic: ttdManagerTrafficUploaded,
        }),
      });

      if (response.ok) {
        alert("Laporan berhasil disetujui!");
        handleCloseSignature();
        fetchInspeksi();
      } else {
        const error = await response.json();
        alert(error.message || "Gagal menyetujui laporan");
      }
    } catch (error) {
      console.error("Error approving inspeksi:", error);
      alert("Terjadi kesalahan saat menyetujui laporan");
    } finally {
      setSigning(false);
    }
  };

  const stats = {
    total: inspeksiList.length + approvedList.length,
    pending: inspeksiList.length,
    approved: approvedList.length,
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard Manager Traffic
          </h2>
          <p className="text-gray-600">
            Selamat datang, <span className="font-semibold text-blue-600">{session?.user?.name}</span>!
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Menunggu Approval</p>
                <p className="text-4xl font-bold text-blue-600">{stats.pending}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Sudah Disetujui</p>
                <p className="text-4xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Laporan</p>
                <p className="text-4xl font-bold text-purple-600">{stats.total}</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Status</p>
                <p className="text-2xl font-bold text-orange-600">Aktif</p>
              </div>
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-3xl">🔥</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition ${
                activeTab === "pending"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              📋 Menunggu Approval ({stats.pending})
            </button>
            <button
              onClick={() => setActiveTab("approved")}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition ${
                activeTab === "approved"
                  ? "bg-green-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              ✅ Riwayat Approved ({stats.approved})
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-4 font-medium">Memuat data...</p>
              </div>
            ) : activeTab === "pending" ? (
              inspeksiList.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-600 font-medium">Tidak ada laporan yang menunggu persetujuan</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inspeksiList.map((inspeksi) => (
                    <div
                      key={inspeksi.id}
                      className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition bg-white"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg">
                              {inspeksi.kategoriKendaraan}
                            </span>
                            <span className="px-3 py-1 bg-yellow-600 text-white text-xs font-semibold rounded-lg">
                              Menunggu Persetujuan
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-900 text-lg mb-2">
                            {inspeksi.nomorKendaraan} - {inspeksi.lokasiInspeksi}
                          </h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p className="flex items-center gap-2">
                              <span className="font-semibold">👤 Petugas:</span>
                              {inspeksi.namaPetugas} ({inspeksi.nipPetugas})
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="font-semibold">📅 Tanggal:</span>
                              {new Date(inspeksi.tanggalInspeksi).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenSignature(inspeksi)}
                            className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm shadow-sm"
                          >
                            ✓ Setujui
                          </button>
                          <a
                            href={`/dashboard/petugas-lapangan/inspeksi/${inspeksi.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm shadow-sm"
                          >
                            👁️ Lihat
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              approvedList.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-gray-600 font-medium">Belum ada laporan yang disetujui</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvedList.map((inspeksi) => (
                    <div
                      key={inspeksi.id}
                      className="border border-green-200 rounded-xl p-5 bg-green-50 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg">
                              {inspeksi.kategoriKendaraan}
                            </span>
                            <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-lg">
                              ✅ Approved
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-900 text-lg mb-2">
                            {inspeksi.nomorKendaraan} - {inspeksi.lokasiInspeksi}
                          </h4>
                          <div className="text-sm text-gray-700 space-y-1">
                            <p className="flex items-center gap-2">
                              <span className="font-semibold">👤 Petugas:</span>
                              {inspeksi.namaPetugas} ({inspeksi.nipPetugas})
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="font-semibold">📅 Inspeksi:</span>
                              {new Date(inspeksi.tanggalInspeksi).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <div>
                          <a
                            href={`/dashboard/petugas-lapangan/inspeksi/${inspeksi.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm shadow-sm"
                          >
                            �️ Lihat Detail
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && selectedInspeksi && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full my-8 border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white sticky top-0 z-10 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                ✍️ Preview & Tanda Tangan Manager Traffic
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Inspeksi: {selectedInspeksi?.nomorKendaraan} - {selectedInspeksi?.kategoriKendaraan}
              </p>
            </div>
            
            <div className="max-h-[calc(90vh-200px)] overflow-y-auto">
              {loadingDetail ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600 mt-4 font-medium">Memuat detail laporan...</p>
                </div>
              ) : inspeksiDetail ? (
                <div className="p-6">
                  {/* Preview Laporan Lengkap */}
                  <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      📋 Preview Laporan Inspeksi
                    </h4>
                    <PreviewInspeksi inspeksi={inspeksiDetail} />
                  </div>

                  {/* Form Tanda Tangan Manager Traffic */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h5 className="font-bold text-blue-900 mb-4 text-lg">✍️ Tanda Tangan Manager Traffic</h5>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tanda Tangan Digital
                      </label>
                      <div className="border-2 border-blue-300 rounded-xl bg-white shadow-sm">
                        <SignatureCanvas
                          ref={sigCanvas}
                          canvasProps={{
                            className: "w-full h-64 rounded-xl",
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2 italic">
                        Gunakan mouse atau touchscreen untuk menandatangani
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-red-600 font-medium">Gagal memuat detail laporan</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end sticky bottom-0 rounded-b-2xl">
              <button
                onClick={handleClearSignature}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                disabled={signing}
              >
                🗑️ Hapus TTD
              </button>
              <button
                onClick={handleCloseSignature}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold shadow-sm"
                disabled={signing}
              >
                ✕ Batal
              </button>
              <button
                onClick={handleApproveWithSignature}
                disabled={signing || loadingDetail}
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {signing ? "⏳ Menyetujui..." : "✓ Setujui Laporan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
