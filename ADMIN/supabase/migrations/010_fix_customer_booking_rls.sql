-- ====================================================================
-- MIGRATION 010: SECURE CUSTOMER BOOKING RLS POLICIES
-- Amontron Hotel and Restaurant - Lodge Management System
-- Safe, Minimal & Idempotent: Run in Supabase SQL Editor
-- ====================================================================

-- 1. Ensure RLS is active on bookings and customers
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing public insert policies on bookings to re-define cleanly
DROP POLICY IF EXISTS "Public insert booking request" ON public.bookings;
DROP POLICY IF EXISTS "Allow anonymous booking insert" ON public.bookings;
DROP POLICY IF EXISTS "Anon insert pending bookings" ON public.bookings;

-- 3. Secure INSERT Policy:
-- Anonymous (anon) and authenticated website visitors may ONLY insert
-- pending booking requests. They cannot set status to 'reserved', 'checked_in',
-- or bypass front-desk approval.
CREATE POLICY "Public insert booking request" ON public.bookings
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    booking_status = 'pending' AND
    (source IS NULL OR source IN ('website', 'direct'))
  );

-- 4. Preserve existing Staff and Admin management policies
-- Staff and Admins retain full view, insert, and update permissions.
-- Admins retain exclusive permanent deletion permissions.
DROP POLICY IF EXISTS "Staff and admin view bookings" ON public.bookings;
CREATE POLICY "Staff and admin view bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('staff', 'admin'));

DROP POLICY IF EXISTS "Staff and admin insert bookings" ON public.bookings;
CREATE POLICY "Staff and admin insert bookings" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('staff', 'admin'));

DROP POLICY IF EXISTS "Staff and admin update bookings" ON public.bookings;
CREATE POLICY "Staff and admin update bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('staff', 'admin'))
  WITH CHECK (public.current_user_role() IN ('staff', 'admin'));

DROP POLICY IF EXISTS "Admin delete bookings" ON public.bookings;
CREATE POLICY "Admin delete bookings" ON public.bookings
  FOR DELETE TO authenticated
  USING (public.current_user_role() = 'admin');

-- 5. Ensure anonymous users have NO UPDATE or DELETE access on bookings
-- (PostgreSQL blocks by default if no matching policy exists for anon).
