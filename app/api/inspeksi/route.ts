import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PETUGAS_LAPANGAN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Helper function untuk konversi date yang aman
    const parseDate = (dateString: string | null | undefined) => {
      if (!dateString || dateString.trim() === '') return null;
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    };

    // Mapping field dari form ke database schema
    // Form menggunakan nama field yang berbeda-beda
    const kategoriKendaraan = body.kategori || body.kategoriKendaraan;
    const nomorKendaraan = body.platNomor || body.nomorKendaraan || '-';
    const lokasiInspeksi = body.lokasiInspeksi || 
      (body.latitude && body.longitude ? `Lat: ${body.latitude}, Long: ${body.longitude}` : '') || 
      '-';
    const namaPetugas = body.namaPetugas1 || body.namaPetugas || '-';
    const nipPetugas = body.nipPetugas1 || body.nipPetugas || '-';
    const kondisiKendaraan = body.kondisiKendaraan || "BAIK";
    const kilometerKendaraan = body.kilometerKendaraan ? parseInt(body.kilometerKendaraan) : 0;
    const fotoIdCard = body.fotoIdCard || null;
    const fotoSeragam = body.fotoSeragam || null;
    const fotoBodi = body.fotoKendaraan || body.fotoBodi || null;
    const kelengkapanKendaraan = body.kelengkapanKendaraan || body.kelengkapanSarana || {};

    // Prepare dataKhusus - save all specific form data here
    const dataKhusus = {
      // Petugas data
      namaPetugas1: body.namaPetugas1,
      nipPetugas1: body.nipPetugas1,
      namaPetugas2: body.namaPetugas2,
      nipPetugas2: body.nipPetugas2,
      ttdPetugas1: body.ttdPetugas1 || null,
      ttdPetugas2: body.ttdPetugas2 || null,
      
      // Kendaraan data
      merkKendaraan: body.merkKendaraan,
      tahunKendaraan: body.tahunKendaraan,
      warnaBahan: body.warnaBahan,
      platNomor: body.platNomor,
      
      // Kelengkapan
      kelengkapanSarana: body.kelengkapanSarana || {},
      kelengkapanKendaraan: body.kelengkapanKendaraan || {},
      
      // Masa Berlaku Dokumen
      masaBerlakuSTNK: body.masaBerlakuSTNK,
      masaBerlakuKIR: body.masaBerlakuKIR,
      masaBerlakuSIMPetugas1: body.masaBerlakuSIMPetugas1,
      masaBerlakuSIMPetugas2: body.masaBerlakuSIMPetugas2,
      tanggalService: body.tanggalService, // FIXED: use tanggalService not masaBerlakuService
      jumlahBBM: body.jumlahBBM, // FIXED: use jumlahBBM not masaBerlakuBBM
      
      // Foto Dokumen
      fotoSTNK: body.fotoSTNK,
      fotoKIR: body.fotoKIR,
      fotoSIMPetugas1: body.fotoSIMPetugas1,
      fotoSIMPetugas2: body.fotoSIMPetugas2,
      fotoService: body.fotoService,
      fotoBBM: body.fotoBBM,
      
      // Lokasi data
      latitude: body.latitude,
      longitude: body.longitude,
      lokasiInspeksi: body.lokasiInspeksi,
      
      // Other data
      catatan: body.catatan,
      
      // Other specific data per kategori
      ...body.dataKhususLainnya,
    };

    // Log data untuk debugging
    console.log("=== INSPEKSI API DEBUG ===");
    console.log("Body kategori:", body.kategori);
    console.log("Body kategoriKendaraan:", body.kategoriKendaraan);
    console.log("Kategori yang disimpan:", kategoriKendaraan);
    console.log("Data yang akan disimpan:", {
      kategoriKendaraan,
      nomorKendaraan,
      lokasiInspeksi,
      namaPetugas,
      nipPetugas,
      status: body.status,
      hasDataKhusus: !!dataKhusus,
      hasTTD1: !!body.ttdPetugas1,
      hasTTD2: !!body.ttdPetugas2,
      hasTanggalService: !!body.tanggalService,
      hasJumlahBBM: !!body.jumlahBBM,
    });
    console.log("=========================");

    const inspeksi = await prisma.inspeksi.create({
      data: {
        kategoriKendaraan,
        nomorKendaraan,
        lokasiInspeksi,
        namaPetugas,
        nipPetugas,
        
        // Petugas 2 (jika ada)
        namaPetugas2: body.namaPetugas2 || null,
        nipPetugas2: body.nipPetugas2 || null,
        
        // Dokumen STNK
        nomorSTNK: body.nomorSTNK || null,
        masaBerlakuSTNK: parseDate(body.masaBerlakuSTNK) as any,
        fotoSTNK: body.fotoSTNK || null,
        
        // Dokumen KIR
        nomorKIR: body.nomorKIR || null,
        masaBerlakuKIR: parseDate(body.masaBerlakuKIR) as any,
        fotoKIR: body.fotoKIR || null,
        
        // SIM Petugas
        masaBerlakuSIMPetugas1: parseDate(body.masaBerlakuSIMPetugas1) as any,
        fotoSIMPetugas1: body.fotoSIMPetugas1 || null,
        masaBerlakuSIMPetugas2: parseDate(body.masaBerlakuSIMPetugas2) as any,
        fotoSIMPetugas2: body.fotoSIMPetugas2 || null,
        
        // Service dan BBM
        tanggalService: parseDate(body.tanggalService) as any,
        fotoService: body.fotoService || null,
        jumlahBBM: body.jumlahBBM || null,
        fotoBBM: body.fotoBBM || null,
        
        // Data khusus dan kelengkapan
        kelengkapanKendaraan,
        dataKhusus: dataKhusus as any, // Save all specific data here
        catatan: body.catatan || null,
        status: body.status,
        needsApproval: body.status === "SUBMITTED",
        petugasId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      inspeksi,
      message: body.status === "DRAFT" 
        ? "Draft berhasil disimpan" 
        : "Inspeksi berhasil dikirim ke Manager Traffic",
    });
  } catch (error) {
    console.error("Error creating inspeksi:", error);
    
    // Log detail error untuk debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    let where: any = {};

    // Filter berdasarkan role
    if (session.user.role === "PETUGAS_LAPANGAN") {
      where.petugasId = session.user.id;
    }

    // Filter berdasarkan status
    if (status) {
      where.status = status;
    }

    // Filter berdasarkan kategori
    if (kategori) {
      where.kategoriKendaraan = kategori;
    }

    // Optimasi: Select only necessary fields untuk list view
    const inspeksi = await prisma.inspeksi.findMany({
      where,
      select: {
        id: true,
        kategoriKendaraan: true,
        nomorKendaraan: true,
        lokasiInspeksi: true,
        tanggalInspeksi: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        approvedAtTraffic: true,
        approvedAtOperational: true,
        ttdManagerTraffic: true,
        ttdManagerOperasional: true,
        rejectionNote: true,
        rejectedBy: true,
        dataKhusus: true,
        petugas: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: skip,
    });

    // Get total count for pagination
    const total = await prisma.inspeksi.count({ where });

    return NextResponse.json({
      data: inspeksi,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, {
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error("Error fetching inspeksi:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
