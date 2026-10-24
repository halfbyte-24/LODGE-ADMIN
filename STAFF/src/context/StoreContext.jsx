import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const StoreContext = createContext();

// Authoritative 9 hotel rooms (Floors 1 to 3) matching Supabase database
const initialRooms = [
  { id: 'cd0b603d-2d63-4de6-b3ec-1d39194a941d', room_number: '101', floor: '1st', type: 'Standard', price: 500, ac: false, maxGuests: 2, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: 'd1796afa-0776-45b8-bbb0-7a692de552cc', room_number: '102', floor: '1st', type: 'Standard', price: 800, ac: false, maxGuests: 2, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: '6a49bcde-c03d-4e58-9d40-5f1f9f7425c8', room_number: '103', floor: '1st', type: 'Deluxe', price: 1500, ac: true, maxGuests: 3, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: '89f8416f-e653-4c7b-a4ff-32434766075f', room_number: '201', floor: '2nd', type: 'Standard', price: 800, ac: false, maxGuests: 2, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: '782b3e2c-0873-4bdd-960e-d255fd148772', room_number: '202', floor: '2nd', type: 'Deluxe', price: 1500, ac: true, maxGuests: 3, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: '4b727664-9da5-494b-a90a-ef4b14caf583', room_number: '203', floor: '2nd', type: 'Deluxe', price: 1500, ac: true, maxGuests: 3, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: 'be3c6cf8-583c-4c51-a791-4a440f81bfa3', room_number: '301', floor: '3rd', type: 'Standard', price: 800, ac: false, maxGuests: 2, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: '8b8a1dfa-90e7-497c-8356-3685c04b206a', room_number: '302', floor: '3rd', type: 'Deluxe', price: 1500, ac: true, maxGuests: 3, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: 'e607c044-5a36-4fe8-bfbf-3af8992e4628', room_number: '303', floor: '3rd', type: 'Super Deluxe', price: 2000, ac: true, maxGuests: 3, status: 'Available', wifi: true, bathroom: 'Attached' }
];

