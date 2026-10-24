-- ====================================================================
-- MIGRATION 007: TEST DATA CLASSIFICATION, SAFE CLEANUP & RLS SECURITY
-- Amontron Hotel and Restaurant - Lodge Management System
-- Safe, Non-Destructive & Idempotent: Run in Supabase SQL Editor
-- ====================================================================

-- 1. ADD TEST DATA CLASSIFICATION COLUMNS
-- Explicit flag to segregate test sandbox entries from genuine guest & operational records
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS is_test_data boolean DEFAULT false NOT NULL;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS is_test_data boolean DEFAULT false NOT NULL;

ALTER TABLE public.bills
  ADD COLUMN IF NOT EXISTS is_test_data boolean DEFAULT false NOT NULL;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS is_test_data boolean DEFAULT false NOT NULL;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS is_test_data boolean DEFAULT false NOT NULL;

-- 2. CREATE PERFORMANCE INDEXES FOR FAST FILTERING
CREATE INDEX IF NOT EXISTS idx_customers_is_test_data ON public.customers(is_test_data);
CREATE INDEX IF NOT EXISTS idx_bookings_is_test_data ON public.bookings(is_test_data);
CREATE INDEX IF NOT EXISTS idx_bills_is_test_data ON public.bills(is_test_data);
CREATE INDEX IF NOT EXISTS idx_payments_is_test_data ON public.payments(is_test_data);
CREATE INDEX IF NOT EXISTS idx_expenses_is_test_data ON public.expenses(is_test_data);

-- 3. FIX BILLS & BILL ITEMS RLS PERMISSIONS
-- Revoke inadvertent Staff DELETE permissions while preserving SELECT, INSERT and UPDATE for Staff.
-- Only authenticated Admins may delete bills/bill items.

-- BILLS
DROP POLICY IF EXISTS "Staff and admin manage bills" ON public.bills;
DROP POLICY IF EXISTS "Staff and admin insert bills" ON public.bills;
DROP POLICY IF EXISTS "Staff and admin update bills" ON public.bills;
DROP POLICY IF EXISTS "Admin delete bills" ON public.bills;

CREATE POLICY "Staff and admin insert bills" ON public.bills
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Staff and admin update bills" ON public.bills
  FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('staff', 'admin'))
  WITH CHECK (public.current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Admin delete bills" ON public.bills
  FOR DELETE TO authenticated
  USING (public.current_user_role() = 'admin');

-- BILL ITEMS
DROP POLICY IF EXISTS "Staff and admin manage bill items" ON public.bill_items;
DROP POLICY IF EXISTS "Staff and admin insert bill items" ON public.bill_items;
DROP POLICY IF EXISTS "Staff and admin update bill items" ON public.bill_items;
DROP POLICY IF EXISTS "Admin delete bill items" ON public.bill_items;

CREATE POLICY "Staff and admin insert bill items" ON public.bill_items
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Staff and admin update bill items" ON public.bill_items
  FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('staff', 'admin'))
  WITH CHECK (public.current_user_role() IN ('staff', 'admin'));

CREATE POLICY "Admin delete bill items" ON public.bill_items
  FOR DELETE TO authenticated
  USING (public.current_user_role() = 'admin');

-- 4. CONFIGURE STRICT ADMIN-ONLY DELETION POLICIES ON CUSTOMERS & BOOKINGS
-- Foreign key RESTRICT constraints prevent deletion if child records exist.
-- Only Admins can execute permanent deletion on unlinked records.

DROP POLICY IF EXISTS "Admin delete customers" ON public.customers;
CREATE POLICY "Admin delete customers" ON public.customers
  FOR DELETE TO authenticated
  USING (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Admin delete bookings" ON public.bookings;
CREATE POLICY "Admin delete bookings" ON public.bookings
  FOR DELETE TO authenticated
  USING (public.current_user_role() = 'admin');

-- 5. CONFIGURE ADMIN MANAGEMENT POLICIES ON PAYMENTS
-- Allows Admins to update payment flags (e.g. marking is_test_data) and delete unlinked test payments if safe.
DROP POLICY IF EXISTS "Admin update payments" ON public.payments;
CREATE POLICY "Admin update payments" ON public.payments
  FOR UPDATE TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Admin delete payments" ON public.payments;
CREATE POLICY "Admin delete payments" ON public.payments
  FOR DELETE TO authenticated
  USING (public.current_user_role() = 'admin');

-- 6. AUDIT LOGGING HELPER FUNCTION
-- Secure helper to record test data actions in financial_audit_logs if the table exists
CREATE OR REPLACE FUNCTION public.log_test_data_action(
  p_action_type text,
  p_entity_type text,
  p_record_id text,
  p_details jsonb
)
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'financial_audit_logs') THEN
    INSERT INTO public.financial_audit_logs (
      action_type,
      year_month,
      performed_by,
      details,
      created_at
    ) VALUES (
      p_action_type,
      to_char(now(), 'YYYY-MM'),
      auth.uid(),
      jsonb_build_object(
        'entity_type', p_entity_type,
        'record_id', p_record_id,
        'info', p_details
      ),
      now()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
