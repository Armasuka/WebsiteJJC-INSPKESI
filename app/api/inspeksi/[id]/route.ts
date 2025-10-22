import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log("GET /api/inspeksi/[id]: No session found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const params = await context.params;
    console.log("GET /api/inspeksi/[id]:", params.id, "by user:", session.user.email);
    
    const inspeksi = await prisma.inspeksi.findUnique({
      where: { id: params.id },
      include: {
        petugas: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!inspeksi) {
      console.log("Inspeksi not found:", params.id);
      return NextResponse.json(
        { error: "Inspeksi not found" },
        { status: 404 }
      );
    }

    // Petugas hanya bisa lihat inspeksinya sendiri
    if (
      session.user.role === "PETUGAS_LAPANGAN" &&
      inspeksi.petugasId !== session.user.id
    ) {
      console.log("Forbidden access:", session.user.id, "trying to access", inspeksi.petugasId);
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    console.log("Returning inspeksi data for:", params.id);
    return NextResponse.json(inspeksi);
  } catch (error) {
    console.error("Error fetching inspeksi:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const body = await request.json();
    const { action, ...updateData } = body;

    const inspeksi = await prisma.inspeksi.findUnique({
      where: { id: params.id },
    });

    if (!inspeksi) {
      return NextResponse.json(
        { error: "Inspeksi not found" },
        { status: 404 }
      );
    }

    // Handle approval/rejection oleh Manager Traffic
    if (action === "approve_traffic" && session.user.role === "MANAGER_TRAFFIC") {
      const updated = await prisma.inspeksi.update({
        where: { id: params.id },
        data: {
          status: "APPROVED_BY_TRAFFIC",
          approvedByTraffic: session.user.id,
          approvedAtTraffic: new Date(),
          ttdManagerTraffic: updateData.ttdManagerTraffic || null,
        },
      });
      return NextResponse.json({
        success: true,
        inspeksi: updated,
        message: "Inspeksi berhasil disetujui oleh Manager Traffic",
      });
    }

    if (action === "approve_operational" && session.user.role === "MANAGER_OPERATIONAL") {
      // Pastikan sudah disetujui Manager Traffic dulu
      if (inspeksi.status !== "APPROVED_BY_TRAFFIC") {
        return NextResponse.json(
          { error: "Inspeksi harus disetujui oleh Manager Traffic terlebih dahulu" },
          { status: 400 }
        );
      }

      const updated = await prisma.inspeksi.update({
        where: { id: params.id },
        data: {
          status: "APPROVED_BY_OPERATIONAL",
          approvedByOperational: session.user.id,
          approvedAtOperational: new Date(),
          ttdManagerOperasional: updateData.ttdManagerOperasional || null,
        },
      });
      
      // Auto-generate PDF akan dilakukan by client side atau manual trigger
      // karena jsPDF tidak work well di server side Next.js
      
      return NextResponse.json({
        success: true,
        inspeksi: updated,
        message: "Inspeksi berhasil disetujui oleh Manager Operational. Silakan generate PDF.",
      });
    }

    // Legacy support untuk "approve" action (tanpa tanda tangan)
    if (action === "approve" && session.user.role === "MANAGER_TRAFFIC") {
      const updated = await prisma.inspeksi.update({
        where: { id: params.id },
        data: {
          status: "APPROVED_BY_TRAFFIC",
          approvedByTraffic: session.user.id,
          approvedAtTraffic: new Date(),
        },
      });
      return NextResponse.json({
        success: true,
        inspeksi: updated,
        message: "Inspeksi berhasil disetujui",
      });
    }

    if (action === "reject" && session.user.role === "MANAGER_TRAFFIC") {
      const updated = await prisma.inspeksi.update({
        where: { id: params.id },
        data: {
          status: "REJECTED",
          rejectionNote: updateData.rejectionNote,
          rejectedBy: "TRAFFIC",
          rejectedAt: new Date(),
        },
      });
      return NextResponse.json({
        success: true,
        inspeksi: updated,
        message: "Inspeksi ditolak",
      });
    }

    // Update oleh Petugas Lapangan (hanya draft)
    if (
      session.user.role === "PETUGAS_LAPANGAN" &&
      inspeksi.petugasId === session.user.id &&
      inspeksi.status === "DRAFT"
    ) {
      // Helper function untuk konversi date yang aman
      const parseDate = (dateString: string | null | undefined) => {
        if (!dateString || dateString.trim() === '') return null;
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
      };

      // Mapping field dari form ke database schema (sama seperti POST)
      const kategoriKendaraan = body.kategori || body.kategoriKendaraan;
      const nomorKendaraan = body.platNomor || body.nomorKendaraan || '-';
      const lokasiInspeksi = body.lokasiInspeksi || 
        (body.latitude && body.longitude ? `Lat: ${body.latitude}, Long: ${body.longitude}` : '') || 
        '-';
      const namaPetugas = body.namaPetugas1 || body.namaPetugas || '-';
      const nipPetugas = body.nipPetugas1 || body.nipPetugas || '-';
      const kelengkapanKendaraan = body.kelengkapanKendaraan || body.kelengkapanSarana || {};
      
      // Simpan data tambahan ke dataKhusus JSON field
      const dataKhusus = {
        ...(inspeksi.dataKhusus as any || {}),
        merkKendaraan: body.merkKendaraan || '',
        tahunKendaraan: body.tahunKendaraan || '',
        warnaBahan: body.warnaBahan || '',
        latitude: body.latitude || '',
        longitude: body.longitude || '',
        fotoKendaraan: body.fotoKendaraan || null,
        fotoInterior: body.fotoInterior || null,
        ttdPetugas1: body.ttdPetugas1 || null,
        ttdPetugas2: body.ttdPetugas2 || null,
        namaPetugas2: body.namaPetugas2 || null,
        nipPetugas2: body.nipPetugas2 || null,
      };

      const updated = await prisma.inspeksi.update({
        where: { id: params.id },
        data: {
          kategoriKendaraan,
          nomorKendaraan,
          lokasiInspeksi,
          namaPetugas,
          nipPetugas,
          namaPetugas2: body.namaPetugas2 || null,
          nipPetugas2: body.nipPetugas2 || null,
          nomorSTNK: body.nomorSTNK || null,
          masaBerlakuSTNK: parseDate(body.masaBerlakuSTNK),
          fotoSTNK: body.fotoSTNK || null,
          nomorKIR: body.nomorKIR || null,
          masaBerlakuKIR: parseDate(body.masaBerlakuKIR),
          fotoKIR: body.fotoKIR || null,
          masaBerlakuSIMPetugas1: parseDate(body.masaBerlakuSIMPetugas1),
          fotoSIMPetugas1: body.fotoSIMPetugas1 || null,
          masaBerlakuSIMPetugas2: parseDate(body.masaBerlakuSIMPetugas2),
          fotoSIMPetugas2: body.fotoSIMPetugas2 || null,
          tanggalService: parseDate(body.tanggalService),
          fotoService: body.fotoService || null,
          jumlahBBM: body.jumlahBBM || null,
          fotoBBM: body.fotoBBM || null,
          dataKhusus,
          kelengkapanKendaraan,
          catatan: body.catatan || null,
          status: body.status,
          needsApproval: body.status === "SUBMITTED",
        },
      });
      return NextResponse.json({
        success: true,
        inspeksi: updated,
        message: body.status === "DRAFT" 
          ? "Draft berhasil diperbarui" 
          : "Inspeksi berhasil dikirim ke Manager Traffic",
      });
    }

    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Error updating inspeksi:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PETUGAS_LAPANGAN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const inspeksi = await prisma.inspeksi.findUnique({
      where: { id: params.id },
    });

    if (!inspeksi) {
      return NextResponse.json(
        { error: "Inspeksi not found" },
        { status: 404 }
      );
    }

    // Hanya bisa hapus draft milik sendiri
    if (
      inspeksi.petugasId !== session.user.id ||
      inspeksi.status !== "DRAFT"
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    await prisma.inspeksi.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Draft berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting inspeksi:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
