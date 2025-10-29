-- CreateTable
CREATE TABLE "komentar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspeksiId" TEXT NOT NULL,
    "pengirimId" TEXT NOT NULL,
    "namaPengirim" TEXT NOT NULL,
    "rolePengirim" TEXT NOT NULL,
    "isiKomentar" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "komentar_inspeksiId_fkey" FOREIGN KEY ("inspeksiId") REFERENCES "inspeksi" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "komentar_pengirimId_fkey" FOREIGN KEY ("pengirimId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "komentar_inspeksiId_idx" ON "komentar"("inspeksiId");

-- CreateIndex
CREATE INDEX "komentar_createdAt_idx" ON "komentar"("createdAt");
