const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPetugas() {
  try {
    const data = await prisma.inspeksi.findFirst({
      where: {
        status: {
          in: ['APPROVED_BY_TRAFFIC', 'APPROVED_BY_OPERATIONAL']
        }
      }
    });
    
    console.log('=== DATA PETUGAS ===');
    console.log('Nama Petugas 1:', data.namaPetugas);
    console.log('NIP Petugas 1:', data.nipPetugas);
    console.log('Nama Petugas 2:', data.namaPetugas2);
    console.log('NIP Petugas 2:', data.nipPetugas2);
    console.log('\n=== DATA KHUSUS ===');
    console.log(JSON.stringify(data.dataKhusus, null, 2));
    
    await prisma.$disconnect();
  } catch (err) {
    console.error('Error:', err);
    await prisma.$disconnect();
  }
}

checkPetugas();
