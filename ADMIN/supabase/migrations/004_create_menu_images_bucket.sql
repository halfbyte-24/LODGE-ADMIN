-- ====================================================================
-- MIGRATION 004: CREATE MENU IMAGES STORAGE BUCKET & EXPAND CATEGORIES
-- Amontron Hotel and Restaurant - Lodge Management System
-- ====================================================================

-- 1. Create public bucket 'menu-images' for restaurant dish and beverage photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true,
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- 2. Storage RLS Policies for menu-images
-- Allow public viewing of menu images
DROP POLICY IF EXISTS "Public can view menu images" ON storage.objects;
CREATE POLICY "Public can view menu images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'menu-images');

-- Allow authenticated users / admins to upload menu images
DROP POLICY IF EXISTS "Authenticated can upload menu images" ON storage.objects;
CREATE POLICY "Authenticated can upload menu images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'menu-images');

-- Allow admins to update or delete menu images
DROP POLICY IF EXISTS "Admin manage menu images" ON storage.objects;
CREATE POLICY "Admin manage menu images" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'menu-images')
  WITH CHECK (bucket_id = 'menu-images');

-- 3. Relax category type check constraint to support additional types
ALTER TABLE public.menu_categories DROP CONSTRAINT IF EXISTS menu_categories_type_check;
ALTER TABLE public.menu_categories ADD CONSTRAINT menu_categories_type_check CHECK (type IN ('food', 'drink', 'dessert', 'other'));

-- 4. Seed standard categories if missing (safe idempotency)
INSERT INTO public.menu_categories (name, type, sort_order)
SELECT 'Rolls', 'food', 1
WHERE NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE LOWER(name) = 'rolls');

INSERT INTO public.menu_categories (name, type, sort_order)
SELECT 'Chicken', 'food', 2
WHERE NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE LOWER(name) = 'chicken');

INSERT INTO public.menu_categories (name, type, sort_order)
SELECT 'Paneer & Veg', 'food', 3
WHERE NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE LOWER(name) = 'paneer & veg');

INSERT INTO public.menu_categories (name, type, sort_order)
SELECT 'Roti & Bread', 'food', 4
WHERE NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE LOWER(name) = 'roti & bread');

INSERT INTO public.menu_categories (name, type, sort_order)
SELECT 'Fish', 'food', 5
WHERE NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE LOWER(name) = 'fish');

INSERT INTO public.menu_categories (name, type, sort_order)
SELECT 'Mutton', 'food', 6
WHERE NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE LOWER(name) = 'mutton');

INSERT INTO public.menu_categories (name, type, sort_order)
SELECT 'Snacks & Starters', 'food', 7
WHERE NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE LOWER(name) = 'snacks & starters');

INSERT INTO public.menu_categories (name, type, sort_order)
SELECT 'Tea & Coffee', 'drink', 8
WHERE NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE LOWER(name) = 'tea & coffee');

INSERT INTO public.menu_categories (name, type, sort_order)
SELECT 'Desserts', 'dessert', 9
WHERE NOT EXISTS (SELECT 1 FROM public.menu_categories WHERE LOWER(name) = 'desserts');
