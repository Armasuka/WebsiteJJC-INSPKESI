"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (role === "MANAGER_TRAFFIC") {
        router.push("/dashboard/manager-traffic");
      } else if (role === "MANAGER_OPERATIONAL") {
        router.push("/dashboard/manager-operational");
      } else if (role === "PETUGAS_LAPANGAN") {
        router.push("/dashboard/petugas-lapangan");
      }
    }
  }, [status, session, router]);

  return (
    <div className="text-center py-12">
      <div className="text-lg text-gray-600">Redirecting...</div>
    </div>
  );
}

