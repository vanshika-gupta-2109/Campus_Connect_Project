/*
# Add society column to announcements table

1. Modified Tables
- `announcements` — added `society` column
  - `society` (text, nullable) — name of the society/club the announcement belongs to (e.g. "Robotics Society", "Debate Club", "Drama Society"). NULL means the announcement is general/not tied to a specific society.

2. Index
- Index on `society` for filtering by society

3. Security
- No security changes — existing RLS policies already allow full CRUD for anon + authenticated.

4. Important Notes
- The column is nullable so existing announcements without a society remain valid.
- New announcements can optionally specify a society.
- The frontend will use this column to filter announcements by society/club.
*/

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS society text;

CREATE INDEX IF NOT EXISTS idx_announcements_society ON announcements(society);

-- Update existing seed data with society values where applicable
UPDATE announcements SET society = 'Chess Club' WHERE title LIKE 'Chess Club%';
UPDATE announcements SET society = 'Athletics Society' WHERE category = 'sports';
UPDATE announcements SET society = 'Community Engagement Society' WHERE title LIKE 'Volunteer Tutors%';

-- Insert additional society-specific announcements
INSERT INTO announcements (title, body, category, priority, author_name, author_role, society, created_at, expires_at) VALUES
('Robotics Society: Sign-Up Now Open', 'The Robotics Society is recruiting new members! No experience needed — we teach everything from basic circuits to advanced programming. Meetings every Wednesday at 5 PM in the Engineering Lab. Join us to build robots and compete in the regional tournament this April.', 'clubs', 'info', 'Kevin Park', 'Robotics Society President', 'Robotics Society', now() - interval '10 hours', now() + interval '30 days'),
('Drama Society: Auditions for Spring Play', 'Auditions for our spring production of "A Midsummer Night''s Dream" are next Tuesday and Thursday from 6 PM in the auditorium. Prepare a 1-minute monologue. All roles open. Rehearsals will be Monday-Thursday evenings starting March 1.', 'events', 'important', 'Olivia Reed', 'Drama Society Director', 'Drama Society', now() - interval '1 day', now() + interval '14 days'),
('Debate Club: Inter-College Tournament Sign-Up', 'Sign up to represent our college at the Inter-College Debate Tournament on April 5-6. We need 4 speakers and 2 reserves. Topic: "Technology has done more harm than good." Preparation sessions every Friday at 4 PM.', 'events', 'info', 'Rahul Mehta', 'Debate Club President', 'Debate Club', now() - interval '2 days', now() + interval '25 days'),
('Photography Society: Spring Exhibition Submissions', 'Submit your best photos for our Spring Exhibition by March 20. Theme: "Campus Life." Up to 5 photos per member. Selected works will be displayed in the Student Union gallery for two weeks. See our website for submission guidelines.', 'events', 'info', 'Yuki Tanaka', 'Photography Society Secretary', 'Photography Society', now() - interval '3 days', now() + interval '20 days'),
('Music Society: Open Mic Night Friday', 'Join the Music Society for Open Mic Night this Friday at 7 PM in the Student Union cafe. All performers welcome — singers, instrumentalists, poets. Sign up at the door or message us to reserve a slot. Free coffee and snacks!', 'events', 'info', 'Marcus Lee', 'Music Society VP', 'Music Society', now() - interval '5 hours', now() + interval '5 days')
ON CONFLICT DO NOTHING;
