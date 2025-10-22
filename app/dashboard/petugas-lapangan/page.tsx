"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface InspeksiItem {
  id: string;
  kategoriKendaraan: string;
  nomorKendaraan: string;
  status: string;
  tanggalInspeksi: string;
  approvedByTraffic?: string;
  approvedByOperational?: string;
  approvedAtTraffic?: string;
  approvedAtOperational?: string;
  merkKendaraan?: string;
  lokasiInspeksi?: string;
}

export default function PetugasLapanganDashboard() {
  const { data: session } = useSession();
  const [recentInspeksi, setRecentInspeksi] = useState<InspeksiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Optimasi: Hanya muat 5 data terbaru untuk dashboard
      const response = await fetch("/api/inspeksi?limit=5");
      if (response.ok) {
        const result = await response.json();
        
        // Handle both old and new response format
        const data = result.data || result;
        setRecentInspeksi(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-red-600 bg-clip-text text-transparent mb-2">
          Dashboard Petugas Lapangan
        </h2>
        <p className="text-gray-600">Selamat datang, <span className="font-semibold text-blue-700">{session?.user?.name}</span>!</p>
      </div>

      {/* Status Laporan Inspeksi */}
      <div className="bg-white rounded-lg shadow-md border-t-4 border-blue-700">
        <div className="px-6 py-4 border-b-2 border-blue-100 bg-gradient-to-r from-blue-50 to-transparent">
          <h3 className="text-lg font-bold text-blue-700">📋 Status Laporan Inspeksi Terkini</h3>
          <p className="text-sm text-gray-600 mt-1">Status tanda tangan dari Manager Traffic & Manager Operational</p>
        </div>
        
        {loading ? (
          <div className="px-6 py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
            <p className="text-gray-500 mt-2 text-sm">Memuat data...</p>
          </div>
        ) : recentInspeksi.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-5xl mb-3">📝</div>
            <p className="text-gray-600 font-medium">Belum ada laporan inspeksi</p>
            <p className="text-sm text-gray-500 mt-1">Buat inspeksi pertama Anda untuk melihat status di sini</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentInspeksi.map((item) => (
              <div key={item.id} className="px-6 py-5 hover:bg-blue-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {item.kategoriKendaraan} - {item.nomorKendaraan}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        item.status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-800' :
                        item.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status === 'APPROVED' ? '✅ Disetujui' :
                         item.status === 'SUBMITTED' ? '⏳ Menunggu' :
                         item.status === 'REJECTED' ? '❌ Ditolak' :
                         '💾 Draft'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      {/* Manager Traffic */}
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">👔</span>
                          <p className="text-xs font-semibold text-blue-800">Manager Traffic</p>
                        </div>
                        {item.approvedByTraffic ? (
                          <div>
                            <p className="text-sm font-medium text-green-700 flex items-center gap-1">
                              <span>✓</span> Sudah ditandatangani
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {new Date(item.approvedAtTraffic!).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <span>⏳</span> Belum ditandatangani
                          </p>
                        )}
                      </div>

                      {/* Manager Operational */}
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">👔</span>
                          <p className="text-xs font-semibold text-purple-800">Manager Operational</p>
                        </div>
                        {item.approvedByOperational ? (
                          <div>
                            <p className="text-sm font-medium text-green-700 flex items-center gap-1">
                              <span>✓</span> Sudah ditandatangani
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {new Date(item.approvedAtOperational!).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <span>⏳</span> Belum ditandatangani
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                      📅 Inspeksi: {new Date(item.tanggalInspeksi).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  
                  <Link href={`/dashboard/petugas-lapangan/inspeksi/${item.id}`}>
                    <button className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium">
                      Detail
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Link href="/dashboard/petugas-lapangan/rekap-acc">
          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition cursor-pointer transform hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-lg">Rekap Hasil ACC</h3>
              <span className="text-4xl">📊</span>
            </div>
            <p className="text-green-100 text-sm">Lihat & download PDF inspeksi yang sudah ACC</p>
          </div>
        </Link>

        <Link href="/dashboard/petugas-lapangan/inspeksi">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition cursor-pointer transform hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-lg">Inspeksi Baru</h3>
              <span className="text-4xl">➕</span>
            </div>
            <p className="text-blue-100 text-sm">Buat laporan inspeksi kendaraan baru</p>
          </div>
        </Link>

        <Link href="/dashboard/petugas-lapangan/riwayat">
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition cursor-pointer transform hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-lg">Riwayat Lengkap</h3>
              <span className="text-4xl">�</span>
            </div>
            <p className="text-purple-100 text-sm">Lihat semua riwayat inspeksi dengan filter</p>
          </div>
        </Link>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md border-l-4 border-blue-600 p-6">
        <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
          <span className="text-xl">ℹ️</span> Panduan Inspeksi Kendaraan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">📝 Kategori yang Tersedia:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>🏢 Plaza - Kendaraan Operasional</li>
              <li>🚚 Derek - Kendaraan Evakuasi</li>
              <li>🛡️ Kamtib - Kendaraan Keamanan</li>
              <li>🚒 Rescue - Kendaraan Penyelamatan</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">📋 Langkah Inspeksi:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>1️⃣ Pilih kategori kendaraan</li>
              <li>2️⃣ Isi informasi dasar & lokasi GPS</li>
              <li>3️⃣ Cek kelengkapan sarana & kendaraan</li>
              <li>4️⃣ Upload dokumen & foto</li>
              <li>5️⃣ Tanda tangan digital</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
