import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Calendar, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Ban, 
  FileText, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { getBookings, cancelBooking } from '../lib/supabaseClient';
import './ManageBookingsModal.css';

export default function ManageBookingsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState('');
  const [feedback, setFeedback] = useState('');

  const loadReservations = async (searchQuery = '') => {
    setIsLoading(true);
    setFeedback('');
    try {
      const res = await getBookings(searchQuery);
      setResults(res.data || []);
      setDataSource(res.source || 'Local');
      if (res.data && res.data.length === 0 && searchQuery) {
        setFeedback('No reservations found matching that inquiry. Check code or email.');
      }
    } catch (err) {
      console.error(err);
      setFeedback('Error loading reservations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadReservations(query);
  };

  const handleCancel = async (bookingId) => {
    if (window.confirm('Are you sure you wish to cancel this mountain reservation?')) {
      const res = await cancelBooking(bookingId);
      if (res.success) {
        loadReservations(query);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content manage-modal-content" onClick={(e) => e.stopPropagation()}>
        
        <button className="modal-close-btn" onClick={onClose} aria-label="Close portal">
          <X size={20} />
        </button>

        {/* Portal Header */}
        <div className="manage-header">
          <span className="badge-gold">GUEST CONCIERGE PORTAL</span>
          <h2 className="manage-title">Manage Your Reservations</h2>
          <p className="manage-subtitle">
            Look up your reservation status, review booking details, or request itinerary modifications.
          </p>

          {/* Search Form */}
          <form className="manage-search-form" onSubmit={handleSearch}>
            <div className="search-bar-wrap">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Enter booking reference (e.g. AMN-88219) or email"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="btn-primary search-btn" disabled={isLoading}>
                {isLoading ? <RefreshCw size={15} className="spin-icon" /> : 'Search'}
              </button>
            </div>
          </form>

          {/* Source indicator */}
          <div className="source-info">
            <span>Database Source: <strong>{dataSource}</strong></span>
            {query && (
              <button 
                type="button" 
                className="btn-clear-search" 
                onClick={() => { setQuery(''); loadReservations(''); }}
              >
                Clear Filter (View All)
              </button>
            )}
          </div>
        </div>

        {/* Reservations List */}
        <div className="manage-body">
          {feedback && <div className="portal-feedback">{feedback}</div>}

          {results.length === 0 && !isLoading && !feedback && (
            <div className="empty-state">
              <AlertCircle size={32} className="text-gold" />
              <p>No active reservations found.</p>
            </div>
          )}

          <div className="reservations-list">
            {results.map((booking) => {
              const isCancelled = booking.status === 'Cancelled';
              return (
                <div key={booking.id} className={`booking-record-card ${isCancelled ? 'record-cancelled' : ''}`}>
                  
                  <div className="record-top">
                    <div>
                      <div className="record-code-tag">
                        <span>{booking.booking_code}</span>
                        <span className={`status-pill ${isCancelled ? 'pill-cancelled' : 'pill-confirmed'}`}>
                          {booking.status}
                        </span>
                      </div>
                      <h3 className="record-room-name">{booking.room_name}</h3>
                      <p className="record-guest-name">Guest: <strong>{booking.guest_name}</strong> ({booking.guest_email})</p>
                    </div>

                    <div className="record-price-box">
                      <span className="record-price">${Number(booking.total_price).toLocaleString()}</span>
                      <small>Guaranteed Total</small>
                    </div>
                  </div>

                  <div className="record-meta-grid">
                    <div className="meta-col">
                      <Calendar size={14} className="text-gold" />
                      <span>{booking.check_in} — {booking.check_out} ({booking.nights} nights)</span>
                    </div>
                    <div className="meta-col">
                      <Users size={14} className="text-gold" />
                      <span>{booking.adults} Adults {booking.children > 0 ? `, ${booking.children} Kids` : ''}</span>
                    </div>
                  </div>

                  {booking.enhancements && booking.enhancements.length > 0 && (
                    <div className="record-enhancements">
                      <Sparkles size={13} className="text-gold" />
                      <span>VIP Additions: {Array.isArray(booking.enhancements) ? booking.enhancements.join(', ') : booking.enhancements}</span>
                    </div>
                  )}

                  {booking.special_requests && (
                    <div className="record-notes">
                      <em>"Note: {booking.special_requests}"</em>
                    </div>
                  )}

                  <div className="record-actions">
                    {!isCancelled && (
                      <button 
                        className="btn-cancel-reservation"
                        onClick={() => handleCancel(booking.id)}
                      >
                        <Ban size={14} />
                        <span>Cancel Reservation</span>
                      </button>
                    )}
                    <span className="booked-date">
                      Reserved on: {new Date(booking.created_at).toLocaleDateString()}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
