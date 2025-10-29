"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import PreviewInspeksi from "@/app/components/PreviewInspeksi";
import KomentarSection from "@/app/components/KomentarSection";
import jsPDF from "jspdf";

interface Inspeksi {
  id: string;
  kategoriKendaraan: string;
  nomorKendaraan: string;
  lokasiInspeksi: string;
  tanggalInspeksi: string;
  namaPetugas: string;
  nipPetugas?: string;
  namaPetugas2?: string | null;
  nipPetugas2?: string | null;
  dataKhusus: any;
  status: string;
  ttdManagerTraffic?: string | null;
  ttdManagerOperasional?: string | null;
  approvedAtTraffic?: string | null;
  approvedAtOperational?: string | null;
  pdfUrl?: string | null;
  rejectionNote?: string | null;
  rejectedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function DetailInspeksi() {
  const params = useParams();
  const router = useRouter();
  const [inspeksi, setInspeksi] = useState<Inspeksi | null>(null);
  const [loading, setLoading] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInspeksi = async () => {
      try {
        console.log("Fetching inspeksi with ID:", params.id);
        const response = await fetch(`/api/inspeksi/${params.id}`);
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Error response:", errorData);
          throw new Error(errorData.error || "Gagal memuat data inspeksi");
        }
        
        const data = await response.json();
        console.log("Inspeksi data loaded:", data);
        setInspeksi(data);
      } catch (error: any) {
        console.error("Error fetching inspeksi:", error);
        alert(`Gagal memuat data inspeksi: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchInspeksi();
    }
  }, [params.id]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      DRAFT: { label: "💾 Draft", className: "bg-gray-100 text-gray-800 border-gray-300" },
      SUBMITTED: { label: "⏳ Menunggu Manager Traffic", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      APPROVED_BY_TRAFFIC: { label: "🔵 Menunggu Manager Operasional", className: "bg-blue-100 text-blue-800 border-blue-300" },
      APPROVED_BY_OPERATIONAL: { label: "✅ APPROVED", className: "bg-green-100 text-green-800 border-green-300" },
      REJECTED: { label: "❌ DITOLAK", className: "bg-red-100 text-red-800 border-red-300" },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const handleGeneratePDF = () => {
    if (!inspeksi) return;
    
    // Langsung trigger browser print dialog
    // User tinggal "Save as PDF" atau "Print to PDF"
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data inspeksi...</p>
        </div>
      </div>
    );
  }

  if (!inspeksi) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">Data inspeksi tidak ditemukan</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Detail Inspeksi</h1>
            <p className="text-gray-600">ID: {inspeksi.id}</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/petugas-lapangan/riwayat')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Kembali
          </button>
        </div>

        <div className="mb-6 flex items-center justify-between bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4">
            <span className="text-gray-600 font-medium">Status:</span>
            {getStatusBadge(inspeksi.status)}
          </div>
          
          {inspeksi.status === "APPROVED_BY_OPERATIONAL" && (
            <div className="flex gap-3">
              <button
                onClick={handleGeneratePDF}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                </svg>
                Print / Save as PDF
              </button>
            </div>
          )}
        </div>

        {inspeksi.status === "REJECTED" && inspeksi.rejectionNote && (
          <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-2">
                  Ditolak oleh: {inspeksi.rejectedBy === "TRAFFIC" ? "Manager Traffic" : "Manager Operasional"}
                </h3>
                <p className="text-red-800 font-medium">Alasan Penolakan:</p>
                <p className="text-red-700 mt-1 bg-white p-3 rounded border border-red-200">{inspeksi.rejectionNote}</p>
              </div>
            </div>
          </div>
        )}

        <div ref={previewRef} id="preview-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <PreviewInspeksi inspeksi={inspeksi} />
        </div>

        {/* Bagian Komunikasi/Komentar */}
        <div className="mt-6">
          <KomentarSection inspeksiId={inspeksi.id} />
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Dibuat:</span> {new Date(inspeksi.createdAt).toLocaleString('id-ID')}
            </div>
            <div>
              <span className="font-medium">Terakhir diupdate:</span> {new Date(inspeksi.updatedAt).toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
