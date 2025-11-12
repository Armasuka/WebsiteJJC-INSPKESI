const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInspeksi() {
  try {
    const data = await prisma.inspeksi.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nomorKendaraan: true,
        kategoriKendaraan: true,
        status: true,
        approvedByTraffic: true,
        approvedByOperational: true,
        approvedAtTraffic: true,
        approvedAtOperational: true,
      }
    });
    
    console.log('=== DATA INSPEKSI TERBARU ===');
    console.log(JSON.stringify(data, null, 2));
    
    await prisma.$disconnect();
  } catch (err) {
    console.error('Error:', err);
    await prisma.$disconnect();
  }
}

checkInspeksi();
