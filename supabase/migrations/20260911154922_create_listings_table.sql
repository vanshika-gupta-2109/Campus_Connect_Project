/*
# Create listings table for campus marketplace

1. New Tables
- `listings` — stores marketplace items posted by students
  - `id` (uuid, primary key)
  - `title` (text, not null) — item name
  - `description` (text, not null) — item details
  - `price` (numeric, not null) — asking price in USD
  - `category` (text, not null) — one of: textbooks, electronics, furniture, clothing, housing, services, other
  - `condition` (text, not null) — one of: new, like-new, good, fair
  - `image_url` (text) — optional product photo URL
  - `seller_name` (text, not null) — name of the student selling
  - `contact_info` (text, not null) — email or phone for contact
  - `created_at` (timestamptz, default now)
  - `updated_at` (timestamptz, default now)

2. Indexes
- Index on `category` for filtering
- Index on `created_at` for sorting by newest

3. Security
- Enable RLS on `listings`.
- Allow anon + authenticated CRUD — this is a public/shared prototype with no sign-in.
- All policies use `USING (true)` / `WITH CHECK (true)` because the data is intentionally public.

4. Important Notes
- This is a single-tenant prototype with no authentication.
- All data is publicly readable and writable by design.
- Category and condition are constrained via CHECK constraints.
*/

CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  category text NOT NULL CHECK (category IN ('textbooks','electronics','furniture','clothing','housing','services','other')),
  condition text NOT NULL CHECK (condition IN ('new','like-new','good','fair')),
  image_url text,
  seller_name text NOT NULL,
  contact_info text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_listings" ON listings;
CREATE POLICY "anon_select_listings" ON listings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_listings" ON listings;
CREATE POLICY "anon_insert_listings" ON listings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_listings" ON listings;
CREATE POLICY "anon_update_listings" ON listings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_listings" ON listings;
CREATE POLICY "anon_delete_listings" ON listings FOR DELETE
  TO anon, authenticated USING (true);