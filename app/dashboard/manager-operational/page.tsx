"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import PreviewInspeksi from "@/app/components/PreviewInspeksi";
import KomentarSection from "@/app/components/KomentarSection";
import { uploadSignatureToMinio } from "@/lib/uploadUtils";
import ToastNotification from "@/app/components/ToastNotification";

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
  approvedByTraffic: string | null;
  approvedAtTraffic: string | null;
  ttdManagerTraffic: string | null;
  dataKhusus: any;
  createdAt: string;
  // Add more fields for preview
  nomorSTNK?: string | null;
  masaBerlakuSTNK?: string | null;
  fotoSTNK?: string | null;
  nomorKIR?: string | null;
  masaBerlakuKIR?: string | null;
  fotoKIR?: string | null;
  masaBerlakuSIMPetugas1?: string | null;
  fotoSIMPetugas1?: string | null;
  masaBerlakuSIMPetugas2?: string | null;
  fotoSIMPetugas2?: string | null;
  tanggalService?: string | null;
  fotoService?: string | null;
  jumlahBBM?: string | null;
  fotoBBM?: string | null;
  kelengkapanKendaraan?: any;
  catatan?: string | null;
  // Rejection fields
  rejectionNote?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
}

interface RejectionStats {
  total: number;
  byReason: { [key: string]: number };
  byKategori: { [key: string]: number };
}

// Tipe untuk kategori kelengkapan laporan
type KelengkapanStatus = "sempurna" | "cukup" | "tidak_lengkap";

// Interface untuk item kelengkapan
interface KelengkapanItem {
  ada: boolean;
  jumlah: string;
  kondisi: string;
}

