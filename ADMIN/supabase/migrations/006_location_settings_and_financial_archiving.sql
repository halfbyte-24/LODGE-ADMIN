-- ====================================================================
-- MIGRATION 006: LOCATION SETTINGS, MONTHLY FINANCIAL ARCHIVING & AUDIT
-- Amontron Hotel and Restaurant - Lodge Management System
-- Safe & Non-Destructive: Run in Supabase SQL Editor
-- ====================================================================

-- 1. Extend hotel_settings for customer-facing location & landmarks
ALTER TABLE public.hotel_settings
  ADD COLUMN IF NOT EXISTS display_locality text DEFAULT 'Near Kamarpukur, West Bengal',
  ADD COLUMN IF NOT EXISTS landmark_1 text DEFAULT 'Near Kamarpukur Ramakrishna Math and Mission',
  ADD COLUMN IF NOT EXISTS landmark_2 text DEFAULT 'Near Kamarpukur Railway Station',
  ADD COLUMN IF NOT EXISTS travel_time_description text DEFAULT 'Conveniently located near Kamarpukur’s key landmarks.',
  ADD COLUMN IF NOT EXISTS google_maps_embed_url text DEFAULT 'https://maps.google.com/maps?q=WM55%2B6MH%2C+Dasghara%2C+West+Bengal+722161&hl=en&z=15&output=embed';

-- 2. Extend expenses table for safe soft-archiving (preserving records)
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;

-- 3. Monthly Financial Archives Table (Stores finalized monthly financial snapshots)
CREATE TABLE IF NOT EXISTS public.monthly_financial_archives (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  year_month text NOT NULL UNIQUE, -- e.g. '2026-10'
  month_name text NOT NULL,        -- e.g. 'October 2026'
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_payments_received numeric NOT NULL DEFAULT 0,
  total_expenses numeric NOT NULL DEFAULT 0,
  net_cash_movement numeric NOT NULL DEFAULT 0,
  total_invoiced_revenue numeric NOT NULL DEFAULT 0,
  outstanding_balance numeric NOT NULL DEFAULT 0,
  bills_count integer NOT NULL DEFAULT 0,
  bookings_count integer NOT NULL DEFAULT 0,
  payments_count integer NOT NULL DEFAULT 0,
  expenses_count integer NOT NULL DEFAULT 0,
  is_closed boolean NOT NULL DEFAULT true,
  closed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  closed_by uuid REFERENCES public.profiles(id),
  closed_by_name text,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Financial Audit Logs (Immutable trail of administrative financial actions)
CREATE TABLE IF NOT EXISTS public.financial_audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type text NOT NULL, -- 'close_month', 'reopen_month', 'archive_expenses', 'export_summary'
  year_month text NOT NULL,
  performed_by uuid REFERENCES public.profiles(id),
  performed_by_name text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. RLS Security Policies
ALTER TABLE public.monthly_financial_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated Admins full access to archives and audit logs
DROP POLICY IF EXISTS "Admins have full access to monthly archives" ON public.monthly_financial_archives;
CREATE POLICY "Admins have full access to monthly archives"
  ON public.monthly_financial_archives
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Allow authenticated Staff read-only access to closed monthly archives
DROP POLICY IF EXISTS "Staff can read monthly archives" ON public.monthly_financial_archives;
CREATE POLICY "Staff can read monthly archives"
  ON public.monthly_financial_archives
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff')
    )
  );

-- Admins can insert and read audit logs
DROP POLICY IF EXISTS "Admins have full access to audit logs" ON public.financial_audit_logs;
CREATE POLICY "Admins have full access to audit logs"
  ON public.financial_audit_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Update hotel_settings default row with verified Kamarpukur location text if not set
UPDATE public.hotel_settings
SET 
  display_locality = COALESCE(display_locality, 'Near Kamarpukur, West Bengal'),
  landmark_1 = COALESCE(landmark_1, 'Near Kamarpukur Ramakrishna Math and Mission'),
  landmark_2 = COALESCE(landmark_2, 'Near Kamarpukur Railway Station'),
  travel_time_description = COALESCE(travel_time_description, 'Conveniently located near Kamarpukur’s key landmarks.'),
  google_maps_embed_url = COALESCE(google_maps_embed_url, 'https://maps.google.com/maps?q=WM55%2B6MH%2C+Dasghara%2C+West+Bengal+722161&hl=en&z=15&output=embed'),
  updated_at = now()
WHERE id IS NOT NULL;
