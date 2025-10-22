"use client";

import Link from "next/link";

export default function PilihKategoriKendaraanPage() {
  const kategoris = [
    {
      id: "PLAZA",
      name: "Plaza",
      icon: "🏢",
      description: "Kendaraan Operasional",
      color: "from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
      hoverColor: "hover:border-blue-400",
      textColor: "text-blue-700",
    },
    {
      id: "DEREK",
      name: "Derek",
      icon: "🚚",
      description: "Kendaraan Evakuasi",
      color: "from-yellow-50 to-yellow-100",
      borderColor: "border-yellow-200",
      hoverColor: "hover:border-yellow-400",
      textColor: "text-yellow-700",
    },
    {
      id: "KAMTIB",
      name: "Kamtib",
      icon: "🛡️",
      description: "Kendaraan Keamanan",
      color: "from-green-50 to-green-100",
      borderColor: "border-green-200",
      hoverColor: "hover:border-green-400",
      textColor: "text-green-700",
    },
    {
      id: "RESCUE",
      name: "Rescue",
      icon: "🚒",
      description: "Kendaraan Penyelamatan",
      color: "from-orange-50 to-orange-100",
      borderColor: "border-orange-200",
      hoverColor: "hover:border-orange-400",
      textColor: "text-orange-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/petugas-lapangan">
          <button className="mb-4 px-4 py-2 text-blue-700 hover:text-blue-800 font-medium flex items-center gap-2">
            ← Kembali ke Dashboard
          </button>
        </Link>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-red-600 bg-clip-text text-transparent mb-2">
          Pilih Kategori Kendaraan
        </h2>
        <p className="text-gray-600">Pilih jenis kendaraan yang akan diinspeksi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kategoris.map((kategori) => (
          <Link
            key={kategori.id}
            href={`/dashboard/petugas-lapangan/inspeksi/${kategori.id.toLowerCase()}`}
          >
            <div
              className={`bg-gradient-to-br ${kategori.color} rounded-lg shadow-md border-2 ${kategori.borderColor} ${kategori.hoverColor} p-8 text-center cursor-pointer transform transition hover:scale-105 hover:shadow-xl`}
            >
              <div className="text-6xl mb-4">{kategori.icon}</div>
              <h3 className={`text-2xl font-bold ${kategori.textColor} mb-2`}>
                {kategori.name}
              </h3>
              <p className="text-gray-600 text-sm">{kategori.description}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-700 p-4 rounded">
        <h4 className="font-bold text-blue-800 mb-2">ℹ️ Informasi</h4>
        <p className="text-sm text-blue-700">
          Setelah memilih kategori, Anda akan mengisi:
        </p>
        <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc space-y-1">
          <li>Informasi Dasar (Petugas, Plat Nomor, Lokasi)</li>
          <li>Kelengkapan Sarana & Kendaraan</li>
          <li>Masa Berlaku Dokumen dengan Foto</li>
          <li>Tanda Tangan Digital Petugas</li>
        </ul>
      </div>
    </div>
  );
}