export default function ManagerOperationalDashboard() {
  const { data: session, status } = useSession();
  const [inspeksiList, setInspeksiList] = useState<Inspeksi[]>([]);
  const [approvedList, setApprovedList] = useState<Inspeksi[]>([]);
  const [rejectedList, setRejectedList] = useState<Inspeksi[]>([]);
  const [rejectionStats, setRejectionStats] = useState<RejectionStats>({ total: 0, byReason: {}, byKategori: {} });
  const [loading, setLoading] = useState(true);
  const [selectedInspeksi, setSelectedInspeksi] = useState<Inspeksi | null>(null);
  const [inspeksiDetail, setInspeksiDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signing, setSigning] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("ALL");
  const [rejectionReasonFilter, setRejectionReasonFilter] = useState("ALL");
  const [viewOnlyMode, setViewOnlyMode] = useState(false);  // Mode view-only tanpa TTD
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [selectedRejectionReason, setSelectedRejectionReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [kelengkapanFilter, setKelengkapanFilter] = useState<"ALL" | KelengkapanStatus>("ALL");

  // Daftar alasan penolakan yang sudah ditentukan
  const rejectionReasons = [
    { id: "perlengkapan_tidak_lengkap", label: "Perlengkapan tidak lengkap" },
    { id: "dokumen_petugas_kadaluarsa", label: "Dokumen petugas kadaluarsa" },
    { id: "dokumen_kendaraan_tidak_lengkap", label: "Dokumen kendaraan tidak lengkap" },
    { id: "dokumen_kendaraan_kadaluarsa", label: "Dokumen kendaraan kadaluarsa" },
    { id: "foto_tidak_jelas", label: "Foto tidak jelas/buram" },
    { id: "data_tidak_sesuai", label: "Data tidak sesuai dengan foto" },
    { id: "informasi_tidak_lengkap", label: "Informasi inspeksi tidak lengkap" },
    { id: "format_salah", label: "Format pengisian salah" },
    { id: "lainnya", label: "Lainnya (masukkan komentar)" },
  ];

  // Daftar kelengkapan yang diharapkan berdasarkan kategori kendaraan
  const kelengkapanPerKategori: Record<string, { sarana: string[], kendaraan: string[] }> = {
    DEREK: {
      sarana: [
        "Towing Hook/Pengait Derek",
        "Winch/Kerekan",
        "Sling/Belt Derek",
        "Wheel Lift System",
        "Safety Chain/Rantai Pengaman",
        "Lampu Rotator Kuning",
        "Rambu Peringatan (Traffic Cone)",
        "Radio Komunikasi (HT)",
        "Alat Pemadam Api Ringan (APAR)",
        "Toolkit Derek Lengkap",
      ],
      kendaraan: [
        "Ban Serep",
        "Dongkrak & Kunci Roda",
        "Segitiga Pengaman",
        "Kotak P3K",
        "Toolkit/Perkakas Dasar",
      ]
    },
    PLAZA: {
      sarana: [
        "Traffic Cone (min 10 unit)",
        "Safety Vest",
        "Rambu Lalu Lintas Portable",
        "Lampu Rotator/Warning Light",
        "Radio Komunikasi (HT)",
        "Alat Pemadam Api Ringan (APAR)",
        "Pembatas Jalan (Barier)",
        "Megaphone/TOA",
        "Alat Bantu Pernafasan (Masker)",
        "Peralatan Kebersihan",
      ],
      kendaraan: [
        "Ban Serep",
        "Dongkrak & Kunci Roda",
        "Segitiga Pengaman",
        "Kotak P3K",
        "Toolkit/Perkakas Dasar",
      ]
    },
    KAMTIB: {
      sarana: [
        "Rompi keselamatan kerja",
        "Sepatu Safety",
        "Sabuk Pentungan dll",
      ],
      kendaraan: [
        "Rubber Cone",
        "Bendera Merah/Tongkat",
        "Handy Talky",
      ]
    },
    RESCUE: {
      sarana: [
        "Hydraulic Rescue Tool (Jaws of Life)",
        "Tali Kerma/Rope Rescue",
        "Harness & Karabiner",
        "Alat Pemotong (Cutter/Saw)",
        "Lampu Sorot/Searchlight",
        "Radio Komunikasi (HT)",
        "Tabung Oksigen Portable",
        "Alat Pemadam Api Ringan (APAR)",
        "Stretcher/Tandu Lipat",
        "Life Jacket/Pelampung",
      ],
      kendaraan: [
        "Ban Serep",
        "Dongkrak & Kunci Roda",
        "Segitiga Pengaman",
        "Kotak P3K",
        "Toolkit/Perkakas Dasar"
      ]
    }
  };

  // Fungsi untuk menghitung persentase kelengkapan dari inspeksi
  const calculateKelengkapanPercentage = (inspeksi: Inspeksi): { percentage: number; available: number; total: number } => {
    const kategori = inspeksi.kategoriKendaraan;
    const dataKhusus = inspeksi.dataKhusus || (typeof inspeksi.kelengkapanKendaraan === 'object' ? { kelengkapanKendaraan: inspeksi.kelengkapanKendaraan } : {});
    
    // Ambil kelengkapan sarana dan kendaraan dari dataKhusus atau langsung dari field
    const kelengkapanSarana: Record<string, KelengkapanItem> = dataKhusus.kelengkapanSarana || {};
    const kelengkapanKendaraan: Record<string, KelengkapanItem> = dataKhusus.kelengkapanKendaraan || inspeksi.kelengkapanKendaraan || {};
    
    // Dapatkan daftar item yang diharapkan untuk kategori ini
    const expected = kelengkapanPerKategori[kategori] || { sarana: [], kendaraan: [] };
    const totalExpected = expected.sarana.length + expected.kendaraan.length;
    
    if (totalExpected === 0) {
      return { percentage: 100, available: 0, total: 0 };
    }
    
    // Hitung berapa banyak item yang ada (ada: true)
    let availableCount = 0;
    
    // Hitung dari kelengkapan sarana
    Object.values(kelengkapanSarana).forEach((item: KelengkapanItem) => {
      if (item?.ada === true) {
        availableCount++;
      }
    });
    
    // Hitung dari kelengkapan kendaraan
    Object.values(kelengkapanKendaraan).forEach((item: KelengkapanItem) => {
      if (item?.ada === true) {
        availableCount++;
      }
    });
    
    const percentage = Math.round((availableCount / totalExpected) * 100);
    return { percentage, available: availableCount, total: totalExpected };
  };

  // Fungsi untuk mendapatkan status kelengkapan berdasarkan persentase
  const getKelengkapanStatus = (inspeksi: Inspeksi): { status: KelengkapanStatus; percentage: number; label: string; color: string; bgColor: string } => {
    const { percentage } = calculateKelengkapanPercentage(inspeksi);
    
    if (percentage >= 90) {
      return { 
        status: "sempurna", 
        percentage, 
        label: "Lengkap", 
        color: "text-green-700", 
        bgColor: "bg-green-100" 
      };
    } else if (percentage >= 60) {
      return { 
        status: "cukup", 
        percentage, 
        label: "Cukup Lengkap", 
        color: "text-yellow-700", 
        bgColor: "bg-yellow-100" 
      };
    } else {
      return { 
        status: "tidak_lengkap", 
        percentage, 
        label: "Tidak Lengkap", 
        color: "text-red-700", 
        bgColor: "bg-red-100" 
      };
    }
  };

  const sigCanvas = useRef<SignatureCanvas>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "warning" | "info" = "success") => {
    setToast({ message, type });
  };

  const fetchInspeksi = async () => {
    try {
      setLoading(true);
      console.log("[MANAGER OPS] Fetching inspeksi data...");
      
      // Optimasi: Fetch hanya data yang diperlukan dengan limit
      const response = await fetch("/api/inspeksi?limit=50", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      
      if (!response.ok) {
        console.error(`[MANAGER OPS] HTTP ${response.status}: ${response.statusText}`);
        setInspeksiList([]);
        setApprovedList([]);
        return;
      }
      
      const result = await response.json();
      console.log("[MANAGER OPS] Fetched data:", result);
      
      // Handle both old and new response format
      const data = result.data || result;
      
      if (!Array.isArray(data)) {
        console.error("[MANAGER OPS] Invalid data format: expected array");
        setInspeksiList([]);
        setApprovedList([]);
        setRejectedList([]);
        return;
      }
      
      const pending = data.filter(
        (item: Inspeksi) => item.status === "APPROVED_BY_TRAFFIC"
      );
      const approved = data.filter(
        (item: Inspeksi) => item.status === "APPROVED_BY_OPERATIONAL"
      );
      const rejected = data.filter(
        (item: Inspeksi) => item.status === "REJECTED" && item.rejectedBy === "OPERATIONAL"
      );
      
      console.log("[MANAGER OPS] Pending count:", pending.length);
      console.log("[MANAGER OPS] Approved count:", approved.length);
      console.log("[MANAGER OPS] Rejected count:", rejected.length);
      
      setInspeksiList(pending);
      setApprovedList(approved);
      setRejectedList(rejected);
      
      // Hitung statistik penolakan
      calculateRejectionStats(rejected);
    } catch (error) {
      console.error("[MANAGER OPS] Error fetching inspeksi:", error);
      setInspeksiList([]);
      setApprovedList([]);
      setRejectedList([]);
      
      // Retry once after cache error
      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        console.log("[MANAGER OPS] Retrying fetch after cache error...");
        setTimeout(() => {
          fetchInspeksi();
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mengekstrak kategori alasan dari rejectionNote
  const extractReasonCategory = (rejectionNote: string | null | undefined): string => {
    if (!rejectionNote) return "Tidak diketahui";
    
    // Mapping dari ID alasan ke label yang lebih pendek untuk chart
    const reasonMapping: { [key: string]: string } = {
      "perlengkapan tidak lengkap": "Perlengkapan",
      "dokumen petugas kadaluarsa": "Dok. Petugas Kadaluarsa",
      "dokumen kendaraan tidak lengkap": "Dok. Kendaraan Tidak Lengkap",
      "dokumen kendaraan kadaluarsa": "Dok. Kendaraan Kadaluarsa",
      "foto tidak jelas": "Foto Tidak Jelas",
      "data tidak sesuai": "Data Tidak Sesuai",
      "informasi inspeksi tidak lengkap": "Info Tidak Lengkap",
      "format pengisian salah": "Format Salah",
      "lainnya": "Lainnya",
    };
    
    const noteLower = rejectionNote.toLowerCase();
    for (const [key, value] of Object.entries(reasonMapping)) {
      if (noteLower.includes(key)) {
        return value;
      }
    }
    
    return "Lainnya";
  };

  // Fungsi untuk menghitung statistik penolakan
  const calculateRejectionStats = (rejectedData: Inspeksi[]) => {
    const byReason: { [key: string]: number } = {};
    const byKategori: { [key: string]: number } = {};
    
    rejectedData.forEach((item) => {
      // Count by reason
      const reason = extractReasonCategory(item.rejectionNote);
      byReason[reason] = (byReason[reason] || 0) + 1;
      
      // Count by kategori kendaraan
      const kategori = item.kategoriKendaraan || "Unknown";
      byKategori[kategori] = (byKategori[kategori] || 0) + 1;
    });
    
    setRejectionStats({
      total: rejectedData.length,
      byReason,
      byKategori,
    });
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchInspeksi();
    }
  }, [status]);

  const handleOpenSignature = async (inspeksi: Inspeksi, viewOnly: boolean = false) => {
    setSelectedInspeksi(inspeksi);
    setViewOnlyMode(viewOnly);
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
    setViewOnlyMode(false);
    setShowRejectModal(false);
    setRejectionNote("");
    setSelectedRejectionReason("");
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };

  const handleOpenRejectModal = () => {
    setShowRejectModal(true);
  };

  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
    setRejectionNote("");
    setSelectedRejectionReason("");
  };

  const handleRejectInspeksi = async () => {
    if (!selectedInspeksi) {
      console.error("[MANAGER OPS] Missing selectedInspeksi");
      return;
    }

    if (!selectedRejectionReason) {
      showToast("Mohon pilih alasan penolakan", "warning");
      return;
    }

    // Jika pilih "lainnya", wajib isi komentar
    if (selectedRejectionReason === "lainnya" && !rejectionNote.trim()) {
      showToast("Mohon isi komentar untuk alasan penolakan", "warning");
      return;
    }

    // Gabungkan alasan + komentar
    const selectedReasonLabel = rejectionReasons.find(r => r.id === selectedRejectionReason)?.label || selectedRejectionReason;
    const fullRejectionNote = rejectionNote.trim() 
      ? `${selectedReasonLabel}: ${rejectionNote.trim()}`
      : selectedReasonLabel;

    try {
      console.log("[MANAGER OPS] Starting rejection process for:", selectedInspeksi.id);
      setRejecting(true);

      console.log("[MANAGER OPS] Sending rejection request to API...");
      const response = await fetch(`/api/inspeksi/${selectedInspeksi.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject_operational",
          rejectionNote: fullRejectionNote,
        }),
      });

      console.log("[MANAGER OPS] API Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[MANAGER OPS] API Error Response:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("[MANAGER OPS] API Response data:", data);

      if (data.success) {
        console.log("[MANAGER OPS] Rejection successful!");
        showToast("Laporan berhasil ditolak! Email notifikasi telah dikirim ke petugas", "success");
        
        // Close modal first
        handleCloseSignature();
        
        // Then refresh data
        console.log("[MANAGER OPS] Refreshing data...");
        await fetchInspeksi();
        console.log("[MANAGER OPS] Data refreshed successfully");
      } else {
        throw new Error(data.error || data.message || "Gagal menolak laporan");
      }
    } catch (error) {
      console.error("[MANAGER OPS] Error rejecting inspeksi:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      showToast(`Terjadi kesalahan: ${errorMessage}`, "error");
    } finally {
      console.log("[MANAGER OPS] Rejection process finished");
      setRejecting(false);
    }
  };

  const handleClearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };

  const handleApproveWithSignature = async () => {
    if (!selectedInspeksi || !sigCanvas.current) {
      console.error("[MANAGER OPS] Missing selectedInspeksi or sigCanvas");
      return;
    }

    if (sigCanvas.current.isEmpty()) {
      showToast("Mohon buat tanda tangan terlebih dahulu", "warning");
      return;
    }

    try {
      console.log("[MANAGER OPS] Starting approval process for:", selectedInspeksi.id);
      setSigning(true);
      const signatureData = sigCanvas.current.toDataURL();
      console.log("[MANAGER OPS] Signature data captured, length:", signatureData.length);
      
      console.log("[MANAGER OPS] Processing signature...");
      // Process signature for database storage
      const ttdManagerOperasionalUploaded = await uploadSignatureToMinio(signatureData, 'ttd-manager-operational');
      console.log("[MANAGER OPS] Signature processed successfully:", ttdManagerOperasionalUploaded);

      console.log("[MANAGER OPS] Sending approval request to API...");
      const response = await fetch(`/api/inspeksi/${selectedInspeksi.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve_operational",
          ttdManagerOperasional: ttdManagerOperasionalUploaded,
        }),
      });

      console.log("[MANAGER OPS] API Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[MANAGER OPS] API Error Response:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("[MANAGER OPS] API Response data:", data);

      if (data.success) {
        console.log("[MANAGER OPS] Approval successful!");
        showToast("Laporan berhasil di-ACC! Inspeksi selesai disetujui", "success");
        
        // Close modal first
        handleCloseSignature();
        
        // Then refresh data
        console.log("[MANAGER OPS] Refreshing data...");
        await fetchInspeksi();
        console.log("[MANAGER OPS] Data refreshed successfully");
      } else {
        throw new Error(data.error || data.message || "Gagal menyetujui laporan");
      }
    } catch (error) {
      console.error("[MANAGER OPS] Error approving inspeksi:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      showToast(`Terjadi kesalahan: ${errorMessage}`, "error");
    } finally {
      console.log("[MANAGER OPS] Approval process finished");
      setSigning(false);
    }
  };

  const stats = {
    total: inspeksiList.length + approvedList.length + rejectedList.length,
    pending: inspeksiList.length,
    approved: approvedList.length,
    rejected: rejectedList.length,
  };

  // Hitung statistik kelengkapan dari semua pending inspeksi
  const kelengkapanStats = {
    sempurna: inspeksiList.filter(item => getKelengkapanStatus(item).status === "sempurna").length,
    cukup: inspeksiList.filter(item => getKelengkapanStatus(item).status === "cukup").length,
    tidak_lengkap: inspeksiList.filter(item => getKelengkapanStatus(item).status === "tidak_lengkap").length,
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

    // Filter berdasarkan kelengkapan
    if (kelengkapanFilter !== "ALL") {
      filtered = filtered.filter((item) => {
        const { status } = getKelengkapanStatus(item);
        return status === kelengkapanFilter;
      });
    }
    
    return filtered;
  };

  // Filter khusus untuk rejected list dengan filter alasan
  const getFilteredRejectedList = () => {
    let filtered = getFilteredList(rejectedList);
    
    if (rejectionReasonFilter !== "ALL") {
      filtered = filtered.filter((item) => {
        const reason = extractReasonCategory(item.rejectionNote);
        return reason === rejectionReasonFilter;
      });
    }
    
    return filtered;
  };

  const filteredPendingList = getFilteredList(inspeksiList);
  const filteredApprovedList = getFilteredList(approvedList);
  const filteredRejectedList = getFilteredRejectedList();

  // Warna untuk chart pie
  const chartColors = [
    "#EF4444", // red
    "#F97316", // orange
    "#EAB308", // yellow
    "#22C55E", // green
    "#06B6D4", // cyan
    "#3B82F6", // blue
    "#8B5CF6", // violet
    "#EC4899", // pink
    "#6B7280", // gray
  ];

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Dashboard Manager Operational
              </h2>
              <p className="text-gray-600">
                Selamat datang, <span className="font-semibold text-blue-600">{session?.user?.name}</span>!
              </p>
            </div>
            <a
              href="/dashboard/manager-operational/rekap"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Lihat Rekap Laporan
            </a>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <p className="text-gray-800 text-sm font-semibold mb-1">Ditolak</p>
                <p className="text-4xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="w-14 h-14 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

        {/* Statistik Kelengkapan - Hanya tampil jika tab pending aktif dan ada data pending */}
        {activeTab === "pending" && stats.pending > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Statistik Kelengkapan Laporan Menunggu
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {/* Lengkap */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-green-700">Lengkap (≥90%)</p>
                    <p className="text-2xl font-bold text-green-600">{kelengkapanStats.sempurna}</p>
                  </div>
                </div>
              </div>
              {/* Cukup Lengkap */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-yellow-700">Cukup (60-89%)</p>
                    <p className="text-2xl font-bold text-yellow-600">{kelengkapanStats.cukup}</p>
                  </div>
                </div>
              </div>
              {/* Tidak Lengkap */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-700">Tidak Lengkap (&lt;60%)</p>
                    <p className="text-2xl font-bold text-red-600">{kelengkapanStats.tidak_lengkap}</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Progress Bar */}
            {stats.pending > 0 && (
              <div className="mt-4">
                <div className="flex h-3 rounded-full overflow-hidden bg-gray-200">
                  <div 
                    className="bg-green-500" 
                    style={{ width: `${(kelengkapanStats.sempurna / stats.pending) * 100}%` }}
                    title={`Lengkap: ${kelengkapanStats.sempurna}`}
                  />
                  <div 
                    className="bg-yellow-400" 
                    style={{ width: `${(kelengkapanStats.cukup / stats.pending) * 100}%` }}
                    title={`Cukup: ${kelengkapanStats.cukup}`}
                  />
                  <div 
                    className="bg-red-500" 
                    style={{ width: `${(kelengkapanStats.tidak_lengkap / stats.pending) * 100}%` }}
                    title={`Tidak Lengkap: ${kelengkapanStats.tidak_lengkap}`}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Lengkap: {stats.pending > 0 ? ((kelengkapanStats.sempurna / stats.pending) * 100).toFixed(0) : 0}%</span>
                  <span>Cukup: {stats.pending > 0 ? ((kelengkapanStats.cukup / stats.pending) * 100).toFixed(0) : 0}%</span>
                  <span>Tidak Lengkap: {stats.pending > 0 ? ((kelengkapanStats.tidak_lengkap / stats.pending) * 100).toFixed(0) : 0}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Diagram Penolakan - Hanya tampil jika tab rejected aktif dan ada data rejected */}
        {activeTab === "rejected" && stats.rejected > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart Alasan Penolakan */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                Diagram Alasan Penolakan
              </h3>
              
              {/* Simple Pie Chart using CSS */}
              <div className="flex flex-col items-center">
                <div className="relative w-48 h-48 mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {(() => {
                      const entries = Object.entries(rejectionStats.byReason);
                      let cumulativePercent = 0;
                      
                      return entries.map(([reason, count], index) => {
                        const percent = (count / rejectionStats.total) * 100;
                        const startPercent = cumulativePercent;
                        cumulativePercent += percent;
                        
                        // Calculate stroke-dasharray and stroke-dashoffset for pie segments
                        const circumference = 2 * Math.PI * 40; // radius = 40
                        const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -((startPercent / 100) * circumference);
                        
                        return (
                          <circle
                            key={reason}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke={chartColors[index % chartColors.length]}
                            strokeWidth="20"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-500"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{rejectionStats.total}</p>
                      <p className="text-xs text-gray-600">Total</p>
                    </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="w-full space-y-2">
                  {Object.entries(rejectionStats.byReason).map(([reason, count], index) => (
                    <div key={reason} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: chartColors[index % chartColors.length] }}
                        />
                        <span className="text-gray-700">{reason}</span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {count} ({((count / rejectionStats.total) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart Kategori Kendaraan yang Ditolak */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Penolakan per Kategori Kendaraan
              </h3>
              
              {/* Bar Chart */}
              <div className="space-y-4">
                {Object.entries(rejectionStats.byKategori).map(([kategori, count], index) => {
                  const maxCount = Math.max(...Object.values(rejectionStats.byKategori));
                  const percentage = (count / maxCount) * 100;
                  
                  return (
                    <div key={kategori}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{kategori}</span>
                        <span className="text-sm font-bold text-gray-900">{count} penolakan</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="h-4 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: chartColors[index % chartColors.length]
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Summary */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Kategori dengan penolakan terbanyak:{" "}
                  <span className="font-bold text-red-600">
                    {Object.entries(rejectionStats.byKategori).sort((a, b) => b[1] - a[1])[0]?.[0] || "-"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Tabs Navigation - Dipindah ke atas */}
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
            <button
              onClick={() => setActiveTab("rejected")}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors duration-200 ${
                activeTab === "rejected"
                  ? "bg-red-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Riwayat Ditolak ({stats.rejected})
            </button>
          </div>

          {/* Filter Section - Dipindah ke bawah tabs */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter & Pencarian
              </h3>
            </div>
            
            <div className={`grid grid-cols-1 ${activeTab === "rejected" ? "md:grid-cols-4" : "md:grid-cols-3"} gap-4`}>
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
                  Filter Kategori Kendaraan
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

              {/* Filter Kelengkapan Laporan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Filter Kelengkapan
                </label>
                <select
                  value={kelengkapanFilter}
                  onChange={(e) => setKelengkapanFilter(e.target.value as "ALL" | KelengkapanStatus)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors duration-200 text-gray-900 font-medium"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="sempurna">✓ Lengkap (≥90%)</option>
                  <option value="cukup">◐ Cukup Lengkap (60-89%)</option>
                  <option value="tidak_lengkap">✗ Tidak Lengkap (&lt;60%)</option>
                </select>
              </div>

              {/* Filter Alasan Penolakan - hanya tampil di tab rejected */}
              {activeTab === "rejected" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Filter Alasan Penolakan
                  </label>
                  <select
                    value={rejectionReasonFilter}
                    onChange={(e) => setRejectionReasonFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors duration-200 text-gray-900 font-medium bg-red-50"
                  >
                    <option value="ALL">Semua Alasan</option>
                    <option value="Perlengkapan">Perlengkapan tidak lengkap</option>
                    <option value="Dok. Petugas Kadaluarsa">Dokumen petugas kadaluarsa</option>
                    <option value="Dok. Kendaraan Tidak Lengkap">Dokumen kendaraan tidak lengkap</option>
                    <option value="Dok. Kendaraan Kadaluarsa">Dokumen kendaraan kadaluarsa</option>
                    <option value="Foto Tidak Jelas">Foto tidak jelas/buram</option>
                    <option value="Data Tidak Sesuai">Data tidak sesuai dengan foto</option>
                    <option value="Info Tidak Lengkap">Informasi tidak lengkap</option>
                    <option value="Format Salah">Format pengisian salah</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="mt-3 text-sm text-gray-600">
              Menampilkan <span className="font-bold text-blue-600">
                {activeTab === "pending" 
                  ? filteredPendingList.length 
                  : activeTab === "approved" 
                    ? filteredApprovedList.length 
                    : filteredRejectedList.length}
              </span> dari{" "}
              <span className="font-bold">
                {activeTab === "pending" 
                  ? inspeksiList.length 
                  : activeTab === "approved" 
                    ? approvedList.length 
                    : rejectedList.length}
              </span> laporan
            </div>
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
                  {filteredPendingList.map((inspeksi) => {
                    const kelengkapanInfo = getKelengkapanStatus(inspeksi);
                    return (
                    <div
                      key={inspeksi.id}
                      className="border border-gray-200 rounded-lg p-5 transition-colors duration-200 bg-white"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg">
                              {inspeksi.kategoriKendaraan}
                            </span>
                            <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-lg">
                              Disetujui Manager Traffic
                            </span>
                            {/* Badge Status Kelengkapan */}
                            <span className={`px-3 py-1 ${kelengkapanInfo.bgColor} ${kelengkapanInfo.color} text-xs font-semibold rounded-lg flex items-center gap-1`}>
                              {kelengkapanInfo.status === "sempurna" && (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              {kelengkapanInfo.status === "cukup" && (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                                </svg>
                              )}
                              {kelengkapanInfo.status === "tidak_lengkap" && (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                              {kelengkapanInfo.label} ({kelengkapanInfo.percentage}%)
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
                            {inspeksi.approvedAtTraffic && (
                              <p className="flex items-center gap-2">
                                <span className="font-semibold">Disetujui Traffic:</span>
                                {new Date(inspeksi.approvedAtTraffic).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
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
                  );
                  })}
                </div>
              )
            ) : activeTab === "approved" ? (
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
                  {filteredApprovedList.map((inspeksi) => {
                    const kelengkapanInfo = getKelengkapanStatus(inspeksi);
                    return (
                    <div
                      key={inspeksi.id}
                      className="border border-green-200 rounded-lg p-5 bg-green-50 transition-colors duration-200"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg">
                              {inspeksi.kategoriKendaraan}
                            </span>
                            <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-lg">
                              Approved
                            </span>
                            {/* Badge Status Kelengkapan */}
                            <span className={`px-3 py-1 ${kelengkapanInfo.bgColor} ${kelengkapanInfo.color} text-xs font-semibold rounded-lg flex items-center gap-1`}>
                              {kelengkapanInfo.status === "sempurna" && (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              {kelengkapanInfo.status === "cukup" && (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                                </svg>
                              )}
                              {kelengkapanInfo.status === "tidak_lengkap" && (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                              {kelengkapanInfo.label} ({kelengkapanInfo.percentage}%)
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-900 text-lg mb-2">
                            {inspeksi.nomorKendaraan} - {inspeksi.lokasiInspeksi}
                          </h4>
                          <div className="text-sm text-gray-700 space-y-1">
                            <p className="flex items-center gap-2">
                              <span className="font-semibold">Petugas:</span>
                              {inspeksi.namaPetugas} ({inspeksi.nipPetugas})
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="font-semibold">Inspeksi:</span>
                              {new Date(inspeksi.tanggalInspeksi).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                            {inspeksi.approvedAtTraffic && (
                              <p className="flex items-center gap-2">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-semibold">Approved Traffic:</span>
                                {new Date(inspeksi.approvedAtTraffic).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </p>
                            )}
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
                  );
                  })}
                </div>
              )
            ) : activeTab === "rejected" ? (
              /* Tab Riwayat Ditolak */
              filteredRejectedList.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 font-medium">
                    {rejectedList.length === 0 
                      ? "Belum ada laporan yang ditolak" 
                      : "Tidak ada laporan sesuai filter"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRejectedList.map((inspeksi) => {
                    const kelengkapanInfo = getKelengkapanStatus(inspeksi);
                    return (
                    <div
                      key={inspeksi.id}
                      className="border-2 border-red-200 rounded-lg p-5 bg-red-50 transition-colors duration-200"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg">
                              {inspeksi.kategoriKendaraan}
                            </span>
                            <span className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Ditolak
                            </span>
                            {/* Badge Status Kelengkapan */}
                            <span className={`px-3 py-1 ${kelengkapanInfo.bgColor} ${kelengkapanInfo.color} text-xs font-semibold rounded-lg flex items-center gap-1`}>
                              {kelengkapanInfo.status === "sempurna" && (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              {kelengkapanInfo.status === "cukup" && (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                                </svg>
                              )}
                              {kelengkapanInfo.status === "tidak_lengkap" && (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                              {kelengkapanInfo.label} ({kelengkapanInfo.percentage}%)
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-900 text-lg mb-2">
                            {inspeksi.nomorKendaraan} - {inspeksi.lokasiInspeksi}
                          </h4>
                          <div className="text-sm text-gray-700 space-y-1">
                            <p className="flex items-center gap-2">
                              <span className="font-semibold">Petugas:</span>
                              {inspeksi.namaPetugas} ({inspeksi.nipPetugas})
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="font-semibold">Tanggal Inspeksi:</span>
                              {new Date(inspeksi.tanggalInspeksi).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                            {inspeksi.rejectedAt && (
                              <p className="flex items-center gap-2 text-red-700">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-semibold">Ditolak:</span>
                                {new Date(inspeksi.rejectedAt).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                          </div>
                          
                          {/* Alasan Penolakan */}
                          {inspeksi.rejectionNote && (
                            <div className="mt-3 p-3 bg-white border border-red-200 rounded-lg">
                              <p className="text-sm font-semibold text-red-800 mb-1 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Alasan Penolakan:
                              </p>
                              <p className="text-sm text-red-700">{inspeksi.rejectionNote}</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <button
                            onClick={() => handleOpenSignature(inspeksi, true)}
                            className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold text-sm shadow-sm flex items-center gap-2"
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
                  );
                  })}
                </div>
              )
            ) : null}
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && selectedInspeksi && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-6xl w-full my-8">
            <div className="px-6 py-5 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-md z-10 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview & Tanda Tangan Manager Operational
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Inspeksi: {selectedInspeksi?.nomorKendaraan} - {selectedInspeksi?.kategoriKendaraan}
              </p>
            </div>
            
            <div className="max-h-[calc(90vh-200px)] overflow-y-auto">
              {loadingDetail ? (
                <div className="text-center py-16">
                  <div className="inline-block animate-spin rounded-full h-14 w-14 border-b-4 border-blue-600"></div>
                  <p className="text-gray-800 mt-4 font-bold">Memuat detail laporan...</p>
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

                  {/* Tanda Tangan Manager Traffic */}
                  {inspeksiDetail.ttdManagerTraffic && (
                    <div className="bg-green-50 border-2 border-green-500 rounded-xl p-5 mb-6">
                      <h5 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Disetujui Manager Traffic
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

                  {/* Form Tanda Tangan Manager Operational - Hanya tampil jika bukan view-only */}
                  {!viewOnlyMode && (
                    <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-6">
                      <h5 className="font-bold text-blue-700 mb-4 flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Tanda Tangan Manager Operational
                      </h5>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Tanda Tangan Digital
                        </label>
                        <div className="border-2 border-gray-300 rounded-xl bg-white shadow-sm">
                          <SignatureCanvas
                            ref={sigCanvas}
                            canvasProps={{
                              className: "w-full h-64 rounded-xl",
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-2 font-medium">
                          Gunakan mouse atau touchscreen untuk menandatangani
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Info jika sudah approved (view-only mode) */}
                  {viewOnlyMode && inspeksiDetail.status === "APPROVED_BY_OPERATIONAL" && inspeksiDetail.ttdManagerOperasional && (
                    <div className="bg-green-50 border-2 border-green-500 rounded-xl p-5">
                      <h5 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Sudah Disetujui Manager Operational
                      </h5>
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 font-medium">
                            <strong>Tanggal Approval:</strong>{" "}
                            {inspeksiDetail.approvedAtOperational && new Date(inspeksiDetail.approvedAtOperational).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="text-sm text-green-600 font-semibold mt-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Inspeksi ini sudah final dan tidak bisa diubah
                          </p>
                        </div>
                        <div className="border-2 border-green-400 rounded-lg p-3 bg-white shadow-sm">
                          <img 
                            src={inspeksiDetail.ttdManagerOperasional} 
                            alt="TTD Manager Ops" 
                            className="w-48 h-24 object-contain"
                          />
                          <p className="text-xs text-center text-gray-800 mt-2 font-semibold">Tanda Tangan Manager Operational</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-gray-800 font-bold">Gagal memuat detail laporan</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/95 backdrop-blur-md flex gap-3 justify-end sticky bottom-0 rounded-b-2xl">
              {!viewOnlyMode && (
                <>
                  <button
                    onClick={handleClearSignature}
                    className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold shadow-sm flex items-center gap-2"
                    disabled={signing || rejecting}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Hapus TTD
                  </button>
                  <button
                    onClick={handleOpenRejectModal}
                    className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold shadow-sm flex items-center gap-2"
                    disabled={signing || rejecting}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Tolak Laporan
                  </button>
                  <button
                    onClick={handleCloseSignature}
                    className="px-5 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-semibold shadow-sm flex items-center gap-2"
                    disabled={signing || rejecting}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Batal
                  </button>
                  <button
                    onClick={handleApproveWithSignature}
                    disabled={signing || loadingDetail || rejecting}
                    className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

      {/* Modal Reject */}
      {showRejectModal && selectedInspeksi && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col my-4">
            <div className="px-6 py-5 border-b border-gray-200 bg-red-50/95 backdrop-blur-md rounded-t-2xl flex-shrink-0">
              <h3 className="text-xl font-bold text-red-900 flex items-center gap-2">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tolak Laporan Inspeksi
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Inspeksi: {selectedInspeksi?.nomorKendaraan} - {selectedInspeksi?.kategoriKendaraan}
              </p>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {/* Pilihan Alasan Penolakan */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Pilih Alasan Penolakan <span className="text-red-600">*</span>
                </label>
                <div className="space-y-2">
                  {rejectionReasons.map((reason) => (
                    <label
                      key={reason.id}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedRejectionReason === reason.id
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="rejectionReason"
                        value={reason.id}
                        checked={selectedRejectionReason === reason.id}
                        onChange={(e) => setSelectedRejectionReason(e.target.value)}
                        disabled={rejecting}
                        className="w-4 h-4 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-gray-800 font-medium">{reason.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Komentar Tambahan */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Komentar Tambahan {selectedRejectionReason === "lainnya" && <span className="text-red-600">*</span>}
                </label>
                <textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder={selectedRejectionReason === "lainnya" 
                    ? "Jelaskan alasan penolakan secara detail..." 
                    : "Tambahkan detail atau instruksi perbaikan (opsional)..."}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none placeholder:text-gray-700 placeholder:font-medium text-gray-900 font-medium"
                  rows={4}
                  disabled={rejecting}
                />
                <p className="text-xs text-gray-700 mt-2 font-medium">
                  {selectedRejectionReason === "lainnya" 
                    ? "Wajib diisi jika memilih alasan 'Lainnya'"
                    : "Berikan penjelasan tambahan agar petugas dapat memperbaiki laporan"}
                </p>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                <p className="text-sm text-yellow-900 font-medium flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>
                    Laporan yang ditolak akan dikembalikan ke petugas untuk diperbaiki. 
                    Pastikan alasan penolakan sudah jelas dan spesifik.
                  </span>
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/95 backdrop-blur-md flex gap-3 justify-end rounded-b-2xl flex-shrink-0">
              <button
                onClick={handleCloseRejectModal}
                className="px-5 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-semibold shadow-sm flex items-center gap-2"
                disabled={rejecting}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Batal
              </button>
              <button
                onClick={handleRejectInspeksi}
                disabled={rejecting || !selectedRejectionReason || (selectedRejectionReason === "lainnya" && !rejectionNote.trim())}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {rejecting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menolak...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Tolak Laporan
                  </>
                )}
              </button>
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




