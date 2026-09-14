/*
# Create todos table for personal task list

1. New Tables
- `todos`
  - `id` (uuid, primary key)
  - `title` (text, not null) — the task description
  - `completed` (boolean, default false) — whether the task is done
  - `source_announcement_id` (uuid, nullable, FK to announcements.id ON DELETE SET NULL) — links to the announcement that triggered this AI-suggested task
  - `is_ai_generated` (boolean, default false) — true when the task was auto-extracted from an announcement
  - `user_id` (uuid, not null, defaults to auth.uid()) — the task owner
  - `created_at` (timestamptz, default now())

2. Security
- RLS enabled on `todos`.
- Owner-scoped CRUD: each authenticated user can only access their own tasks.
- SELECT: authenticated, USING (auth.uid() = user_id)
- INSERT: authenticated, WITH CHECK (auth.uid() = user_id)
- UPDATE: authenticated, USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)
- DELETE: authenticated, USING (auth.uid() = user_id)

3. Important Notes
- The app already has a sign-in/sign-up screen, so authenticated-only policies are correct.
- `user_id` defaults to `auth.uid()` so inserts omitting it still satisfy the WITH CHECK.
- `source_announcement_id` is nullable and SET NULL on delete so tasks survive announcement deletion.
- An index on user_id speeds up fetching a user's task list.
*/

CREATE TABLE IF NOT EXISTS todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  source_announcement_id uuid REFERENCES announcements(id) ON DELETE SET NULL,
  is_ai_generated boolean NOT NULL DEFAULT false,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_todos" ON todos;
CREATE POLICY "select_own_todos" ON todos FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_todos" ON todos;
CREATE POLICY "insert_own_todos" ON todos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_todos" ON todos;
CREATE POLICY "update_own_todos" ON todos FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_todos" ON todos;
CREATE POLICY "delete_own_todos" ON todos FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
