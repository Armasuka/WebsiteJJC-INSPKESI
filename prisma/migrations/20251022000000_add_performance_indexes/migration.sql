-- Migration: add indexes to inspeksi table to improve query performance
-- This migration is idempotent: it will only create indexes if they do not already exist.

-- For Postgres: check and create index if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'i' AND c.relname = 'idx_inspeksi_status') THEN
        EXECUTE 'CREATE INDEX idx_inspeksi_status ON inspeksi (status)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'i' AND c.relname = 'idx_inspeksi_petugasId') THEN
        EXECUTE 'CREATE INDEX idx_inspeksi_petugasId ON inspeksi ("petugasId")';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'i' AND c.relname = 'idx_inspeksi_createdAt') THEN
        EXECUTE 'CREATE INDEX idx_inspeksi_createdAt ON inspeksi ("createdAt")';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'i' AND c.relname = 'idx_inspeksi_kategoriKendaraan') THEN
        EXECUTE 'CREATE INDEX idx_inspeksi_kategoriKendaraan ON inspeksi ("kategoriKendaraan")';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'i' AND c.relname = 'idx_inspeksi_tanggalInspeksi') THEN
        EXECUTE 'CREATE INDEX idx_inspeksi_tanggalInspeksi ON inspeksi ("tanggalInspeksi")';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'i' AND c.relname = 'idx_inspeksi_petugasId_status') THEN
        EXECUTE 'CREATE INDEX idx_inspeksi_petugasId_status ON inspeksi ("petugasId", status)';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'i' AND c.relname = 'idx_inspeksi_status_createdAt') THEN
        EXECUTE 'CREATE INDEX idx_inspeksi_status_createdAt ON inspeksi (status, "createdAt")';
    END IF;
END
$$;
