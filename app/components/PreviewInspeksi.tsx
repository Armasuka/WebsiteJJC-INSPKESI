import React from 'react';

interface PreviewInspeksiProps {
  inspeksi: {
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
    ttdManagerTraffic?: string | null;
    ttdManagerOperasional?: string | null;
    approvedAtTraffic?: string | null;
    approvedAtOperational?: string | null;
  };
}

export default function PreviewInspeksi({ inspeksi }: PreviewInspeksiProps) {
  const dataKhusus = inspeksi.dataKhusus || {};
  const kelengkapanSarana = dataKhusus.kelengkapanSarana || {};
  const kelengkapanKendaraan = dataKhusus.kelengkapanKendaraan || {};
  const ttdPetugas1 = dataKhusus.ttdPetugas1;
  const ttdPetugas2 = dataKhusus.ttdPetugas2;

  // Debug logging
  console.log('PreviewInspeksi - dataKhusus:', {
    hasDataKhusus: !!inspeksi.dataKhusus,
    hasTTD1: !!ttdPetugas1,
    hasTTD2: !!ttdPetugas2,
    ttd1Length: ttdPetugas1?.length || 0,
    ttd2Length: ttdPetugas2?.length || 0,
    dataKhususKeys: Object.keys(dataKhusus),
  });

  // Define list kelengkapan berdasarkan kategori - EXACT dari form masing-masing
  const getKelengkapanList = (kategori: string, type: 'sarana' | 'kendaraan') => {
    const lists: Record<string, { sarana: string[], kendaraan: string[] }> = {
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

    return lists[kategori]?.[type] || [];
  };

  const saranaList = getKelengkapanList(inspeksi.kategoriKendaraan, 'sarana');
  const kendaraanList = getKelengkapanList(inspeksi.kategoriKendaraan, 'kendaraan');

  return (
    <div className="bg-white" id="print-wrapper">
      {/* Halaman 1 - Dengan Border */}
      <div className="border-2 border-black halaman-1" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header dengan Logo */}
        <div className="border-b-2 border-black">
          <div className="flex items-center gap-6 p-6">
            <div className="flex-shrink-0">
              <img src="/logo/logo_jjc.png" alt="Logo Jasamarga" className="h-15 w-auto object-contain" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-black mb-2 uppercase">
                PT JASAMARGA JALANLAYANG CIKAMPEK
              </h1>
              <h2 className="text-base font-semibold text-black uppercase">
                Inspeksi Periodik Kendaraan Layanan Operasi
              </h2>
            </div>
          </div>
        </div>

        {/* Info Inspeksi */}
        <div className="border-b-2 border-black">
          <div className="grid grid-cols-2 gap-0">
            <div className="border-r-2 border-black p-4">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 pr-3 text-black font-medium" style={{ width: '100px' }}>HARI</td>
                    <td className="py-1 text-black">: {new Date(inspeksi.tanggalInspeksi).toLocaleDateString('id-ID', { weekday: 'long' })}</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-3 text-black font-medium">TANGGAL</td>
                    <td className="py-1 text-black">: {new Date(inspeksi.tanggalInspeksi).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-4">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 pr-3 text-black font-medium" style={{ width: '100px' }}>UNIT</td>
                    <td className="py-1 text-black">: <span className="font-bold">{inspeksi.kategoriKendaraan}</span></td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-3 text-black font-medium">NO. POLISI</td>
                    <td className="py-1 text-black">: <span className="font-bold text-lg">{inspeksi.nomorKendaraan}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="bg-gray-100 border-b-2 border-black">
          <div className="grid grid-cols-12 text-xs font-bold uppercase text-black">
            <div className="col-span-1 p-2 text-center border-r-2 border-black">NO</div>
            <div className="col-span-5 p-2 text-center border-r-2 border-black">URAIAN</div>
            <div className="col-span-2 p-2 text-center border-r-2 border-black">
              <div className="mb-1">STATUS</div>
              <div className="grid grid-cols-2 border-t border-black pt-1">
                <div className="border-r border-black">Ada</div>
                <div>Tidak</div>
              </div>
            </div>
            <div className="col-span-1 p-2 text-center border-r-2 border-black">JUMLAH</div>
            <div className="col-span-3 p-2 text-center">
              <div className="mb-1">KONDISI</div>
              <div className="grid grid-cols-3 border-t border-black pt-1">
                <div className="border-r border-black text-[10px]">BAIK</div>
                <div className="border-r border-black text-[10px]">RUSAK RINGAN</div>
                <div className="text-[10px]">RUSAK BERAT</div>
              </div>
            </div>
          </div>
        </div>

        {/* Kelengkapan Petugas/Sarana */}
        {saranaList.length > 0 && (
          <>
            <div className="bg-gray-200 border-b-2 border-black p-2 font-bold text-sm uppercase text-black">
              {inspeksi.kategoriKendaraan === "KAMTIB" 
                ? "KELENGKAPAN PETUGAS" 
                : `KELENGKAPAN SARANA ${inspeksi.kategoriKendaraan}`}
            </div>
            {saranaList.map((item, index) => {
              const data = kelengkapanSarana[item];
              return (
              <div key={index} className="grid grid-cols-12 border-b border-black text-xs">
                <div className="col-span-1 p-2 text-center border-r border-black font-medium text-black">{index + 1}</div>
                <div className="col-span-5 p-2 border-r border-black text-black">{item}</div>
                <div className="col-span-2 border-r border-black">
                  <div className="grid grid-cols-2 h-full">
                    <div className="p-2 text-center border-r border-black flex items-center justify-center text-green-600 font-bold text-lg">
                      {data?.ada ? "✔" : ""}
                    </div>
                    <div className="p-2 text-center flex items-center justify-center text-red-600 font-bold text-lg">
                      {!data?.ada ? "✔" : ""}
                    </div>
                  </div>
                </div>
                <div className="col-span-1 p-2 text-center border-r border-black font-semibold text-black">
                  {data?.ada ? data.jumlah : "-"}
                </div>
                <div className="col-span-3">
                  <div className="grid grid-cols-3 h-full text-center">
                    <div className="p-2 border-r border-black flex items-center justify-center text-green-600 font-bold text-lg">
                      {data?.ada && data?.kondisi === "BAIK" ? "✔" : ""}
                    </div>
                    <div className="p-2 border-r border-black flex items-center justify-center text-yellow-600 font-bold text-lg">
                      {data?.ada && data?.kondisi === "RUSAK_RINGAN" ? "✔" : ""}
                    </div>
                    <div className="p-2 flex items-center justify-center text-red-600 font-bold text-lg">
                      {data?.ada && data?.kondisi === "RUSAK_BERAT" ? "✔" : ""}
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </>
        )}

        {/* Kelengkapan Kendaraan */}
        {kendaraanList.length > 0 && (
          <>
            <div className="bg-gray-200 border-t-2 border-b-2 border-black p-2 font-bold text-sm uppercase text-black">
              KELENGKAPAN KENDARAAN
            </div>
            {kendaraanList.map((item, index) => {
              const data = kelengkapanKendaraan[item];
              return (
              <div key={index} className="grid grid-cols-12 border-b border-black text-xs">
                <div className="col-span-1 p-2 text-center border-r border-black font-medium text-black">{index + 1}</div>
                <div className="col-span-5 p-2 border-r border-black text-black">{item}</div>
                <div className="col-span-2 border-r border-black">
                  <div className="grid grid-cols-2 h-full">
                    <div className="p-2 text-center border-r border-black flex items-center justify-center text-green-600 font-bold text-lg">
                      {data?.ada ? "✔" : ""}
                    </div>
                    <div className="p-2 text-center flex items-center justify-center text-red-600 font-bold text-lg">
                      {!data?.ada ? "✔" : ""}
                    </div>
                  </div>
                </div>
                <div className="col-span-1 p-2 text-center border-r border-black font-semibold text-black">
                  {data?.ada ? data.jumlah : "-"}
                </div>
                <div className="col-span-3">
                  <div className="grid grid-cols-3 h-full text-center">
                    <div className="p-2 border-r border-black flex items-center justify-center text-green-600 font-bold text-lg">
                      {data?.ada && data?.kondisi === "BAIK" ? "✔" : ""}
                    </div>
                    <div className="p-2 border-r border-black flex items-center justify-center text-yellow-600 font-bold text-lg">
                      {data?.ada && data?.kondisi === "RUSAK_RINGAN" ? "✔" : ""}
                    </div>
                    <div className="p-2 flex items-center justify-center text-red-600 font-bold text-lg">
                      {data?.ada && data?.kondisi === "RUSAK_BERAT" ? "✔" : ""}
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </>
        )}

        {/* Masa Berlaku Dokumen */}
        {dataKhusus.masaBerlakuSTNK && (
          <>
            <div className="bg-gray-200 border-b-2 border-black p-2 font-bold text-sm uppercase text-black">
              MASA BERLAKU DOKUMEN
            </div>
            <div className="border-b-2 border-black">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border-r border-black p-2 font-bold text-black">STNK</th>
                    <th className="border-r border-black p-2 font-bold text-black">KIR</th>
                    <th className="border-r border-black p-2 font-bold text-black">SIM Operator 1</th>
                    {/* Hide SIM Operator 2 for RESCUE category (only 1 petugas) */}
                    {inspeksi.kategoriKendaraan !== "RESCUE" && (
                      <th className="border-r border-black p-2 font-bold text-black">SIM Operator 2</th>
                    )}
                    <th className="border-r border-black p-2 font-bold text-black">Service</th>
                    <th className="p-2 font-bold text-black">BBM</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-r border-black p-3 text-center text-black">
                      {dataKhusus.masaBerlakuSTNK ? new Date(dataKhusus.masaBerlakuSTNK).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }) : "-"}
                    </td>
                    <td className="border-r border-black p-3 text-center text-black">
                      {dataKhusus.masaBerlakuKIR ? new Date(dataKhusus.masaBerlakuKIR).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }) : "-"}
                    </td>
                    <td className="border-r border-black p-3 text-center text-black">
                      {dataKhusus.masaBerlakuSIMPetugas1 ? new Date(dataKhusus.masaBerlakuSIMPetugas1).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }) : "-"}
                    </td>
                    {/* Hide SIM Operator 2 for RESCUE category (only 1 petugas) */}
                    {inspeksi.kategoriKendaraan !== "RESCUE" && (
                      <td className="border-r border-black p-3 text-center text-black">
                        {dataKhusus.masaBerlakuSIMPetugas2 ? new Date(dataKhusus.masaBerlakuSIMPetugas2).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }) : "-"}
                      </td>
                    )}
                    <td className="border-r border-black p-3 text-center text-black">
                      {dataKhusus.tanggalService || dataKhusus.masaBerlakuService ? new Date(dataKhusus.tanggalService || dataKhusus.masaBerlakuService).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }) : "-"}
                    </td>
                    <td className="p-3 text-center text-black">
                      {dataKhusus.jumlahBBM ? `${dataKhusus.jumlahBBM} BAR` : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* NAMA PETUGAS */}
        <div className="p-3 border-b-2 border-black">
          <div className="font-bold text-xs mb-2 uppercase text-black">NAMA PETUGAS</div>
          {inspeksi.kategoriKendaraan === "RESCUE" ? (
            // RESCUE: Hanya 1 petugas
            <div className="flex justify-start">
              <div className="text-center" style={{ width: '200px' }}>
                <div className="text-xs font-medium mb-1 text-black">Petugas Lapangan</div>
                <div className="p-2 min-h-[60px] flex items-center justify-center mb-1">
                  {ttdPetugas1 ? (
                    <img src={ttdPetugas1} alt="TTD" className="max-h-16" />
                  ) : (
                    <span className="text-gray-400 text-xs italic">( Tanda tangan )</span>
                  )}
                </div>
                <div className="border-t-2 border-black pt-1 font-bold text-xs text-black">
                  {dataKhusus.namaPetugas1 || inspeksi.namaPetugas}
                </div>
                <div className="text-xs mt-1 text-black">NIP: {dataKhusus.nipPetugas1 || "-"}</div>
              </div>
            </div>
          ) : (
            // DEREK, PLAZA, KAMTIB: 2 petugas
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-xs font-medium mb-1 text-black">Petugas 1</div>
                <div className="p-2 min-h-[60px] flex items-center justify-center mb-1">
                  {ttdPetugas1 ? (
                    <img src={ttdPetugas1} alt="TTD Petugas 1" className="max-h-16" />
                  ) : (
                    <span className="text-gray-400 text-xs italic">( Tanda tangan )</span>
                  )}
                </div>
                <div className="border-t-2 border-black pt-1 font-bold text-xs text-black">
                  {dataKhusus.namaPetugas1 || inspeksi.namaPetugas}
                </div>
                <div className="text-xs mt-1 text-black">NIP: {dataKhusus.nipPetugas1 || inspeksi.nipPetugas || "-"}</div>
              </div>

              <div className="text-center">
                <div className="text-xs font-medium mb-1 text-black">Petugas 2</div>
                <div className="p-2 min-h-[60px] flex items-center justify-center mb-1">
                  {ttdPetugas2 ? (
                    <img src={ttdPetugas2} alt="TTD Petugas 2" className="max-h-16" />
                  ) : (
                    <span className="text-gray-400 text-xs italic">( Tanda tangan )</span>
                  )}
                </div>
                <div className="border-t-2 border-black pt-1 font-bold text-xs text-black">
                  {inspeksi.namaPetugas2 || dataKhusus.namaPetugas2 || "-"}
                </div>
                <div className="text-xs mt-1 text-black">NIP: {inspeksi.nipPetugas2 || dataKhusus.nipPetugas2 || "-"}</div>
              </div>
            </div>
          )}
        </div>

        {/* Manager Approval */}
        <div className="grid grid-cols-2">
          <div className="border-r-2 border-black p-3 text-center">
            <div className="text-xs mb-1 uppercase font-medium text-black">PT JMTO</div>
            <div className="p-2 min-h-[60px] flex items-center justify-center mb-1">
              {inspeksi.ttdManagerTraffic ? (
                <img src={inspeksi.ttdManagerTraffic} alt="TTD Manager Traffic" className="max-h-14" />
              ) : (
                <span className="text-gray-400 text-xs italic">( Tanda tangan )</span>
              )}
            </div>
            <div className="border-t-2 border-black pt-1 text-xs">
              <div className="font-bold text-black">Manager Traffic</div>
            </div>
          </div>
          <div className="p-3 text-center">
            <div className="text-xs mb-1 uppercase font-medium text-black">PT JJC</div>
            <div className="p-2 min-h-[60px] flex items-center justify-center mb-1">
              {inspeksi.ttdManagerOperasional ? (
                <img src={inspeksi.ttdManagerOperasional} alt="TTD Manager Ops" className="max-h-14" />
              ) : (
                <span className="text-gray-400 text-xs italic">( Tanda tangan )</span>
              )}
            </div>
            <div className="border-t-2 border-black pt-1 text-xs">
              <div className="font-bold text-black">Manager Operasional</div>
            </div>
          </div>
        </div>

        {/* Section Komentar Manager - REMOVED: Komentar tidak ditampilkan di PDF/Print */}
      </div>

      {/* Halaman 2+ - Lampiran Foto Dokumen (Tanpa Border) */}
      <div className="lampiran-foto-section" style={{ fontFamily: 'Arial, sans-serif' }}>
        {(() => {
          const photos = [
            { label: 'STNK', file: dataKhusus.fotoSTNK },
            { label: 'KIR', file: dataKhusus.fotoKIR },
            { label: 'SIM Petugas 1', file: dataKhusus.fotoSIMPetugas1 },
            // Hide SIM Petugas 2 for RESCUE category (only 1 petugas)
            ...(inspeksi.kategoriKendaraan !== "RESCUE" ? [{ label: 'SIM Petugas 2', file: dataKhusus.fotoSIMPetugas2 }] : []),
            { label: 'Bukti Service', file: dataKhusus.fotoService },
            { label: 'BBM', file: dataKhusus.fotoBBM },
          ].filter(photo => photo.file);

          if (photos.length === 0) return null;

          // Split photos into pages of 3
          const pages = [];
          for (let i = 0; i < photos.length; i += 3) {
            pages.push(photos.slice(i, i + 3));
          }

          return pages.map((pagePhotos, pageIndex) => (
            <div key={pageIndex}>
              <div className="bg-gray-200 border-b-2 border-black p-2 font-bold text-sm uppercase text-black flex justify-between items-center">
                <span>LAMPIRAN FOTO DOKUMEN</span>
                <span className="text-xs font-normal">Halaman {pageIndex + 1} dari {pages.length}</span>
              </div>
              <div className="border-b-2 border-black p-4">
                <div className="grid grid-cols-1 gap-4">
                  {pagePhotos.map((photo, idx) => (
                    <div key={idx} className="bg-white">
                      <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-300">
                        <p className="text-sm font-bold text-black">Foto {photo.label}</p>
                      </div>
                      <div className="p-2 flex justify-center items-center bg-gray-50">
                        <img 
                          src={photo.file} 
                          alt={photo.label} 
                          className="max-w-full max-h-[400px] object-contain" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
}
