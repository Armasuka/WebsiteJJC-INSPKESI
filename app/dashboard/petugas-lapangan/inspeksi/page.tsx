"use client";

import Link from "next/link";

export default function PilihKategoriKendaraanPage() {
  const kategoris = [
    {
      id: "PLAZA",
      name: "Plaza",
      icon: (
        <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 11.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V7.3l7-3.11v8.8z"/>
        </svg>
      ),
      description: "Kendaraan Operasional",
      color: "from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
      hoverColor: "hover:border-blue-400",
      textColor: "text-blue-700",
    },
    {
      id: "DEREK",
      name: "Derek",
      icon: (
        <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18 18.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm1.5-9H17V12h4.46L19.5 9.5zM6 18.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM20 8l3 4v5h-2c0 1.66-1.34 3-3 3s-3-1.34-3-3H9c0 1.66-1.34 3-3 3s-3-1.34-3-3H1V6c0-1.11.89-2 2-2h14v4h3zM8 6H4v7h4V6z"/>
        </svg>
      ),
      description: "Kendaraan Evakuasi",
      color: "from-yellow-50 to-yellow-100",
      borderColor: "border-yellow-200",
      hoverColor: "hover:border-yellow-400",
      textColor: "text-yellow-700",
    },
    {
      id: "KAMTIB",
      name: "Kamtib",
      icon: (
        <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
        </svg>
      ),
      description: "Kendaraan Keamanan",
      color: "from-green-50 to-green-100",
      borderColor: "border-green-200",
      hoverColor: "hover:border-green-400",
      textColor: "text-green-700",
    },
    {
      id: "RESCUE",
      name: "Rescue",
      icon: (
        <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      ),
      description: "Kendaraan Penyelamatan",
      color: "from-orange-50 to-orange-100",
      borderColor: "border-orange-200",
      hoverColor: "hover:border-orange-400",
      textColor: "text-orange-700",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <Link href="/dashboard/petugas-lapangan">
          <button className="mb-3 sm:mb-4 px-3 sm:px-4 py-2 text-blue-700 hover:text-blue-800 font-medium flex items-center gap-2 text-sm sm:text-base">
            ← Kembali ke Dashboard
          </button>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-red-600 bg-clip-text text-transparent mb-2">
          Pilih Kategori Kendaraan
        </h2>
        <p className="text-sm sm:text-base text-gray-600">Pilih jenis kendaraan yang akan diinspeksi</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {kategoris.map((kategori) => (
          <Link
            key={kategori.id}
            href={`/dashboard/petugas-lapangan/inspeksi/${kategori.id.toLowerCase()}`}
          >
            <div
              className={`bg-gradient-to-br ${kategori.color} rounded-lg shadow-md border-2 ${kategori.borderColor} ${kategori.hoverColor} p-6 sm:p-8 text-center cursor-pointer transform transition hover:scale-105 hover:shadow-xl`}
            >
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">{kategori.icon}</div>
              <h3 className={`text-xl sm:text-2xl font-bold ${kategori.textColor} mb-2`}>
                {kategori.name}
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm">{kategori.description}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-700 p-3 sm:p-4 rounded">
        <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2 text-sm sm:text-base">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
          </svg>
          <span>Informasi</span>
        </h4>
        <p className="text-xs sm:text-sm text-blue-700 mb-2">
          Setelah memilih kategori, Anda akan mengisi:
        </p>
        <ul className="text-xs sm:text-sm text-blue-700 mt-2 ml-4 list-disc space-y-1">
          <li>Informasi Dasar (Petugas, Plat Nomor, Lokasi)</li>
          <li>Kelengkapan Sarana & Kendaraan</li>
          <li>Masa Berlaku Dokumen dengan Foto</li>
          <li>Tanda Tangan Digital Petugas</li>
        </ul>
      </div>
    </div>
  );
}

