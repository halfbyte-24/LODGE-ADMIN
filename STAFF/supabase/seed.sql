-- Insert Default Hotel Settings
INSERT INTO public.hotel_settings (hotel_name, address, city, state, pin_code, phone, email) 
VALUES ('Grand Horizon Lodge & Restaurant', '123 Highway Road', 'Cityville', 'State', '12345', '+91 98765 43210', 'info@grandhorizon.com')
ON CONFLICT DO NOTHING;

-- Insert 18 Rooms
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

-- Insert Menu Categories
DO $$ 
DECLARE 
  cat_rice uuid;
  cat_biriyani uuid;
  cat_drinks uuid;
BEGIN
  INSERT INTO public.menu_categories (name, type) VALUES ('Rice', 'food') RETURNING id INTO cat_rice;
  INSERT INTO public.menu_categories (name, type) VALUES ('Biriyani', 'food') RETURNING id INTO cat_biriyani;
  INSERT INTO public.menu_categories (name, type) VALUES ('Drinks', 'drink') RETURNING id INTO cat_drinks;

  -- Insert Menu Items
  INSERT INTO public.menu_items (category_id, name, price, is_veg) VALUES
  (cat_rice, 'Veg Fried Rice', 120, true),
  (cat_rice, 'Chicken Fried Rice', 160, false),
  (cat_biriyani, 'Chicken Biriyani', 180, false),
  (cat_biriyani, 'Mutton Biriyani', 250, false),
  (cat_drinks, 'Mineral Water', 20, true),
  (cat_drinks, 'Tea', 15, true);
END $$;

-- Insert Services
INSERT INTO public.services (name, price) VALUES
('Extra Bed', 300),
('Laundry', 200),
('Room Service', 100),
('Late Checkout', 500);
