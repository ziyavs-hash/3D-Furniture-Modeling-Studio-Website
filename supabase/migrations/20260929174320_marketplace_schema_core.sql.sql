/*
# Atelier Linea Marketplace — Core Schema

This migration creates the foundational marketplace database architecture.

## New Tables

1. `profiles` — extends auth.users with role (user/admin), display_name, preferred_language
2. `products` — main marketplace product entity with slug, pricing, category/room/style, formats, software, renderer, publishing state, featured/trending/new_release flags
3. `product_images` — one-to-many preview images with sort_order (NO limit on count)
4. `product_files` — downloadable model files with format, storage path, file size
5. `collections` — curated product collections (name, slug, description, cover)
6. `product_collections` — many-to-many join between products and collections
7. `favorites` — user favorites with unique constraint
8. `cart_items` — user cart with unique constraint per product
9. `marketplace_orders` — marketplace order entity with status state machine
10. `order_items` — order line items
11. `entitlements` — download access (purchase or free)
12. `download_logs` — download activity tracking
13. `admin_audit_logs` — admin action audit trail

## Existing Tables Preserved
- `portfolio_items` — unchanged
- `orders` — existing studio order form data preserved

## Security
- RLS enabled on all new tables
- is_admin() SECURITY DEFINER function checks admin role
- generate_unique_slug() ensures unique product slugs
- Public can read published products/collections/images
- Only admin can create/update/delete products, files, images, collections
- Users own their favorites, cart, orders, entitlements
*/

-- ============================================================
-- PROFILES TABLE (must exist before is_admin function)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  preferred_language text DEFAULT 'az',
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.generate_unique_slug(base_text text, existing_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  base_slug text;
  candidate text;
  counter integer := 1;
  found boolean;
BEGIN
  base_slug := lower(trim(regexp_replace(base_text, '[^a-zA-Z0-9]+', '-', 'g')));
  base_slug := trim(both '-' from base_slug);
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'product';
  END IF;
  candidate := base_slug;
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.products
      WHERE slug = candidate AND id IS DISTINCT FROM existing_id
    ) INTO found;
    IF NOT found THEN
      RETURN candidate;
    END IF;
    counter := counter + 1;
    candidate := base_slug || '-' || counter::text;
  END LOOP;
END;
$$;

-- ============================================================
-- PROFILE POLICIES & TRIGGER
-- ============================================================

DROP POLICY IF EXISTS "select_own_or_admin_profiles" ON public.profiles;
CREATE POLICY "select_own_or_admin_profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'USD',
  is_free boolean NOT NULL DEFAULT false,
  category text,
  room text,
  style text,
  formats text[] DEFAULT '{}',
  software text[] DEFAULT '{}',
  renderer text[] DEFAULT '{}',
  license_type text DEFAULT 'personal' CHECK (license_type IN ('personal', 'commercial', 'studio')),
  compatibility text,
  geometry_info text,
  texture_info text,
  file_info text,
  polygon_count text,
  texture_resolution text,
  dimensions text,
  units text DEFAULT 'cm',
  software_version text,
  renderer_version text,
  material_count text,
  production_ready boolean DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  featured boolean DEFAULT false,
  trending boolean DEFAULT false,
  new_release boolean DEFAULT false,
  view_count integer DEFAULT 0,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_products" ON public.products;
CREATE POLICY "public_read_published_products"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (published = true);

DROP POLICY IF EXISTS "admin_read_all_products" ON public.products;
CREATE POLICY "admin_read_all_products"
  ON public.products FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_products" ON public.products;
CREATE POLICY "admin_insert_products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_products" ON public.products;
CREATE POLICY "admin_update_products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_products" ON public.products;
CREATE POLICY "admin_delete_products"
  ON public.products FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_published ON public.products(published);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_room ON public.products(room);
CREATE INDEX IF NOT EXISTS idx_products_style ON public.products(style);
CREATE INDEX IF NOT EXISTS idx_products_is_free ON public.products(is_free);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured);
CREATE INDEX IF NOT EXISTS idx_products_trending ON public.products(trending);
CREATE INDEX IF NOT EXISTS idx_products_new_release ON public.products(new_release);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);

-- ============================================================
-- PRODUCT IMAGES TABLE (unlimited count)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_product_images" ON public.product_images;
CREATE POLICY "public_read_product_images"
  ON public.product_images FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.products WHERE products.id = product_images.product_id AND products.published = true)
  );

DROP POLICY IF EXISTS "admin_read_all_product_images" ON public.product_images;
CREATE POLICY "admin_read_all_product_images"
  ON public.product_images FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_product_images" ON public.product_images;
CREATE POLICY "admin_insert_product_images"
  ON public.product_images FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_product_images" ON public.product_images;
CREATE POLICY "admin_update_product_images"
  ON public.product_images FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_product_images" ON public.product_images;
CREATE POLICY "admin_delete_product_images"
  ON public.product_images FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON public.product_images(sort_order);

-- ============================================================
-- PRODUCT FILES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  file_format text NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  is_zip boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.product_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_product_files" ON public.product_files;
CREATE POLICY "public_read_product_files"
  ON public.product_files FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.products WHERE products.id = product_files.product_id AND products.published = true)
  );

DROP POLICY IF EXISTS "admin_read_all_product_files" ON public.product_files;
CREATE POLICY "admin_read_all_product_files"
  ON public.product_files FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_product_files" ON public.product_files;
CREATE POLICY "admin_insert_product_files"
  ON public.product_files FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_product_files" ON public.product_files;