export function StoreProvider({ children }) {
  const [hotelConfig, setHotelConfig] = useState({
    name: 'Amontron Hotel and Restaurant',
    address: 'WM55+6MH, Dasghara',
    city: 'Dasghara',
    state: 'West Bengal',
    pin: '722161',
    phone: '+91 94334 24718',
    email: 'amontronhotelandrestaurant@gmail.com',
    mapLink: 'https://www.google.com/maps/search/?api=1&query=WM55%2B6MH%2C+Dasghara%2C+West+Bengal+722161',
    checkInTime: '12:00 PM',
    checkOutTime: '11:00 AM',
    check_in_time: '12:00 PM',
    check_out_time: '11:00 AM'
  });

  useEffect(() => {
    async function syncWithSupabase() {
      try {
        const [settingsRes, roomsRes] = await Promise.all([
          supabase.from('hotel_settings').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('rooms').select('*').order('room_number', { ascending: true })
        ]);

        if (settingsRes.data) {
          const d = settingsRes.data;
          const routingTimings = d.whatsapp_routing?.timings || {};
          const checkIn = d.check_in_time || routingTimings.check_in_time || '12:00 PM';
          const checkOut = d.check_out_time || routingTimings.check_out_time || '11:00 AM';

          setHotelConfig({
            name: d.hotel_name || 'Amontron Hotel and Restaurant',
            address: d.address || 'WM55+6MH, Dasghara',
            city: d.city || 'Dasghara',
            state: d.state || 'West Bengal',
            pin: d.pin_code || '722161',
            phone: d.phone || '+91 94334 24718',
            email: d.email || 'amontronhotelandrestaurant@gmail.com',
            mapLink: d.google_maps_url || 'https://www.google.com/maps/search/?api=1&query=WM55%2B6MH%2C+Dasghara%2C+West+Bengal+722161',
            checkInTime: checkIn,
            checkOutTime: checkOut,
            check_in_time: checkIn,
            check_out_time: checkOut
          });
        }

        if (roomsRes.data && roomsRes.data.length > 0) {
          setRooms(roomsRes.data.map(r => ({
            id: r.id,
            room_number: r.room_number,
            floor: r.floor,
            type: r.room_type,
            price: Number(r.price_per_night),
            ac: r.ac,
            maxGuests: r.max_guests || 2,
            status: r.status === 'occupied' ? 'Occupied' : r.status === 'maintenance' ? 'Maintenance' : r.status === 'cleaning' ? 'Cleaning' : 'Available',
            wifi: r.wifi !== false,
            bathroom: r.attached_bathroom !== false ? 'Attached' : 'Common'
          })));
        }
      } catch (err) {
        console.warn('[STAFF StoreContext] Supabase sync error:', err);
      }
    }
    syncWithSupabase();
  }, []);

  const [guests, setGuests] = useState([
    { id: 'g1', name: 'Rahul Das', phone: '9876543210', notes: 'VIP', isRoomGuest: true, room: '203', checkIn: '2026-09-28', checkOut: '2026-09-30', bookingId: 'BK-1024', status: 'Staying' },
    { id: 'g2', name: 'Amit Kumar', phone: '9123456789', notes: '', isRoomGuest: false, status: 'Restaurant' }
  ]);
  
  const [rooms, setRooms] = useState(initialRooms);
  const [bills, setBills] = useState([]);
  
  // draftBills holds the in-progress bills: { [guestId]: { items: [], discount: 0, tax: 0, advance: 0 } }
  const [draftBills, setDraftBills] = useState({});

  const addGuest = (guestData) => {
    const newGuest = { ...guestData, id: 'g' + Date.now() };
    setGuests(prev => [...prev, newGuest]);
    return newGuest;
  };

  const bookRoom = (guestId, roomData) => {
    setGuests(prev => prev.map(g => {
      if (g.id === guestId) {
        return {
          ...g,
          isRoomGuest: true,
          room: roomData.roomId,
          checkIn: roomData.checkIn,
          checkOut: roomData.checkOut,
          bookingId: 'BK-' + Math.floor(Math.random() * 10000),
          status: 'Staying'
        }
      }
      return g;
    }));
    setRooms(prev => prev.map(r => r.id === roomData.roomId ? { ...r, status: 'Occupied' } : r));
  };

  const saveBill = (billData) => {
    const newBill = { ...billData, id: 'b' + Date.now(), invoiceId: 'INV-' + Math.floor(Math.random() * 10000) };
    setBills(prev => {
      const existing = prev.findIndex(b => b.id === billData.id);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { ...next[existing], ...billData };
        return next;
      }
      return [...prev, newBill];
    });
    
    // Clear draft bill for this guest after saving
    setDraftBills(prev => {
      const next = { ...prev };
      delete next[billData.guestId];
      return next;
    });

    return newBill;
  };

  const markBillPaid = (billId, paymentData) => {
    setBills(prev => prev.map(b => b.id === billId ? { ...b, ...paymentData, paymentStatus: 'PAID' } : b));
    
    // Also free the room if they were staying
    const bill = bills.find(b => b.id === billId);
    if (bill) {
      const guest = guests.find(g => g.id === bill.guestId);
      if (guest && guest.room) {
        setRooms(prev => prev.map(r => r.id === guest.room ? { ...r, status: 'Available' } : r));
        setGuests(prev => prev.map(g => g.id === guest.id ? { ...g, status: 'Checked Out' } : g));
      }
    }
  };

  const updateDraftBill = (guestId, updater) => {
    setDraftBills(prev => {
      const current = prev[guestId] || { items: [], discount: 0, tax: 0, advance: 0 };
      return { ...prev, [guestId]: updater(current) };
    });
  };

  return (
    <StoreContext.Provider value={{
      hotelConfig, setHotelConfig,
      guests, addGuest, bookRoom,
      rooms, 
      bills, saveBill, markBillPaid,
      draftBills, updateDraftBill
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
