import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Get rekap detail with inspeksi data
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only MANAGER_OPERATIONAL can view rekap
    if (session.user.role !== "MANAGER_OPERATIONAL") {
      return NextResponse.json(
        { error: "Forbidden - Only Manager Operational can view rekap" },
        { status: 403 }
      );
    }

    const rekapId = params.id;

    // Get rekap data
    const rekap = await prisma.rekapManager.findUnique({
      where: { id: rekapId },
    });

    if (!rekap) {
      return NextResponse.json({ error: "Rekap not found" }, { status: 404 });
    }

    // Get inspeksi data in the period
    const whereClause: any = {
      status: {
        in: ["APPROVED_BY_TRAFFIC", "APPROVED_BY_OPERATIONAL"],
      },
      OR: [
        {
          approvedAtTraffic: {
            gte: new Date(rekap.tanggalMulai),
            lte: new Date(new Date(rekap.tanggalSelesai).setHours(23, 59, 59, 999)),
          },
        },
        {
          approvedAtOperational: {
            gte: new Date(rekap.tanggalMulai),
            lte: new Date(new Date(rekap.tanggalSelesai).setHours(23, 59, 59, 999)),
          },
        },
      ],
    };

    if (rekap.kategoriKendaraan && rekap.kategoriKendaraan !== "ALL") {
      whereClause.kategoriKendaraan = rekap.kategoriKendaraan;
    }

    const inspeksiList = await prisma.inspeksi.findMany({
      where: whereClause,
      include: {
        petugas: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        tanggalInspeksi: "desc",
      },
    });

    // Calculate statistics
    const stats = {
      totalInspeksi: inspeksiList.length,
      byKategori: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byPetugas: {} as Record<string, number>,
    };

    inspeksiList.forEach((inspeksi) => {
      // By kategori
      stats.byKategori[inspeksi.kategoriKendaraan] = 
        (stats.byKategori[inspeksi.kategoriKendaraan] || 0) + 1;

      // By status
      stats.byStatus[inspeksi.status] = 
        (stats.byStatus[inspeksi.status] || 0) + 1;

      // By petugas
      const petugasName = inspeksi.petugas.name;
      stats.byPetugas[petugasName] = 
        (stats.byPetugas[petugasName] || 0) + 1;
    });

    return NextResponse.json({
      rekap,
      inspeksiList,
      statistics: stats,
    });
  } catch (error) {
    console.error("Error fetching rekap detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch rekap detail" },
      { status: 500 }
    );
  }
}
