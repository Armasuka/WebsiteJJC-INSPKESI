import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { sendEmail, emailTemplateRekapManager } from "@/lib/emailService";

const prisma = new PrismaClient();

// GET: Ambil rekap untuk manager
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only managers can access
    if (session.user.role !== "MANAGER_TRAFFIC" && session.user.role !== "MANAGER_OPERATIONAL") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const isRead = searchParams.get("isRead");
    
    // Determine manager role
    const receiverRole = session.user.role === "MANAGER_TRAFFIC" ? "TRAFFIC" : "OPERATIONAL";

    // Build query
    const where: any = {
      receiverRole: receiverRole,
    };

    if (isRead !== null) {
      where.isRead = isRead === "true";
    }

    const rekaps = await prisma.rekapManager.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(rekaps);
  } catch (error) {
    console.error("Error fetching rekap:", error);
    return NextResponse.json(
      { error: "Failed to fetch rekap" },
      { status: 500 }
    );
  }
}

// POST: Kirim rekap dari petugas ke manager
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only petugas can send rekap
    if (session.user.role !== "PETUGAS_LAPANGAN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      judulRekap,
      periodeType,
      tanggalMulai,
      tanggalSelesai,
      kategoriKendaraan,
      receiverRole, // Will be ignored, always set to OPERATIONAL
      dataStatistik,
      catatan,
    } = body;

    // Validate required fields
    if (!judulRekap || !periodeType || !tanggalMulai || !tanggalSelesai) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Force receiverRole to OPERATIONAL only
    const finalReceiverRole = "OPERATIONAL";

    // Count total inspeksi dalam periode
    // Ambil semua yang sudah ter-ACC (minimal oleh Traffic)
    const whereClause: any = {
      status: {
        in: ["APPROVED_BY_TRAFFIC", "APPROVED_BY_OPERATIONAL"]
      },
      OR: [
        {
          approvedAtTraffic: {
            gte: new Date(tanggalMulai),
            lte: new Date(new Date(tanggalSelesai).setHours(23, 59, 59, 999)),
          },
        },
        {
          approvedAtOperational: {
            gte: new Date(tanggalMulai),
            lte: new Date(new Date(tanggalSelesai).setHours(23, 59, 59, 999)),
          },
        }
      ]
    };

    if (kategoriKendaraan && kategoriKendaraan !== "ALL") {
      whereClause.kategoriKendaraan = kategoriKendaraan;
    }

    console.log("📊 Querying inspeksi with whereClause:", JSON.stringify(whereClause, null, 2));

    const totalInspeksi = await prisma.inspeksi.count({
      where: whereClause,
    });

    console.log("📊 Total inspeksi found:", totalInspeksi);

    // Get breakdown per kategori
    const breakdown = await prisma.inspeksi.groupBy({
      by: ["kategoriKendaraan"],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    console.log("📊 Breakdown per kategori:", breakdown);

    const statistik = {
      totalInspeksi,
      breakdown: breakdown.map((item) => ({
        kategori: item.kategoriKendaraan,
        count: item._count.id,
      })),
      ...dataStatistik,
    };

    // Determine which managers to send to - Always OPERATIONAL only
    const receivers = ["OPERATIONAL"] as const;

    // Create rekap for each receiver
    const createdRekaps = await Promise.all(
      receivers.map((role) =>
        prisma.rekapManager.create({
          data: {
            judulRekap,
            periodeType,
            tanggalMulai: new Date(tanggalMulai),
            tanggalSelesai: new Date(tanggalSelesai),
            kategoriKendaraan: kategoriKendaraan === "ALL" ? null : kategoriKendaraan,
            totalInspeksi,
            dataStatistik: statistik,
            pengirimId: session.user.id,
            namaPengirim: session.user.name || "Unknown",
            receiverRole: "OPERATIONAL", // Always OPERATIONAL
            catatan,
          },
        })
      )
    );

    // Send email notifications to managers
    if (process.env.EMAIL_ENABLED === "true") {
      for (const rekap of createdRekaps) {
        try {
          // Get manager email - always MANAGER_OPERATIONAL
          const managers = await prisma.user.findMany({
            where: { role: "MANAGER_OPERATIONAL" },
            select: { email: true, name: true },
          });

          // Send email to all managers with this role
          for (const manager of managers) {
            const emailHtml = emailTemplateRekapManager({
              managerName: manager.name || "Manager",
              managerRole: rekap.receiverRole as 'TRAFFIC' | 'OPERATIONAL',
              judulRekap: rekap.judulRekap,
              periodeType: rekap.periodeType,
              tanggalMulai: new Date(rekap.tanggalMulai).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              }),
              tanggalSelesai: new Date(rekap.tanggalSelesai).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              }),
              kategoriKendaraan: rekap.kategoriKendaraan,
              totalInspeksi: rekap.totalInspeksi,
              namaPengirim: rekap.namaPengirim,
              catatan: rekap.catatan || undefined,
            });

            await sendEmail({
              to: manager.email,
              subject: `📊 Laporan Rekap Inspeksi Baru - ${rekap.judulRekap}`,
              html: emailHtml,
            });

            console.log(`✅ Email rekap sent to ${manager.email} (MANAGER_OPERATIONAL)`);
          }
        } catch (emailError) {
          console.error("❌ Error sending rekap email:", emailError);
          // Don't throw error, continue with response
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Rekap berhasil dikirim ke manager",
      rekaps: createdRekaps,
    });
  } catch (error) {
    console.error("Error creating rekap:", error);
    return NextResponse.json(
      { error: "Failed to create rekap" },
      { status: 500 }
    );
  }
}

// PATCH: Mark rekap as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "MANAGER_TRAFFIC" && session.user.role !== "MANAGER_OPERATIONAL") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { rekapId } = body;

    if (!rekapId) {
      return NextResponse.json({ error: "Rekap ID required" }, { status: 400 });
    }

    const updatedRekap = await prisma.rekapManager.update({
      where: { id: rekapId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json(updatedRekap);
  } catch (error) {
    console.error("Error updating rekap:", error);
    return NextResponse.json(
      { error: "Failed to update rekap" },
      { status: 500 }
    );
  }
}
