import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const kategori = searchParams.get("kategori");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let where: any = {};

    // Filter berdasarkan role
    if (session.user.role === "PETUGAS_LAPANGAN") {
      where.petugasId = session.user.id;
    }

    // Filter berdasarkan status
    if (status && status !== "ALL") {
      where.status = status;
    }

    // Filter berdasarkan kategori
    if (kategori && kategori !== "ALL") {
      where.kategoriKendaraan = kategori;
    }

    // Search by nomor kendaraan (plat nomor)
    if (search) {
      where.nomorKendaraan = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Filter by date range
    if (startDate && endDate) {
      where.tanggalInspeksi = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z')
      };
    }

    // Fetch all data for export
    const inspeksi = await prisma.inspeksi.findMany({
      where,
      select: {
        id: true,
        kategoriKendaraan: true,
        nomorKendaraan: true,
        lokasiInspeksi: true,
        tanggalInspeksi: true,
        namaPetugas: true,
        nipPetugas: true,
        namaPetugas2: true,
        nipPetugas2: true,
        nomorSTNK: true,
        masaBerlakuSTNK: true,
        nomorKIR: true,
        masaBerlakuKIR: true,
        status: true,
        catatan: true,
        createdAt: true,
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

    // Convert to CSV format
    const csvRows = [];
    
    // Header
    csvRows.push([
      'No',
      'Tanggal Inspeksi',
      'Kategori',
      'Nomor Kendaraan',
      'Lokasi',
      'Petugas 1',
      'NIP Petugas 1',
      'Petugas 2',
      'NIP Petugas 2',
      'Nomor STNK',
      'Masa Berlaku STNK',
      'Nomor KIR',
      'Masa Berlaku KIR',
      'Status',
      'Catatan',
      'Dibuat Oleh',
      'Email Petugas',
    ].join(','));

    // Data rows
    inspeksi.forEach((item, index) => {
      const formatDate = (date: Date | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('id-ID');
      };

      const statusMap: Record<string, string> = {
        DRAFT: 'Draft',
        SUBMITTED: 'Menunggu Manager Traffic',
        APPROVED_BY_TRAFFIC: 'Menunggu Manager Ops',
        APPROVED_BY_OPERATIONAL: 'Approved',
        REJECTED: 'Ditolak',
      };

      csvRows.push([
        index + 1,
        formatDate(item.tanggalInspeksi),
        item.kategoriKendaraan,
        `"${item.nomorKendaraan}"`, // Quote to preserve format
        `"${item.lokasiInspeksi}"`,
        `"${item.namaPetugas}"`,
        `"${item.nipPetugas}"`,
        item.namaPetugas2 ? `"${item.namaPetugas2}"` : '-',
        item.nipPetugas2 ? `"${item.nipPetugas2}"` : '-',
        item.nomorSTNK ? `"${item.nomorSTNK}"` : '-',
        formatDate(item.masaBerlakuSTNK),
        item.nomorKIR ? `"${item.nomorKIR}"` : '-',
        formatDate(item.masaBerlakuKIR),
        statusMap[item.status] || item.status,
        item.catatan ? `"${item.catatan.replace(/"/g, '""')}"` : '-', // Escape quotes
        `"${item.petugas.name}"`,
        item.petugas.email,
      ].join(','));
    });

    const csv = csvRows.join('\n');
    
    // Add BOM for Excel to recognize UTF-8
    const csvWithBOM = '\uFEFF' + csv;
    
    const filename = `inspeksi_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvWithBOM, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting inspeksi:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
