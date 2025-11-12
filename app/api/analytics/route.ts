import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Get analytics data for manager operational
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only MANAGER_OPERATIONAL can access
    if (session.user.role !== "MANAGER_OPERATIONAL") {
      return NextResponse.json(
        { error: "Forbidden - Only Manager Operational can access analytics" },
        { status: 403 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const kategori = searchParams.get("kategori");

    // Build where clause
    const whereClause: any = {};

    // Date filter
    if (startDate && endDate) {
      whereClause.tanggalInspeksi = {
        gte: new Date(startDate),
        lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    // Kategori filter
    if (kategori && kategori !== "ALL") {
      whereClause.kategoriKendaraan = kategori;
    }

    // Get all inspeksi with status filter
    const [approvedInspeksi, rejectedInspeksi, allInspeksi] = await Promise.all([
      // Approved (both traffic and operational)
      prisma.inspeksi.findMany({
        where: {
          ...whereClause,
          status: {
            in: ["APPROVED_BY_TRAFFIC", "APPROVED_BY_OPERATIONAL"],
          },
        },
        include: {
          petugas: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          tanggalInspeksi: "desc",
        },
      }),
      // Rejected
      prisma.inspeksi.findMany({
        where: {
          ...whereClause,
          status: "REJECTED",
        },
        include: {
          petugas: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          tanggalInspeksi: "desc",
        },
      }),
      // All for comparison
      prisma.inspeksi.findMany({
        where: whereClause,
        select: {
          id: true,
          status: true,
          kategoriKendaraan: true,
        },
      }),
    ]);

    // Calculate statistics
    const stats = {
      total: allInspeksi.length,
      approved: approvedInspeksi.length,
      rejected: rejectedInspeksi.length,
      approvedByTraffic: approvedInspeksi.filter(
        (i) => i.status === "APPROVED_BY_TRAFFIC"
      ).length,
      approvedByOperational: approvedInspeksi.filter(
        (i) => i.status === "APPROVED_BY_OPERATIONAL"
      ).length,
    };

    // Group by kategori
    const byKategori = {
      approved: {} as Record<string, number>,
      rejected: {} as Record<string, number>,
    };

    approvedInspeksi.forEach((inspeksi) => {
      const kategori = inspeksi.kategoriKendaraan;
      byKategori.approved[kategori] = (byKategori.approved[kategori] || 0) + 1;
    });

    rejectedInspeksi.forEach((inspeksi) => {
      const kategori = inspeksi.kategoriKendaraan;
      byKategori.rejected[kategori] = (byKategori.rejected[kategori] || 0) + 1;
    });

    // Group by petugas - Approved
    const petugasApproved: Record<
      string,
      { name: string; email: string; count: number }
    > = {};

    approvedInspeksi.forEach((inspeksi) => {
      const petugasId = inspeksi.petugas.id;
      if (!petugasApproved[petugasId]) {
        petugasApproved[petugasId] = {
          name: inspeksi.petugas.name,
          email: inspeksi.petugas.email,
          count: 0,
        };
      }
      petugasApproved[petugasId].count++;
    });

    // Group by petugas - Rejected
    const petugasRejected: Record<
      string,
      { name: string; email: string; count: number }
    > = {};

    rejectedInspeksi.forEach((inspeksi) => {
      const petugasId = inspeksi.petugas.id;
      if (!petugasRejected[petugasId]) {
        petugasRejected[petugasId] = {
          name: inspeksi.petugas.name,
          email: inspeksi.petugas.email,
          count: 0,
        };
      }
      petugasRejected[petugasId].count++;
    });

    // Convert to arrays and sort
    const topPetugasApproved = Object.values(petugasApproved)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topPetugasRejected = Object.values(petugasRejected)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Group by month (last 6 months)
    const monthlyData: Record<
      string,
      { approved: number; rejected: number }
    > = {};

    [...approvedInspeksi, ...rejectedInspeksi].forEach((inspeksi) => {
      const month = new Date(inspeksi.tanggalInspeksi).toLocaleDateString(
        "id-ID",
        {
          year: "numeric",
          month: "short",
        }
      );

      if (!monthlyData[month]) {
        monthlyData[month] = { approved: 0, rejected: 0 };
      }

      if (inspeksi.status === "REJECTED") {
        monthlyData[month].rejected++;
      } else {
        monthlyData[month].approved++;
      }
    });

    return NextResponse.json({
      stats,
      byKategori,
      topPetugasApproved,
      topPetugasRejected,
      monthlyData,
      approvedList: approvedInspeksi,
      rejectedList: rejectedInspeksi,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
