/*
# Create portfolio_items and orders tables

1. New Tables
- `portfolio_items`
  - `id` (uuid, primary key)
  - `title` (text, not null) — project name
  - `software` (text, not null) — tools used, e.g. "3ds Max + Corona"
  - `category` (text, not null) — Divan, Kreslo, Stol, Stul, Mətbəx, Revit Family, Digər
  - `image_url` (text, not null) — main render image URL
  - `before_image_url` (text, nullable) — reference image for before/after slider
  - `after_image_url` (text, nullable) — 3D model image for before/after slider
  - `created_at` (timestamptz, default now)
  - `sort_order` (integer, default 0) — manual ordering
- `orders`
  - `id` (uuid, primary key)
  - `name` (text, not null)
  - `email` (text, not null)
  - `phone` (text, not null)
  - `service` (text, not null) — selected service type
  - `furniture_category` (text, nullable) — furniture category
  - `pinterest_url` (text, nullable) — Pinterest or reference URL
  - `description` (text, nullable) — project details
  - `file_path` (text, nullable) — uploaded file path in storage
  - `status` (text, default 'new') — order status
  - `created_at` (timestamptz, default now)

2. Security
- Enable RLS on both tables.
- portfolio_items: public read (anon + authenticated), no public write (admin manages via service role or authenticated). For this no-auth public site, allow anon read and authenticated full CRUD.
- orders: allow anon insert (customers submit orders), authenticated read/update/delete (admin manages). No anon read to protect customer data.
*/

CREATE TABLE IF NOT EXISTS portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  software text NOT NULL,
  category text NOT NULL,
  image_url text NOT NULL,
  before_image_url text,
  after_image_url text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_portfolio" ON portfolio_items;
CREATE POLICY "anon_read_portfolio"
  ON portfolio_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_portfolio" ON portfolio_items;
CREATE POLICY "auth_insert_portfolio"
  ON portfolio_items FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_portfolio" ON portfolio_items;
CREATE POLICY "auth_update_portfolio"
  ON portfolio_items FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_portfolio" ON portfolio_items;
CREATE POLICY "auth_delete_portfolio"
  ON portfolio_items FOR DELETE
  TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  service text NOT NULL,
  furniture_category text,
  pinterest_url text,
  description text,
  file_path text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders"
  ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_read_orders" ON orders;
CREATE POLICY "auth_read_orders"
  ON orders FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_orders" ON orders;
CREATE POLICY "auth_update_orders"
  ON orders FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_orders" ON orders;
CREATE POLICY "auth_delete_orders"
  ON orders FOR DELETE
  TO authenticated USING (true);
