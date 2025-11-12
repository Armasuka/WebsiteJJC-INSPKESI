import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// DELETE - Delete user (only for Manager Operational)
export async function DELETE(
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

    // Only Manager Operational can delete users
    if (session.user.role !== "MANAGER_OPERATIONAL") {
      return NextResponse.json(
        { error: "Forbidden - Only Manager Operational can delete users" },
        { status: 403 }
      );
    }

    const params = await context.params;
    const userId = params.id;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Prevent deleting Manager accounts
    if (user.role === "MANAGER_OPERATIONAL" || user.role === "MANAGER_TRAFFIC") {
      return NextResponse.json(
        { error: "Tidak dapat menghapus akun Manager" },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (user.id === session.user.id) {
      return NextResponse.json(
        { error: "Tidak dapat menghapus akun sendiri" },
        { status: 403 }
      );
    }

    // Check if user has inspeksi data
    const inspeksiCount = await prisma.inspeksi.count({
      where: { petugasId: userId },
    });

    if (inspeksiCount > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus akun ini karena memiliki ${inspeksiCount} data inspeksi` },
        { status: 400 }
      );
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    console.log(`[USER MANAGEMENT] User deleted: ${user.email} by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: "Akun petugas berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
