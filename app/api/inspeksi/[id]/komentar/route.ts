import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Ambil semua komentar untuk inspeksi tertentu
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const komentar = await prisma.komentar.findMany({
      where: {
        inspeksiId: params.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(komentar);
  } catch (error) {
    console.error("Error fetching komentar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Tambah komentar baru
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { isiKomentar } = body;

    if (!isiKomentar || isiKomentar.trim() === "") {
      return NextResponse.json(
        { error: "Komentar tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Cek apakah inspeksi exists
    const inspeksi = await prisma.inspeksi.findUnique({
      where: { id: params.id },
    });

    if (!inspeksi) {
      return NextResponse.json(
        { error: "Inspeksi tidak ditemukan" },
        { status: 404 }
      );
    }

    // Buat komentar baru
    const komentar = await prisma.komentar.create({
      data: {
        inspeksiId: params.id,
        pengirimId: session.user.id,
        namaPengirim: session.user.name,
        rolePengirim: session.user.role,
        isiKomentar: isiKomentar.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      komentar,
      message: "Komentar berhasil ditambahkan",
    });
  } catch (error) {
    console.error("Error creating komentar:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
