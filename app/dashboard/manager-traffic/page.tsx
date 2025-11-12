"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import PreviewInspeksi from "@/app/components/PreviewInspeksi";
import KomentarSection from "@/app/components/KomentarSection";
import ToastNotification from "@/app/components/ToastNotification";
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
  const { data: session, status: sessionStatus } = useSession();
  const [inspeksiList, setInspeksiList] = useState<Inspeksi[]>([]);
  const [approvedList, setApprovedList] = useState<Inspeksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInspeksi, setSelectedInspeksi] = useState<Inspeksi | null>(null);
  const [inspeksiDetail, setInspeksiDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signing, setSigning] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("ALL");
  const [viewOnlyMode, setViewOnlyMode] = useState(false);  // Mode view-only tanpa TTD
  const sigCanvas = useRef<SignatureCanvas>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "warning" | "info" = "success") => {
    setToast({ message, type });
  };

  const fetchInspeksi = async () => {
    // Don't fetch if session is not ready
    if (sessionStatus !== "authenticated") {
      console.log("[MANAGER TRAFFIC] Waiting for session to be ready...");
      return;
    }

    try {
      setLoading(true);
      console.log("[MANAGER TRAFFIC] Fetching inspeksi data...");
      
      // Optimasi: Fetch hanya data yang diperlukan dengan limit
      const response = await fetch("/api/inspeksi?limit=50", {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("[MANAGER TRAFFIC] Fetched data:", result);
      
      // Handle both old and new response format
      const data = result.data || result;
      
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format: expected array");
      }
      
      const pending = data.filter(
        (item: Inspeksi) => item.status === "SUBMITTED"
      );
      const approved = data.filter(
        (item: Inspeksi) => item.status === "APPROVED_BY_TRAFFIC" || item.status === "APPROVED_BY_OPERATIONAL"
      );
      
      console.log("[MANAGER TRAFFIC] Pending count:", pending.length);
      console.log("[MANAGER TRAFFIC] Approved count:", approved.length);
      
      setInspeksiList(pending);
      setApprovedList(approved);
    } catch (error) {
      console.error("[MANAGER TRAFFIC] Error fetching inspeksi:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      showToast(`Gagal memuat data inspeksi: ${errorMessage}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch when session is authenticated
    if (sessionStatus === "authenticated") {
      fetchInspeksi();
    }
  }, [sessionStatus]);

  const handleOpenSignature = async (inspeksi: Inspeksi, viewOnly: boolean = false) => {
    setSelectedInspeksi(inspeksi);
    setViewOnlyMode(viewOnly);
    setShowSignatureModal(true);
    setLoadingDetail(true);
    
    try {
      const response = await fetch(`/api/inspeksi/${inspeksi.id}`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
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
    setViewOnlyMode(false);
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
    if (!selectedInspeksi || !sigCanvas.current) {
      console.error("[MANAGER TRAFFIC] Missing selectedInspeksi or sigCanvas");
      return;
    }

    if (sigCanvas.current.isEmpty()) {
      showToast("Mohon buat tanda tangan terlebih dahulu", "warning");
      return;
    }

    try {
      console.log("[MANAGER TRAFFIC] Starting approval process for:", selectedInspeksi.id);
      setSigning(true);
      const signatureData = sigCanvas.current.toDataURL();
      console.log("[MANAGER TRAFFIC] Signature data captured, length:", signatureData.length);
      
      // Process signature for database storage
      console.log("[MANAGER TRAFFIC] Processing signature...");
      const ttdManagerTrafficUploaded = await uploadSignatureToMinio(signatureData, 'ttd-manager-traffic');
      console.log("[MANAGER TRAFFIC] Signature processed successfully:", ttdManagerTrafficUploaded);

      console.log("[MANAGER TRAFFIC] Sending approval request to API...");
      const response = await fetch(`/api/inspeksi/${selectedInspeksi.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve_traffic",
          ttdManagerTraffic: ttdManagerTrafficUploaded,
        }),
      });

      console.log("[MANAGER TRAFFIC] API Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[MANAGER TRAFFIC] API Error Response:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("[MANAGER TRAFFIC] API Response data:", data);

      if (data.success) {
        console.log("[MANAGER TRAFFIC] Approval successful!");
        showToast("Laporan berhasil disetujui! Email notifikasi telah dikirim ke Manager Operational", "success");
        
        // Close modal first
        handleCloseSignature();
        
        // Then refresh data
        console.log("[MANAGER TRAFFIC] Refreshing data...");
        await fetchInspeksi();
        console.log("[MANAGER TRAFFIC] Data refreshed successfully");
      } else {
        throw new Error(data.error || data.message || "Gagal menyetujui laporan");
      }
    } catch (error) {
      console.error("[MANAGER TRAFFIC] Error approving inspeksi:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      showToast(`Terjadi kesalahan: ${errorMessage}`, "error");
    } finally {
      console.log("[MANAGER TRAFFIC] Approval process finished");
      setSigning(false);
    }
  };

  const stats = {
    total: inspeksiList.length + approvedList.length,
    pending: inspeksiList.length,
    approved: approvedList.length,
  };

  // Filter data based on search and kategori
  const getFilteredList = (list: Inspeksi[]) => {
    let filtered = [...list];
    
    if (searchQuery.trim()) {
      filtered = filtered.filter((item) => 
        item.nomorKendaraan.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (kategoriFilter !== "ALL") {
      filtered = filtered.filter((item) => item.kategoriKendaraan === kategoriFilter);
    }
    
    return filtered;
  };

  const filteredPendingList = getFilteredList(inspeksiList);
  const filteredApprovedList = getFilteredList(approvedList);

  // Show loading state while session is loading
  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard Manager Traffic
            </h2>
            <p className="text-gray-600">
              Selamat datang, <span className="font-semibold text-blue-600">{session?.user?.name}</span>!
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-800 text-sm font-semibold mb-1">Menunggu Approval</p>
                <p className="text-4xl font-bold text-blue-600">{stats.pending}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-800 text-sm font-semibold mb-1">Sudah Disetujui</p>
                <p className="text-4xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-800 text-sm font-semibold mb-1">Total Laporan</p>
                <p className="text-4xl font-bold text-purple-600">{stats.total}</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Filter Section */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter & Pencarian
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Cari Nomor Kendaraan
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Contoh: B 1234 XYZ"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white transition-colors duration-200 placeholder:text-gray-700 placeholder:font-medium text-gray-900 font-medium"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter Kategori
                </label>
                <select
                  value={kategoriFilter}
                  onChange={(e) => setKategoriFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors duration-200 text-gray-900 font-medium"
                >
                  <option value="ALL">Semua Kategori</option>
                  <option value="PLAZA">Plaza</option>
                  <option value="DEREK">Derek</option>
                  <option value="KAMTIB">Kamtib</option>
                  <option value="RESCUE">Rescue</option>
                </select>
              </div>
            </div>
            
            <div className="mt-3 text-sm text-gray-600">
              Menampilkan <span className="font-bold text-blue-600">
                {activeTab === "pending" ? filteredPendingList.length : filteredApprovedList.length}
              </span> dari{" "}
              <span className="font-bold">{activeTab === "pending" ? inspeksiList.length : approvedList.length}</span> laporan
            </div>
          </div>
          
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors duration-200 ${
                activeTab === "pending"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Menunggu Approval ({stats.pending})
            </button>
            <button
              onClick={() => setActiveTab("approved")}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors duration-200 ${
                activeTab === "approved"
                  ? "bg-green-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Riwayat Approved ({stats.approved})
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-800 mt-4 font-semibold">Memuat data...</p>
              </div>
            ) : activeTab === "pending" ? (
              filteredPendingList.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-600 font-medium">
                    {inspeksiList.length === 0 
                      ? "Tidak ada laporan yang menunggu persetujuan" 
                      : "Tidak ada laporan sesuai filter"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPendingList.map((inspeksi) => (
                    <div
                      key={inspeksi.id}
                      className="border border-gray-200 rounded-lg p-5 transition-colors duration-200 bg-white"
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
                              <span className="font-semibold">Petugas:</span>
                              {inspeksi.namaPetugas} ({inspeksi.nipPetugas})
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="font-semibold">Tanggal:</span>
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
                            className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-semibold text-sm shadow-sm"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => handleOpenSignature(inspeksi)}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold text-sm shadow-sm"
                          >
                            Lihat
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              filteredApprovedList.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-600 font-medium">
                    {approvedList.length === 0 
                      ? "Belum ada laporan yang disetujui" 
                      : "Tidak ada laporan sesuai filter"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredApprovedList.map((inspeksi) => (
                    <div
                      key={inspeksi.id}
                      className="border border-green-200 rounded-lg p-5 bg-green-50 transition-colors duration-200"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg">
                              {inspeksi.kategoriKendaraan}
                            </span>
                            <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-lg">
                              Approved
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-900 text-lg mb-2">
                            {inspeksi.nomorKendaraan} - {inspeksi.lokasiInspeksi}
                          </h4>
                          <div className="text-sm text-gray-700 space-y-1">
                            <p className="flex items-center gap-2">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="font-semibold">Petugas:</span>
                              {inspeksi.namaPetugas} ({inspeksi.nipPetugas})
                            </p>
                            <p className="flex items-center gap-2">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="font-semibold">Inspeksi:</span>
                              {new Date(inspeksi.tanggalInspeksi).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <div>
                          <button
                            onClick={() => handleOpenSignature(inspeksi, true)}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm shadow-sm flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Lihat Detail
                          </button>
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-6xl w-full my-8 border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50/95 to-white/95 backdrop-blur-md sticky top-0 z-10 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview & Tanda Tangan Manager Traffic
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Inspeksi: {selectedInspeksi?.nomorKendaraan} - {selectedInspeksi?.kategoriKendaraan}
              </p>
            </div>
            
            <div className="max-h-[calc(90vh-200px)] overflow-y-auto">
              {loadingDetail ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="text-gray-800 mt-4 font-semibold">Memuat detail laporan...</p>
                </div>
              ) : inspeksiDetail ? (
                <div className="p-6">
                  {/* Preview Laporan Lengkap */}
                  <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Preview Laporan Inspeksi
                    </h4>
                    <PreviewInspeksi inspeksi={inspeksiDetail} />
                  </div>

                  {/* Bagian Komunikasi/Komentar */}
                  <div className="mb-6">
                    <KomentarSection inspeksiId={inspeksiDetail.id} />
                  </div>

                  {/* Form Tanda Tangan Manager Traffic - Hanya tampil jika bukan view-only */}
                  {!viewOnlyMode && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <h5 className="font-bold text-blue-900 mb-4 text-lg flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Tanda Tangan Manager Traffic
                      </h5>
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
                        <p className="text-xs text-gray-700 mt-2 italic font-medium">
                          Gunakan mouse atau touchscreen untuk menandatangani
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Info jika sudah approved (view-only mode) */}
                  {viewOnlyMode && (inspeksiDetail.status === "APPROVED_BY_TRAFFIC" || inspeksiDetail.status === "APPROVED_BY_OPERATIONAL") && inspeksiDetail.ttdManagerTraffic && (
                    <div className="bg-green-50 border-2 border-green-500 rounded-xl p-5">
                      <h5 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Sudah Disetujui Manager Traffic
                      </h5>
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 font-medium">
                            <strong>Tanggal Approval:</strong>{" "}
                            {inspeksiDetail.approvedAtTraffic && new Date(inspeksiDetail.approvedAtTraffic).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="text-sm text-green-600 font-semibold mt-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {inspeksiDetail.status === "APPROVED_BY_OPERATIONAL" 
                              ? "Inspeksi ini sudah final dan tidak bisa diubah"
                              : "Menunggu approval Manager Operational"}
                          </p>
                        </div>
                        <div className="border-2 border-green-400 rounded-lg p-3 bg-white shadow-sm">
                          <img 
                            src={inspeksiDetail.ttdManagerTraffic} 
                            alt="TTD Manager Traffic" 
                            className="w-48 h-24 object-contain"
                          />
                          <p className="text-xs text-center text-gray-800 mt-2 font-semibold">Tanda Tangan Manager Traffic</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-red-600 font-medium">Gagal memuat detail laporan</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/95 backdrop-blur-md flex gap-3 justify-end sticky bottom-0 rounded-b-2xl">
              {!viewOnlyMode && (
                <>
                  <button
                    onClick={handleClearSignature}
                    className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold flex items-center gap-2"
                    disabled={signing}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Hapus TTD
                  </button>
                  <button
                    onClick={handleCloseSignature}
                    className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold shadow-sm flex items-center gap-2"
                    disabled={signing}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Batal
                  </button>
                  <button
                    onClick={handleApproveWithSignature}
                    disabled={signing || loadingDetail}
                    className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
                  >
                    {signing ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Menyetujui...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Setujui Laporan
                      </>
                    )}
                  </button>
                </>
              )}
              {viewOnlyMode && (
                <button
                  onClick={handleCloseSignature}
                  className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold shadow-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Tutup
                </button>
              )}
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




