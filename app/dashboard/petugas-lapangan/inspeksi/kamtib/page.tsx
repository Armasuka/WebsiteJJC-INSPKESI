"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AlertModal from "@/app/components/Toast";
import { uploadFileToMinio, uploadSignatureToMinio } from "@/lib/uploadUtils";

interface KelengkapanItem {
  ada: boolean;
  jumlah: string;
  kondisi: "BAIK" | "RUSAK_RINGAN" | "RUSAK_BERAT";
}

interface InspeksiForm {
  namaPetugas1: string;
  nipPetugas1: string;
  namaPetugas2: string;
  nipPetugas2: string;
  platNomor: string;
  merkKendaraan: string;
  tahunKendaraan: string;
  warnaBahan: string;
  lokasiInspeksi: string;
  latitude: string;
  longitude: string;
  kelengkapanSarana: Record<string, KelengkapanItem>;
  kelengkapanKendaraan: Record<string, KelengkapanItem>;
  masaBerlakuSTNK: string;
  fotoSTNK: File | string | null;
  masaBerlakuKIR: string;
  fotoKIR: File | string | null;
  masaBerlakuSIMPetugas1: string;
  fotoSIMPetugas1: File | string | null;
  masaBerlakuSIMPetugas2: string;
  fotoSIMPetugas2: File | string | null;
  tanggalService: string;
  fotoService: File | string | null;
  jumlahBBM: string;
  fotoBBM: File | string | null;
  ttdPetugas1: string;
  ttdPetugas2: string;
  catatan: string;
}

