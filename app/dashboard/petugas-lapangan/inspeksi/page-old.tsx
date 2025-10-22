"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type KategoriKendaraan = "AMBULANCE" | "PLAZA" | "DEREK" | "KAMTIB" | "RESCUE";
type StatusInspeksi = "DRAFT" | "SUBMITTED";

interface InspeksiForm {
  kategoriKendaraan: KategoriKendaraan | "";
  nomorKendaraan: string;
  lokasiInspeksi: string;
  
  // Kelengkapan Petugas
  namaPetugas: string;
  nipPetugas: string;
  fotoIdCard: File | null;
  fotoSeragam: File | null;
  
  // Data Kendaraan
  merkKendaraan: string;
  tahunKendaraan: string;
  warnaBahan: string;
  kondisiKendaraan: string;
  kilometerKendaraan: string;
  fotoBodi: File | null;
  fotoInterior: File | null;
  
  // Dokumen Kendaraan
  nomorSTNK: string;
  masaBerlakuSTNK: string;
  fotoSTNK: File | null;
  nomorKIR: string;
  masaBerlakuKIR: string;
  fotoKIR: File | null;
  asuransi: string;
  masaBerlakuAsuransi: string;
  fotoAsuransi: File | null;
  
  catatan: string;
}

export default function InspeksiKendaraanPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState<InspeksiForm>({
    kategoriKendaraan: "",
    nomorKendaraan: "",
    lokasiInspeksi: "",
    namaPetugas: session?.user?.name || "",
    nipPetugas: "",
    fotoIdCard: null,
    fotoSeragam: null,
    merkKendaraan: "",
    tahunKendaraan: "",
    warnaBahan: "",
    kondisiKendaraan: "BAIK",
    kilometerKendaraan: "",
    fotoBodi: null,
    fotoInterior: null,
    nomorSTNK: "",
    masaBerlakuSTNK: "",
    fotoSTNK: null,
    nomorKIR: "",
    masaBerlakuKIR: "",
    fotoKIR: null,
    asuransi: "",
    masaBerlakuAsuransi: "",
    fotoAsuransi: null,
    catatan: "",
  });

  const [kelengkapanKendaraan, setKelengkapanKendaraan] = useState<Record<string, boolean>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof InspeksiForm) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, [fieldName]: file }));
  };

  const handleKelengkapanChange = (item: string, checked: boolean) => {
    setKelengkapanKendaraan(prev => ({ ...prev, [item]: checked }));
  };

  const getKelengkapanByKategori = (kategori: KategoriKendaraan | ""): string[] => {
    switch (kategori) {
      case "AMBULANCE":
        return [
          "Tabung Oksigen (min 2 unit)",
          "Brankar/Tandu",
          "Kotak P3K Lengkap",
          "Alat Resusitasi (Ambu Bag)",
          "Defibrillator",
          "Sirene dan Lampu Rotator",
          "Tanda Ambulance",
          "Alat Pengukur Tekanan Darah",
          "Stetoskop",
          "Selimut Steril",
        ];
      case "PLAZA":
        return [
          "Radio Komunikasi",
          "Alat Tulis Kantor",
          "Komputer/Tablet Genggam",
          "Printer Receipt",
          "Uang Kembalian",
          "Rompi Keselamatan",
          "Tanda Plaza",
          "CCTV Operasional",
          "Pembaca Kartu E-Toll",
          "Sistem Palang Otomatis",
        ];
      case "DEREK":
        return [
          "Kabel Derek (Towing Cable)",
          "Dongkrak Hidrolik",
          "Roda Ganjal",
          "Lampu Strobo/Warning Light",
          "Rambu Peringatan",
          "Safety Cone (min 5 unit)",
          "Tali Pengikat Kendaraan",
          "Sarung Tangan Safety",
          "Radio Komunikasi",
          "Tool Kit Lengkap",
        ];
      case "KAMTIB":
        return [
          "Radio Komunikasi HT",
          "Rompi Reflektif",
          "Tongkat Lalu Lintas",
          "Peluit",
          "Senter LED",
          "Buku Catatan Patroli",
          "Alat Pengaman Diri",
          "Tanda Pengenal",
          "Rambu Pengamanan",
          "Kamera Dokumentasi",
        ];
      case "RESCUE":
        return [
          "Peralatan Cutting/Pemotong",
          "Alat Pemadam Kebakaran (APAR)",
          "Tali Kernmantle",
          "Safety Harness",
          "Helmet Safety",
          "Kotak P3K",
          "Lampu Sorot Portable",
          "Radio Komunikasi",
          "Safety Cone",
          "Tool Kit Emergency",
        ];
      default:
        return [];
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    // Simulasi upload - dalam produksi, gunakan service seperti S3, Cloudinary, dll
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (status: StatusInspeksi) => {
    try {
      setLoading(true);

      // Upload semua foto
      const fotoIdCard = formData.fotoIdCard ? await uploadFile(formData.fotoIdCard) : null;
      const fotoSeragam = formData.fotoSeragam ? await uploadFile(formData.fotoSeragam) : null;
      const fotoBodi = formData.fotoBodi ? await uploadFile(formData.fotoBodi) : null;
      const fotoInterior = formData.fotoInterior ? await uploadFile(formData.fotoInterior) : null;
      const fotoSTNK = formData.fotoSTNK ? await uploadFile(formData.fotoSTNK) : null;
      const fotoKIR = formData.fotoKIR ? await uploadFile(formData.fotoKIR) : null;
      const fotoAsuransi = formData.fotoAsuransi ? await uploadFile(formData.fotoAsuransi) : null;

      const payload = {
        ...formData,
        kilometerKendaraan: parseInt(formData.kilometerKendaraan),
        kelengkapanKendaraan,
        status,
        fotoIdCard,
        fotoSeragam,
        fotoBodi,
        fotoInterior,
        fotoSTNK,
        fotoKIR,
        fotoAsuransi,
      };

      const response = await fetch("/api/inspeksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan inspeksi");
      }

      alert(status === "DRAFT" ? "Draft berhasil disimpan!" : "Inspeksi berhasil dikirim ke Manager Traffic!");
      router.push("/dashboard/petugas-lapangan");
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const kelengkapanItems = getKelengkapanByKategori(formData.kategoriKendaraan);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-red-600 bg-clip-text text-transparent mb-2">
          Form Inspeksi Kendaraan
        </h2>
        <p className="text-gray-600">Lengkapi semua data inspeksi kendaraan dengan teliti</p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  currentStep >= step
                    ? "bg-blue-700 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {step}
              </div>
              {step < 5 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    currentStep > step ? "bg-blue-700" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>Kategori</span>
          <span>Petugas</span>
          <span>Kendaraan</span>
          <span>Dokumen</span>
          <span>Review</span>
        </div>
      </div>

      <form className="space-y-6">
        {/* Step 1: Kategori & Info Dasar */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h3 className="text-xl font-semibold text-blue-700 mb-4">
              1. Kategori Kendaraan & Informasi Dasar
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori Kendaraan <span className="text-red-600">*</span>
              </label>
              <select
                name="kategoriKendaraan"
                value={formData.kategoriKendaraan}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Pilih Kategori</option>
                <option value="AMBULANCE">Ambulance</option>
                <option value="PLAZA">Plaza</option>
                <option value="DEREK">Derek</option>
                <option value="KAMTIB">Kamtib</option>
                <option value="RESCUE">Rescue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Kendaraan (Plat) <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="nomorKendaraan"
                value={formData.nomorKendaraan}
                onChange={handleInputChange}
                placeholder="B 1234 XYZ"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lokasi Inspeksi <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="lokasiInspeksi"
                value={formData.lokasiInspeksi}
                onChange={handleInputChange}
                placeholder="Contoh: Gerbang Tol Cikampek KM 45"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={!formData.kategoriKendaraan || !formData.nomorKendaraan || !formData.lokasiInspeksi}
                className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                Lanjut →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Kelengkapan Petugas */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h3 className="text-xl font-semibold text-blue-700 mb-4">
              2. Kelengkapan Petugas
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Petugas <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="namaPetugas"
                value={formData.namaPetugas}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIP Petugas <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="nipPetugas"
                value={formData.nipPetugas}
                onChange={handleInputChange}
                placeholder="123456789"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto ID Card <span className="text-red-600">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "fotoIdCard")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {formData.fotoIdCard && (
                <p className="text-sm text-green-600 mt-1">✓ {formData.fotoIdCard.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto Seragam (Full Body) <span className="text-red-600">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "fotoSeragam")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {formData.fotoSeragam && (
                <p className="text-sm text-green-600 mt-1">✓ {formData.fotoSeragam.name}</p>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                ← Kembali
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                disabled={!formData.namaPetugas || !formData.nipPetugas || !formData.fotoIdCard || !formData.fotoSeragam}
                className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                Lanjut →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Data Kendaraan */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h3 className="text-xl font-semibold text-blue-700 mb-4">
              3. Data Kendaraan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merk Kendaraan <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="merkKendaraan"
                  value={formData.merkKendaraan}
                  onChange={handleInputChange}
                  placeholder="Toyota, Mitsubishi, dll"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tahun Kendaraan <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="tahunKendaraan"
                  value={formData.tahunKendaraan}
                  onChange={handleInputChange}
                  placeholder="2023"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warna Kendaraan <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="warnaBahan"
                  value={formData.warnaBahan}
                  onChange={handleInputChange}
                  placeholder="Putih, Merah, dll"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kondisi Kendaraan <span className="text-red-600">*</span>
                </label>
                <select
                  name="kondisiKendaraan"
                  value={formData.kondisiKendaraan}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="BAIK">Baik</option>
                  <option value="CUKUP">Cukup</option>
                  <option value="PERLU_PERBAIKAN">Perlu Perbaikan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kilometer Kendaraan <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  name="kilometerKendaraan"
                  value={formData.kilometerKendaraan}
                  onChange={handleInputChange}
                  placeholder="50000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto Bodi Kendaraan <span className="text-red-600">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "fotoBodi")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {formData.fotoBodi && (
                <p className="text-sm text-green-600 mt-1">✓ {formData.fotoBodi.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto Interior Kendaraan <span className="text-red-600">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "fotoInterior")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {formData.fotoInterior && (
                <p className="text-sm text-green-600 mt-1">✓ {formData.fotoInterior.name}</p>
              )}
            </div>

            {/* Checklist Kelengkapan Kendaraan */}
            <div className="border-t pt-4 mt-6">
              <h4 className="font-semibold text-gray-800 mb-3">
                Kelengkapan Kendaraan {formData.kategoriKendaraan}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {kelengkapanItems.map((item) => (
                  <label key={item} className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kelengkapanKendaraan[item] || false}
                      onChange={(e) => handleKelengkapanChange(item, e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-700 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                ← Kembali
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                disabled={!formData.merkKendaraan || !formData.tahunKendaraan || !formData.fotoBodi || !formData.fotoInterior}
                className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                Lanjut →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Dokumen Kendaraan */}
        {currentStep === 4 && (
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h3 className="text-xl font-semibold text-blue-700 mb-4">
              4. Masa Berlaku Dokumen Kendaraan
            </h3>

            {/* STNK */}
            <div className="border-b pb-4">
              <h4 className="font-semibold text-gray-800 mb-3">STNK</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor STNK <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="nomorSTNK"
                    value={formData.nomorSTNK}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Masa Berlaku STNK <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    name="masaBerlakuSTNK"
                    value={formData.masaBerlakuSTNK}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto STNK <span className="text-red-600">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "fotoSTNK")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                {formData.fotoSTNK && (
                  <p className="text-sm text-green-600 mt-1">✓ {formData.fotoSTNK.name}</p>
                )}
              </div>
            </div>

            {/* KIR */}
            <div className="border-b pb-4">
              <h4 className="font-semibold text-gray-800 mb-3">KIR (Kendaraan Umum)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor KIR
                  </label>
                  <input
                    type="text"
                    name="nomorKIR"
                    value={formData.nomorKIR}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Masa Berlaku KIR
                  </label>
                  <input
                    type="date"
                    name="masaBerlakuKIR"
                    value={formData.masaBerlakuKIR}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto KIR
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "fotoKIR")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formData.fotoKIR && (
                  <p className="text-sm text-green-600 mt-1">✓ {formData.fotoKIR.name}</p>
                )}
              </div>
            </div>

            {/* Asuransi */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Asuransi</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Asuransi
                  </label>
                  <input
                    type="text"
                    name="asuransi"
                    value={formData.asuransi}
                    onChange={handleInputChange}
                    placeholder="Nama perusahaan asuransi"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Masa Berlaku Asuransi
                  </label>
                  <input
                    type="date"
                    name="masaBerlakuAsuransi"
                    value={formData.masaBerlakuAsuransi}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto Polis Asuransi
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "fotoAsuransi")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formData.fotoAsuransi && (
                  <p className="text-sm text-green-600 mt-1">✓ {formData.fotoAsuransi.name}</p>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                ← Kembali
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                disabled={!formData.nomorSTNK || !formData.masaBerlakuSTNK || !formData.fotoSTNK}
                className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                Lanjut →
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {currentStep === 5 && (
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h3 className="text-xl font-semibold text-blue-700 mb-4">
              5. Review & Catatan
            </h3>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-gray-800">Ringkasan Inspeksi</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Kategori:</div>
                <div className="font-medium">{formData.kategoriKendaraan}</div>
                
                <div className="text-gray-600">Nomor Kendaraan:</div>
                <div className="font-medium">{formData.nomorKendaraan}</div>
                
                <div className="text-gray-600">Lokasi:</div>
                <div className="font-medium">{formData.lokasiInspeksi}</div>
                
                <div className="text-gray-600">Petugas:</div>
                <div className="font-medium">{formData.namaPetugas} ({formData.nipPetugas})</div>
                
                <div className="text-gray-600">Merk/Tahun:</div>
                <div className="font-medium">{formData.merkKendaraan} - {formData.tahunKendaraan}</div>
                
                <div className="text-gray-600">Kondisi:</div>
                <div className="font-medium">{formData.kondisiKendaraan}</div>
                
                <div className="text-gray-600">Kelengkapan Checked:</div>
                <div className="font-medium">{Object.values(kelengkapanKendaraan).filter(Boolean).length} / {kelengkapanItems.length}</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan Tambahan
              </label>
              <textarea
                name="catatan"
                value={formData.catatan}
                onChange={handleInputChange}
                rows={4}
                placeholder="Tambahkan catatan jika diperlukan..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
              <div className="flex">
                <div className="text-2xl mr-3">⚠️</div>
                <div>
                  <h4 className="font-semibold text-yellow-800">Perhatian!</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Setelah submit, laporan inspeksi akan dikirim ke Manager Traffic untuk ditandatangani.
                    Pastikan semua data sudah benar sebelum mengirim.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                ← Kembali
              </button>
              <div className="space-x-3">
                <button
                  type="button"
                  onClick={() => handleSubmit("DRAFT")}
                  disabled={loading}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition"
                >
                  💾 Simpan Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit("SUBMITTED")}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
                >
                  📤 Kirim ke Manager Traffic
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
            <p className="text-center mt-4 text-gray-700">Menyimpan data...</p>
          </div>
        </div>
      )}
    </div>
  );
}
