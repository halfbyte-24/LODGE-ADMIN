import React, { useState, useEffect } from 'react';
import { Calendar, Users, BedDouble, ArrowRight } from 'lucide-react';
import { ROOM_TYPES } from '../data/hotelData';
import './FloatingBookingBar.css';

export default function FloatingBookingBar({ onCheckAvailability, defaultRoomId }) {
  const [selectedRoomId, setSelectedRoomId] = useState(defaultRoomId || ROOM_TYPES[0].id);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');

  // Initialize dates: tomorrow & 2 days later
  useEffect(() => {
    const today = new Date();
    const inD = new Date(today);
    inD.setDate(today.getDate() + 2);
    const outD = new Date(inD);
    outD.setDate(inD.getDate() + 2);

    setCheckIn(inD.toISOString().split('T')[0]);
    setCheckOut(outD.toISOString().split('T')[0]);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedRoom = ROOM_TYPES.find(r => r.id === selectedRoomId) || ROOM_TYPES[0];
    onCheckAvailability({
      room_id: selectedRoom.id,
      room_name: selectedRoom.name,
      check_in: checkIn,
      check_out: checkOut,
      guests: parseInt(guests, 10)
    });
  };

  return (
    <div className="floating-booking-wrapper">
      <div className="floating-booking-container">
        
        <form className="hotel-reservation-card" onSubmit={handleSubmit}>
          
          {/* Room Selection */}
          <div className="res-field-col">
            <label className="res-label">
              <BedDouble size={14} className="res-icon" />
              <span>ROOM / ROOM TYPE</span>
            </label>
            <select
              className="res-select"
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
            >
              {ROOM_TYPES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (₹{r.price.toLocaleString()}/night)
                </option>
              ))}
            </select>
          </div>

          <div className="res-divider-line" />

          {/* Check-In Date */}
          <div className="res-field-col">
            <label className="res-label">
              <Calendar size={14} className="res-icon" />
              <span>CHECK IN</span>
            </label>
            <input
              type="date"
              className="res-input"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
            />
          </div>

          <div className="res-divider-line" />

          {/* Check-Out Date */}
          <div className="res-field-col">
            <label className="res-label">
              <Calendar size={14} className="res-icon" />
              <span>CHECK OUT</span>
            </label>
            <input
              type="date"
              className="res-input"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              required
            />
          </div>

          <div className="res-divider-line" />

          {/* Number of Guests */}
          <div className="res-field-col">
            <label className="res-label">
              <Users size={14} className="res-icon" />
              <span>GUESTS</span>
            </label>
            <select
              className="res-select"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
            >
              <option value="1">1 Guest</option>
              <option value="2">2 Guests</option>
              <option value="3">3 Guests</option>
              <option value="4">4 Guests</option>
              <option value="6">5+ Family / Group</option>
            </select>
          </div>

          {/* Action CTA */}
          <div className="res-field-col res-btn-col">
            <button type="submit" className="btn-gold res-submit-btn">
              <span>BOOK NOW</span>
              <ArrowRight size={15} />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
