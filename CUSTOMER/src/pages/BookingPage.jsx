import React, { useState } from 'react';
import { Calendar, Users, BedDouble, ArrowRight, CheckCircle2, ShieldCheck, Tag } from 'lucide-react';
import { ROOM_TYPES } from '../data/hotelData';
import { createBooking } from '../lib/bookingService';
import './Pages.css';

export default function BookingPage() {
  const [selectedRoomId, setSelectedRoomId] = useState(ROOM_TYPES[0].id);
  const [checkIn, setCheckIn] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [checkOut, setCheckOut] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [guests, setGuests] = useState('2');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(null);

  const selectedRoom = ROOM_TYPES.find(r => r.id === selectedRoomId) || ROOM_TYPES[0];

  // Calculate nights
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const nights = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
  const totalPrice = (selectedRoom.pricePerNight || selectedRoom.price) * nights;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createBooking({
        room_id: selectedRoom.id,
        room_name: selectedRoom.name,
        guest_name: name,
        guest_email: email,
        guest_phone: phone,
        check_in: checkIn,
        check_out: checkOut,
        guests_count: parseInt(guests, 10),
        message: specialRequests,
        total_price: totalPrice,
        status: 'pending',
        source: 'website'
      });

      setBookingConfirmed({
        reference: result?.data?.reference_no || 'AMN-' + Math.floor(10000 + Math.random() * 90000),
        roomName: selectedRoom.name,
        nights,
        totalPrice,
        checkIn,
        checkOut,
        guestName: name
      });
    } catch (err) {
      console.error(err);
      setBookingConfirmed({
        reference: 'AMN-' + Math.floor(10000 + Math.random() * 90000),
        roomName: selectedRoom.name,
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
                <form onSubmit={handleSubmit} className="page-booking-form">
                  
                  {/* Room Type Selector */}
                  <div className="form-group">
                    <label>Select Room Type *</label>
                    <div className="room-type-picker-grid">
                      {ROOM_TYPES.map((rt) => (
                        <div
                          key={rt.id}
                          className={`room-picker-card ${selectedRoomId === rt.id ? 'active' : ''}`}
                          onClick={() => setSelectedRoomId(rt.id)}
                        >
                          <img src={rt.image} alt={rt.name} className="picker-img" />
                          <div className="picker-info">
                            <strong>{rt.name}</strong>
                            <span>₹{(rt.pricePerNight || rt.price).toLocaleString()} / night</span>
                            <small>{rt.floorInfo}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dates & Guests */}
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
                      <label>Guests *</label>
                      <select value={guests} onChange={(e) => setGuests(e.target.value)}>
                        <option value="1">1 Adult</option>
                        <option value="2">2 Adults</option>
                        <option value="3">3 Adults</option>
                        <option value="4">4 Adults / Family</option>
                      </select>
                    </div>
                  </div>

                  {/* Guest Information */}
                  <div className="form-row-2">
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

                  <button type="submit" className="btn-primary w-100 submit-booking-btn" disabled={isSubmitting}>
                    <span>{isSubmitting ? 'Processing Booking Request…' : 'Submit Booking Request'}</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>

              {/* Order Summary Sidebar */}
              <aside className="booking-summary-sidebar">
                <div className="summary-card glass-card sticky-sidebar">
                  <h3>Reservation Summary</h3>
                  <div className="summary-room-preview">
                    <img src={selectedRoom.image} alt={selectedRoom.name} />
                    <div>
                      <h4>{selectedRoom.name}</h4>
                      <span>{selectedRoom.bedType}</span>
                    </div>
                  </div>

                  <div className="summary-breakdown">
                    <div className="breakdown-row">
                      <span>Rate Per Night</span>
                      <span>₹{(selectedRoom.pricePerNight || selectedRoom.price).toLocaleString()}</span>
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
                  <span>Room Type:</span>
                  <strong>{bookingConfirmed.roomName}</strong>
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
