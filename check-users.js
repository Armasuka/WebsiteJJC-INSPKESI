// Script untuk cek data user di database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Mengecek data user di database...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (users.length === 0) {
      console.log('❌ Tidak ada user di database');
      return;
    }

    console.log(`✅ Ditemukan ${users.length} user:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Last Updated: ${user.updatedAt.toLocaleString('id-ID')}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
