import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function RoomBooking() {
  const { guestId } = useParams();
  const navigate = useNavigate();
  const { rooms, bookRoom } = useStore();
  
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [checkIn, setCheckIn] = useState(new Date().toISOString().split('T')[0]);
  const [checkOut, setCheckOut] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);

  const availableRooms = rooms.filter(r => r.status === 'Available');

  const handleConfirm = () => {
    if (!selectedRoom || !checkIn || !checkOut) return alert('Select room and dates.');
    
    bookRoom(guestId, {
      roomId: selectedRoom.id,
      checkIn,
      checkOut,
      guestsCount
    });
    
    navigate(`/billing/guest/${guestId}`);
  };

  return (
    <div className="page-container">
      <div style={{ maxWidth: 800, margin: '0 auto', marginTop: '2rem' }}>
        <h2 style={{fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem'}}>Select Available Room</h2>
        
        <div className="rooms-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {availableRooms.map(room => (
            <div 
              key={room.id} 
              className={`card ${selectedRoom?.id === room.id ? 'selected-room' : ''}`}
              style={{ cursor: 'pointer', border: selectedRoom?.id === room.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)' }}
              onClick={() => setSelectedRoom(room)}
            >
              <h3 style={{fontSize: '1.25rem', marginBottom: '0.5rem'}}>Room {room.id}</h3>
              <p style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>{room.type} • {room.ac ? 'AC' : 'Non-AC'}</p>
              <p style={{fontSize: '1.125rem', fontWeight: 600, marginTop: '0.5rem', color: 'var(--primary-color)'}}>₹{room.price} / Night</p>
              <p style={{fontSize: '0.75rem', marginTop: '0.5rem'}}>Max Guests: {room.maxGuests}</p>
              <div style={{fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--success-color)', fontWeight: 600}}>Available</div>
            </div>
          ))}
          {availableRooms.length === 0 && <p>No rooms available.</p>}
        </div>

        {selectedRoom && (
          <div className="card">
            <h3 className="card-title" style={{marginBottom: '1rem'}}>Booking Details for Room {selectedRoom.id}</h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="input-group" style={{flex: 1}}>
                <label className="input-label">Check-in Date</label>
                <input type="date" className="input" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
              </div>
              <div className="input-group" style={{flex: 1}}>
                <label className="input-label">Check-out Date</label>
                <input type="date" className="input" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
              </div>
              <div className="input-group" style={{flex: 1}}>
                <label className="input-label">Guests</label>
                <input type="number" className="input" min="1" max={selectedRoom.maxGuests} value={guestsCount} onChange={e => setGuestsCount(e.target.value)} />
              </div>
            </div>
            
            <button className="btn btn-primary" style={{width: '100%'}} onClick={handleConfirm}>
              Confirm Guest & Booking
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
