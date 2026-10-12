-- ====================================================================
-- MIGRATION 003: ENFORCE ADMIN-EXCLUSIVE ROOM & MENU PRICING PERMISSIONS
-- Lodge Management System - Grand Horizon Lodge & Restaurant
-- ====================================================================

-- 1. Strictly restrict menu_items modifications to Admins only
-- (Staff can view and add to customer bills, but cannot alter menu items or prices)
DROP POLICY IF EXISTS "Admin manage menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Staff manage menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Public read menu items" ON public.menu_items;

CREATE POLICY "Public read menu items" ON public.menu_items
  FOR SELECT TO anon, authenticated
  USING (is_available = true);

CREATE POLICY "Admin manage menu items" ON public.menu_items
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- 2. Strictly restrict menu_categories modifications to Admins only
DROP POLICY IF EXISTS "Admin manage menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Public read menu categories" ON public.menu_categories;

CREATE POLICY "Public read menu categories" ON public.menu_categories
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admin manage menu categories" ON public.menu_categories
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- 3. Room pricing and room configuration:
-- Staff can read room inventory and update room operational status ('available', 'occupied', 'cleaning', 'maintenance')
-- Admin can configure room rates (price_per_night), room configuration, and all room fields.
DROP POLICY IF EXISTS "Staff update room status" ON public.rooms;
DROP POLICY IF EXISTS "Admin manage rooms" ON public.rooms;
DROP POLICY IF EXISTS "Public read active rooms" ON public.rooms;

CREATE POLICY "Public read active rooms" ON public.rooms
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Admin has full ALL privileges on rooms
CREATE POLICY "Admin manage rooms" ON public.rooms
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- Optional helper trigger to prevent non-admins from changing price_per_night
CREATE OR REPLACE FUNCTION public.check_room_update_permission()
RETURNS TRIGGER AS $$
BEGIN
  -- If price or room configuration is altered, caller must be an admin
  IF (NEW.price_per_night IS DISTINCT FROM OLD.price_per_night OR
      NEW.room_number IS DISTINCT FROM OLD.room_number OR
      NEW.floor IS DISTINCT FROM OLD.floor OR
      NEW.room_type IS DISTINCT FROM OLD.room_type) THEN
    IF public.current_user_role() != 'admin' THEN
      RAISE EXCEPTION 'Only Administrators are permitted to modify room rates or room configurations.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_room_rates ON public.rooms;
CREATE TRIGGER trg_protect_room_rates
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.check_room_update_permission();

-- Allow staff to update room operational status
CREATE POLICY "Staff update room status" ON public.rooms
  FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('staff', 'admin'))
  WITH CHECK (public.current_user_role() IN ('staff', 'admin'));
