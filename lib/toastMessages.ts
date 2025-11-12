// Utility untuk menambahkan toast notification ke file
// File ini berisi kode yang sudah di-update dengan toast

/*
CRITICAL FILES YANG PERLU TOAST:

1. ✅ Manager Traffic - DONE
2. Manager Operational (approve & reject)
3. Petugas Rekap ACC (kirim rekap)
4. Petugas Inspeksi pages (save/submit)
5. Manager Rekap pages (mark as read)

TOAST MESSAGES:
- Success: Hijau dengan ✓
- Error: Merah dengan ✕
- Warning: Kuning dengan ⚠
- Info: Biru dengan ℹ

IMPLEMENTASI:
1. Import ToastNotification
2. Add state: const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
3. Add function: const showToast = (message: string, type: "success" | "error" | "warning" | "info" = "success") => { setToast({ message, type }); };
4. Replace alert() with showToast()
5. Add component before closing </div>:
   {toast && (
     <ToastNotification
       message={toast.message}
       type={toast.type}
       onClose={() => setToast(null)}
     />
   )}
*/

export const TOAST_MESSAGES = {
  // Manager Traffic
  APPROVE_TRAFFIC_SUCCESS: "✓ Laporan berhasil disetujui! Email notifikasi telah dikirim ke Manager Operational",
  APPROVE_TRAFFIC_ERROR: "Gagal menyetujui laporan",
  TTD_EMPTY_WARNING: "Mohon buat tanda tangan terlebih dahulu",
  
  // Manager Operational
  APPROVE_OPERATIONAL_SUCCESS: "✓ Laporan berhasil di-ACC! Inspeksi selesai disetujui",
  REJECT_SUCCESS: "✓ Laporan berhasil ditolak. Email notifikasi telah dikirim ke petugas",
  REJECT_ERROR: "Gagal menolak laporan",
  REJECT_NOTE_EMPTY: "Mohon isi alasan penolakan",
  
  // Petugas - Submit Inspeksi
  SUBMIT_SUCCESS: "✓ Laporan berhasil dikirim! Email notifikasi telah dikirim ke Manager Traffic",
  SAVE_DRAFT_SUCCESS: "✓ Draft berhasil disimpan",
  SUBMIT_ERROR: "Gagal mengirim laporan",
  
  // Petugas - Kirim Rekap
  REKAP_SUCCESS: "✓ Rekap berhasil dikirim ke manager! Email notifikasi telah terkirim",
  REKAP_ERROR: "Gagal mengirim rekap",
  REKAP_EMPTY_WARNING: "Tidak ada data inspeksi yang ter-ACC dalam periode ini",
  
  // General
  LOAD_ERROR: "Gagal memuat data",
  NETWORK_ERROR: "Terjadi kesalahan jaringan. Mohon cek koneksi internet Anda",
};

console.log("Toast utility loaded ✅");