CREATE POLICY "admin_update_product_files"
  ON public.product_files FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_product_files" ON public.product_files;
CREATE POLICY "admin_delete_product_files"
  ON public.product_files FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_product_files_product_id ON public.product_files(product_id);

-- ============================================================
-- COLLECTIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  cover_image_url text,
  published boolean NOT NULL DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_collections" ON public.collections;
CREATE POLICY "public_read_published_collections"
  ON public.collections FOR SELECT
  TO anon, authenticated
  USING (published = true);

DROP POLICY IF EXISTS "admin_read_all_collections" ON public.collections;
CREATE POLICY "admin_read_all_collections"
  ON public.collections FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_collections" ON public.collections;
CREATE POLICY "admin_insert_collections"
  ON public.collections FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_collections" ON public.collections;
CREATE POLICY "admin_update_collections"
  ON public.collections FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_collections" ON public.collections;
CREATE POLICY "admin_delete_collections"
  ON public.collections FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_published ON public.collections(published);

-- ============================================================
-- PRODUCT COLLECTIONS JOIN
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_collections (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (product_id, collection_id)
);

ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_product_collections" ON public.product_collections;
CREATE POLICY "public_read_product_collections"
  ON public.product_collections FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "admin_insert_product_collections" ON public.product_collections;
CREATE POLICY "admin_insert_product_collections"
  ON public.product_collections FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_product_collections" ON public.product_collections;
CREATE POLICY "admin_delete_product_collections"
  ON public.product_collections FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_pc_product_id ON public.product_collections(product_id);
CREATE INDEX IF NOT EXISTS idx_pc_collection_id ON public.product_collections(collection_id);

-- ============================================================
-- FAVORITES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_favorites" ON public.favorites;
CREATE POLICY "select_own_favorites"
  ON public.favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_favorites" ON public.favorites;
CREATE POLICY "insert_own_favorites"
  ON public.favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_favorites" ON public.favorites;
CREATE POLICY "delete_own_favorites"
  ON public.favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON public.favorites(product_id);

-- ============================================================
-- CART ITEMS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_cart" ON public.cart_items;
CREATE POLICY "select_own_cart"
  ON public.cart_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_cart" ON public.cart_items;
CREATE POLICY "insert_own_cart"
  ON public.cart_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_cart" ON public.cart_items;
CREATE POLICY "update_own_cart"
  ON public.cart_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_cart" ON public.cart_items;
CREATE POLICY "delete_own_cart"
  ON public.cart_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_cart_user_id ON public.cart_items(user_id);

-- ============================================================
-- MARKETPLACE ORDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number text NOT NULL UNIQUE,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'payment_processing', 'paid', 'failed', 'cancelled', 'refunded')),
  payment_provider text,
  payment_reference text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_or_admin_orders" ON public.marketplace_orders;
CREATE POLICY "select_own_or_admin_orders"
  ON public.marketplace_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "insert_own_orders" ON public.marketplace_orders;
CREATE POLICY "insert_own_orders"
  ON public.marketplace_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "admin_update_orders" ON public.marketplace_orders;
CREATE POLICY "admin_update_orders"
  ON public.marketplace_orders FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_orders" ON public.marketplace_orders;
CREATE POLICY "admin_delete_orders"
  ON public.marketplace_orders FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.marketplace_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.marketplace_orders(status);

-- ============================================================
-- ORDER ITEMS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  price numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_or_admin_order_items" ON public.order_items;
CREATE POLICY "select_own_or_admin_order_items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.marketplace_orders
      WHERE marketplace_orders.id = order_items.order_id
      AND (marketplace_orders.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "admin_insert_order_items" ON public.order_items;
CREATE POLICY "admin_insert_order_items"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_order_items" ON public.order_items;
CREATE POLICY "admin_delete_order_items"
  ON public.order_items FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- ============================================================
-- ENTITLEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.marketplace_orders(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'purchase' CHECK (source IN ('purchase', 'free_download', 'admin_grant')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_or_admin_entitlements" ON public.entitlements;
CREATE POLICY "select_own_or_admin_entitlements"
  ON public.entitlements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "admin_insert_entitlements" ON public.entitlements;
CREATE POLICY "admin_insert_entitlements"
  ON public.entitlements FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_entitlements" ON public.entitlements;
CREATE POLICY "admin_delete_entitlements"
  ON public.entitlements FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_entitlements_user_id ON public.entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_product_id ON public.entitlements(product_id);

-- ============================================================
-- DOWNLOAD LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.download_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_file_id uuid REFERENCES public.product_files(id) ON DELETE SET NULL,
  file_format text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.download_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_or_admin_download_logs" ON public.download_logs;
CREATE POLICY "select_own_or_admin_download_logs"
  ON public.download_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "admin_insert_download_logs" ON public.download_logs;
CREATE POLICY "admin_insert_download_logs"
  ON public.download_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_download_logs_user_id ON public.download_logs(user_id);

-- ============================================================
-- ADMIN AUDIT LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_audit_logs" ON public.admin_audit_logs;
CREATE POLICY "admin_read_audit_logs"
  ON public.admin_audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_audit_logs" ON public.admin_audit_logs;
CREATE POLICY "admin_insert_audit_logs"
  ON public.admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS collections_updated_at ON public.collections;
CREATE TRIGGER collections_updated_at BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS marketplace_orders_updated_at ON public.marketplace_orders;
CREATE TRIGGER marketplace_orders_updated_at BEFORE UPDATE ON public.marketplace_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
