"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import * as XLSX from 'xlsx';

interface InspeksiItem {
  id: string;
  kategoriKendaraan: string;
  nomorKendaraan: string;
  tanggalInspeksi: string;
  namaPetugas: string;
  pdfUrl: string | null;
  approvedAtOperational: string;
}

export default function RekapAccPage() {
  const { data: session } = useSession();
  const [inspeksi, setInspeksi] = useState<InspeksiItem[]>([]);
  const [filteredInspeksi, setFilteredInspeksi] = useState<InspeksiItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [kategoriFilter, setKategoriFilter] = useState<string>("ALL");
  const [customDateFrom, setCustomDateFrom] = useState<string>("");
  const [customDateTo, setCustomDateTo] = useState<string>("");

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
      "Petugas": item.namaPetugas,
      "Status": "APPROVED",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap ACC");
    
    const fileName = `Rekap_Inspeksi_ACC_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/petugas-lapangan">
          <button className="mb-4 px-4 py-2 text-blue-700 hover:text-blue-800 font-medium flex items-center gap-2">
            ← Kembali ke Dashboard
          </button>
        </Link>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-blue-600 bg-clip-text text-transparent mb-2">
          📊 Rekap Hasil ACC
        </h2>
        <p className="text-gray-600">
          Daftar inspeksi yang telah disetujui oleh Manager Traffic & Manager Operasional
        </p>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-bold text-gray-800 mb-4">🔍 Filter Data</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Period Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Periode
            </label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              🚗 Kategori Kendaraan
            </label>
            <select
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value)}
              className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Export Button */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            📊 Menampilkan <span className="font-bold text-green-700">{filteredInspeksi.length}</span> dari{" "}
            <span className="font-bold">{inspeksi.length}</span> total inspeksi ACC
          </p>
          <button
            onClick={exportToExcel}
            disabled={filteredInspeksi.length === 0}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            📥 Export to Excel
          </button>
        </div>
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto"></div>
          <p className="text-gray-500 mt-4">Memuat data...</p>
        </div>
      ) : filteredInspeksi.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-600 font-medium">Tidak ada data inspeksi ACC</p>
          <p className="text-sm text-gray-500 mt-2">
            {periodFilter !== "all" || kategoriFilter !== "ALL"
              ? "Coba ubah filter untuk melihat data lainnya"
              : "Belum ada inspeksi yang disetujui"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-green-600 to-blue-600">
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
                    Petugas
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
                  <tr key={item.id} className="hover:bg-green-50 transition">
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
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getKategoriIcon(item.kategoriKendaraan)}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {item.kategoriKendaraan}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.nomorKendaraan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.namaPetugas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        ✓ APPROVED
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/dashboard/petugas-lapangan/inspeksi/${item.id}`}>
                          <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition text-xs">
                            👁️ Detail
                          </button>
                        </Link>
                        {item.pdfUrl ? (
                          <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer">
                            <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition text-xs">
                              📄 PDF
                            </button>
                          </a>
                        ) : (
                          <button
                            disabled
                            className="px-3 py-1 bg-gray-300 text-gray-500 rounded cursor-not-allowed text-xs"
                            title="PDF belum tersedia"
                          >
                            📄 PDF
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
