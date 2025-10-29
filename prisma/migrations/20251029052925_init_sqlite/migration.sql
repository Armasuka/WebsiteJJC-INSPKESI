-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "inspeksi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kategoriKendaraan" TEXT NOT NULL,
    "nomorKendaraan" TEXT NOT NULL,
    "lokasiInspeksi" TEXT NOT NULL,
    "tanggalInspeksi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "namaPetugas" TEXT NOT NULL,
    "nipPetugas" TEXT NOT NULL,
    "namaPetugas2" TEXT,
    "nipPetugas2" TEXT,
    "nomorSTNK" TEXT,
    "masaBerlakuSTNK" DATETIME,
    "fotoSTNK" TEXT,
    "nomorKIR" TEXT,
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

-- CreateTable
CREATE TABLE "rekap_manager" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "judulRekap" TEXT NOT NULL,
    "periodeType" TEXT NOT NULL,
    "tanggalMulai" DATETIME NOT NULL,
    "tanggalSelesai" DATETIME NOT NULL,
    "kategoriKendaraan" TEXT,
    "totalInspeksi" INTEGER NOT NULL DEFAULT 0,
    "dataStatistik" JSONB,
    "pengirimId" TEXT NOT NULL,
    "namaPengirim" TEXT NOT NULL,
    "receiverRole" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "catatan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "inspeksi_status_idx" ON "inspeksi"("status");

-- CreateIndex
CREATE INDEX "inspeksi_petugasId_idx" ON "inspeksi"("petugasId");

-- CreateIndex
CREATE INDEX "inspeksi_createdAt_idx" ON "inspeksi"("createdAt");

-- CreateIndex
CREATE INDEX "inspeksi_kategoriKendaraan_idx" ON "inspeksi"("kategoriKendaraan");

-- CreateIndex
CREATE INDEX "inspeksi_tanggalInspeksi_idx" ON "inspeksi"("tanggalInspeksi");

-- CreateIndex
CREATE INDEX "inspeksi_petugasId_status_idx" ON "inspeksi"("petugasId", "status");

-- CreateIndex
CREATE INDEX "inspeksi_status_createdAt_idx" ON "inspeksi"("status", "createdAt");

-- CreateIndex
CREATE INDEX "rekap_manager_receiverRole_idx" ON "rekap_manager"("receiverRole");

-- CreateIndex
CREATE INDEX "rekap_manager_isRead_idx" ON "rekap_manager"("isRead");

-- CreateIndex
CREATE INDEX "rekap_manager_createdAt_idx" ON "rekap_manager"("createdAt");

-- CreateIndex
CREATE INDEX "rekap_manager_periodeType_idx" ON "rekap_manager"("periodeType");
