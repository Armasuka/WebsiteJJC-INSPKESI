import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.log('[PROFILE UPDATE] ERROR: No session found');
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, email, currentPassword, newPassword } = body;

    console.log('[PROFILE UPDATE] Session user:', {
      email: session.user.email,
      name: session.user.name,
      hasId: !!(session.user as any).id
    });

    // Validasi input
    if (!name || !email) {
      return NextResponse.json(
        { error: "Nama dan email harus diisi" },
        { status: 400 }
      );
    }

    // Get user ID from session (dari JWT callback)
    const userId = (session.user as any).id;
    const userEmail = session.user.email;
    
    if (!userId && !userEmail) {
      console.log('[PROFILE UPDATE] ERROR: No ID or email in session');
      return NextResponse.json(
        { error: "Session tidak valid" },
        { status: 400 }
      );
    }

    // Get current user - prioritas pakai ID, fallback ke email
    let currentUser;
    if (userId) {
      currentUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      console.log(`[PROFILE UPDATE] Found user by ID: ${userId}`);
    }
    
    // Jika tidak ketemu by ID, coba by email
    if (!currentUser && userEmail) {
      currentUser = await prisma.user.findUnique({
        where: { email: userEmail },
      });
      console.log(`[PROFILE UPDATE] Found user by email: ${userEmail}`);
    }

    if (!currentUser) {
      console.log('[PROFILE UPDATE] ERROR: User not found in database');
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    console.log(`[PROFILE UPDATE] User: ${currentUser.email} (${currentUser.id}) attempting to update profile`);

    // Check if email is already used by another user
    if (email !== currentUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email sudah digunakan" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
    };

    // If changing password
    if (currentPassword && newPassword) {
      // Verify current password
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        currentUser.password
      );

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Password lama tidak sesuai" },
          { status: 400 }
        );
      }

      // Validate new password
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password baru minimal 6 karakter" },
          { status: 400 }
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    console.log(`[PROFILE UPDATE] Success: ${updatedUser.email} - Updated fields: ${Object.keys(updateData).join(', ')}`);

    return NextResponse.json({
      message: "Profil berhasil diupdate",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan saat mengupdate profil" },
      { status: 500 }
    );
  }
}
