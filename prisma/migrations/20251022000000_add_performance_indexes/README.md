Migration: add_performance_indexes

This migration adds indexes to the `inspeksi` table to improve query performance. It's written to be idempotent for PostgreSQL so it won't fail if indexes already exist.

It was generated as a manual migration to resolve a failed automated migration attempt.

How to apply:
1. Ensure `DATABASE_URL` points to the correct database.
2. Run `npx prisma migrate resolve --applied "20251022000000_add_performance_indexes"` if the migration already applied partially / failed in the DB, or
3. Run `npx prisma migrate deploy` to execute migrations in production.

If `prisma migrate deploy` still errors, inspect database logs and run the SQL manually with `psql` or your DB client.