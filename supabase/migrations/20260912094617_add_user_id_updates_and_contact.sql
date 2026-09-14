/*
# Add user_id, contact_email, and announcement_updates table

1. Modified Tables
- `announcements`
  - `user_id` (uuid, nullable) — links to auth.users. NULL for existing announcements posted without sign-in. New announcements from signed-in users will have this set.
  - `contact_email` (text, nullable) — optional contact email the poster provides for others to reach them (e.g. housing, lost-and-found).

2. New Tables
- `announcement_updates`
  - `id` (uuid, primary key)
  - `announcement_id` (uuid, FK to announcements.id, ON DELETE CASCADE) — the parent announcement
  - `author_name` (text, not null) — display name of the person posting the update
  - `body` (text, not null) — the update message (e.g. "Item has been found!")
  - `is_resolved` (boolean, default false) — marks the announcement as resolved (e.g. lost item found)
  - `user_id` (uuid, nullable, FK to auth.users) — the authenticated user who posted the update
  - `created_at` (timestamptz, default now())

3. Security
- RLS enabled on `announcement_updates`.
- SELECT: public (anon + authenticated) — anyone can read updates.
- INSERT: public (anon + authenticated) — anyone can post an update (the app will enforce ownership client-side for now; full server-side ownership check requires auth which is optional).
- UPDATE: public — allows marking resolved.
- DELETE: public — allows removing updates.

4. Important Notes
- The `user_id` column on announcements is nullable so existing data is not lost.
- The `contact_email` column is nullable so it remains optional.
- `announcement_updates` cascade-delete with their parent announcement.
- Existing RLS policies on `announcements` remain unchanged (anon + authenticated full CRUD).
*/

-- Add user_id to announcements
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add contact_email to announcements
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS contact_email text;

-- Create announcement_updates table
CREATE TABLE IF NOT EXISTS announcement_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  body text NOT NULL,
  is_resolved boolean NOT NULL DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcement_updates ENABLE ROW LEVEL SECURITY;

-- Allow public read of updates
DROP POLICY IF EXISTS "public_select_updates" ON announcement_updates;
CREATE POLICY "public_select_updates" ON announcement_updates FOR SELECT
  TO anon, authenticated USING (true);

-- Allow public insert of updates
DROP POLICY IF EXISTS "public_insert_updates" ON announcement_updates;
CREATE POLICY "public_insert_updates" ON announcement_updates FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Allow public update of updates (marking resolved)
DROP POLICY IF EXISTS "public_update_updates" ON announcement_updates;
CREATE POLICY "public_update_updates" ON announcement_updates FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Allow public delete of updates
DROP POLICY IF EXISTS "public_delete_updates" ON announcement_updates;
CREATE POLICY "public_delete_updates" ON announcement_updates FOR DELETE
  TO anon, authenticated USING (true);

-- Index for fetching updates by announcement
CREATE INDEX IF NOT EXISTS idx_announcement_updates_announcement_id ON announcement_updates(announcement_id);
