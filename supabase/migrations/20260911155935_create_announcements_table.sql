/*
# Create announcements table for campus announcements board

1. New Tables
- `announcements` — stores campus-wide announcements posted by staff/students
  - `id` (uuid, primary key)
  - `title` (text, not null) — announcement headline
  - `body` (text, not null) — full announcement text
  - `category` (text, not null) — one of: academic, events, housing, lost-found, clubs, sports, emergency, general
  - `priority` (text, not null) — one of: info, important, urgent
  - `author_name` (text, not null) — name of person posting
  - `author_role` (text, not null) — role/title (e.g. Dean, Student, Club President)
  - `created_at` (timestamptz, default now)
  - `expires_at` (timestamptz) — optional expiration date

2. Indexes
- Index on `category` for filtering
- Index on `priority` for sorting
- Index on `created_at` for newest-first ordering

3. Security
- Enable RLS on `announcements`.
- Allow anon + authenticated CRUD — public/shared prototype with no sign-in.
- All policies use `USING (true)` / `WITH CHECK (true)` because data is intentionally public.

4. Important Notes
- Single-tenant prototype with no authentication.
- All data is publicly readable and writable by design.
- Category and priority are constrained via CHECK constraints.
*/

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  category text NOT NULL CHECK (category IN ('academic','events','housing','lost-found','clubs','sports','emergency','general')),
  priority text NOT NULL CHECK (priority IN ('info','important','urgent')),
  author_name text NOT NULL,
  author_role text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_announcements" ON announcements;
CREATE POLICY "anon_select_announcements" ON announcements FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_announcements" ON announcements;
CREATE POLICY "anon_insert_announcements" ON announcements FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_announcements" ON announcements;
CREATE POLICY "anon_update_announcements" ON announcements FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_announcements" ON announcements;
CREATE POLICY "anon_delete_announcements" ON announcements FOR DELETE
  TO anon, authenticated USING (true);