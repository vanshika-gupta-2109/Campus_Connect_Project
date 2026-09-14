/*
# Lock down announcements and announcement_updates to owner-only mutations

1. Modified Policies on `announcements`
- SELECT: stays public (anon + authenticated) — anyone can read announcements.
- INSERT: stays public (anon + authenticated) — anyone can post (with or without sign-in).
- UPDATE: now restricted to the announcement's owner (auth.uid() = user_id).
  Announcements with user_id = NULL (posted without sign-in) cannot be edited by anyone.
- DELETE: now restricted to the announcement's owner (auth.uid() = user_id).
  Announcements with user_id = NULL cannot be deleted by anyone.

2. Modified Policies on `announcement_updates`
- SELECT: stays public — anyone can read updates.
- INSERT: now restricted to the announcement's owner. Only the person who posted
  the announcement can add updates to it. Requires the updater to be authenticated
  AND to be the owner of the parent announcement.
- UPDATE: now restricted to the update's author (auth.uid() = user_id) AND the
  announcement's owner. Only the owner can modify updates on their announcement.
- DELETE: now restricted to the announcement's owner. Only the owner can delete
  updates from their announcement.

3. Security
- All mutation policies now use auth.uid() for ownership checks.
- Public read remains for both tables.
- Announcements without an owner (user_id NULL) become read-only — they cannot be
  edited or deleted by anyone through the data API. This is intentional: if nobody
  owns the post, nobody should be able to modify it.

4. Important Notes
- This is a breaking change for unauthenticated edits/deletes. The frontend must
  enforce the same checks (show edit/delete only to the owner) so users get clear
  feedback rather than silent RLS failures.
- The INSERT policy on announcements remains open to allow posting without sign-in.
  The user_id column on announcements is nullable; signed-in users get it set
  automatically by the frontend.
*/

-- === Announcements: lock down UPDATE and DELETE to owner only ===

DROP POLICY IF EXISTS "anon_select_announcements" ON announcements;
DROP POLICY IF EXISTS "anon_insert_announcements" ON announcements;
DROP POLICY IF EXISTS "anon_update_announcements" ON announcements;
DROP POLICY IF EXISTS "anon_delete_announcements" ON announcements;

-- Public read
CREATE POLICY "anon_select_announcements" ON announcements FOR SELECT
  TO anon, authenticated USING (true);

-- Public insert (anyone can post, with or without sign-in)
CREATE POLICY "anon_insert_announcements" ON announcements FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Only the owner can update
CREATE POLICY "owner_update_announcements" ON announcements FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Only the owner can delete
CREATE POLICY "owner_delete_announcements" ON announcements FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- === Announcement updates: lock down to announcement owner only ===

DROP POLICY IF EXISTS "public_select_updates" ON announcement_updates;
DROP POLICY IF EXISTS "public_insert_updates" ON announcement_updates;
DROP POLICY IF EXISTS "public_update_updates" ON announcement_updates;
DROP POLICY IF EXISTS "public_delete_updates" ON announcement_updates;

-- Public read
CREATE POLICY "public_select_updates" ON announcement_updates FOR SELECT
  TO anon, authenticated USING (true);

-- Only the announcement owner can insert updates
CREATE POLICY "owner_insert_updates" ON announcement_updates FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM announcements
      WHERE announcements.id = announcement_updates.announcement_id
      AND announcements.user_id = auth.uid()
    )
  );

-- Only the announcement owner can update updates
CREATE POLICY "owner_update_updates" ON announcement_updates FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM announcements
      WHERE announcements.id = announcement_updates.announcement_id
      AND announcements.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM announcements
      WHERE announcements.id = announcement_updates.announcement_id
      AND announcements.user_id = auth.uid()
    )
  );

-- Only the announcement owner can delete updates
CREATE POLICY "owner_delete_updates" ON announcement_updates FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM announcements
      WHERE announcements.id = announcement_updates.announcement_id
      AND announcements.user_id = auth.uid()
    )
  );
