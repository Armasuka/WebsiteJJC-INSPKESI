import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const resolvedParams = await params;
  const id = resolvedParams.id;
    const body = await request.json();
    const { pdfDataUri } = body;

    if (!pdfDataUri) {
      return NextResponse.json({ error: "PDF data required" }, { status: 400 });
    }

    // Get inspeksi data
    const inspeksi = await prisma.inspeksi.findUnique({
      where: { id },
    });

    if (!inspeksi) {
      return NextResponse.json({ error: "Inspeksi tidak ditemukan" }, { status: 404 });
    }

    // Check if already approved by operational
    if (inspeksi.status !== "APPROVED_BY_OPERATIONAL") {
      return NextResponse.json(
        { error: "PDF hanya bisa dibuat untuk inspeksi yang sudah di-approve oleh Manager Operational" },
        { status: 400 }
      );
    }

    // Update database with PDF URL (store as base64 data URI)
    const updatedInspeksi = await prisma.inspeksi.update({
      where: { id },
      data: {
        pdfUrl: pdfDataUri,
        pdfGeneratedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "PDF berhasil disimpan",
      pdfUrl: pdfDataUri,
    });
  } catch (error) {
    console.error("Error saving PDF:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan PDF" },
      { status: 500 }
    );
  }
}
