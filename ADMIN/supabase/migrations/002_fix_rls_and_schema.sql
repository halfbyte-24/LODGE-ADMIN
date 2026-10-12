-- =========================================================================
-- GRAND HORIZON LODGE & RESTAURANT - COMPREHENSIVE PRODUCTION MIGRATION
-- Safe & Non-Destructive: Run in Supabase SQL Editor
-- =========================================================================

-- 1. EXTEND SCHEMA FOR BOOKINGS
-- Ensure room_id is nullable (to allow pending website booking requests before physical room assignment)
ALTER TABLE public.bookings ALTER COLUMN room_id DROP NOT NULL;

-- Add website booking compatibility columns to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS source text DEFAULT 'direct';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS special_requests text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_email text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_phone text;

-- Update booking_status CHECK constraint to support full lifecycle:
-- pending, reserved, checked_in, checked_out, cancelled, expired
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_booking_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_booking_status_check 
  CHECK (booking_status IN ('pending', 'reserved', 'checked_in', 'checked_out', 'cancelled', 'expired'));

-- Add email column to customers table if not exists
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS email text;

-- Ensure bills support customer reference properly
ALTER TABLE public.bills ALTER COLUMN booking_id DROP NOT NULL;

-- 2. CREATE ENQUIRIES TABLE (for Customer Contact form)
CREATE TABLE IF NOT EXISTS public.enquiries (
  id text PRIMARY KEY,
  name text NOT NULL,
  phone text,
  email text,
  message text NOT NULL,
  source text DEFAULT 'website',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Helper function to check role safely
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ----------------------------------------------------
-- A. PROFILES POLICIES
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
DROP POLICY IF EXISTS "Staff and Admin read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;

CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admin manage all profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin');

-- ----------------------------------------------------
-- B. HOTEL SETTINGS
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Public read hotel settings" ON public.hotel_settings;
DROP POLICY IF EXISTS "Admin manage hotel settings" ON public.hotel_settings;

CREATE POLICY "Public read hotel settings" ON public.hotel_settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admin manage hotel settings" ON public.hotel_settings
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin');

-- ----------------------------------------------------
-- C. ROOMS
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Public read active rooms" ON public.rooms;
DROP POLICY IF EXISTS "Staff read rooms" ON public.rooms;
DROP POLICY IF EXISTS "Staff update room status" ON public.rooms;
DROP POLICY IF EXISTS "Admin manage rooms" ON public.rooms;

CREATE POLICY "Public read active rooms" ON public.rooms
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Staff update room status" ON public.rooms
  FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Admin manage rooms" ON public.rooms
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin');

-- ----------------------------------------------------
-- D. CUSTOMERS
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Public insert customer" ON public.customers;
DROP POLICY IF EXISTS "Staff and admin read customers" ON public.customers;
DROP POLICY IF EXISTS "Staff and admin manage customers" ON public.customers;

-- Anonymous public booking submission can insert a customer record
CREATE POLICY "Public insert customer" ON public.customers
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Authenticated staff and admin can view and manage customers
CREATE POLICY "Staff and admin view customers" ON public.customers
  FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Staff and admin manage customers" ON public.customers
  FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('staff', 'admin'));

-- ----------------------------------------------------
-- E. BOOKINGS
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Public insert booking request" ON public.bookings;
DROP POLICY IF EXISTS "Staff and admin view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Staff and admin update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin delete bookings" ON public.bookings;

-- Anonymous website visitors can only insert pending requests
CREATE POLICY "Public insert booking request" ON public.bookings
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    booking_status = 'pending' AND
    source = 'website'
  );

-- Staff and admin can view all bookings
CREATE POLICY "Staff and admin view bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('staff', 'admin'));

-- Staff and admin can insert and update bookings
CREATE POLICY "Staff and admin insert bookings" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Staff and admin update bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('staff', 'admin'));

-- ----------------------------------------------------
-- F. MENU CATEGORIES & MENU ITEMS & SERVICES
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Public read menu" ON public.menu_items;
DROP POLICY IF EXISTS "Public read menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Public read services" ON public.services;

CREATE POLICY "Public read menu categories" ON public.menu_categories
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Public read menu items" ON public.menu_items
  FOR SELECT TO anon, authenticated
  USING (is_available = true);

CREATE POLICY "Public read services" ON public.services
  FOR SELECT TO anon, authenticated
  USING (is_available = true);

CREATE POLICY "Admin manage menu categories" ON public.menu_categories
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin');

CREATE POLICY "Admin manage menu items" ON public.menu_items
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin');

CREATE POLICY "Admin manage services" ON public.services
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin');

-- ----------------------------------------------------
-- G. BILLS & BILL ITEMS & PAYMENTS
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Staff and admin view bills" ON public.bills;
DROP POLICY IF EXISTS "Staff and admin manage bills" ON public.bills;
DROP POLICY IF EXISTS "Staff and admin view bill items" ON public.bill_items;
DROP POLICY IF EXISTS "Staff and admin manage bill items" ON public.bill_items;
DROP POLICY IF EXISTS "Staff and admin view payments" ON public.payments;
DROP POLICY IF EXISTS "Staff and admin manage payments" ON public.payments;

