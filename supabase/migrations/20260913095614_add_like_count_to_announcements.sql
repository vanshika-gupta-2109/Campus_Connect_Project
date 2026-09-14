ALTER TABLE announcements ADD COLUMN IF NOT EXISTS like_count integer NOT NULL DEFAULT 0;