export default function InspeksiKamtibPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [alertModal, setAlertModal] = useState<{ message: string; type: "success" | "error" | "warning" | "info" } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef2 = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawing2, setIsDrawing2] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [hasSignature2, setHasSignature2] = useState(false);

  const [formData, setFormData] = useState<InspeksiForm>({
    namaPetugas1: session?.user?.name || "",
    nipPetugas1: "",
    namaPetugas2: "",
    nipPetugas2: "",
    platNomor: "",
    merkKendaraan: "",
    tahunKendaraan: "",
    warnaBahan: "",
    lokasiInspeksi: "",
    latitude: "",
    longitude: "",
    kelengkapanSarana: {},
    kelengkapanKendaraan: {},
    masaBerlakuSTNK: "",
    fotoSTNK: null,
    masaBerlakuKIR: "",
    fotoKIR: null,
    masaBerlakuSIMPetugas1: "",
    fotoSIMPetugas1: null,
    masaBerlakuSIMPetugas2: "",
    fotoSIMPetugas2: null,
    tanggalService: "",
    fotoService: null,
    jumlahBBM: "",
    fotoBBM: null,
    ttdPetugas1: "",
    ttdPetugas2: "",
    catatan: "",
  });

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('draft_kamtib');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed.formData);
        setCurrentStep(parsed.currentStep || 1);
        setHasSignature(!!parsed.formData.ttdPetugas1);
        setHasSignature2(!!parsed.formData.ttdPetugas2);
        
        // Restore canvas signatures
        if (parsed.formData.ttdPetugas1 && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0);
            };
            img.src = parsed.formData.ttdPetugas1;
          }
        }
        if (parsed.formData.ttdPetugas2 && canvasRef2.current) {
          const ctx = canvasRef2.current.getContext('2d');
          if (ctx) {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0);
            };
            img.src = parsed.formData.ttdPetugas2;
          }
        }
        
        setAlertModal({ message: "Draft ditemukan! Data sebelumnya berhasil dimuat.", type: "info" });
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

  // Auto-save draft whenever formData or currentStep changes (localStorage only, no database)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.namaPetugas1 || formData.platNomor || currentStep > 1) {
        try {
          const formDataToSave = { ...formData };
          // Convert File to base64, skip if already string or null
          if (formData.fotoSTNK && typeof formData.fotoSTNK !== 'string' && formData.fotoSTNK instanceof File) {
            formDataToSave.fotoSTNK = await uploadFile(formData.fotoSTNK);
          }
          if (formData.fotoKIR && typeof formData.fotoKIR !== 'string' && formData.fotoKIR instanceof File) {
            formDataToSave.fotoKIR = await uploadFile(formData.fotoKIR);
          }
          if (formData.fotoSIMPetugas1 && typeof formData.fotoSIMPetugas1 !== 'string' && formData.fotoSIMPetugas1 instanceof File) {
            formDataToSave.fotoSIMPetugas1 = await uploadFile(formData.fotoSIMPetugas1);
          }
          if (formData.fotoSIMPetugas2 && typeof formData.fotoSIMPetugas2 !== 'string' && formData.fotoSIMPetugas2 instanceof File) {
            formDataToSave.fotoSIMPetugas2 = await uploadFile(formData.fotoSIMPetugas2);
          }
          if (formData.fotoService && typeof formData.fotoService !== 'string' && formData.fotoService instanceof File) {
            formDataToSave.fotoService = await uploadFile(formData.fotoService);
          }
          if (formData.fotoBBM && typeof formData.fotoBBM !== 'string' && formData.fotoBBM instanceof File) {
            formDataToSave.fotoBBM = await uploadFile(formData.fotoBBM);
          }
          
          const draftData = { formData: formDataToSave, currentStep, timestamp: new Date().toISOString() };
          localStorage.setItem('draft_kamtib', JSON.stringify(draftData));
        } catch (error) {
          console.error('Error auto-saving draft:', error);
        }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData, currentStep]);

  // Clear draft from localStorage
  const clearDraftFromLocal = () => {
    localStorage.removeItem('draft_kamtib');
  };

  const kelengkapanSaranaKamtib = [
    "Rompi keselamatan kerja",
    "Sepatu Safety",
    "Sabuk Pentungan dll",
  ];

  const kelengkapanKendaraanUmum = [
    "Rubber Cone",
    "Bendera Merah/Tongkat",
    "Handy Talky",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleKelengkapanChange = (
    type: "sarana" | "kendaraan",
    item: string,
    field: "ada" | "jumlah" | "kondisi",
    value: boolean | string
  ) => {
    if (type === "sarana") {
      setFormData((prev) => ({
        ...prev,
        kelengkapanSarana: {
          ...prev.kelengkapanSarana,
          [item]: {
            ...(prev.kelengkapanSarana[item] || { ada: false, jumlah: "", kondisi: "BAIK" }),
            [field]: value,
          },
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        kelengkapanKendaraan: {
          ...prev.kelengkapanKendaraan,
          [item]: {
            ...(prev.kelengkapanKendaraan[item] || { ada: false, jumlah: "", kondisi: "BAIK" }),
            [field]: value,
          },
        },
      }));
    }
  };

  // Load draft jika ada parameter draft di URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const draft = searchParams.get('draft');
    
    if (draft) {
      setDraftId(draft);
      loadDraft(draft);
    }
  }, []);

  const loadDraft = async (id: string) => {
    try {
      setLoadingDraft(true);
      const response = await fetch(`/api/inspeksi/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Populate form dengan data draft
        setFormData({
          namaPetugas1: data.namaPetugas || session?.user?.name || "",
          nipPetugas1: data.nipPetugas || "",
          namaPetugas2: "", // Data ini tidak ada di schema, bisa diambil dari dataKhusus jika perlu
          nipPetugas2: "",
          platNomor: data.nomorKendaraan || "",
          merkKendaraan: data.merkKendaraan || "",
          tahunKendaraan: data.tahunKendaraan || "",
          warnaBahan: data.warnaBahan || "",
          lokasiInspeksi: data.lokasiInspeksi || "",
          latitude: "",
          longitude: "",
          kelengkapanSarana: data.kelengkapanKendaraan || {},
          kelengkapanKendaraan: {},
          masaBerlakuSTNK: data.masaBerlakuSTNK ? new Date(data.masaBerlakuSTNK).toISOString().split('T')[0] : "",
          fotoSTNK: null, // File tidak bisa di-populate
          masaBerlakuKIR: data.masaBerlakuKIR ? new Date(data.masaBerlakuKIR).toISOString().split('T')[0] : "",
          fotoKIR: null,
          masaBerlakuSIMPetugas1: "",
          fotoSIMPetugas1: null,
          masaBerlakuSIMPetugas2: "",
          fotoSIMPetugas2: null,
          tanggalService: "",
          fotoService: null,
          jumlahBBM: "",
          fotoBBM: null,
          ttdPetugas1: "",
          ttdPetugas2: "",
          catatan: data.catatan || "",
        });
        
        alert("Draft berhasil dimuat! Silakan lanjutkan pengisian.");
      } else {
        alert("Gagal memuat draft");
      }
    } catch (error) {
      console.error("Error loading draft:", error);
      alert("Gagal memuat draft");
    } finally {
      setLoadingDraft(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
      }
    }
    
    const canvas2 = canvasRef2.current;
    if (canvas2) {
      const ctx2 = canvas2.getContext("2d");
      if (ctx2) {
        ctx2.strokeStyle = "black";
        ctx2.lineWidth = 2;
        ctx2.lineCap = "round";
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setHasSignature(true);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setFormData((prev) => ({ ...prev, ttdPetugas1: "" }));
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setFormData((prev) => ({ ...prev, ttdPetugas1: dataUrl }));
    alert("Tanda tangan Petugas 1 berhasil disimpan!");
  };

  // Functions for Petugas 2
  const startDrawing2 = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef2.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing2(true);
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw2 = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing2) return;
    const canvas = canvasRef2.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing2 = () => {
    setIsDrawing2(false);
    setHasSignature2(true);
  };

  const clearSignature2 = () => {
    const canvas = canvasRef2.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature2(false);
    setFormData((prev) => ({ ...prev, ttdPetugas2: "" }));
  };

  const saveSignature2 = () => {
    const canvas = canvasRef2.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setFormData((prev) => ({ ...prev, ttdPetugas2: dataUrl }));
    alert("Tanda tangan Petugas 2 berhasil disimpan!");
  };

  const getLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
          setIsGettingLocation(false);
          alert("Lokasi berhasil diambil!");
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Gagal mengambil lokasi. Pastikan GPS aktif.");
          setIsGettingLocation(false);
        }
      );
    } else {
      alert("Browser tidak mendukung geolocation");
      setIsGettingLocation(false);
    }
  };

  const uploadFile = async (file: File | string, customFileName?: string): Promise<string> => {
    try {
      // Upload to MinIO and return URL
      return await uploadFileToMinio(file, customFileName);
    } catch (error) {
      console.error('Error uploading file:', error);
      // Fallback: convert to base64 if MinIO upload fails
      if (typeof file === 'string') {
        return file;
      }
      if (file instanceof File) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      return '';
    }
  };

  const nextStep = () => {
    // Validasi Step 1 sebelum lanjut
    if (currentStep === 1) {
      if (!formData.namaPetugas1 || !formData.nipPetugas1 || 
          !formData.namaPetugas2 || !formData.nipPetugas2 || 
          !formData.platNomor || !formData.lokasiInspeksi) {
        setAlertModal({ message: "Mohon lengkapi semua field yang wajib diisi di Step 1!", type: "warning" });
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };
  
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validasi field wajib
      if (!formData.platNomor || !formData.nipPetugas1 || !formData.nipPetugas2) {
        alert("Mohon lengkapi semua field yang wajib diisi (Plat Nomor, NIP Petugas)");
        setLoading(false);
        return;
      }

      const fotoSTNKBase64 = formData.fotoSTNK ? await uploadFile(formData.fotoSTNK) : null;
      const fotoKIRBase64 = formData.fotoKIR ? await uploadFile(formData.fotoKIR) : null;
      const fotoSIMPetugas1Base64 = formData.fotoSIMPetugas1 ? await uploadFile(formData.fotoSIMPetugas1) : null;
      const fotoSIMPetugas2Base64 = formData.fotoSIMPetugas2 ? await uploadFile(formData.fotoSIMPetugas2) : null;
      const fotoServiceBase64 = formData.fotoService ? await uploadFile(formData.fotoService) : null;
      const fotoBBMBase64 = formData.fotoBBM ? await uploadFile(formData.fotoBBM) : null;
      
      // Upload signatures to MinIO
      const ttdPetugas1Uploaded = formData.ttdPetugas1 ? await uploadSignatureToMinio(formData.ttdPetugas1, 'ttd-petugas1-kamtib') : null;
      const ttdPetugas2Uploaded = formData.ttdPetugas2 ? await uploadSignatureToMinio(formData.ttdPetugas2, 'ttd-petugas2-kamtib') : null;

      const payload = {
        ...formData,
        kategori: "KAMTIB",
        status: "SUBMITTED",
        fotoSTNK: fotoSTNKBase64,
        fotoKIR: fotoKIRBase64,
        fotoSIMPetugas1: fotoSIMPetugas1Base64,
        fotoSIMPetugas2: fotoSIMPetugas2Base64,
        fotoService: fotoServiceBase64,
        fotoBBM: fotoBBMBase64,
        ttdPetugas1: ttdPetugas1Uploaded,
        ttdPetugas2: ttdPetugas2Uploaded,
      };

      console.log("Payload yang dikirim:", payload);

      const response = await fetch("/api/inspeksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.error || "Gagal menyimpan inspeksi");
      }
      
      clearDraftFromLocal();
      setAlertModal({ message: "Inspeksi berhasil dikirim ke Manager!", type: "success" });
      
      setTimeout(() => {
        router.push("/dashboard/petugas-lapangan");
      }, 1500);
    } catch (error) {
      console.error("Error:", error);
      setAlertModal({ message: "Gagal menyimpan inspeksi. " + (error as Error).message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-700 p-4 rounded">
        <h3 className="font-bold text-blue-800 mb-2">👤 Petugas 1 (Pengemudi)</h3>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nama Petugas 1 *</label>
          <input type="text" name="namaPetugas1" value={formData.namaPetugas1} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">NIP Petugas 1 *</label>
          <input type="text" name="nipPetugas1" value={formData.nipPetugas1} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black" />
        </div>
      </div>

      <div className="bg-purple-50 border-l-4 border-purple-700 p-4 rounded">
        <h3 className="font-bold text-purple-800 mb-2">👤 Petugas 2 (Pendamping)</h3>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nama Petugas 2 *</label>
          <input type="text" name="namaPetugas2" value={formData.namaPetugas2} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">NIP Petugas 2 *</label>
          <input type="text" name="nipPetugas2" value={formData.nipPetugas2} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black" />
        </div>
      </div>

      <div className="bg-red-50 border-l-4 border-red-700 p-4 rounded">
        <h3 className="font-bold text-red-800 mb-2">🚔 Identitas Kendaraan Kamtib</h3>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Plat Nomor *</label>
          <input type="text" name="platNomor" value={formData.platNomor} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black" />
        </div>
      </div>

      <div className="bg-green-50 border-l-4 border-green-700 p-4 rounded">
        <h3 className="font-bold text-green-800 mb-2">📍 Lokasi Inspeksi</h3>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Lokasi Inspeksi *</label>
          <input type="text" name="lokasiInspeksi" value={formData.lokasiInspeksi} onChange={handleInputChange} required placeholder="Contoh: Pos Kamtib KM 60" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-black" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
            <input type="text" name="latitude" value={formData.latitude} onChange={handleInputChange} readOnly className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-black" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
            <input type="text" name="longitude" value={formData.longitude} onChange={handleInputChange} readOnly className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-black" />
          </div>
          <div className="flex items-end">
            <button type="button" onClick={getLocation} disabled={isGettingLocation} className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:bg-gray-400">
              {isGettingLocation ? "Mengambil..." : "📍 Ambil Lokasi GPS"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={nextStep} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
          Lanjut ke Kelengkapan Sarana →
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-indigo-50 border-l-4 border-indigo-700 p-4 rounded">
        <h3 className="font-bold text-indigo-800 mb-2">�️ Kelengkapan Petugas</h3>
        <p className="text-sm text-indigo-700">Centang kelengkapan petugas, isi jumlah dan kondisinya</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          {kelengkapanSaranaKamtib.map((item) => {
            const itemData = formData.kelengkapanSarana[item] || { ada: false, jumlah: "", kondisi: "BAIK" };
            return (
              <div key={item} className={`border-2 rounded-lg p-4 transition ${itemData.ada ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={itemData.ada} onChange={(e) => handleKelengkapanChange("sarana", item, "ada", e.target.checked)} className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-1" />
                  <div className="flex-1">
                    <label className="font-medium text-gray-800 block mb-2">{item}</label>
                    {itemData.ada && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah *</label>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => { const currentJumlah = parseInt(itemData.jumlah) || 0; if (currentJumlah > 0) { handleKelengkapanChange("sarana", item, "jumlah", (currentJumlah - 1).toString()); }}} className="w-10 h-10 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold text-lg flex items-center justify-center transition">−</button>
                            <input type="number" value={itemData.jumlah} onChange={(e) => handleKelengkapanChange("sarana", item, "jumlah", e.target.value)} className="flex-1 px-3 py-2 text-sm text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black" min="0" />
                            <button type="button" onClick={() => { const currentJumlah = parseInt(itemData.jumlah) || 0; handleKelengkapanChange("sarana", item, "jumlah", (currentJumlah + 1).toString()); }} className="w-10 h-10 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-bold text-lg flex items-center justify-center transition">+</button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Kondisi *</label>
                          <select value={itemData.kondisi} onChange={(e) => handleKelengkapanChange("sarana", item, "kondisi", e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black">
                            <option value="BAIK">✅ Baik</option>
                            <option value="RUSAK_RINGAN">⚠️ Rusak Ringan</option>
                            <option value="RUSAK_BERAT">❌ Rusak Berat</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-700 p-4 rounded">
        <h3 className="font-bold text-blue-800 mb-2">� Kelengkapan Kendaraan</h3>
        <p className="text-sm text-blue-700">Centang kelengkapan kendaraan, isi jumlah dan kondisinya</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          {kelengkapanKendaraanUmum.map((item) => {
            const itemData = formData.kelengkapanKendaraan[item] || { ada: false, jumlah: "", kondisi: "BAIK" };
            return (
              <div key={item} className={`border-2 rounded-lg p-4 transition ${itemData.ada ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={itemData.ada} onChange={(e) => handleKelengkapanChange("kendaraan", item, "ada", e.target.checked)} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1" />
                  <div className="flex-1">
                    <label className="font-medium text-gray-800 block mb-2">{item}</label>
                    {itemData.ada && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah *</label>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => { const currentJumlah = parseInt(itemData.jumlah) || 0; if (currentJumlah > 0) { handleKelengkapanChange("kendaraan", item, "jumlah", (currentJumlah - 1).toString()); }}} className="w-10 h-10 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold text-lg flex items-center justify-center transition">−</button>
                            <input type="number" value={itemData.jumlah} onChange={(e) => handleKelengkapanChange("kendaraan", item, "jumlah", e.target.value)} className="flex-1 px-3 py-2 text-sm text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black" min="0" />
                            <button type="button" onClick={() => { const currentJumlah = parseInt(itemData.jumlah) || 0; handleKelengkapanChange("kendaraan", item, "jumlah", (currentJumlah + 1).toString()); }} className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-lg flex items-center justify-center transition">+</button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Kondisi *</label>
                          <select value={itemData.kondisi} onChange={(e) => handleKelengkapanChange("kendaraan", item, "kondisi", e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black">
                            <option value="BAIK">✅ Baik</option>
                            <option value="RUSAK_RINGAN">⚠️ Rusak Ringan</option>
                            <option value="RUSAK_BERAT">❌ Rusak Berat</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={prevStep} className="px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition">← Kembali</button>
        <button type="button" onClick={nextStep} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">Lanjut ke Dokumen →</button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-700 p-4 rounded">
        <h3 className="font-bold text-blue-800 mb-2">📄 STNK</h3>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Masa Berlaku *</label>
          <input type="date" name="masaBerlakuSTNK" value={formData.masaBerlakuSTNK} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Foto STNK *</label>
          <div className="flex gap-2">
            <label className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center cursor-pointer flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Pilih File
              <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setFormData((prev) => ({ ...prev, fotoSTNK: reader.result as string })); reader.readAsDataURL(file); } }} className="hidden" />
            </label>
            <label className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center cursor-pointer flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Kamera
              <input type="file" accept="image/*" capture="environment" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setFormData((prev) => ({ ...prev, fotoSTNK: reader.result as string })); reader.readAsDataURL(file); } }} className="hidden" />
            </label>
          </div>
          {formData.fotoSTNK && typeof formData.fotoSTNK === 'string' && <img src={formData.fotoSTNK} alt="Preview STNK" className="mt-2 w-full h-32 object-cover rounded border" />}
        </div>
      </div>

      <div className="bg-green-50 border-l-4 border-green-700 p-4 rounded">
        <h3 className="font-bold text-green-800 mb-2">📄 KIR</h3>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Masa Berlaku *</label>
          <input type="date" name="masaBerlakuKIR" value={formData.masaBerlakuKIR} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-black" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Foto KIR *</label>
          <div className="flex gap-2">
            <label className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center cursor-pointer flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Pilih File
              <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setFormData((prev) => ({ ...prev, fotoKIR: reader.result as string })); reader.readAsDataURL(file); } }} className="hidden" />
            </label>
            <label className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center cursor-pointer flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Kamera
              <input type="file" accept="image/*" capture="environment" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setFormData((prev) => ({ ...prev, fotoKIR: reader.result as string })); reader.readAsDataURL(file); } }} className="hidden" />
            </label>
          </div>
          {formData.fotoKIR && typeof formData.fotoKIR === 'string' && <img src={formData.fotoKIR} alt="Preview KIR" className="mt-2 w-full h-32 object-cover rounded border" />}
        </div>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-700 p-4 rounded">
        <h3 className="font-bold text-yellow-800 mb-2">📄 SIM Petugas 1</h3>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Masa Berlaku *</label>
          <input type="date" name="masaBerlakuSIMPetugas1" value={formData.masaBerlakuSIMPetugas1} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-black" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Foto SIM *</label>
          <div className="flex gap-2">
            <label className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center cursor-pointer flex items-center justify-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Pilih File
              <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setFormData((prev) => ({ ...prev, fotoSIMPetugas1: reader.result as string })); reader.readAsDataURL(file); } }} className="hidden" />
            </label>
            <label className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center cursor-pointer flex items-center justify-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Kamera
              <input type="file" accept="image/*" capture="environment" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setFormData((prev) => ({ ...prev, fotoSIMPetugas1: reader.result as string })); reader.readAsDataURL(file); } }} className="hidden" />
            </label>
          </div>
          {formData.fotoSIMPetugas1 && typeof formData.fotoSIMPetugas1 === 'string' && <img src={formData.fotoSIMPetugas1} alt="Preview SIM 1" className="mt-2 w-full h-32 object-cover rounded border" />}
        </div>
        <h3 className="font-bold text-purple-800 mb-2">� SIM Petugas 2</h3>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Masa Berlaku *</label>
          <input type="date" name="masaBerlakuSIMPetugas2" value={formData.masaBerlakuSIMPetugas2} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Foto SIM *</label>
          <div className="flex gap-2">
            <label className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center cursor-pointer flex items-center justify-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Pilih File
              <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setFormData((prev) => ({ ...prev, fotoSIMPetugas2: reader.result as string })); reader.readAsDataURL(file); } }} className="hidden" />
            </label>
            <label className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center cursor-pointer flex items-center justify-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Kamera
              <input type="file" accept="image/*" capture="environment" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setFormData((prev) => ({ ...prev, fotoSIMPetugas2: reader.result as string })); reader.readAsDataURL(file); } }} className="hidden" />
            </label>
          </div>
          {formData.fotoSIMPetugas2 && typeof formData.fotoSIMPetugas2 === 'string' && <img src={formData.fotoSIMPetugas2} alt="Preview SIM 2" className="mt-2 w-full h-32 object-cover rounded border" />}
        </div>
      </div>

      <div className="bg-orange-50 border-l-4 border-orange-700 p-4 rounded">
        <h3 className="font-bold text-orange-800 mb-2">🔧 Service Terakhir</h3>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Service *</label>
          <input type="date" name="tanggalService" value={formData.tanggalService} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Foto Bukti Service *</label>
          <div className="flex gap-2">
            <label className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center cursor-pointer flex items-center justify-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Pilih File
              <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setFormData((prev) => ({ ...prev, fotoService: reader.result as string })); reader.readAsDataURL(file); } }} className="hidden" />
            </label>
            <label className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center cursor-pointer flex items-center justify-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Kamera
              <input type="file" accept="image/*" capture="environment" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setFormData((prev) => ({ ...prev, fotoService: reader.result as string })); reader.readAsDataURL(file); } }} className="hidden" />
            </label>
          </div>
          {formData.fotoService && typeof formData.fotoService === 'string' && <img src={formData.fotoService} alt="Preview Service" className="mt-2 w-full h-32 object-cover rounded border" />}
        </div>
      </div>

      <div className="bg-cyan-50 border-l-4 border-cyan-700 p-4 rounded">
        <h3 className="font-bold text-cyan-800 mb-2">⛽ BBM Terakhir</h3>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah BBM (BAR) *</label>
          <input 
            type="number" 
            name="jumlahBBM" 
            value={formData.jumlahBBM} 
            onChange={handleInputChange} 
            step="0.5"
            min="0"
            placeholder="Contoh: 1, 1.5, 2"
            required 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-black" 
          />
          <p className="text-xs text-gray-500 mt-1">* Masukkan jumlah dalam BAR (bisa desimal, contoh: 1.5)</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Foto Bukti BBM *</label>
          <div className="flex gap-2">
            <label className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center cursor-pointer flex items-center justify-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Pilih File
              <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setFormData((prev) => ({ ...prev, fotoBBM: reader.result as string })); reader.readAsDataURL(file); } }} className="hidden" />
            </label>
            <label className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center cursor-pointer flex items-center justify-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Kamera
              <input type="file" accept="image/*" capture="environment" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setFormData((prev) => ({ ...prev, fotoBBM: reader.result as string })); reader.readAsDataURL(file); } }} className="hidden" />
            </label>
          </div>
          {formData.fotoBBM && typeof formData.fotoBBM === 'string' && <img src={formData.fotoBBM} alt="Preview BBM" className="mt-2 w-full h-32 object-cover rounded border" />}
          <p className="text-xs text-gray-500 mt-1">* Upload foto bukti pengisian BBM terakhir</p>
        </div>
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={prevStep} className="px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition">← Kembali</button>
        <button type="button" onClick={nextStep} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">Lanjut ke Tanda Tangan →</button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="bg-indigo-50 border-l-4 border-indigo-700 p-4 rounded">
        <h3 className="font-bold text-indigo-800 mb-2">✍️ Tanda Tangan Digital Petugas 1</h3>
        <p className="text-sm text-indigo-700">Tanda tangani di area canvas menggunakan mouse atau sentuhan</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
          <canvas ref={canvasRef} width={600} height={200} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} className="border border-gray-300 rounded cursor-crosshair mx-auto bg-white" style={{ touchAction: 'none', maxWidth: '100%' }} />
        </div>

        <div className="flex gap-3 justify-center">
          <button type="button" onClick={clearSignature} className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition">🗑️ Hapus</button>
          <button type="button" onClick={saveSignature} disabled={!hasSignature} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:bg-gray-400">💾 Simpan Tanda Tangan</button>
        </div>

        {formData.ttdPetugas1 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium mb-2">✓ Tanda tangan Petugas 1 tersimpan</p>
            <img src={formData.ttdPetugas1} alt="Signature Petugas 1" className="border border-gray-300 rounded max-w-xs" />
          </div>
        )}
      </div>

      <div className="bg-purple-50 border-l-4 border-purple-700 p-4 rounded">
        <h3 className="font-bold text-purple-800 mb-2">✍️ Tanda Tangan Digital Petugas 2</h3>
        <p className="text-sm text-purple-700">Tanda tangani di area canvas menggunakan mouse atau sentuhan</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
          <canvas ref={canvasRef2} width={600} height={200} onMouseDown={startDrawing2} onMouseMove={draw2} onMouseUp={stopDrawing2} onMouseLeave={stopDrawing2} onTouchStart={startDrawing2} onTouchMove={draw2} onTouchEnd={stopDrawing2} className="border border-gray-300 rounded cursor-crosshair mx-auto bg-white" style={{ touchAction: 'none', maxWidth: '100%' }} />
        </div>

        <div className="flex gap-3 justify-center">
          <button type="button" onClick={clearSignature2} className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition">🗑️ Hapus</button>
          <button type="button" onClick={saveSignature2} disabled={!hasSignature2} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:bg-gray-400">💾 Simpan Tanda Tangan</button>
        </div>

        {formData.ttdPetugas2 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium mb-2">✓ Tanda tangan Petugas 2 tersimpan</p>
            <img src={formData.ttdPetugas2} alt="Signature Petugas 2" className="border border-gray-300 rounded max-w-xs" />
          </div>
        )}
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-700 p-6 rounded">
        <h4 className="font-bold text-blue-800 mb-3">📊 Ringkasan Inspeksi</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div><p className="text-gray-600">Petugas 1:</p><p className="font-semibold text-gray-800">{formData.namaPetugas1}</p></div>
          <div><p className="text-gray-600">Plat Nomor:</p><p className="font-semibold text-gray-800">{formData.platNomor}</p></div>
          <div><p className="text-gray-600">Lokasi:</p><p className="font-semibold text-gray-800">{formData.lokasiInspeksi}</p></div>
          <div><p className="text-gray-600">Kelengkapan Petugas:</p><p className="font-semibold text-gray-800">{Object.values(formData.kelengkapanSarana).filter(item => item?.ada).length} / {kelengkapanSaranaKamtib.length} item</p></div>
          <div><p className="text-gray-600">Kelengkapan Kendaraan:</p><p className="font-semibold text-gray-800">{Object.values(formData.kelengkapanKendaraan).filter(item => item?.ada).length} / {kelengkapanKendaraanUmum.length} item</p></div>
        </div>
      </div>

      <div className="flex justify-between gap-4">
        <button type="button" onClick={prevStep} className="px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition">← Kembali</button>
        <button type="button" onClick={() => setShowPreview(true)} disabled={loading || !formData.ttdPetugas1 || !formData.ttdPetugas2} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:bg-gray-400">👁️ Preview & Submit</button>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6 rounded-t-lg border-b-4 border-blue-600">
          <h2 className="text-2xl font-bold mb-2">PREVIEW DOKUMEN INSPEKSI</h2>
          <p className="text-gray-300 text-sm">Periksa kembali kelengkapan data sebelum mengirim ke Manager</p>
        </div>

        {/* Content - Preview Form untuk PDF */}
        <div className="p-8 max-h-[70vh] overflow-y-auto bg-white">
          <div className="border-2 border-black mb-4" style={{ fontFamily: 'Arial, sans-serif' }}>
            {/* Header dengan Logo Besar */}
            <div className="border-b-2 border-black">
              <div className="flex items-center gap-6 p-6">
                <div className="flex-shrink-0">
                  <img src="/logo/logo_jjc.png" alt="Logo Jasamarga" className="w-35 h-35 object-contain" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-black mb-2 uppercase" style={{ color: 'black' }}>
                    PT JASAMARGA JALANLAYANG CIKAMPEK
                  </h1>
                  <h2 className="text-base font-semibold text-black uppercase" style={{ color: 'black' }}>
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
                        <td className="py-1 text-black">: {new Date().toLocaleDateString('id-ID', { weekday: 'long' })}</td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-3 text-black font-medium">TANGGAL</td>
                        <td className="py-1 text-black">: {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="p-4">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr>
                        <td className="py-1 pr-3 text-black font-medium" style={{ width: '100px' }}>UNIT</td>
                        <td className="py-1 text-black">: <span className="font-bold">KAMTIB</span></td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-3 text-black font-medium">NO. POLISI</td>
                        <td className="py-1 text-black">: <span className="font-bold text-lg">{formData.platNomor || "-"}</span></td>
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

            {/* Kelengkapan Petugas */}
            <div className="bg-gray-200 border-b-2 border-black p-2 font-bold text-sm uppercase text-black" style={{ color: 'black' }}>
              KELENGKAPAN PETUGAS
            </div>
            {kelengkapanSaranaKamtib.map((item, index) => {
              const data = formData.kelengkapanSarana[item];
              return (
                <div key={index} className="grid grid-cols-12 border-b border-black text-xs">
                  <div className="col-span-1 p-2 text-center border-r border-black font-medium text-black">{index + 1}</div>
                  <div className="col-span-5 p-2 border-r border-black text-black">{item}</div>
                  <div className="col-span-2 border-r border-black">
                    <div className="grid grid-cols-2 h-full">
                      <div className="p-2 text-center border-r border-black flex items-center justify-center text-black">
                        {data?.ada ? "✓" : ""}
                      </div>
                      <div className="p-2 text-center flex items-center justify-center text-black">
                        {!data?.ada ? "✓" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1 p-2 text-center border-r border-black font-semibold text-black">
                    {data?.ada ? data.jumlah : "-"}
                  </div>
                  <div className="col-span-3">
                    <div className="grid grid-cols-3 h-full text-center">
                      <div className="p-2 border-r border-black flex items-center justify-center text-black">
                        {data?.ada && data?.kondisi === "BAIK" ? "✓" : ""}
                      </div>
                      <div className="p-2 border-r border-black flex items-center justify-center text-black">
                        {data?.ada && data?.kondisi === "RUSAK_RINGAN" ? "✓" : ""}
                      </div>
                      <div className="p-2 flex items-center justify-center text-black">
                        {data?.ada && data?.kondisi === "RUSAK_BERAT" ? "✓" : ""}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Kelengkapan Sarana */}
            <div className="bg-gray-200 border-b-2 border-black p-2 font-bold text-sm uppercase text-black" style={{ color: 'black' }}>
              KELENGKAPAN KENDARAAN
            </div>
            {kelengkapanKendaraanUmum.map((item, index) => {
              const data = formData.kelengkapanKendaraan[item];
              return (
                <div key={index} className="grid grid-cols-12 border-b border-black text-xs">
                  <div className="col-span-1 p-2 text-center border-r border-black font-medium text-black">{index + 1}</div>
                  <div className="col-span-5 p-2 border-r border-black text-black">{item}</div>
                  <div className="col-span-2 border-r border-black">
                    <div className="grid grid-cols-2 h-full">
                      <div className="p-2 text-center border-r border-black flex items-center justify-center text-black">
                        {data?.ada ? "✓" : ""}
                      </div>
                      <div className="p-2 text-center flex items-center justify-center text-black">
                        {!data?.ada ? "✓" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1 p-2 text-center border-r border-black font-semibold text-black">
                    {data?.ada ? data.jumlah : "-"}
                  </div>
                  <div className="col-span-3">
                    <div className="grid grid-cols-3 h-full text-center">
                      <div className="p-2 border-r border-black flex items-center justify-center text-black">
                        {data?.ada && data?.kondisi === "BAIK" ? "✓" : ""}
                      </div>
                      <div className="p-2 border-r border-black flex items-center justify-center text-black">
                        {data?.ada && data?.kondisi === "RUSAK_RINGAN" ? "✓" : ""}
                      </div>
                      <div className="p-2 flex items-center justify-center text-black">
                        {data?.ada && data?.kondisi === "RUSAK_BERAT" ? "✓" : ""}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Masa Berlaku Dokumen */}
            <div className="bg-gray-200 border-b-2 border-black p-2 font-bold text-sm uppercase text-black" style={{ color: 'black' }}>
              MASA BERLAKU DOKUMEN
            </div>
            <div className="border-b-2 border-black">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border-r border-black p-2 font-bold text-black">STNK</th>
                    <th className="border-r border-black p-2 font-bold text-black">KIR</th>
                    <th className="border-r border-black p-2 font-bold text-black">SIM Operator 1</th>
                    <th className="border-r border-black p-2 font-bold text-black">SIM Operator 2</th>
                    <th className="border-r border-black p-2 font-bold text-black">Service</th>
                    <th className="p-2 font-bold text-black">BBM</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-r border-black p-3 text-center text-black">
                      {formData.masaBerlakuSTNK ? new Date(formData.masaBerlakuSTNK).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }) : "-"}
                    </td>
                    <td className="border-r border-black p-3 text-center text-black">
                      {formData.masaBerlakuKIR ? new Date(formData.masaBerlakuKIR).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }) : "-"}
                    </td>
                    <td className="border-r border-black p-3 text-center text-black">
                      {formData.masaBerlakuSIMPetugas1 ? new Date(formData.masaBerlakuSIMPetugas1).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }) : "-"}
                    </td>
                    <td className="border-r border-black p-3 text-center text-black">
                      {formData.masaBerlakuSIMPetugas2 ? new Date(formData.masaBerlakuSIMPetugas2).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }) : "-"}
                    </td>
                    <td className="border-r border-black p-3 text-center text-black">
                      {formData.tanggalService ? new Date(formData.tanggalService).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }) : "-"}
                    </td>
                    <td className="p-3 text-center text-black">
                      {formData.jumlahBBM ? `${formData.jumlahBBM} BAR` : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tanda Tangan Petugas */}
            <div className="p-6 border-b-2 border-black">
              <div className="font-bold text-sm mb-4 uppercase text-black">NAMA PETUGAS</div>
              <div className="grid grid-cols-2 gap-12">
                {/* Petugas 1 */}
                <div className="text-center">
                  <div className="text-xs font-medium mb-2 text-black">Petugas 1</div>
                  <div className="p-4 min-h-[100px] flex items-center justify-center mb-3">
                    {formData.ttdPetugas1 ? (
                      <img src={formData.ttdPetugas1} alt="TTD" className="max-h-20" />
                    ) : (
                      <span className="text-gray-400 text-xs italic">( Tanda tangan )</span>
                    )}
                  </div>
                  <div className="border-t-2 border-black pt-2 font-bold text-black">
                    {formData.namaPetugas1}
                  </div>
                  <div className="text-xs mt-1 text-black">NIP: {formData.nipPetugas1 || "-"}</div>
                </div>

                {/* Petugas 2 */}
                <div className="text-center">
                  <div className="text-xs font-medium mb-2 text-black">Petugas 2</div>
                  <div className="p-4 min-h-[100px] flex items-center justify-center mb-3">
                    {formData.ttdPetugas2 ? (
                      <img src={formData.ttdPetugas2} alt="TTD Petugas 2" className="max-h-20" />
                    ) : (
                      <span className="text-gray-400 text-xs italic">( Tanda tangan )</span>
                    )}
                  </div>
                  <div className="border-t-2 border-black pt-2 font-bold text-black">
                    {formData.namaPetugas2 || "-"}
                  </div>
                  <div className="text-xs mt-1 text-black">NIP: {formData.nipPetugas2 || "-"}</div>
                </div>
              </div>
            </div>

            {/* Footer Approval */}
            <div className="grid grid-cols-2 border-t-2 border-black">
              <div className="border-r-2 border-black p-6 text-center">
                <div className="text-xs mb-2 uppercase font-medium text-black">PT JMTO</div>
                <div className="p-4 min-h-[80px] flex items-center justify-center mb-3">
                  <span className="text-gray-400 text-xs italic">( Tanda tangan )</span>
                </div>
                <div className="border-t-2 border-black pt-2 text-sm">
                  <div className="font-bold text-black">Manager Traffic</div>
                </div>
              </div>
              <div className="p-6 text-center">
                <div className="text-xs mb-2 uppercase font-medium text-black">PT JJC</div>
                <div className="p-4 min-h-[80px] flex items-center justify-center mb-3">
                  <span className="text-gray-400 text-xs italic">( Tanda tangan )</span>
                </div>
                <div className="border-t-2 border-black pt-2 text-sm">
                  <div className="font-bold text-black">NIK</div>
                </div>
              </div>
            </div>
          </div>

          {/* Halaman Lampiran - Bukti Dokumen */}
          {(formData.fotoSTNK || formData.fotoKIR || formData.fotoSIMPetugas1 || formData.fotoSIMPetugas2 || formData.fotoService || formData.fotoBBM) && (
            <>
              {/* Helper function to chunk photos into pages of 3 */}
              {(() => {
                const photos = [];
                if (formData.fotoSTNK) photos.push({ label: 'STNK', file: formData.fotoSTNK });
                if (formData.fotoKIR) photos.push({ label: 'KIR', file: formData.fotoKIR });
                if (formData.fotoSIMPetugas1) photos.push({ label: 'SIM Petugas 1', file: formData.fotoSIMPetugas1 });
                if (formData.fotoSIMPetugas2) photos.push({ label: 'SIM Petugas 2', file: formData.fotoSIMPetugas2 });
                if (formData.fotoService) photos.push({ label: 'Bukti Service', file: formData.fotoService });
                if (formData.fotoBBM) photos.push({ label: 'Bukti BBM', file: formData.fotoBBM });
                
                // Chunk into groups of 3
                const chunks = [];
                for (let i = 0; i < photos.length; i += 3) {
                  chunks.push(photos.slice(i, i + 3));
                }
                
                return chunks.map((chunk, pageIndex) => (
                  <div key={pageIndex} className="border-2 border-black mt-8 mb-4" style={{ fontFamily: 'Arial, sans-serif', pageBreakBefore: 'always' }}>
                    {/* Header Lampiran */}
                    <div className="border-b-2 border-black">
                      <div className="flex items-center gap-6 p-6">
                        <div className="flex-shrink-0">
                          <img src="/logo/logo_jjc.png" alt="Logo Jasamarga" className="w-35 h-35 object-contain" />
                        </div>
                        <div className="flex-1">
                          <h1 className="text-2xl font-bold text-black mb-2 uppercase" style={{ color: 'black' }}>
                            PT JASAMARGA JALANLAYANG CIKAMPEK
                          </h1>
                          <h2 className="text-base font-semibold text-black uppercase" style={{ color: 'black' }}>
                            Lampiran Bukti Dokumen - Halaman {pageIndex + 1}
                          </h2>
                        </div>
                      </div>
                    </div>

                    {/* Content Lampiran */}
                    <div className="p-6">
                      <div className="mb-4 text-sm text-black" style={{ color: 'black' }}>
                        <p><strong>No. Polisi:</strong> {formData.platNomor || "-"}</p>
                        <p><strong>Unit:</strong> KAMTIB</p>
                        <p><strong>Tanggal Inspeksi:</strong> {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                      </div>

                      <div className="space-y-6">
                        {chunk.map((photo, index) => (
                          <div key={index} className="border-2 border-gray-300 p-4 rounded">
                            <h3 className="font-bold text-sm mb-3 uppercase text-center bg-gray-200 p-2 text-black" style={{ color: 'black' }}>
                              Bukti Dokumen: {photo.label}
                            </h3>
                            <div className="flex justify-center items-center bg-gray-50 p-4" style={{ minHeight: '300px', maxHeight: '400px' }}>
                              {photo.file && (typeof photo.file === 'string' ? photo.file : photo.file instanceof File ? URL.createObjectURL(photo.file) : null) && (
                                <img 
                                  src={
                                    typeof photo.file === 'string' 
                                      ? photo.file 
                                      : URL.createObjectURL(photo.file)
                                  } 
                                  alt={`Foto ${photo.label}`} 
                                  className="max-w-full max-h-96 object-contain border border-gray-300"
                                />
                              )}
                            </div>
                            <p className="text-xs text-center mt-2 text-black italic" style={{ color: 'black' }}>
                              Foto dokumen {photo.label} - Kendaraan {formData.platNomor || "-"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="border-t-2 border-gray-300 p-6 bg-gray-50 rounded-b-lg flex justify-between">
          <button 
            type="button" 
            onClick={() => setShowPreview(false)}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition shadow"
          >
            ← KEMBALI
          </button>
          <button 
            type="button" 
            onClick={() => {
              setShowPreview(false);
              handleSubmit();
            }}
            disabled={loading}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition shadow disabled:bg-gray-400"
          >
            {loading ? "MENGIRIM..." : "KIRIM KE MANAGER"}
          </button>
        </div>
      </div>
    </div>
  );

  // Loading state untuk draft
  if (loadingDraft) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Memuat Draft...</h2>
          <p className="text-gray-600">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex justify-between items-start mb-4">
            <Link href="/dashboard/petugas-lapangan/inspeksi" className="inline-flex items-center text-white hover:text-indigo-100 transition">← Kembali ke Pilihan Kategori</Link>
            {localStorage.getItem('draft_kamtib') && (
              <button 
                onClick={() => {
                  if (confirm('Yakin ingin menghapus draft dan mulai dari awal?')) {
                    clearDraftFromLocal();
                    window.location.reload();
                  }
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition"
              >
                🗑️ Hapus Draft
              </button>
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2">🚔 Inspeksi Kendaraan Kamtib</h1>
          <p className="text-indigo-100">
            Isi formulir inspeksi untuk kendaraan keamanan dan ketertiban
          </p>
          {localStorage.getItem('draft_kamtib') && (
            <div className="mt-2 bg-indigo-500 bg-opacity-50 rounded px-3 py-2 text-sm">
              📝 Draft tersimpan - Data sebelumnya sudah dimuat
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${currentStep === step ? "bg-indigo-600 text-white" : currentStep > step ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>{currentStep > step ? "✓" : step}</div>
                {step < 4 && <div className={`w-16 md:w-32 h-1 mx-2 transition ${currentStep > step ? "bg-green-500" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-xs md:text-sm font-medium text-gray-600">
            <span>Informasi Dasar</span>
            <span>Kelengkapan</span>
            <span>Dokumen</span>
            <span>Tanda Tangan</span>
          </div>
        </div>

        <form onSubmit={(e) => e.preventDefault()}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </form>

        {/* Preview Modal */}
        {showPreview && renderPreview()}
        
        {/* Alert Modal */}
        {alertModal && (
          <AlertModal
            message={alertModal.message}
            type={alertModal.type}
            onClose={() => setAlertModal(null)}
          />
        )}
      </div>
    </div>
  );
}
