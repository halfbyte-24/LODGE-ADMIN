-- =========================================================================
-- AURA LODGE & RETREAT - SUPABASE DATABASE SCHEMA
-- Execute this script in your Supabase project's SQL Editor
-- =========================================================================

-- 1. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  booking_code TEXT NOT NULL UNIQUE,
  room_id TEXT NOT NULL,
  room_name TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER NOT NULL,
  adults INTEGER NOT NULL DEFAULT 2,
  children INTEGER NOT NULL DEFAULT 0,
  enhancements JSONB DEFAULT '[]'::jsonb,
  total_price NUMERIC NOT NULL,
  status TEXT DEFAULT 'Confirmed',
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and public policies for demonstration
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert to bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select of own bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Allow public update of bookings" ON bookings FOR UPDATE USING (true);

-- 2. Dining Reservations Table
CREATE TABLE IF NOT EXISTS dining_reservations (
  id TEXT PRIMARY KEY,
  reservation_code TEXT NOT NULL UNIQUE,
  venue_name TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  party_size INTEGER NOT NULL,
  dietary_notes TEXT,
  status TEXT DEFAULT 'Confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dining_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert to dining" ON dining_reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read dining" ON dining_reservations FOR SELECT USING (true);

-- 3. Messages & Inquiries Table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert to messages" ON messages FOR INSERT WITH CHECK (true);

-- 4. Newsletter Subscribers Table
CREATE TABLE IF NOT EXISTS newsletter (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE newsletter ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public newsletter signups" ON newsletter FOR INSERT WITH CHECK (true);
