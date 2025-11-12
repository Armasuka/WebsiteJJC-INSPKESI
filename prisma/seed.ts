import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data (hapus inspeksi dulu karena foreign key)
  await prisma.komentar.deleteMany();
  console.log("🗑️  Cleared existing komentars");
  await prisma.inspeksi.deleteMany();
  console.log("🗑️  Cleared existing inspeksi");
  await prisma.user.deleteMany();
  console.log("🗑️  Cleared existing users");

  // ===========================================
  // MANAGER TRAFFIC ACCOUNTS
  // ===========================================
  const managerTraffic1 = await prisma.user.create({
    data: {
      email: "armasuka10@gmail.com",
      password: await bcrypt.hash("password123", 10),
      name: "Budi Santoso",
      role: "MANAGER_TRAFFIC",
    },
  });

  const managerTraffic2 = await prisma.user.create({
    data: {
      email: "traffic.manager@jasamarga.com",
      password: await bcrypt.hash("password123", 10),
      name: "Siti Nurhaliza",
      role: "MANAGER_TRAFFIC",
    },
  });

  // ===========================================
  // MANAGER OPERATIONAL ACCOUNTS
  // ===========================================
  const managerOperational1 = await prisma.user.create({
    data: {
      email: "cadelldell11@gmail.com",
      password: await bcrypt.hash("password123", 10),
      name: "Andi Wijaya",
      role: "MANAGER_OPERATIONAL",
    },
  });

  const managerOperational2 = await prisma.user.create({
    data: {
      email: "operational.manager@jasamarga.com",
      password: await bcrypt.hash("password123", 10),
      name: "Dewi Lestari",
      role: "MANAGER_OPERATIONAL",
    },
  });

  // ===========================================
  // PETUGAS LAPANGAN ACCOUNTS
  // ===========================================
  const petugasLapangan1 = await prisma.user.create({
    data: {
      email: "petugas.lapangan@jasamarga.com",
      password: await bcrypt.hash("password123", 10),
      name: "Ahmad Fauzi",
      role: "PETUGAS_LAPANGAN",
    },
  });

  const petugasLapangan2 = await prisma.user.create({
    data: {
      email: "petugas.a@jasamarga.com",
      password: await bcrypt.hash("password123", 10),
      name: "Rudi Hartono",
      role: "PETUGAS_LAPANGAN",
    },
  });

  const petugasLapangan3 = await prisma.user.create({
    data: {
      email: "petugas.b@jasamarga.com",
      password: await bcrypt.hash("password123", 10),
      name: "Tono Sugiarto",
      role: "PETUGAS_LAPANGAN",
    },
  });

  const petugasLapangan4 = await prisma.user.create({
    data: {
      email: "petugas.c@jasamarga.com",
      password: await bcrypt.hash("password123", 10),
      name: "Joko Susilo",
      role: "PETUGAS_LAPANGAN",
    },
  });

  const petugasLapangan5 = await prisma.user.create({
    data: {
      email: "petugas.d@jasamarga.com",
      password: await bcrypt.hash("password123", 10),
      name: "Bambang Suryanto",
      role: "PETUGAS_LAPANGAN",
    },
  });

  console.log("\n✅ Seed data created successfully!\n");
  
  console.log("═══════════════════════════════════════════════════════════");
  console.log("🚦 MANAGER TRAFFIC ACCOUNTS (2 users)");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`1. Name: ${managerTraffic1.name}`);
  console.log(`   Email: ${managerTraffic1.email}`);
  console.log(`   Password: password123`);
  console.log(`   Role: ${managerTraffic1.role}\n`);
  
  console.log(`2. Name: ${managerTraffic2.name}`);
  console.log(`   Email: ${managerTraffic2.email}`);
  console.log(`   Password: password123`);
  console.log(`   Role: ${managerTraffic2.role}\n`);

  console.log("═══════════════════════════════════════════════════════════");
  console.log("📋 MANAGER OPERATIONAL ACCOUNTS (2 users)");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`1. Name: ${managerOperational1.name}`);
  console.log(`   Email: ${managerOperational1.email}`);
  console.log(`   Password: password123`);
  console.log(`   Role: ${managerOperational1.role}\n`);
  
  console.log(`2. Name: ${managerOperational2.name}`);
  console.log(`   Email: ${managerOperational2.email}`);
  console.log(`   Password: password123`);
  console.log(`   Role: ${managerOperational2.role}\n`);

  console.log("═══════════════════════════════════════════════════════════");
  console.log("🔧 PETUGAS LAPANGAN ACCOUNTS (5 users)");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`1. Name: ${petugasLapangan1.name}`);
  console.log(`   Email: ${petugasLapangan1.email}`);
  console.log(`   Password: password123`);
  console.log(`   Role: ${petugasLapangan1.role}\n`);
  
  console.log(`2. Name: ${petugasLapangan2.name}`);
  console.log(`   Email: ${petugasLapangan2.email}`);
  console.log(`   Password: password123`);
  console.log(`   Role: ${petugasLapangan2.role}\n`);
  
  console.log(`3. Name: ${petugasLapangan3.name}`);
  console.log(`   Email: ${petugasLapangan3.email}`);
  console.log(`   Password: password123`);
  console.log(`   Role: ${petugasLapangan3.role}\n`);
  
  console.log(`4. Name: ${petugasLapangan4.name}`);
  console.log(`   Email: ${petugasLapangan4.email}`);
  console.log(`   Password: password123`);
  console.log(`   Role: ${petugasLapangan4.role}\n`);
  
  console.log(`5. Name: ${petugasLapangan5.name}`);
  console.log(`   Email: ${petugasLapangan5.email}`);
  console.log(`   Password: password123`);
  console.log(`   Role: ${petugasLapangan5.role}\n`);

  console.log("═══════════════════════════════════════════════════════════");
  console.log("📊 SUMMARY");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`Total Users Created: 9`);
  console.log(`- Manager Traffic: 2`);
  console.log(`- Manager Operational: 2`);
  console.log(`- Petugas Lapangan: 5`);
  console.log("\n🎉 Seed completed successfully!");
  console.log("═══════════════════════════════════════════════════════════\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
