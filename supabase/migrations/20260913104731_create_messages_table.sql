/*
# Create messages table for anonymous messaging

1. New Tables
- `messages`
  - `id` (uuid, primary key)
  - `announcement_id` (uuid, FK to announcements.id, ON DELETE CASCADE) — the announcement being replied to
  - `sender_name` (text, not null) — display name entered by the sender (can be "Anonymous")
  - `sender_email` (text, nullable) — optional contact email from the sender
  - `body` (text, not null) — the message content
  - `is_anonymous` (boolean, default false) — when true, the sender chose to hide their name/email
  - `is_read` (boolean, default false) — tracks whether the recipient has read the message
  - `created_at` (timestamptz, default now())

2. Security
- RLS enabled on `messages`.
- SELECT: public (anon + authenticated) — anyone can read messages (the app filters by announcement ownership client-side).
- INSERT: public (anon + authenticated) — anyone can send a message to an announcement poster.
- UPDATE: public (anon + authenticated) — allows marking messages as read.
- DELETE: public (anon + authenticated) — allows deleting messages.

3. Important Notes
- Messages cascade-delete with their parent announcement.
- The app has a sign-in screen, but messaging is intentionally open to anonymous senders.
- Recipients are determined by matching announcement.user_id to the signed-in user.
- An index on announcement_id speeds up fetching messages for a specific announcement.
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  sender_name text NOT NULL,
  sender_email text,
  body text NOT NULL,
  is_anonymous boolean NOT NULL DEFAULT false,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_messages" ON messages;
CREATE POLICY "public_select_messages" ON messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_messages" ON messages;
CREATE POLICY "public_insert_messages" ON messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_messages" ON messages;
CREATE POLICY "public_update_messages" ON messages FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_messages" ON messages;
CREATE POLICY "public_delete_messages" ON messages FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_messages_announcement_id ON messages(announcement_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
