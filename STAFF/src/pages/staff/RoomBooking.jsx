import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomService } from '../../services/roomService';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { BedDouble, Check, X, Calendar, AlertCircle, RefreshCw, CheckCircle2, ShieldAlert, Clock } from 'lucide-react';

const formatLocalDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function RoomBooking() {
  const { hotelConfig } = useStore();
  const { customerId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [rooms, setRooms] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  const todayDate = new Date();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);

  const [bookingData, setBookingData] = useState({
    checkIn: formatLocalDate(todayDate),
    checkOut: formatLocalDate(tomorrowDate),
    guests: 2
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const [roomsData, bookingsData] = await Promise.all([
        roomService.getRooms(),
        roomService.getActiveBookings()
      ]);
      setRooms(roomsData || []);
      setActiveBookings(bookingsData || []);
    } catch (err) {
      console.error('[RoomBooking] Load failed:', err);
      setErrorMessage(err?.message || 'Failed to load rooms and reservation data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, isNaN(diff) ? 1 : diff);
  }, [bookingData.checkIn, bookingData.checkOut]);

  // Determine actual availability for the requested checkIn and checkOut dates
  const getRoomAvailability = (room) => {
    if (room.status === 'maintenance') {
      return { available: false, label: 'MAINTENANCE', reason: 'Under Maintenance', color: '#ea580c' };
    }
    if (room.status === 'cleaning') {
      return { available: false, label: 'CLEANING', reason: 'Cleaning in Progress', color: '#ca8a04' };
    }

    // Check overlapping bookings
    const conflict = activeBookings.find(b => 
      b.room_id === room.id &&
      b.check_in < bookingData.checkOut &&
      b.check_out > bookingData.checkIn
    );

    if (conflict) {
      return {
        available: false,
        label: 'BOOKED FOR DATES',
        reason: `Reserved: ${conflict.check_in} to ${conflict.check_out} (#${conflict.booking_number})`,
        color: '#2563eb'
      };
    }

    // Check if room is physically occupied today and requested check-in is today
    const todayStr = formatLocalDate(new Date());
    if (room.status === 'occupied' && bookingData.checkIn <= todayStr) {
      return {
        available: false,
        label: 'OCCUPIED TODAY',
        reason: 'Currently Occupied',
        color: '#dc2626'
      };
    }

    return {
      available: true,
      label: 'AVAILABLE',
      reason: 'Available for selected dates',
      color: '#16a34a'
    };
  };

  const handleSelectRoom = (room) => {
    const avail = getRoomAvailability(room);
    if (!avail.available) {
      setErrorMessage(`Cannot select Room ${room.room_number}: ${avail.reason}`);
      return;
    }
    setErrorMessage('');
    setSelectedRoom(room);
  };

  const handleConfirm = async () => {
    if (!selectedRoom || isSubmitting) return;

    if (bookingData.checkOut <= bookingData.checkIn) {
      setErrorMessage('Check-out date must be strictly after the check-in date.');
      return;
    }

    // Verify availability one more time in state before calling database
    const avail = getRoomAvailability(selectedRoom);
    if (!avail.available) {
      setErrorMessage(`Room ${selectedRoom.room_number} is no longer available: ${avail.reason}`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const roomTotal = nights * Number(selectedRoom.price_per_night);
      await roomService.bookRoom({
        customerId,
        roomId: selectedRoom.id,
        roomNumber: selectedRoom.room_number,
        staffId: profile?.id,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        nights,
        guests: bookingData.guests,
        roomRate: Number(selectedRoom.price_per_night),
        roomTotal
      });
      navigate(`/staff/billing/${customerId}`);
    } catch (err) {
      console.error('[RoomBooking] Booking failed:', err);
      setErrorMessage(err?.message || 'Failed to book room. Please select another room.');
      // Refresh live bookings to update room statuses immediately
      loadData();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto', opacity: 0.7 }} />
        <p style={{ fontWeight: 600 }}>Checking Room Inventory &amp; Availability...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem 1rem', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Room Selection</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Choose an available room for the specified stay dates.</p>
        </div>
        <button className="btn btn-outline" onClick={loadData} style={{ minHeight: '38px', fontSize: '0.85rem' }}>
          <RefreshCw size={15} /> Refresh Availability
        </button>
      </div>

      {errorMessage && (
        <div style={{ padding: '0.85rem 1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} /> {errorMessage}
        </div>
      )}

      {/* DATE RANGE CONTROLS (ALWAYS VISIBLE TO INFLUENCE AVAILABILITY) */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: '#f8fafc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={16} /> Stay Dates &amp; Occupancy
          </h3>
          <span style={{ fontSize: '0.78rem', color: '#475569', background: '#e2e8f0', padding: '3px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> Standard Policy: In from {hotelConfig?.checkInTime || '12:00 PM'} • Out by {hotelConfig?.checkOutTime || '11:00 AM'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div className="input-group">
            <label className="input-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Check-in Date *</label>
            <input 
              type="date" 
              className="input" 
              value={bookingData.checkIn} 
              onChange={e => setBookingData(prev => ({ ...prev, checkIn: e.target.value }))}
              style={{ minHeight: '42px' }}
            />
          </div>
          <div className="input-group">
            <label className="input-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Check-out Date *</label>
            <input 
              type="date" 
              className="input" 
              value={bookingData.checkOut} 
              onChange={e => setBookingData(prev => ({ ...prev, checkOut: e.target.value }))}
              style={{ minHeight: '42px' }}
            />
          </div>
          <div className="input-group">
            <label className="input-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Guests</label>
            <input 
              type="number" 
              min="1" 
              max="10"
              className="input" 
              value={bookingData.guests} 
              onChange={e => setBookingData(prev => ({ ...prev, guests: parseInt(e.target.value, 10) || 1 }))}
              style={{ minHeight: '42px' }}
            />
          </div>
          <div style={{ padding: '0.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <strong>Duration:</strong> {nights} Night{nights > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedRoom ? 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))' : '1fr', gap: '1.5rem', transition: 'all 0.3s ease' }}>
        
        {/* ROOM LISTING BY FLOOR */}
        <div>
          {Object.keys(floors).sort().map(floor => (
            <div key={floor} style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>{floor} Floor</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: '1rem' }}>
                {floors[floor].map(room => {
                  const avail = getRoomAvailability(room);
                  const isSelected = selectedRoom?.id === room.id;

                  return (
                    <div 
                      key={room.id}
                      onClick={() => handleSelectRoom(room)}
                      role="button"
                      tabIndex={avail.available ? 0 : -1}
                      title={avail.available ? `Click to select Room ${room.room_number}` : `Room ${room.room_number}: ${avail.reason}`}
                      style={{
                        background: 'white',
                        border: `2px solid ${isSelected ? 'var(--primary-color)' : avail.available ? 'var(--border-color)' : '#e2e8f0'}`,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        cursor: avail.available ? 'pointer' : 'not-allowed',
                        opacity: avail.available ? 1 : 0.6,
                        boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.25)' : 'var(--shadow-sm)',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      <div style={{ height: '110px', background: '#e2e8f0', position: 'relative' }}>
                        {room.image_url ? (
                          <img src={room.image_url} alt={`Room ${room.room_number}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                            <BedDouble size={36}/>
                          </div>
                        )}
                        {/* Status badge with text & visual indicators */}
                        <div style={{ 
                          position: 'absolute', 
                          top: '0.5rem', 
                          right: '0.5rem', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.7rem', 
                          fontWeight: 800, 
                          background: avail.color, 
                          color: 'white',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          letterSpacing: '0.5px'
                        }}>
                          {avail.label}
                        </div>
                      </div>
                      <div style={{ padding: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>Room {room.room_number}</span>
                          <span style={{ color: 'var(--primary-color)', fontWeight: 800 }}>₹{room.price_per_night}/nt</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{room.room_type} • {room.bed_type}</div>
                        
                        {!avail.available && (
                          <div style={{ fontSize: '0.72rem', color: avail.color, fontWeight: 600, marginTop: '0.35rem' }}>
                            {avail.reason}
                          </div>
                        )}

                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {room.ac && <span style={{ background: '#f1f5f9', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>AC</span>}
                          {room.wifi && <span style={{ background: '#f1f5f9', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>Wi-Fi</span>}
                          <span style={{ background: '#f1f5f9', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>Max {room.max_guests} Guests</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* BOOKING CONFIRMATION PANEL */}
        {selectedRoom && (
          <div style={{ position: 'sticky', top: '1.5rem', height: 'fit-content' }}>
            <div className="card" style={{ padding: '1.5rem', border: '2px solid var(--primary-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--primary-color)' }}>
                  Selected: Room {selectedRoom.room_number}
                </h3>
                <button 
                  type="button"
                  onClick={() => setSelectedRoom(null)} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  aria-label="Deselect room"
                >
                  <X size={20}/>
                </button>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  <span>Room Type</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedRoom.room_type} ({selectedRoom.floor} Floor)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  <span>Dates</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{bookingData.checkIn} → {bookingData.checkOut}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  <span>Price per night</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>₹{selectedRoom.price_per_night}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  <span>Duration</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>× {nights} Night{nights > 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #cbd5e1', fontWeight: 800, fontSize: '1.15rem' }}>
                  <span>Total Stay Charge</span>
                  <span style={{ color: 'var(--primary-color)' }}>₹{nights * Number(selectedRoom.price_per_night)}</span>
                </div>
              </div>

              <button 
                type="button"
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.85rem', fontSize: '1.05rem', fontWeight: 800, minHeight: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} 
                onClick={handleConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <Check size={20} />}
                {isSubmitting ? 'Confirming Reservation...' : 'Confirm Room & Open Bill'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