CREATE POLICY "Staff and admin view bills" ON public.bills
  FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Staff and admin manage bills" ON public.bills
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Staff and admin view bill items" ON public.bill_items
  FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Staff and admin manage bill items" ON public.bill_items
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Staff and admin view payments" ON public.payments
  FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Staff and admin insert payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('staff', 'admin'));

-- ----------------------------------------------------
-- H. EXPENSES
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Staff and admin view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Staff insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admin manage expenses" ON public.expenses;

CREATE POLICY "Staff and admin view expenses" ON public.expenses
  FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Staff insert expenses" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('staff', 'admin') AND
    amount > 0 AND
    staff_id = auth.uid()
  );

CREATE POLICY "Admin manage expenses" ON public.expenses
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin');

-- ----------------------------------------------------
-- I. ENQUIRIES
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Public insert enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "Staff and admin view enquiries" ON public.enquiries;

CREATE POLICY "Public insert enquiries" ON public.enquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff and admin view enquiries" ON public.enquiries
  FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('staff', 'admin'));

-- ----------------------------------------------------
-- 4. SEED INITIAL USERS AND ROOMS (IF EMPTY)
-- ----------------------------------------------------
-- Insert Default Hotel Settings
INSERT INTO public.hotel_settings (hotel_name, address, city, state, pin_code, phone, email) 
VALUES ('Grand Horizon Lodge & Restaurant', '123 Highway Road', 'Cityville', 'State', '12345', '+91 98765 43210', 'info@grandhorizon.com')
ON CONFLICT DO NOTHING;

-- Insert 18 Rooms if empty
INSERT INTO public.rooms (room_number, floor, room_type, price_per_night, max_guests, ac) VALUES
('101', '1st', 'Standard', 800, 2, false),
('102', '1st', 'Standard', 800, 2, false),
('103', '1st', 'Deluxe', 1500, 3, true),
('104', '1st', 'Deluxe', 1500, 3, true),
('105', '1st', 'Family', 2500, 5, true),
('106', '1st', 'Standard', 800, 2, false),
('201', '2nd', 'Standard', 800, 2, false),
('202', '2nd', 'Deluxe', 1500, 3, true),
('203', '2nd', 'Deluxe', 1500, 3, true),
('204', '2nd', 'Super Deluxe', 2000, 3, true),
('205', '2nd', 'Family', 2500, 5, true),
('206', '2nd', 'Standard', 800, 2, false),
('301', '3rd', 'Standard', 800, 2, false),
('302', '3rd', 'Deluxe', 1500, 3, true),
('303', '3rd', 'Super Deluxe', 2000, 3, true),
('304', '3rd', 'Deluxe', 1500, 3, true),
('305', '3rd', 'Family', 2500, 5, true),
('306', '3rd', 'Standard', 800, 2, false)
ON CONFLICT (room_number) DO NOTHING;

-- Insert Menu Categories & Items
DO $$ 
DECLARE 
  cat_rice uuid;
  cat_biriyani uuid;
  cat_drinks uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.menu_categories LIMIT 1) THEN
    INSERT INTO public.menu_categories (name, type) VALUES ('Rice', 'food') RETURNING id INTO cat_rice;
    INSERT INTO public.menu_categories (name, type) VALUES ('Biriyani', 'food') RETURNING id INTO cat_biriyani;
    INSERT INTO public.menu_categories (name, type) VALUES ('Drinks', 'drink') RETURNING id INTO cat_drinks;

    INSERT INTO public.menu_items (category_id, name, price, is_veg) VALUES
    (cat_rice, 'Veg Fried Rice', 120, true),
    (cat_rice, 'Chicken Fried Rice', 160, false),
    (cat_biriyani, 'Chicken Biriyani', 180, false),
    (cat_biriyani, 'Mutton Biriyani', 250, false),
    (cat_drinks, 'Mineral Water', 20, true),
    (cat_drinks, 'Tea', 15, true);
  END IF;
END $$;

-- Insert Services if empty
INSERT INTO public.services (name, price) VALUES
('Extra Bed', 300),
('Laundry', 200),
('Room Service', 100),
('Late Checkout', 500)
ON CONFLICT DO NOTHING;

-- Confirm existing Auth users to allow immediate login
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, now()) 
WHERE email IN ('admin@hotel.com', 'staff@hotel.com');

-- Ensure profiles exist for existing auth users
INSERT INTO public.profiles (id, full_name, email, role, is_active)
SELECT id, 'Hotel Admin', email, 'admin', true
FROM auth.users
WHERE email = 'admin@hotel.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', is_active = true;

INSERT INTO public.profiles (id, full_name, email, role, is_active)
SELECT id, 'Hotel Staff', email, 'staff', true
FROM auth.users
WHERE email = 'staff@hotel.com'
ON CONFLICT (id) DO UPDATE SET role = 'staff', is_active = true;
