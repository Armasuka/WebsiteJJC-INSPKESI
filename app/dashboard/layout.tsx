"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/auth/login" });
  };

  const getRoleDisplay = (role: string) => {
    const roles: Record<string, string> = {
      MANAGER_TRAFFIC: "Manager Traffic",
      MANAGER_OPERATIONAL: "Manager Operational",
      PETUGAS_LAPANGAN: "Petugas Lapangan",
    };
    return roles[role] || role;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 relative">
              <Image
                src="/logo/logo_jjc.png"
                alt="Jasa Marga"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-700">Jasa Marga</h1>
              <p className="text-xs text-gray-500">Sistem Inspeksi Jalan Tol</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="font-semibold text-gray-800">{session?.user?.name}</p>
              <p className="text-sm text-blue-700 font-medium">
                {getRoleDisplay((session?.user as any)?.role)}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
