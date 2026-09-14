/*
# Add academic_branch column to announcements

1. Modified Tables
- `announcements`
  - Added `academic_branch` (text, nullable) — stores the poster's academic branch
    (e.g. Computer Science, Mechanical Engineering, etc.). Optional field; existing
    rows will have NULL and continue to work as before.

2. Security
- No changes to RLS policies — the column inherits the existing public CRUD policies.
*/

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS academic_branch text;
