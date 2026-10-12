import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Users, 
  Check, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2, 
  Download, 
  Printer,
  Tag,
  Clock,
  MapPin,
  ChevronLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ROOMS, VIP_ENHANCEMENTS, RESORT_INFO } from '../data/lodgeData';
import { createBooking } from '../lib/bookingService';
import './BookingModal.css';

export default function BookingModal({ isOpen, onClose, initialData = {} }) {

  // Multi-step: 1 = Dates/Room, 2 = Guests & VIP, 3 = Guest Info, 4 = Confirmation
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedRoomId, setSelectedRoomId] = useState(
    initialData.room ? initialData.room.id : ROOMS[0].id
  );

  // Dates
  const [checkIn, setCheckIn] = useState(
    initialData.checkIn || new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0]
  );
  const [checkOut, setCheckOut] = useState(
    initialData.checkOut || new Date(Date.now() + 86400000 * 18).toISOString().split('T')[0]
  );

  // Guests
  const [adults, setAdults] = useState(initialData.adults || 2);
  const [children, setChildren] = useState(0);

  // VIP Enhancements
  const [selectedEnhancements, setSelectedEnhancements] = useState([]);

  // Guest Details
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');

  // Confirmation result
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [storageSource, setStorageSource] = useState('');

  const selectedRoom = ROOMS.find(r => r.id === selectedRoomId) || ROOMS[0];

  // Calculate nights
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const nights = calculateNights();

  // Price calculations
  const baseRoomTotal = selectedRoom.pricePerNight * nights;
  const enhancementsTotal = selectedEnhancements.reduce((acc, enhId) => {
    const item = VIP_ENHANCEMENTS.find(v => v.id === enhId);
    return acc + (item ? item.price : 0);
  }, 0);

  const subtotal = baseRoomTotal + enhancementsTotal;
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const resortConservationFee = Math.round((subtotal - discountAmount) * 0.05);
  const grandTotal = subtotal - discountAmount + resortConservationFee;

  const handleToggleEnhancement = (enhId) => {
    if (selectedEnhancements.includes(enhId)) {
      setSelectedEnhancements(selectedEnhancements.filter(id => id !== enhId));
    } else {
      setSelectedEnhancements([...selectedEnhancements, enhId]);
    }
  };

  const handleApplyPromo = (e) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (code === 'AMONTRON2026' || code === 'WELCOME2026') {
      setDiscountPercent(15);
      setPromoMessage('Promo applied: 15% discount on your stay!');
    } else if (code === 'WEEKEND10') {
      setDiscountPercent(10);
      setPromoMessage('Weekend promo applied: 10% discount!');
    } else {
      setDiscountPercent(0);
      setPromoMessage('Invalid code. Contact us for current promo codes.');
    }
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#cba358', '#e6c888', '#ffffff', '#ffd700']
      });
    } catch (e) {
      console.log('Confetti error', e);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const bookingPayload = {
      room_id: selectedRoom.id,
      room_name: selectedRoom.name,
      guest_name: guestName || 'Esteemed Guest',
      guest_email: guestEmail || 'guest@example.com',
      guest_phone: guestPhone || '+41 27 000 0000',
      check_in: checkIn,
      check_out: checkOut,
      nights,
      adults,
      children,
      enhancements: selectedEnhancements.map(id => {
        const item = VIP_ENHANCEMENTS.find(v => v.id === id);
        return item ? item.name : id;
      }),
      total_price: grandTotal,
      special_requests: specialRequests
    };

    try {
      const response = await createBooking(bookingPayload);
      setConfirmedBooking(response.data);
      setStorageSource(response.source);
      setIsSubmitting(false);
      setStep(4); // Confirmation step
      triggerCelebration();
    } catch (err) {
      console.error('Booking failed', err);
      setIsSubmitting(false);
    }
  };

  const printItinerary = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content booking-modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Close */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close booking modal">
          <X size={20} />
        </button>

        {/* Modal Stepper Header */}
        {step < 4 && (
          <div className="booking-stepper-header">
            <div className="stepper-title-wrap">
              <span className="stepper-tag">BESPOKE RESERVATION</span>
              <h2 className="stepper-title">Reserve Your Alpine Stay</h2>
            </div>

            <div className="stepper-indicator">
              <div className={`step-node ${step >= 1 ? 'step-active' : ''}`}>
                <span>1</span>
                <label>Sanctuary</label>
              </div>
              <div className="step-line" />
              <div className={`step-node ${step >= 2 ? 'step-active' : ''}`}>
                <span>2</span>
                <label>Guests & VIP</label>
              </div>
              <div className="step-line" />
              <div className={`step-node ${step >= 3 ? 'step-active' : ''}`}>
                <span>3</span>
                <label>Guest Details</label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: SANCTUARY & DATES */}
        {step === 1 && (
          <div className="booking-step-container">
            <h3 className="step-heading">Select Dates & Sanctuary</h3>
            
            {/* Dates row */}
            <div className="form-row-2">
              <div className="input-group">
                <label className="input-label">
                  <Calendar size={14} className="text-gold" />
                  <span>Check-In Date</span>
                </label>
                <input 
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="booking-input"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">
                  <Calendar size={14} className="text-gold" />
                  <span>Check-Out Date</span>
                </label>
                <input 
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="booking-input"
                  required
                />
              </div>
            </div>

            <div className="nights-badge">
              <Clock size={14} />
              <span>{nights} {nights === 1 ? 'Night' : 'Nights'} Selected ({checkIn} to {checkOut})</span>
            </div>

            {/* Room selection list */}
            <div className="room-selection-list">
              <label className="input-label mb-2">Choose Your Sanctuary</label>
              <div className="room-picker-grid">
                {ROOMS.map((room) => {
                  const isSelected = room.id === selectedRoomId;
                  return (
                    <div 
                      key={room.id}
                      className={`room-picker-card ${isSelected ? 'picker-selected' : ''}`}
                      onClick={() => setSelectedRoomId(room.id)}
                    >
                      <img src={room.image} alt={room.name} className="picker-img" />
                      <div className="picker-info">
                        <div className="picker-header">
                          <h4 className="picker-name">{room.name}</h4>
                          <span className="picker-price">${room.pricePerNight.toLocaleString()}<small>/nt</small></span>
                        </div>
                        <p className="picker-specs">{room.sqft} sq ft • Up to {room.maxAdults} Adults • {room.view}</p>
                      </div>
                      <div className="picker-radio">
                        {isSelected && <Check size={14} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="step-actions">
              <div className="live-preview-price">
                <span>Estimated Total:</span>
                <strong>${(selectedRoom.pricePerNight * nights).toLocaleString()}</strong>
              </div>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={() => setStep(2)}
              >
                <span>Continue to Guests & VIP</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: GUESTS & VIP ENHANCEMENTS */}
        {step === 2 && (
          <div className="booking-step-container">
            <h3 className="step-heading">Guests & VIP Alpine Enhancements</h3>

            {/* Guests Counters */}
            <div className="form-row-2 mb-4">
              <div className="input-group">
                <label className="input-label">
                  <Users size={14} className="text-gold" />
                  <span>Adults (Ages 13+)</span>
                </label>
                <div className="counter-controls">
                  <button 
                    type="button" 
                    className="counter-btn"
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                  >-</button>
                  <span className="counter-val">{adults}</span>
                  <button 
                    type="button" 
                    className="counter-btn"
                    onClick={() => setAdults(Math.min(selectedRoom.maxAdults, adults + 1))}
                  >+</button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">
                  <Users size={14} className="text-gold" />
                  <span>Children (Ages 0 - 12)</span>
                </label>
                <div className="counter-controls">
                  <button 
                    type="button" 
                    className="counter-btn"
                    onClick={() => setChildren(Math.max(0, children - 1))}
                  >-</button>
                  <span className="counter-val">{children}</span>
                  <button 
                    type="button" 
                    className="counter-btn"
                    onClick={() => setChildren(Math.min(selectedRoom.maxChildren, children + 1))}
                  >+</button>
                </div>
              </div>
            </div>

            {/* VIP Enhancements Selection */}
            <div className="enhancements-section">
              <label className="input-label mb-2">
                <Sparkles size={14} className="text-gold" />
                <span>Curated VIP Enhancements (Optional)</span>
              </label>

              <div className="enhancements-grid">
                {VIP_ENHANCEMENTS.map((enh) => {
                  const isChecked = selectedEnhancements.includes(enh.id);
                  return (
                    <div 
                      key={enh.id} 
                      className={`enhancement-card ${isChecked ? 'enhancement-checked' : ''}`}
                      onClick={() => handleToggleEnhancement(enh.id)}
                    >
                      <div className="enh-checkbox">
                        {isChecked && <Check size={14} />}
                      </div>
                      <div className="enh-content">
                        <div className="enh-top">
                          <span className="enh-name">{enh.name}</span>
                          <span className="enh-price">+${enh.price}</span>
                        </div>
                        <p className="enh-desc">{enh.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2 Actions */}
            <div className="step-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setStep(1)}
              >
                <ChevronLeft size={16} />
                <span>Back</span>
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={() => setStep(3)}
              >
                <span>Continue to Guest Details</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: GUEST DETAILS & CONFIRMATION */}
        {step === 3 && (
          <form className="booking-step-container" onSubmit={handleFinalSubmit}>
            <h3 className="step-heading">Guest Details & Final Reservation</h3>

            <div className="form-row-2">
              <div className="input-group">
                <label className="input-label">Full Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Lady Vivienne Hastings"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="booking-input"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Email Address *</label>
                <input 
                  type="email"
                  required
                  placeholder="e.g. vivienne@hastings.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="booking-input"
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="input-group">
                <label className="input-label">Phone / WhatsApp Number *</label>
                <input 
                  type="tel"
                  required
                  placeholder="+41 27 966 8200"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="booking-input"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Special Preferences & Dietary</label>
                <input 
                  type="text"
                  placeholder="Pillow preference, allergies, arrival time"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="booking-input"
                />
              </div>
            </div>

            {/* Promo Code Input */}
            <div className="promo-box">
              <div className="promo-input-row">
                <Tag size={16} className="text-gold" />
                <input 
                  type="text"
                  placeholder="Enter promo code (e.g. AMONTRON2026)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="promo-input"
                />
                <button type="button" className="btn-outline-gold promo-btn" onClick={handleApplyPromo}>
                  Apply
                </button>
              </div>
              {promoMessage && (
                <p className={`promo-feedback ${discountPercent > 0 ? 'promo-success' : 'promo-error'}`}>
                  {promoMessage}
                </p>
              )}
            </div>

            {/* Bill Summary */}
            <div className="booking-summary-receipt">
              <div className="receipt-line">
                <span>{selectedRoom.name} ({nights} nights × ${selectedRoom.pricePerNight})</span>
                <span>${baseRoomTotal.toLocaleString()}</span>
              </div>

              {enhancementsTotal > 0 && (
                <div className="receipt-line">
                  <span>VIP Enhancements ({selectedEnhancements.length} selected)</span>
                  <span>+${enhancementsTotal.toLocaleString()}</span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="receipt-line receipt-discount">
                  <span>VIP Privilege Discount ({discountPercent}%)</span>
                  <span>-${discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="receipt-line">
                <span>Alpine Conservation & Tourism Fee (5%)</span>
                <span>+${resortConservationFee.toLocaleString()}</span>
              </div>

              <div className="receipt-divider" />

              <div className="receipt-grand-total">
                <div>
                  <strong>Total Guaranteed Investment</strong>
                  <small>Includes all taxes, breakfast & private valet</small>
                </div>
                <span className="total-amount">${grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Step 3 Actions */}
            <div className="step-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setStep(2)}
              >
                <ChevronLeft size={16} />
                <span>Back</span>
              </button>
              <button 
                type="submit" 
                className="btn-primary btn-submit-final"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Securing Sanctuary...</span>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Confirm & Guarantee Reservation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: SUCCESS CONFIRMATION */}
        {step === 4 && confirmedBooking && (
          <div className="booking-step-container confirmation-screen">
            <div className="confirm-icon-wrap">
              <CheckCircle2 size={54} className="confirm-icon" />
            </div>

            <span className="badge-gold">RESERVATION CONFIRMED</span>
            <h2 className="confirm-title">Thank You for Choosing AMONTRON!</h2>
            <p className="confirm-subtitle">
              Your booking request has been received. Our team will contact you shortly at <strong>{confirmedBooking.guest_email}</strong> to confirm availability and booking details.
            </p>

            {/* Booking Code Card */}
            <div className="booking-code-card">
              <div className="code-label">CONFIRMATION REFERENCE NUMBER</div>
              <div className="code-number">{confirmedBooking.booking_code}</div>
              <div className="code-note">
                Stored via: <strong>{storageSource}</strong>
              </div>
            </div>

            {/* Key Summary Grid */}
            <div className="confirm-specs-grid">
              <div className="confirm-item">
                <span className="label">Room:</span>
                <strong>{confirmedBooking.room_name}</strong>
              </div>
              <div className="confirm-item">
                <span className="label">Dates:</span>
                <strong>{confirmedBooking.check_in} to {confirmedBooking.check_out} ({confirmedBooking.nights} Nights)</strong>
              </div>
              <div className="confirm-item">
                <span className="label">Guests:</span>
                <strong>{confirmedBooking.adults} Adults, {confirmedBooking.children} Children</strong>
              </div>
              <div className="confirm-item">
                <span className="label">Total Amount:</span>
                <strong className="text-gold">${confirmedBooking.total_price.toLocaleString()}</strong>
              </div>
            </div>

            {/* Actions */}
            <div className="confirmation-actions">
              <button className="btn-secondary" onClick={printItinerary}>
                <Printer size={16} />
                <span>Print Itinerary</span>
              </button>
              <button className="btn-primary" onClick={onClose}>
                <span>Done</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
