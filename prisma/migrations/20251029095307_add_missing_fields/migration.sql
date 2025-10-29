-- AlterTable
ALTER TABLE "inspeksi" ADD COLUMN "kelengkapanSarana" JSONB;
ALTER TABLE "inspeksi" ADD COLUMN "latitude" TEXT;
ALTER TABLE "inspeksi" ADD COLUMN "longitude" TEXT;
ALTER TABLE "inspeksi" ADD COLUMN "merkKendaraan" TEXT;
ALTER TABLE "inspeksi" ADD COLUMN "nomorSIMPetugas1" TEXT;
ALTER TABLE "inspeksi" ADD COLUMN "nomorSIMPetugas2" TEXT;
ALTER TABLE "inspeksi" ADD COLUMN "tahunKendaraan" TEXT;
ALTER TABLE "inspeksi" ADD COLUMN "ttdPetugas1" TEXT;
ALTER TABLE "inspeksi" ADD COLUMN "ttdPetugas2" TEXT;
ALTER TABLE "inspeksi" ADD COLUMN "warnaBahan" TEXT;
