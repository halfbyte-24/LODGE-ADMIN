import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomService } from '../../services/roomService';
import { useAuth } from '../../context/AuthContext';
import { BedDouble, Check, X } from 'lucide-react';

export default function RoomBooking() {
  const { customerId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingData, setBookingData] = useState({
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    guests: 2
  });

  useEffect(() => {
    async function loadRooms() {
      try {
        const data = await roomService.getRooms();
        setRooms(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadRooms();
  }, []);

  const floors = useMemo(() => {
    const f = {};
    rooms.forEach(r => {
      if (!f[r.floor]) f[r.floor] = [];
      f[r.floor].push(r);
    });
    return f;
  }, [rooms]);

  const nights = useMemo(() => {
    const start = new Date(bookingData.checkIn);
    const end = new Date(bookingData.checkOut);
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  }, [bookingData.checkIn, bookingData.checkOut]);

  const handleConfirm = async () => {
    if (!selectedRoom) return;
    try {
      const roomTotal = nights * selectedRoom.price_per_night;
      await roomService.bookRoom({
        customerId,
        roomId: selectedRoom.id,
        roomNumber: selectedRoom.room_number,
        staffId: profile.id,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        nights,
        guests: bookingData.guests,
        roomRate: selectedRoom.price_per_night,
        roomTotal
      });
      navigate(`/staff/billing/${customerId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to book room');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading rooms...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Select a Room</h1>
        <p style={{ color: 'var(--text-muted)' }}>Choose an available room to complete the booking.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedRoom ? '2fr 1fr' : '1fr', gap: '2rem', transition: 'all 0.3s ease' }}>
        
        {/* ROOM LISTING */}
        <div>
          {Object.keys(floors).sort().map(floor => (
            <div key={floor} style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>{floor} Floor</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                {floors[floor].map(room => (
                  <div 
                    key={room.id}
                    onClick={() => room.status === 'available' && setSelectedRoom(room)}
                    style={{
                      background: 'white',
                      border: `2px solid ${selectedRoom?.id === room.id ? 'var(--primary)' : 'var(--border-color)'}`,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: room.status === 'available' ? 'pointer' : 'not-allowed',
                      opacity: room.status === 'available' ? 1 : 0.6,
                      boxShadow: selectedRoom?.id === room.id ? '0 4px 12px rgba(59,130,246,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ height: '120px', background: '#e2e8f0', position: 'relative' }}>
                      {room.image_url ? (
                        <img src={room.image_url} alt={room.room_number} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}><BedDouble size={40}/></div>
                      )}
                      <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', background: room.status === 'available' ? '#10b981' : '#f59e0b', color: 'white' }}>
                        {room.status.toUpperCase()}
                      </div>
                    </div>
                    <div style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Room {room.room_number}</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>₹{room.price_per_night}</span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{room.room_type} • {room.bed_type}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {room.ac && <span style={{ background: '#f1f5f9', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>AC</span>}
                        {room.wifi && <span style={{ background: '#f1f5f9', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>Wi-Fi</span>}
                        <span style={{ background: '#f1f5f9', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>Max {room.max_guests} Guests</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* BOOKING PANEL */}
        {selectedRoom && (
          <div style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Book Room {selectedRoom.room_number}</h3>
                <button onClick={() => setSelectedRoom(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20}/></button>
              </div>

              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Check-in Date</label>
                  <input type="date" className="input" value={bookingData.checkIn} onChange={e => setBookingData({...bookingData, checkIn: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Check-out Date</label>
                  <input type="date" className="input" value={bookingData.checkOut} onChange={e => setBookingData({...bookingData, checkOut: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Number of Guests</label>
                  <input type="number" min="1" max={selectedRoom.max_guests} className="input" value={bookingData.guests} onChange={e => setBookingData({...bookingData, guests: parseInt(e.target.value)})} />
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                  <span>Price per night</span>
                  <span>₹{selectedRoom.price_per_night}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                  <span>Number of nights</span>
                  <span>× {nights}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  <span>Room Total</span>
                  <span style={{ color: 'var(--primary)' }}>₹{nights * selectedRoom.price_per_night}</span>
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} onClick={handleConfirm}>
                <Check size={20} /> Confirm Booking
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
