import React, { createContext, useState, useContext } from 'react';

const StoreContext = createContext();

const initialRooms = [
  { id: '101', floor: '1st', type: 'Standard', price: 800, ac: false, maxGuests: 2, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: '102', floor: '1st', type: 'Standard', price: 800, ac: false, maxGuests: 2, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: '103', floor: '1st', type: 'Deluxe', price: 1500, ac: true, maxGuests: 3, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: '104', floor: '1st', type: 'Deluxe', price: 1500, ac: true, maxGuests: 3, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: '105', floor: '1st', type: 'Family', price: 2500, ac: true, maxGuests: 5, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: '106', floor: '1st', type: 'Standard', price: 800, ac: false, maxGuests: 2, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: '201', floor: '2nd', type: 'Standard', price: 800, ac: false, maxGuests: 2, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: '202', floor: '2nd', type: 'Deluxe', price: 1500, ac: true, maxGuests: 3, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: '203', floor: '2nd', type: 'Deluxe', price: 1500, ac: true, maxGuests: 3, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: '204', floor: '2nd', type: 'Super Deluxe', price: 2000, ac: true, maxGuests: 3, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: '205', floor: '2nd', type: 'Family', price: 2500, ac: true, maxGuests: 5, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: '206', floor: '2nd', type: 'Standard', price: 800, ac: false, maxGuests: 2, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: '301', floor: '3rd', type: 'Standard', price: 800, ac: false, maxGuests: 2, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: '302', floor: '3rd', type: 'Deluxe', price: 1500, ac: true, maxGuests: 3, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: '303', floor: '3rd', type: 'Super Deluxe', price: 2000, ac: true, maxGuests: 3, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: '304', floor: '3rd', type: 'Deluxe', price: 1500, ac: true, maxGuests: 3, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: '305', floor: '3rd', type: 'Family', price: 2500, ac: true, maxGuests: 5, status: 'Available', wifi: true, bathroom: 'Attached' },
  { id: '306', floor: '3rd', type: 'Standard', price: 800, ac: false, maxGuests: 2, status: 'Available', wifi: true, bathroom: 'Attached' }
];

export function StoreProvider({ children }) {
  const [hotelConfig, setHotelConfig] = useState({
    name: 'Amontron Hotel and Restaurant',
    address: '123 Highway Road',
    city: 'Cityville',
    state: 'State',
    pin: '12345',
    phone: '+91 94334 24718',
    email: 'amontronhotelandrestaurant@gmail.com',
    mapLink: 'https://maps.app.goo.gl/rSui7ryM9LkorzYk6?g_st=ac'
  });

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
