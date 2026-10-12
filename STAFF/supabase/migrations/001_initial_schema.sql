-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  email text,
  phone text,
  role text default 'staff' check (role in ('admin', 'staff')),
  avatar_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Hotel Settings
CREATE TABLE IF NOT EXISTS public.hotel_settings (
  id uuid default gen_random_uuid() primary key,
  hotel_name text not null,
  logo_url text,
  address text,
  city text,
  state text,
  pin_code text,
  phone text,
  whatsapp text,
  email text,
  google_maps_url text,
  description text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Rooms
CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid default gen_random_uuid() primary key,
  room_number text not null unique,
  floor text not null,
  room_type text not null,
  bed_type text not null default 'Double Bed',
  price_per_night numeric not null,
  max_guests integer not null,
  ac boolean default false,
  wifi boolean default true,
  attached_bathroom boolean default true,
  image_url text,
  status text default 'available' check (status in ('available', 'occupied', 'reserved', 'cleaning', 'maintenance')),
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Customers
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  phone text,
  address text,
  number_of_guests integer default 1,
  customer_type text not null check (customer_type in ('room_guest', 'restaurant_only')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid default gen_random_uuid() primary key,
  booking_number text not null unique,
  customer_id uuid references public.customers on delete restrict not null,
  room_id uuid references public.rooms on delete restrict not null,
  check_in date not null,
  check_out date not null,
  number_of_nights integer not null,
  number_of_guests integer not null,
  room_rate numeric not null,
  room_total numeric not null,
  booking_status text default 'reserved' check (booking_status in ('reserved', 'checked_in', 'checked_out', 'cancelled')),
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Menu Categories
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null check (type in ('food', 'drink')),
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Menu Items
CREATE TABLE IF NOT EXISTS public.menu_items (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references public.menu_categories on delete restrict not null,
  name text not null,
  description text,
  price numeric not null,
  image_url text,
  is_veg boolean default true,
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Services
CREATE TABLE IF NOT EXISTS public.services (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price numeric not null,
  image_url text,
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bills
CREATE TABLE IF NOT EXISTS public.bills (
  id uuid default gen_random_uuid() primary key,
  invoice_number text not null unique,
  customer_id uuid references public.customers on delete restrict not null,
  booking_id uuid references public.bookings on delete restrict,
  staff_id uuid references public.profiles(id),
  subtotal numeric default 0 not null,
  discount_amount numeric default 0 not null,
  tax_amount numeric default 0 not null,
  advance_amount numeric default 0 not null,
  total_amount numeric default 0 not null,
  payment_status text default 'pending' check (payment_status in ('pending', 'partially_paid', 'paid')),
  bill_status text default 'draft' check (bill_status in ('draft', 'confirmed', 'invoiced', 'cancelled', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bill Items
CREATE TABLE IF NOT EXISTS public.bill_items (
  id uuid default gen_random_uuid() primary key,
  bill_id uuid references public.bills on delete cascade not null,
  item_type text not null check (item_type in ('room', 'food', 'drink', 'service', 'custom')),
  reference_id uuid, -- Can be null for custom items, references rooms, menu_items, services otherwise
  item_name text not null,
  quantity integer not null default 1,
  unit_price numeric not null,
  total_price numeric not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid default gen_random_uuid() primary key,
  bill_id uuid references public.bills on delete restrict not null,
  amount numeric not null,
  payment_method text not null check (payment_method in ('cash', 'upi', 'card', 'other')),
  payment_status text default 'paid',
  transaction_reference text,
  paid_at timestamp with time zone default timezone('utc'::text, now()) not null,
  received_by uuid references public.profiles(id),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid default gen_random_uuid() primary key,
  staff_id uuid references public.profiles(id) not null,
  category text not null check (category in ('food_supplies', 'grocery', 'gas', 'cleaning', 'maintenance', 'transportation', 'electricity', 'water', 'other')),
  title text not null,
  amount numeric not null,
  expense_date date not null,
  description text,
  receipt_url text,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_hotel_settings_updated_at BEFORE UPDATE ON hotel_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
