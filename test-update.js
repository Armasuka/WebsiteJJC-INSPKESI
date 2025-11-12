// Test update user profile
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testUpdateProfile() {
  try {
    console.log('🧪 Testing profile update...\n');
    
    // Cari user pertama untuk test
    const testUser = await prisma.user.findFirst({
      where: {
        role: 'PETUGAS_LAPANGAN'
      }
    });

    if (!testUser) {
      console.log('❌ Tidak ada user untuk test');
      return;
    }

    console.log('👤 Test User:');
    console.log(`   Name: ${testUser.name}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Role: ${testUser.role}\n`);

    // Test update nama
    console.log('📝 Testing name update...');
    const newName = `${testUser.name} (Updated ${new Date().toLocaleTimeString()})`;
    
    const updated = await prisma.user.update({
      where: { id: testUser.id },
      data: { name: newName },
      select: {
        id: true,
        name: true,
        email: true,
        updatedAt: true,
      }
    });

    console.log('✅ Update berhasil!');
    console.log(`   New Name: ${updated.name}`);
    console.log(`   Updated At: ${updated.updatedAt.toLocaleString('id-ID')}\n`);

    // Revert kembali
    console.log('🔄 Reverting back to original name...');
    await prisma.user.update({
      where: { id: testUser.id },
      data: { name: testUser.name },
    });
    console.log('✅ Reverted successfully\n');

    console.log('🎉 Database connection and update working perfectly!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdateProfile();
