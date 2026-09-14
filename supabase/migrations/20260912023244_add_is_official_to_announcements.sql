/*
# Add is_official column to announcements table

1. Modified Tables
- `announcements` — added `is_official` column
  - `is_official` (boolean, default false) — true = posted by official campus staff (Dean, Registrar, IT, Athletics, etc.), false = posted by a student

2. Security
- No security changes — existing RLS policies already allow full CRUD for anon + authenticated.

3. Important Notes
- The column defaults to false so existing announcements are treated as student-posted.
- Existing seed data is updated to mark official announcements (Registrar, IT, Facilities, Athletics, Career Services) as official.
*/

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_official boolean NOT NULL DEFAULT false;

-- Mark existing official announcements
UPDATE announcements SET is_official = true WHERE author_role IN ('Registrar', 'IT Department', 'Facilities', 'Athletics', 'Career Services');
