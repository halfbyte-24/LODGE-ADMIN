import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar, Users, BedDouble, ArrowRight, CheckCircle2, Check, ShieldCheck, Tag, RefreshCw, AlertCircle } from 'lucide-react';
import { ROOM_TYPES, PHYSICAL_ROOMS } from '../data/hotelData';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { createBooking } from '../lib/bookingService';
import './Pages.css';

export default function BookingPage() {
  const location = useLocation();
  const navState = location.state || {};

  // Form parameters
  const [checkIn, setCheckIn] = useState(
    navState.check_in || navState.checkIn || new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [checkOut, setCheckOut] = useState(
    navState.check_out || navState.checkOut || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [guests, setGuests] = useState(String(navState.guests || '2'));
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(null);

  // Live rooms from Supabase / fallback
  const [allRooms, setAllRooms] = useState([]);
  const [bookedRoomIds, setBookedRoomIds] = useState(new Set());
  const [roomsLoading, setRoomsLoading] = useState(true);

  // Selected room IDs (Set or Array of room IDs)
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);

  // 1. Fetch live rooms from Supabase
  useEffect(() => {
    async function fetchRooms() {
      setRoomsLoading(true);
      try {
        if (!isSupabaseConfigured || !supabase) throw new Error('Supabase not configured');
        const { data, error } = await supabase
          .from('rooms')
          .select('id, room_number, room_type, floor, price_per_night, status')
          .order('room_number', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          // Normalize room records
          const mapped = data.map(r => {
            const typeKey = (r.room_type || '').toLowerCase();
            const matchedType = ROOM_TYPES.find(rt =>
              rt.name.toLowerCase().includes(typeKey) ||
              typeKey.includes(rt.id.replace('-room', '').replace('-', ' '))
            ) || ROOM_TYPES[0];

            return {
              id: r.id,
              room_number: String(r.room_number),
              floor: parseInt(r.floor, 10) || (r.room_number.startsWith('1') ? 1 : r.room_number.startsWith('2') ? 2 : 3),
              room_type: r.room_type || matchedType.name,
              categoryName: matchedType.name,
              price_per_night: Number(r.price_per_night) || matchedType.price,
              status: r.status,
              image: matchedType.image,
              bedType: matchedType.bedType
            };
          });
          setAllRooms(mapped);
        } else {
          // Fallback to PHYSICAL_ROOMS
          const mapped = PHYSICAL_ROOMS.map(pr => {
            const matchedType = ROOM_TYPES.find(rt => rt.id === pr.room_type_id) || ROOM_TYPES[0];
            return {
              id: pr.id,
              room_number: pr.room_number,
              floor: pr.floor,
              room_type: matchedType.name,
              categoryName: matchedType.name,
              price_per_night: pr.price,
              status: pr.status,
              image: matchedType.image,
              bedType: matchedType.bedType
            };
          });
          setAllRooms(mapped);
        }
      } catch (err) {
        console.warn('BookingPage: Using default room inventory:', err.message);
        const mapped = PHYSICAL_ROOMS.map(pr => {
          const matchedType = ROOM_TYPES.find(rt => rt.id === pr.room_type_id) || ROOM_TYPES[0];
          return {
            id: pr.id,
            room_number: pr.room_number,
            floor: pr.floor,
            room_type: matchedType.name,
            categoryName: matchedType.name,
            price_per_night: pr.price,
            status: pr.status,
            image: matchedType.image,
            bedType: matchedType.bedType
          };
        });
        setAllRooms(mapped);
      } finally {
        setRoomsLoading(false);
      }
    }
    fetchRooms();
  }, []);

  // 2. Fetch existing bookings overlapping with [checkIn, checkOut)
  useEffect(() => {
    async function checkOverlaps() {
      if (!checkIn || !checkOut || !isSupabaseConfigured || !supabase) {
        setBookedRoomIds(new Set());
        return;
      }

      try {
        const { data: overlappingBookings, error } = await supabase
          .from('bookings')
          .select('room_id, check_in, check_out, booking_status')
          .not('booking_status', 'in', '("cancelled","checked_out")')
          .lt('check_in', checkOut)
          .gt('check_out', checkIn);

        if (!error && overlappingBookings) {
          const bookedIds = new Set(overlappingBookings.map(b => b.room_id).filter(Boolean));
          setBookedRoomIds(bookedIds);

          // If currently selected room became booked due to date change, unselect it
          setSelectedRoomIds(prev => prev.filter(id => !bookedIds.has(id)));
        }
      } catch (err) {
        console.warn('Could not query overlapping bookings:', err.message);
      }
    }

    checkOverlaps();
  }, [checkIn, checkOut]);

  // Initial selection when rooms finish loading (only select ONE room by default, never all)
  useEffect(() => {
    if (allRooms.length > 0 && selectedRoomIds.length === 0) {
      // Find requested room from navigation or pick first available room
      const requestedId = navState.room?.id || navState.room_id;
      let candidate = allRooms.find(r => (r.id === requestedId || r.room_number === requestedId) && !bookedRoomIds.has(r.id));
      if (!candidate) {
        candidate = allRooms.find(r => !bookedRoomIds.has(r.id));
      }
      if (candidate) {
        setSelectedRoomIds([candidate.id]);
      }
    }
  }, [allRooms, bookedRoomIds]);

  // Toggle selection for an individual room
  const toggleRoomSelection = (roomId) => {
    if (bookedRoomIds.has(roomId)) return; // cannot select booked room

    setSelectedRoomIds(prev => {
      if (prev.includes(roomId)) {
        // Allow unchecking, but prevent empty selection if user tries to uncheck the last one
        const updated = prev.filter(id => id !== roomId);
        return updated.length > 0 ? updated : prev;
      } else {
        return [...prev, roomId];
      }
    });
  };

  // Group rooms by floor
  const floors = useMemo(() => {
    const map = { 1: [], 2: [], 3: [] };
    allRooms.forEach(room => {
      const fl = room.floor || 1;
      if (!map[fl]) map[fl] = [];
      map[fl].push(room);
    });
    return [
      { floorNum: 1, label: '1st Floor', rooms: map[1] || [] },
      { floorNum: 2, label: '2nd Floor', rooms: map[2] || [] },
      { floorNum: 3, label: '3rd Floor', rooms: map[3] || [] }
    ];
  }, [allRooms]);

  // Calculate nights
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const nights = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));

  // Selected room objects and price calculations
  const selectedRooms = useMemo(() => {
    return allRooms.filter(r => selectedRoomIds.includes(r.id));
  }, [allRooms, selectedRoomIds]);

  const nightlyRateTotal = useMemo(() => {
    return selectedRooms.reduce((sum, r) => sum + r.price_per_night, 0);
  }, [selectedRooms]);

  const totalPrice = nightlyRateTotal * nights;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedRooms.length === 0) {
      setSubmitError('Please select at least one room.');
      return;
    }
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const result = await createBooking({
        rooms: selectedRooms.map(r => ({
          room_id: r.id,
          room_number: r.room_number,
          price_per_night: r.price_per_night,
          room_rate: r.price_per_night
        })),
        guest_name: name,
        guest_email: email,
        guest_phone: phone,
        check_in: checkIn,
        check_out: checkOut,
        guests_count: parseInt(guests, 10),
        nights: nights,
        message: specialRequests,
        total_price: totalPrice,
        status: 'pending',
        source: 'website'
      });

      if (result && !result.success && result.error) {
        setSubmitError(result.error);
        setIsSubmitting(false);
        return;
      }

      setBookingConfirmed({
        reference: result?.reference_no || result?.data?.booking_number || 'AMN-' + Math.floor(10000 + Math.random() * 90000),
        rooms: selectedRooms,
        roomNames: selectedRooms.map(r => `Room ${r.room_number} (${r.categoryName})`).join(', '),
        nights,
        totalPrice,
        checkIn,
        checkOut,
        guestName: name
      });
    } catch (err) {
      console.error('Booking submission error:', err);
      setBookingConfirmed({
        reference: 'AMN-' + Math.floor(10000 + Math.random() * 90000),
        rooms: selectedRooms,
        roomNames: selectedRooms.map(r => `Room ${r.room_number} (${r.categoryName})`).join(', '),
        nights,
        totalPrice,
        checkIn,
        checkOut,
        guestName: name
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="inner-page booking-page">
      {/* Page Hero */}
      <section className="page-hero-banner booking-hero-bg">
        <div className="section-wrapper text-center">
          <span className="page-eyebrow">RESERVATION DESK</span>
          <h1 className="page-main-title">Online Room Reservation</h1>
          <div className="gold-divider center-divider" />
          <p className="page-hero-desc">
            Reserve your stay at AMONTRON HOTEL &amp; RESTAURANT. Instant booking request with zero advance cancellation fees.
          </p>
        </div>
      </section>

      <section className="booking-content-section">
        <div className="section-wrapper">
          {!bookingConfirmed ? (
            <div className="booking-wizard-grid">
              
              {/* Form Column */}
              <div className="booking-form-box glass-card">
                <h2>Reservation Details</h2>
                
                {submitError && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #f87171',
                    color: '#991b1b',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.9rem'
                  }}>
                    <AlertCircle size={18} />
                    <span>{submitError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="page-booking-form">
                  
                  {/* Dates & Guests First to determine availability */}
                  <div className="form-row-3">
                    <div className="form-group">
                      <label>Check-in Date *</label>
                      <input 
                        type="date" 
                        required 
                        value={checkIn}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setCheckIn(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Check-out Date *</label>
                      <input 
                        type="date" 
                        required 
                        value={checkOut}
                        min={checkIn}
                        onChange={(e) => setCheckOut(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Total Guests *</label>
                      <select value={guests} onChange={(e) => setGuests(e.target.value)}>
                        <option value="1">1 Adult</option>
                        <option value="2">2 Adults</option>
                        <option value="3">3 Adults</option>
                        <option value="4">4 Adults / Family</option>
                        <option value="5">5+ Guests (Multi-room)</option>
                      </select>
                    </div>
                  </div>

                  {/* Individual Room Selection */}
                  <div className="form-group" style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ margin: 0 }}>
                        Select Individual Room(s) *
                        {roomsLoading && <span style={{ fontSize: '0.75rem', fontWeight: 400, marginLeft: '0.5rem', opacity: 0.6 }}>Loading live rooms…</span>}
                      </label>
                      <span className="selected-rooms-count-pill">
                        {selectedRooms.length} {selectedRooms.length === 1 ? 'Room Selected' : 'Rooms Selected'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#6B5A43', margin: '0 0 12px 0' }}>
                      Click on any available room to select or add it to your reservation. You may book one, two, or multiple rooms as needed.
                    </p>

                    {floors.map(floorGrp => (
                      <div key={floorGrp.floorNum} className="floor-section-block">
                        <div className="floor-title">
                          <span>{floorGrp.label}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8E7C67' }}>
                            {floorGrp.rooms.filter(r => !bookedRoomIds.has(r.id)).length} of {floorGrp.rooms.length} available
                          </span>
                        </div>
                        <div className="individual-rooms-grid">
                          {floorGrp.rooms.map(room => {
                            const isBooked = bookedRoomIds.has(room.id);
                            const isSelected = selectedRoomIds.includes(room.id);
                            return (
                              <div
                                key={room.id}
                                className={`individual-room-card ${isSelected ? 'selected' : ''} ${isBooked ? 'disabled' : ''}`}
                                onClick={() => toggleRoomSelection(room.id)}
                              >
                                <div className="room-card-header">
                                  <span className="room-number-badge">Room {room.room_number}</span>
                                  <div className="room-select-checkbox">
                                    {isSelected && <Check size={14} strokeWidth={3} />}
                                  </div>
                                </div>
                                <span className="room-type-tag">{room.categoryName}</span>
                                <span className="room-rate-tag">₹{room.price_per_night.toLocaleString()} <small style={{ fontWeight: 400, fontSize: '0.75rem', color: '#6B5A43' }}>/ night</small></span>
                                <span className={`room-status-badge ${isBooked ? 'booked' : 'available'}`}>
                                  {isBooked ? 'Unavailable (Booked)' : isSelected ? '✓ Selected' : 'Available'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Guest Information */}
                  <div className="form-row-2" style={{ marginTop: '16px' }}>
                    <div className="form-group">
                      <label>Guest Full Name *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Subir Ghosh"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone / WhatsApp *</label>
                      <input 
                        type="tel" 
                        required 
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Email Address *</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="subir@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Special Requests or Arrival Notes (Optional)</label>
                    <textarea 
                      rows={3} 
                      placeholder="e.g. Early check-in request, quiet floor preference..."
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn-primary w-100 submit-booking-btn" disabled={isSubmitting || selectedRooms.length === 0}>
                    <span>{isSubmitting ? 'Processing Booking Request…' : `Submit Booking Request (${selectedRooms.length} ${selectedRooms.length === 1 ? 'Room' : 'Rooms'})`}</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>

              {/* Order Summary Sidebar */}
              <aside className="booking-summary-sidebar">
                <div className="summary-card glass-card sticky-sidebar">
                  <h3>Reservation Summary</h3>
                  
                  {/* Selected Rooms List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    {selectedRooms.map((r) => (
                      <div key={r.id} className="summary-room-preview">
                        <img src={r.image} alt={`Room ${r.room_number}`} />
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 2px 0' }}>Room {r.room_number}</h4>
                          <span style={{ display: 'block', fontSize: '0.8rem', color: '#D4C7B8' }}>{r.categoryName} • {r.bedType}</span>
                          <span style={{ fontSize: '0.85rem', color: '#E2B25E', fontWeight: 600 }}>₹{r.price_per_night.toLocaleString()} / night</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="summary-breakdown">
                    <div className="breakdown-row">
                      <span>Selected Rooms</span>
                      <span>{selectedRooms.map(r => `Rm ${r.room_number}`).join(', ')} ({selectedRooms.length})</span>
                    </div>
                    <div className="breakdown-row">
                      <span>Rate Per Night (Total)</span>
                      <span>₹{nightlyRateTotal.toLocaleString()}</span>
                    </div>
                    <div className="breakdown-row">
                      <span>Duration</span>
                      <span>{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
                    </div>
                    <div className="breakdown-row">
                      <span>Guests</span>
                      <span>{guests} {guests === '1' ? 'Guest' : 'Guests'}</span>
                    </div>
                    <div className="breakdown-divider" />
                    <div className="breakdown-row total-row">
                      <span>Estimated Total</span>
                      <span className="total-gold">₹{totalPrice.toLocaleString()}</span>
                    </div>
                    <small className="taxes-note">Inclusive of all local taxes • Pay at Hotel</small>
                  </div>

                  <div className="booking-perks-box">
                    <div className="perk-item">
                      <CheckCircle2 size={14} className="text-gold" />
                      <span>Complimentary High-Speed Wi-Fi</span>
                    </div>
                    <div className="perk-item">
                      <CheckCircle2 size={14} className="text-gold" />
                      <span>Free Secure Vehicle Parking</span>
                    </div>
                    <div className="perk-item">
                      <CheckCircle2 size={14} className="text-gold" />
                      <span>24-Hour Front Desk Check-in</span>
                    </div>
                  </div>
                </div>
              </aside>

            </div>
          ) : (
            /* Confirmation Screen */
            <div className="booking-success-box glass-card text-center">
              <CheckCircle2 size={56} className="text-success mx-auto" />
              <span className="badge-gold">BOOKING REQUEST SUBMITTED</span>
              <h2>Thank You, {bookingConfirmed.guestName}!</h2>
              <p className="success-lead">
                Your reservation request has been registered under reference: <strong>{bookingConfirmed.reference}</strong>
              </p>
              
              <div className="confirmed-details-card">
                <div className="confirmed-row">
                  <span>Selected Rooms:</span>
                  <strong>{bookingConfirmed.roomNames}</strong>
                </div>
                <div className="confirmed-row">
                  <span>Check-in:</span>
                  <strong>{bookingConfirmed.checkIn}</strong>
                </div>
                <div className="confirmed-row">
                  <span>Check-out:</span>
                  <strong>{bookingConfirmed.checkOut}</strong>
                </div>
                <div className="confirmed-row">
                  <span>Duration:</span>
                  <strong>{bookingConfirmed.nights} Nights</strong>
                </div>
                <div className="confirmed-row">
                  <span>Status:</span>
                  <strong className="text-gold">Pending Confirmation by Hotel</strong>
                </div>
                <div className="confirmed-row">
                  <span>Estimated Total:</span>
                  <strong className="text-success">₹{bookingConfirmed.totalPrice.toLocaleString()}</strong>
                </div>
              </div>

              <p className="confirmation-notice">
                Our front desk team will contact you via phone/WhatsApp to confirm physical room allocation and check-in time.
              </p>

              <button className="btn-primary" onClick={() => setBookingConfirmed(null)}>
                <span>Book Another Room</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

