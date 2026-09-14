/*
# Add security question and answer to announcements

1. Modified Tables
- `announcements`
  - `security_question` (text, nullable) — a hidden question the poster sets for Lost & Found items (e.g. "What color is the phone case?"). Only shown to users attempting to claim the item.
  - `security_answer` (text, nullable) — the expected answer. Compared case-insensitively on the client before revealing contact info.

2. Security
- No RLS changes needed — existing policies already allow anon + authenticated CRUD.
- The security_answer column is readable by anyone with SELECT access (the app relies on the client to gate the reveal). This is acceptable for a campus notice board prototype; a production system would hash the answer server-side.

3. Important Notes
- Both columns are nullable so existing announcements are unaffected.
- Only `lost-found` category posts will use these fields in the UI.
- The answer comparison is case-insensitive and trims whitespace.
*/

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS security_question text;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS security_answer text;
