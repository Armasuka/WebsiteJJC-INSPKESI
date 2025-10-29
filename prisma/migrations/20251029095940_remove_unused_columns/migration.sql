/*
  Warnings:

  - You are about to drop the column `kelengkapanSarana` on the `inspeksi` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `inspeksi` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `inspeksi` table. All the data in the column will be lost.
  - You are about to drop the column `merkKendaraan` on the `inspeksi` table. All the data in the column will be lost.
  - You are about to drop the column `nomorKIR` on the `inspeksi` table. All the data in the column will be lost.
  - You are about to drop the column `nomorSIMPetugas1` on the `inspeksi` table. All the data in the column will be lost.
  - You are about to drop the column `nomorSIMPetugas2` on the `inspeksi` table. All the data in the column will be lost.
  - You are about to drop the column `nomorSTNK` on the `inspeksi` table. All the data in the column will be lost.
  - You are about to drop the column `tahunKendaraan` on the `inspeksi` table. All the data in the column will be lost.
  - You are about to drop the column `ttdPetugas1` on the `inspeksi` table. All the data in the column will be lost.
  - You are about to drop the column `ttdPetugas2` on the `inspeksi` table. All the data in the column will be lost.
  - You are about to drop the column `warnaBahan` on the `inspeksi` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_inspeksi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kategoriKendaraan" TEXT NOT NULL,
    "nomorKendaraan" TEXT NOT NULL,
    "lokasiInspeksi" TEXT NOT NULL,
    "tanggalInspeksi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "namaPetugas" TEXT NOT NULL,
    "nipPetugas" TEXT NOT NULL,
    "namaPetugas2" TEXT,
    "nipPetugas2" TEXT,
    "masaBerlakuSTNK" DATETIME,
    "fotoSTNK" TEXT,
    "masaBerlakuKIR" DATETIME,
    "fotoKIR" TEXT,
    "masaBerlakuSIMPetugas1" DATETIME,
    "fotoSIMPetugas1" TEXT,
    "masaBerlakuSIMPetugas2" DATETIME,
    "fotoSIMPetugas2" TEXT,
    "tanggalService" DATETIME,
    "fotoService" TEXT,
    "jumlahBBM" TEXT,
    "fotoBBM" TEXT,
    "dataKhusus" JSONB,
    "kelengkapanKendaraan" JSONB,
    "catatan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "needsApproval" BOOLEAN NOT NULL DEFAULT true,
    "approvedByTraffic" TEXT,
    "approvedAtTraffic" DATETIME,
    "ttdManagerTraffic" TEXT,
    "approvedByOperational" TEXT,
    "approvedAtOperational" DATETIME,
    "ttdManagerOperasional" TEXT,
    "rejectionNote" TEXT,
    "rejectedBy" TEXT,
    "rejectedAt" DATETIME,
    "pdfUrl" TEXT,
    "pdfGeneratedAt" DATETIME,
    "petugasId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "inspeksi_petugasId_fkey" FOREIGN KEY ("petugasId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_inspeksi" ("approvedAtOperational", "approvedAtTraffic", "approvedByOperational", "approvedByTraffic", "catatan", "createdAt", "dataKhusus", "fotoBBM", "fotoKIR", "fotoSIMPetugas1", "fotoSIMPetugas2", "fotoSTNK", "fotoService", "id", "jumlahBBM", "kategoriKendaraan", "kelengkapanKendaraan", "lokasiInspeksi", "masaBerlakuKIR", "masaBerlakuSIMPetugas1", "masaBerlakuSIMPetugas2", "masaBerlakuSTNK", "namaPetugas", "namaPetugas2", "needsApproval", "nipPetugas", "nipPetugas2", "nomorKendaraan", "pdfGeneratedAt", "pdfUrl", "petugasId", "rejectedAt", "rejectedBy", "rejectionNote", "status", "tanggalInspeksi", "tanggalService", "ttdManagerOperasional", "ttdManagerTraffic", "updatedAt") SELECT "approvedAtOperational", "approvedAtTraffic", "approvedByOperational", "approvedByTraffic", "catatan", "createdAt", "dataKhusus", "fotoBBM", "fotoKIR", "fotoSIMPetugas1", "fotoSIMPetugas2", "fotoSTNK", "fotoService", "id", "jumlahBBM", "kategoriKendaraan", "kelengkapanKendaraan", "lokasiInspeksi", "masaBerlakuKIR", "masaBerlakuSIMPetugas1", "masaBerlakuSIMPetugas2", "masaBerlakuSTNK", "namaPetugas", "namaPetugas2", "needsApproval", "nipPetugas", "nipPetugas2", "nomorKendaraan", "pdfGeneratedAt", "pdfUrl", "petugasId", "rejectedAt", "rejectedBy", "rejectionNote", "status", "tanggalInspeksi", "tanggalService", "ttdManagerOperasional", "ttdManagerTraffic", "updatedAt" FROM "inspeksi";
DROP TABLE "inspeksi";
ALTER TABLE "new_inspeksi" RENAME TO "inspeksi";
CREATE INDEX "inspeksi_status_idx" ON "inspeksi"("status");
CREATE INDEX "inspeksi_petugasId_idx" ON "inspeksi"("petugasId");
CREATE INDEX "inspeksi_createdAt_idx" ON "inspeksi"("createdAt");
CREATE INDEX "inspeksi_kategoriKendaraan_idx" ON "inspeksi"("kategoriKendaraan");
CREATE INDEX "inspeksi_tanggalInspeksi_idx" ON "inspeksi"("tanggalInspeksi");
CREATE INDEX "inspeksi_petugasId_status_idx" ON "inspeksi"("petugasId", "status");
CREATE INDEX "inspeksi_status_createdAt_idx" ON "inspeksi"("status", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
