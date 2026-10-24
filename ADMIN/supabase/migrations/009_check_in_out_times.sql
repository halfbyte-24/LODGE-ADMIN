-- ====================================================================
-- MIGRATION 009: HOTEL POLICY CHECK-IN AND CHECK-OUT TIMES
-- Amontron Hotel and Restaurant - Lodge Management System
-- Safe, Non-Destructive & Idempotent: Run in Supabase SQL Editor
-- ====================================================================

-- 1. Add dedicated columns for check-in and check-out times if they do not exist
ALTER TABLE public.hotel_settings 
ADD COLUMN IF NOT EXISTS check_in_time text DEFAULT '12:00 PM',
ADD COLUMN IF NOT EXISTS check_out_time text DEFAULT '11:00 AM';

-- 2. Populate values from existing JSONB if present, or initialize with standard hotel defaults
UPDATE public.hotel_settings
SET 
  check_in_time = COALESCE(
    check_in_time, 
    whatsapp_routing->'timings'->>'check_in_time', 
    '12:00 PM'
  ),
  check_out_time = COALESCE(
    check_out_time, 
    whatsapp_routing->'timings'->>'check_out_time', 
    '11:00 AM'
  )
WHERE check_in_time IS NULL OR check_out_time IS NULL;

-- 3. Add comment for documentation
COMMENT ON COLUMN public.hotel_settings.check_in_time IS 'Official hotel standard check-in time policy (e.g. 12:00 PM)';
COMMENT ON COLUMN public.hotel_settings.check_out_time IS 'Official hotel standard check-out time policy (e.g. 11:00 AM)';
