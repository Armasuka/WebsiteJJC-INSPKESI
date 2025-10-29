"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Komentar {
  id: string;
  inspeksiId: string;
  pengirimId: string;
  namaPengirim: string;
  rolePengirim: string;
  isiKomentar: string;
  createdAt: string;
  updatedAt: string;
}

interface KomentarSectionProps {
  inspeksiId: string;
}

export default function KomentarSection({ inspeksiId }: KomentarSectionProps) {
  const { data: session } = useSession();
  const [komentarList, setKomentarList] = useState<Komentar[]>([]);
  const [newKomentar, setNewKomentar] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Fetch komentar
  const fetchKomentar = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/inspeksi/${inspeksiId}/komentar`);
      if (response.ok) {
        const data = await response.json();
        setKomentarList(data);
      }
    } catch (error) {
      console.error("Error fetching komentar:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKomentar();
  }, [inspeksiId]);

  // Submit komentar baru
  const handleSubmitKomentar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newKomentar.trim()) return;

    try {
      setLoadingSubmit(true);
      const response = await fetch(`/api/inspeksi/${inspeksiId}/komentar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isiKomentar: newKomentar }),
      });

      if (response.ok) {
        setNewKomentar("");
        fetchKomentar(); // Refresh list
      } else {
        const error = await response.json();
        alert(error.error || "Gagal mengirim komentar");
      }
    } catch (error) {
      console.error("Error submitting komentar:", error);
      alert("Gagal mengirim komentar");
    } finally {
      setLoadingSubmit(false);
    }
  };

  // Helper untuk styling berdasarkan role
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "MANAGER_TRAFFIC":
        return <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">Manager Traffic</span>;
      case "MANAGER_OPERATIONAL":
        return <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-medium">Manager Operasional</span>;
      case "PETUGAS_LAPANGAN":
        return <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">Petugas Lapangan</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full font-medium">{role}</span>;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "MANAGER_TRAFFIC":
        return "border-l-4 border-blue-500 bg-blue-50";
      case "MANAGER_OPERATIONAL":
        return "border-l-4 border-purple-500 bg-purple-50";
      case "PETUGAS_LAPANGAN":
        return "border-l-4 border-green-500 bg-green-50";
      default:
        return "border-l-4 border-gray-500 bg-gray-50";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
        Komunikasi & Komentar
        <span className="text-sm font-normal text-gray-500">({komentarList.length})</span>
      </h3>

      {/* List Komentar */}
      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-4 text-gray-500">Memuat komentar...</div>
        ) : komentarList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Belum ada komentar. Mulai komunikasi dengan menambahkan komentar pertama.
          </div>
        ) : (
          komentarList.map((komentar) => (
            <div key={komentar.id} className={`p-4 rounded-lg ${getRoleColor(komentar.rolePengirim)}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800">{komentar.namaPengirim}</p>
                  {getRoleBadge(komentar.rolePengirim)}
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(komentar.createdAt).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{komentar.isiKomentar}</p>
            </div>
          ))
        )}
      </div>

      {/* Form Tambah Komentar */}
      {session && (
        <form onSubmit={handleSubmitKomentar} className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tambah Komentar Baru
          </label>
          <textarea
            value={newKomentar}
            onChange={(e) => setNewKomentar(e.target.value)}
            placeholder="Tulis komentar atau catatan..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black resize-none"
            rows={3}
            disabled={loadingSubmit}
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={loadingSubmit || !newKomentar.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loadingSubmit ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Mengirim...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                  Kirim Komentar
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
