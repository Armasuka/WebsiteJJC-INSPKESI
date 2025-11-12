"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        email: session.user.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    // Validasi password jika ingin ganti password
    if (showPasswordFields) {
      if (!formData.currentPassword) {
        setMessage({ type: "error", text: "Password lama harus diisi" });
        setLoading(false);
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setMessage({ type: "error", text: "Password baru tidak cocok" });
        setLoading(false);
        return;
      }
      if (formData.newPassword.length < 6) {
        setMessage({ type: "error", text: "Password baru minimal 6 karakter" });
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        currentPassword: showPasswordFields ? formData.currentPassword : undefined,
        newPassword: showPasswordFields ? formData.newPassword : undefined,
      };

      console.log("📤 Sending update request:", { 
        name: payload.name, 
        email: payload.email, 
        changingPassword: !!payload.newPassword 
      });

      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("📥 Response:", { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengupdate profil");
      }

      // Update session dengan data baru
      await update({
        ...session,
        user: {
          ...session?.user,
          name: formData.name,
          email: formData.email,
        },
      });

      console.log("✅ Profile updated successfully");
      setMessage({ type: "success", text: "Profil berhasil diupdate" });
      
      // Reset password fields
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordFields(false);

      // Redirect ke dashboard setelah 2 detik
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error: any) {
      console.error("❌ Error updating profile:", error);
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  const userRole = (session.user as any)?.role;
  const getRoleDisplay = (role: string) => {
    const roles: Record<string, string> = {
      MANAGER_TRAFFIC: "Manager Traffic",
      MANAGER_OPERATIONAL: "Manager Operational",
      PETUGAS_LAPANGAN: "Petugas Lapangan",
    };
    return roles[role] || role;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Kembali</span>
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Kelola informasi profil dan keamanan akun Anda
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* User Info Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 sm:px-8 py-8 sm:py-10">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl sm:text-3xl shadow-lg flex-shrink-0">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                {session.user.name}
              </h2>
              <p className="text-sm sm:text-base text-blue-100 mt-1">
                {getRoleDisplay(userRole)}
              </p>
              <p className="text-xs sm:text-sm text-blue-200 mt-1 truncate">
                {session.user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Message Alert */}
          {message.text && (
            <div
              className={`p-4 rounded-lg border ${
                message.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {message.type === "success" ? (
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="text-sm font-medium">{message.text}</span>
              </div>
            </div>
          )}

          {/* Informasi Dasar */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Informasi Dasar
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Masukkan email"
                />
              </div>

              {/* Jabatan - Read Only */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jabatan
                </label>
                <div className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-600">
                  {getRoleDisplay(userRole)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Jabatan hanya dapat diubah oleh Manager Operational
                </p>
              </div>
            </div>
          </div>

          {/* Keamanan */}
          <div className="space-y-4 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Keamanan
              </h3>
              <button
                type="button"
                onClick={() => setShowPasswordFields(!showPasswordFields)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                {showPasswordFields ? "Batal Ganti Password" : "Ganti Password"}
              </button>
            </div>

            {showPasswordFields && (
              <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 rounded-lg">
                {/* Password Lama */}
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Password Lama <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Masukkan password lama"
                  />
                </div>

                {/* Password Baru */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Password Baru <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Minimal 6 karakter"
                  />
                </div>

                {/* Konfirmasi Password Baru */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Konfirmasi Password Baru <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Ulangi password baru"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menyimpan...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Info Card */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Informasi Penting</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Pastikan email Anda valid untuk notifikasi sistem</li>
              <li>• Password minimal 6 karakter untuk keamanan</li>
              <li>• Perubahan jabatan hanya dapat dilakukan oleh Manager Operational</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
