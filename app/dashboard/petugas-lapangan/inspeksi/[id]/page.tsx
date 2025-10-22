"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PreviewInspeksi from "@/app/components/PreviewInspeksi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [generatingPDF, setGeneratingPDF] = useState(false);

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

  const handleGeneratePDF = async () => {
    if (!inspeksi) return;
    
    try {
      setGeneratingPDF(true);
      
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const dataKhusus = inspeksi.dataKhusus || {};
      const kelengkapanSarana = dataKhusus.kelengkapanSarana || {};
      const kelengkapanKendaraan = dataKhusus.kelengkapanKendaraan || {};
      
      // Helper untuk kelengkapan list
      const getKelengkapanList = (kategori: string, type: 'sarana' | 'kendaraan'): string[] => {
        const lists: Record<string, { sarana: string[], kendaraan: string[] }> = {
          DEREK: {
            sarana: ["Towing Hook/Pengait Derek", "Winch/Kerekan", "Sling/Belt Derek", "Wheel Lift System", "Safety Chain/Rantai Pengaman", "Lampu Rotator Kuning", "Rambu Peringatan (Traffic Cone)", "Radio Komunikasi (HT)", "Alat Pemadam Api Ringan (APAR)", "Toolkit Derek Lengkap"],
            kendaraan: ["STNK (Asli & Fotokopi)", "KIR Kendaraan", "Surat Izin Operasional", "Buku Panduan Kendaraan", "Ban Serep", "Dongkrak & Kunci Roda", "Segitiga Pengaman", "Kotak P3K", "Toolkit/Perkakas Dasar", "Dokumentasi Inspeksi Sebelumnya"]
          },
          PLAZA: {
            sarana: ["Traffic Cone (min 10 unit)", "Safety Vest", "Rambu Lalu Lintas Portable", "Lampu Rotator/Warning Light", "Radio Komunikasi (HT)", "Alat Pemadam Api Ringan (APAR)", "Pembatas Jalan (Barier)", "Megaphone/TOA", "Alat Bantu Pernafasan (Masker)", "Peralatan Kebersihan"],
            kendaraan: ["STNK (Asli & Fotokopi)", "KIR Kendaraan", "Surat Izin Operasional", "Buku Panduan Kendaraan", "Ban Serep", "Dongkrak & Kunci Roda", "Segitiga Pengaman", "Kotak P3K", "Toolkit/Perkakas Dasar", "Dokumentasi Inspeksi Sebelumnya"]
          },
          KAMTIB: {
            sarana: ["Rompi keselamatan kerja", "Sepatu Safety", "Sabuk Pentungan dll"],
            kendaraan: ["Rubber Cone", "Bendera Merah/Tongkat", "Handy Talky"]
          },
          RESCUE: {
            sarana: ["Hydraulic Rescue Tool (Jaws of Life)", "Tali Kerma/Rope Rescue", "Harness & Karabiner", "Alat Pemotong (Cutter/Saw)", "Lampu Sorot/Searchlight", "Radio Komunikasi (HT)", "Tabung Oksigen Portable", "Alat Pemadam Api Ringan (APAR)", "Stretcher/Tandu Lipat", "Life Jacket/Pelampung"],
            kendaraan: ["STNK (Asli & Fotokopi)", "KIR Kendaraan", "Surat Izin Operasional", "Buku Panduan Kendaraan", "Ban Serep", "Dongkrak & Kunci Roda", "Segitiga Pengaman", "Kotak P3K", "Toolkit/Perkakas Dasar", "Dokumentasi Inspeksi Sebelumnya"]
          }
        };
        return lists[kategori]?.[type] || [];
      };

      const saranaList = getKelengkapanList(inspeksi.kategoriKendaraan, 'sarana');
      const kendaraanList = getKelengkapanList(inspeksi.kategoriKendaraan, 'kendaraan');

      // Add logo if exists
      let yPos = 20;
      try {
        // Logo placeholder - you can add actual logo here
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("PT JASAMARGA JALANLAYANG CIKAMPEK", 105, yPos, { align: "center" });
        yPos += 7;
        doc.setFontSize(12);
        doc.text("INSPEKSI PERIODIK KENDARAAN LAYANAN OPERASI", 105, yPos, { align: "center" });
        yPos += 12;
      } catch (e) {
        console.error("Error adding header:", e);
      }

      // Info boxes
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      // Left box - Hari & Tanggal
      doc.rect(20, yPos, 85, 15);
      doc.text("HARI", 22, yPos + 5);
      doc.text(": " + new Date(inspeksi.tanggalInspeksi).toLocaleDateString('id-ID', { weekday: 'long' }), 45, yPos + 5);
      doc.text("TANGGAL", 22, yPos + 10);
      doc.text(": " + new Date(inspeksi.tanggalInspeksi).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }), 45, yPos + 10);
      
      // Right box - Unit & No Polisi
      doc.rect(105, yPos, 85, 15);
      doc.text("UNIT", 107, yPos + 5);
      doc.setFont("helvetica", "bold");
      doc.text(": " + inspeksi.kategoriKendaraan, 130, yPos + 5);
      doc.setFont("helvetica", "normal");
      doc.text("NO. POLISI", 107, yPos + 10);
      doc.setFont("helvetica", "bold");
      doc.text(": " + inspeksi.nomorKendaraan, 130, yPos + 10);
      
      yPos += 20;

      // Table 1: KELENGKAPAN PETUGAS
      const saranaRows = saranaList.map((item, idx) => {
        const status = kelengkapanSarana[item];
        const jumlah = dataKhusus.jumlahSarana?.[item] || '';
        return [
          (idx + 1).toString(),
          item,
          status ? '✓' : '',
          status === false ? '✓' : '',
          jumlah,
          status ? '✓' : '',
          '', ''
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [[
          { content: 'KELENGKAPAN PETUGAS', colSpan: 8, styles: { halign: 'left', fontStyle: 'bold', fillColor: [220, 220, 220] } }
        ], [
          'NO', 'URAIAN', 
          { content: 'STATUS', colSpan: 2 },
          'JUMLAH',
          { content: 'KONDISI', colSpan: 3 }
        ], [
          '', '',
          'ADA', 'TIDAK',
          '',
          'BAIK', 'RUSAK RINGAN', 'RUSAK BERAT'
        ]],
        body: saranaRows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.5, lineColor: [0, 0, 0], lineWidth: 0.1 },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { halign: 'left', cellWidth: 'auto' },
          2: { halign: 'center', cellWidth: 12 },
          3: { halign: 'center', cellWidth: 12 },
          4: { halign: 'center', cellWidth: 15 },
          5: { halign: 'center', cellWidth: 12 },
          6: { halign: 'center', cellWidth: 25 },
          7: { halign: 'center', cellWidth: 25 },
        },
      });

      // Table 2: KELENGKAPAN KENDARAAN
      const kendaraanRows = kendaraanList.map((item, idx) => {
        const status = kelengkapanKendaraan[item];
        const jumlah = dataKhusus.jumlahKendaraan?.[item] || '';
        return [
          (idx + 1).toString(),
          item,
          status ? '✓' : '',
          status === false ? '✓' : '',
          jumlah,
          status ? '✓' : '',
          '', ''
        ];
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 2,
        head: [[
          { content: 'KELENGKAPAN KENDARAAN', colSpan: 8, styles: { halign: 'left', fontStyle: 'bold', fillColor: [220, 220, 220] } }
        ], [
          'NO', 'URAIAN',
          { content: 'STATUS', colSpan: 2 },
          'JUMLAH',
          { content: 'KONDISI', colSpan: 3 }
        ], [
          '', '',
          'ADA', 'TIDAK',
          '',
          'BAIK', 'RUSAK RINGAN', 'RUSAK BERAT'
        ]],
        body: kendaraanRows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1.5, lineColor: [0, 0, 0], lineWidth: 0.1 },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { halign: 'left', cellWidth: 'auto' },
          2: { halign: 'center', cellWidth: 12 },
          3: { halign: 'center', cellWidth: 12 },
          4: { halign: 'center', cellWidth: 15 },
          5: { halign: 'center', cellWidth: 12 },
          6: { halign: 'center', cellWidth: 25 },
          7: { halign: 'center', cellWidth: 25 },
        },
      });

      // Masa Berlaku Dokumen Table
      const masaBerlakuData = [
        ['STNK', dataKhusus.masaBerlakuSTNK ? new Date(dataKhusus.masaBerlakuSTNK).toLocaleDateString('id-ID') : '-'],
        ['KIR', dataKhusus.masaBerlakuKIR ? new Date(dataKhusus.masaBerlakuKIR).toLocaleDateString('id-ID') : '-'],
        ['SIM Operator 1', dataKhusus.masaBerlakuSIMPetugas1 ? new Date(dataKhusus.masaBerlakuSIMPetugas1).toLocaleDateString('id-ID') : '-'],
        ['SIM Operator 2', dataKhusus.masaBerlakuSIMPetugas2 ? new Date(dataKhusus.masaBerlakuSIMPetugas2).toLocaleDateString('id-ID') : '-'],
        ['Service', dataKhusus.tanggalService ? new Date(dataKhusus.tanggalService).toLocaleDateString('id-ID') : '-'],
        ['BBM', (dataKhusus.jumlahBBM || '-') + ' BAR'],
      ];

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 2,
        head: [[{ content: 'MASA BERLAKU DOKUMEN', colSpan: 6, styles: { halign: 'center', fontStyle: 'bold', fillColor: [220, 220, 220] } }]],
        body: [masaBerlakuData.slice(0, 3), masaBerlakuData.slice(3, 6)],
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.1 },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: {
          0: { halign: 'center', cellWidth: 31.67, fontStyle: 'bold' },
          1: { halign: 'center', cellWidth: 31.67 },
          2: { halign: 'center', cellWidth: 31.67, fontStyle: 'bold' },
          3: { halign: 'center', cellWidth: 31.67 },
          4: { halign: 'center', cellWidth: 31.67, fontStyle: 'bold' },
          5: { halign: 'center', cellWidth: 31.67 },
        },
      });

      // Catatan
      if (dataKhusus.catatan) {
        yPos = (doc as any).lastAutoTable.finalY + 5;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("CATATAN:", 20, yPos);
        doc.setFont("helvetica", "normal");
        const splitCatatan = doc.splitTextToSize(dataKhusus.catatan, 170);
        doc.text(splitCatatan, 20, yPos + 5);
        yPos += splitCatatan.length * 5 + 10;
      } else {
        yPos = (doc as any).lastAutoTable.finalY + 5;
      }

      // Tanda Tangan Section
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      
      // Petugas 1
      doc.text("Petugas 1", 30, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(inspeksi.namaPetugas, 30, yPos + 5);
      if (dataKhusus.ttdPetugas1) {
        try {
          doc.addImage(dataKhusus.ttdPetugas1, "PNG", 25, yPos + 8, 40, 20);
        } catch (e) {
          console.error("Error adding ttd petugas 1:", e);
        }
      }
      
      // Petugas 2
      if (inspeksi.namaPetugas2) {
        doc.setFont("helvetica", "bold");
        doc.text("Petugas 2", 80, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(inspeksi.namaPetugas2, 80, yPos + 5);
        if (dataKhusus.ttdPetugas2) {
          try {
            doc.addImage(dataKhusus.ttdPetugas2, "PNG", 75, yPos + 8, 40, 20);
          } catch (e) {
            console.error("Error adding ttd petugas 2:", e);
          }
        }
      }
      
      // Manager Traffic
      if (inspeksi.approvedAtTraffic) {
        doc.setFont("helvetica", "bold");
        doc.text("Manager Traffic", 130, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(new Date(inspeksi.approvedAtTraffic).toLocaleDateString("id-ID"), 130, yPos + 5);
        if (inspeksi.ttdManagerTraffic) {
          try {
            doc.addImage(inspeksi.ttdManagerTraffic, "PNG", 125, yPos + 8, 40, 20);
          } catch (e) {
            console.error("Error adding ttd manager traffic:", e);
          }
        }
      }
      
      yPos += 35;
      
      // Manager Operational
      if (inspeksi.approvedAtOperational) {
        doc.setFont("helvetica", "bold");
        doc.text("Manager Operational", 130, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(new Date(inspeksi.approvedAtOperational).toLocaleDateString("id-ID"), 130, yPos + 5);
        if (inspeksi.ttdManagerOperasional) {
          try {
            doc.addImage(inspeksi.ttdManagerOperasional, "PNG", 125, yPos + 8, 40, 20);
          } catch (e) {
            console.error("Error adding ttd manager operational:", e);
          }
        }
      }
      
      // Generate PDF as data URI
      const pdfDataUri = doc.output("datauristring");
      
      // Save to database
      const response = await fetch(`/api/inspeksi/${inspeksi.id}/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfDataUri }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menyimpan PDF");
      }
      
      const data = await response.json();
      
      // Update local state
      setInspeksi({
        ...inspeksi,
        pdfUrl: data.pdfUrl,
      });
      
      alert("PDF berhasil dibuat!");
      
      // Auto download
      const link = document.createElement("a");
      link.href = pdfDataUri;
      link.download = `Inspeksi_${inspeksi.nomorKendaraan}_${new Date().getTime()}.pdf`;
      link.click();
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      alert(error.message || "Gagal membuat PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleDownloadPDF = () => {
    if (inspeksi?.pdfUrl) {
      window.open(inspeksi.pdfUrl, "_blank");
    }
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
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Detail Inspeksi</h1>
            <p className="text-gray-600">ID: {inspeksi.id}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Kembali
          </button>
        </div>

        {/* Status Badge & Actions */}
        <div className="mb-6 flex items-center justify-between bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4">
            <span className="text-gray-600 font-medium">Status:</span>
            {getStatusBadge(inspeksi.status)}
          </div>
          
          {inspeksi.status === "APPROVED_BY_OPERATIONAL" && (
            <div className="flex gap-3">
              {inspeksi.pdfUrl ? (
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download PDF
                </button>
              ) : (
                <button
                  onClick={handleGeneratePDF}
                  disabled={generatingPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingPDF ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Membuat PDF...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                      </svg>
                      Generate PDF
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Rejection Note */}
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

        {/* Preview Inspeksi */}
        <PreviewInspeksi inspeksi={inspeksi} />

        {/* Footer Info */}
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
