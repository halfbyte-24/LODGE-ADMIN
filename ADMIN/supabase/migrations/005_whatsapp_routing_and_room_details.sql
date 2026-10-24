-- ====================================================================
-- MIGRATION 005: WHATSAPP ROUTING, HOTEL SETTINGS & ROOM MANAGEMENT
-- Amontron Hotel and Restaurant - Lodge Management System
-- Safe & Non-Destructive: Run in Supabase SQL Editor
-- ====================================================================

-- 1. Create normalized WhatsApp Contacts table
CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  role_description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for whatsapp_contacts updated_at
DROP TRIGGER IF EXISTS update_whatsapp_contacts_updated_at ON public.whatsapp_contacts;
CREATE TRIGGER update_whatsapp_contacts_updated_at
  BEFORE UPDATE ON public.whatsapp_contacts
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- 2. Extend hotel_settings for WhatsApp routing
ALTER TABLE public.hotel_settings
  ADD COLUMN IF NOT EXISTS whatsapp_routing jsonb DEFAULT '{"contacts":[], "booking_recipient_id": null, "restaurant_recipient_id": null, "general_recipient_id": null}'::jsonb,
  ADD COLUMN IF NOT EXISTS booking_contact_id uuid,
  ADD COLUMN IF NOT EXISTS restaurant_contact_id uuid,
  ADD COLUMN IF NOT EXISTS general_contact_id uuid;

-- Foreign key constraints (safe conditional addition)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_hotel_booking_contact'
  ) THEN
    ALTER TABLE public.hotel_settings
      ADD CONSTRAINT fk_hotel_booking_contact
      FOREIGN KEY (booking_contact_id)
      REFERENCES public.whatsapp_contacts(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_hotel_restaurant_contact'
  ) THEN
    ALTER TABLE public.hotel_settings
      ADD CONSTRAINT fk_hotel_restaurant_contact
      FOREIGN KEY (restaurant_contact_id)
      REFERENCES public.whatsapp_contacts(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_hotel_general_contact'
  ) THEN
    ALTER TABLE public.hotel_settings
      ADD CONSTRAINT fk_hotel_general_contact
      FOREIGN KEY (general_contact_id)
      REFERENCES public.whatsapp_contacts(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Extend rooms table for complete room management
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS description text;

-- 4. Create public storage bucket for room images if missing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-images',
  'room-images',
  true,
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- 5. Row Level Security Policies for whatsapp_contacts
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active whatsapp contacts" ON public.whatsapp_contacts;
CREATE POLICY "Public read active whatsapp contacts" ON public.whatsapp_contacts
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admin manage whatsapp contacts" ON public.whatsapp_contacts;
CREATE POLICY "Admin manage whatsapp contacts" ON public.whatsapp_contacts
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- Storage policies for room-images
DROP POLICY IF EXISTS "Public can view room images" ON storage.objects;
CREATE POLICY "Public can view room images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'room-images');

DROP POLICY IF EXISTS "Authenticated can upload room images" ON storage.objects;
CREATE POLICY "Authenticated can upload room images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'room-images');

DROP POLICY IF EXISTS "Admin manage room images" ON storage.objects;
CREATE POLICY "Admin manage room images" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'room-images')
  WITH CHECK (bucket_id = 'room-images');

-- 6. Synchronize Official Hotel Information in hotel_settings
UPDATE public.hotel_settings
SET 
  hotel_name = 'Amontron Hotel and Restaurant',
  phone = '+91 94334 24718',
  email = 'amontronhotelandrestaurant@gmail.com',
  address = 'WM55+6MH, Dasghara',
  city = 'Dasghara',
  state = 'West Bengal',
  pin_code = '722161',
  google_maps_url = 'https://www.google.com/maps/search/?api=1&query=WM55%2B6MH%2C+Dasghara%2C+West+Bengal+722161',
  description = 'Amontron Hotel and Restaurant offers comfortable lodging, authentic dining, and warm hospitality in Dasghara, West Bengal.',
  updated_at = now()
WHERE id IS NOT NULL;

-- If no settings row exists, insert canonical row
INSERT INTO public.hotel_settings (
  hotel_name,
  phone,
  email,
  address,
  city,
  state,
  pin_code,
  google_maps_url,
  description
)
SELECT 
  'Amontron Hotel and Restaurant',
  '+91 94334 24718',
  'amontronhotelandrestaurant@gmail.com',
  'WM55+6MH, Dasghara',
  'Dasghara',
  'West Bengal',
  '722161',
  'https://www.google.com/maps/search/?api=1&query=WM55%2B6MH%2C+Dasghara%2C+West+Bengal+722161',
  'Amontron Hotel and Restaurant offers comfortable lodging, authentic dining, and warm hospitality in Dasghara, West Bengal.'
WHERE NOT EXISTS (SELECT 1 FROM public.hotel_settings LIMIT 1);
