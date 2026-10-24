-- ====================================================================
-- MIGRATION 008: ATOMIC DEMO DATA CLEANUP RPC & PERFORMANCE INDEXES
-- Amontron Hotel and Restaurant - Lodge Management System
-- Safe, Non-Destructive & Idempotent: Run in Supabase SQL Editor
-- ====================================================================

-- 1. PERFORMANCE INDEXES FOR FAST JOINS, SEARCH & FILTERING
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON public.bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_status ON public.bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(check_in, check_out);

CREATE INDEX IF NOT EXISTS idx_bills_customer_id ON public.bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_bills_booking_id ON public.bills(booking_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON public.bills(bill_status, payment_status);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON public.bills(created_at);

CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON public.bill_items(bill_id);

CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON public.payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON public.payments(paid_at);

CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);

CREATE INDEX IF NOT EXISTS idx_hotel_settings_updated_at ON public.hotel_settings(updated_at DESC);

-- 2. SECURE ADMIN-ONLY ATOMIC DEMO DATA CLEANUP RPC
-- Deletes confirmed demo transactions atomically in safe foreign-key order:
-- payments -> bill_items -> bills -> bookings -> customers -> expenses
CREATE OR REPLACE FUNCTION public.admin_cleanup_demo_records(
  p_customer_ids uuid[] DEFAULT '{}',
  p_booking_ids uuid[] DEFAULT '{}',
  p_bill_ids uuid[] DEFAULT '{}',
  p_expense_ids uuid[] DEFAULT '{}',
  p_reason text DEFAULT 'Admin demo data cleanup before handover'
)
RETURNS jsonb AS $$
DECLARE
  v_role text;
  v_all_bill_ids uuid[] := '{}';
  v_all_booking_ids uuid[] := '{}';
  v_deleted_payments integer := 0;
  v_deleted_bill_items integer := 0;
  v_deleted_bills integer := 0;
  v_deleted_bookings integer := 0;
  v_deleted_customers integer := 0;
  v_deleted_expenses integer := 0;
BEGIN
  -- Strict Admin-only Authorization
  v_role := public.current_user_role();
  IF v_role != 'admin' THEN
    RAISE EXCEPTION 'Access Denied: Only hotel administrators are authorized to perform demo data cleanup.';
  END IF;

  -- 1. Gather all linked bookings for selected customers
  IF array_length(p_customer_ids, 1) > 0 THEN
    SELECT array_agg(id) INTO v_all_booking_ids
    FROM public.bookings
    WHERE customer_id = ANY(p_customer_ids);
  END IF;

  -- Merge directly selected booking IDs
  IF array_length(p_booking_ids, 1) > 0 THEN
    v_all_booking_ids := array_cat(COALESCE(v_all_booking_ids, '{}'), p_booking_ids);
  END IF;

  -- 2. Gather all linked bills for selected customers and bookings
  IF array_length(p_customer_ids, 1) > 0 OR array_length(v_all_booking_ids, 1) > 0 THEN
    SELECT array_agg(id) INTO v_all_bill_ids
    FROM public.bills
    WHERE (customer_id = ANY(p_customer_ids))
       OR (booking_id = ANY(v_all_booking_ids));
  END IF;

  -- Merge directly selected bill IDs
  IF array_length(p_bill_ids, 1) > 0 THEN
    v_all_bill_ids := array_cat(COALESCE(v_all_bill_ids, '{}'), p_bill_ids);
  END IF;

  -- 3. Atomically delete payments linked to demo bills
  IF array_length(v_all_bill_ids, 1) > 0 THEN
    WITH deleted AS (
      DELETE FROM public.payments
      WHERE bill_id = ANY(v_all_bill_ids)
      RETURNING id
    )
    SELECT count(*) INTO v_deleted_payments FROM deleted;

    -- 4. Delete bill items
    WITH deleted AS (
      DELETE FROM public.bill_items
      WHERE bill_id = ANY(v_all_bill_ids)
      RETURNING id
    )
    SELECT count(*) INTO v_deleted_bill_items FROM deleted;

    -- 5. Delete bills
    WITH deleted AS (
      DELETE FROM public.bills
      WHERE id = ANY(v_all_bill_ids)
      RETURNING id
    )
    SELECT count(*) INTO v_deleted_bills FROM deleted;
  END IF;

  -- 6. Delete bookings
  IF array_length(v_all_booking_ids, 1) > 0 THEN
    WITH deleted AS (
      DELETE FROM public.bookings
      WHERE id = ANY(v_all_booking_ids)
      RETURNING id
    )
    SELECT count(*) INTO v_deleted_bookings FROM deleted;
  END IF;

  -- 7. Delete customers
  IF array_length(p_customer_ids, 1) > 0 THEN
    WITH deleted AS (
      DELETE FROM public.customers
      WHERE id = ANY(p_customer_ids)
      RETURNING id
    )
    SELECT count(*) INTO v_deleted_customers FROM deleted;
  END IF;

  -- 8. Delete expenses
  IF array_length(p_expense_ids, 1) > 0 THEN
    WITH deleted AS (
      DELETE FROM public.expenses
      WHERE id = ANY(p_expense_ids)
      RETURNING id
    )
    SELECT count(*) INTO v_deleted_expenses FROM deleted;
  END IF;

  -- 9. Record entry in audit log if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'financial_audit_logs') THEN
    INSERT INTO public.financial_audit_logs (
      action_type,
      year_month,
      performed_by,
      details,
      created_at
    ) VALUES (
      'admin_demo_cleanup',
      to_char(now(), 'YYYY-MM'),
      auth.uid(),
      jsonb_build_object(
        'reason', p_reason,
        'deleted_customers_count', v_deleted_customers,
        'deleted_bookings_count', v_deleted_bookings,
        'deleted_bills_count', v_deleted_bills,
        'deleted_bill_items_count', v_deleted_bill_items,
        'deleted_payments_count', v_deleted_payments,
        'deleted_expenses_count', v_deleted_expenses,
        'timestamp', now()
      ),
      now()
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_customers', v_deleted_customers,
    'deleted_bookings', v_deleted_bookings,
    'deleted_bills', v_deleted_bills,
    'deleted_bill_items', v_deleted_bill_items,
    'deleted_payments', v_deleted_payments,
    'deleted_expenses', v_deleted_expenses,
    'total_cleaned', v_deleted_customers + v_deleted_bookings + v_deleted_bills + v_deleted_payments + v_deleted_expenses
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
