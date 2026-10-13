import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import { UserPlus, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';

const formatLocalDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function NewCustomer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    guests: 1,
    date: formatLocalDate(new Date()),
    notes: ''
  });

  const handleChange = (e) => {
    setErrorMessage('');
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (type) => {
    if (loading) return;
    setErrorMessage('');

    const trimmedName = formData.name.trim();
    const trimmedPhone = formData.phone.trim();
    const cleanDigits = trimmedPhone.replace(/\D/g, '');

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Please enter a valid customer full name (at least 2 letters).');
      return;
    }
    if (!trimmedPhone || cleanDigits.length < 10) {
      setErrorMessage('Please enter a valid 10-digit phone number (e.g. 9876543210).');
      return;
    }
    if (Number(formData.guests) < 1) {
      setErrorMessage('Number of guests must be at least 1.');
      return;
    }
    
    setLoading(true);
    try {
      const customer = await customerService.createCustomer({
        name: trimmedName,
        phone: trimmedPhone,
        address: formData.address.trim(),
        guests: Math.max(1, parseInt(formData.guests, 10) || 1),
        type: type, // 'room_guest' or 'restaurant_only'
        notes: formData.notes.trim()
      });
      
      if (type === 'room_guest') {
        navigate(`/staff/rooms/book/${customer.id}`);
      } else {
        navigate(`/staff/billing/${customer.id}`);
      }
    } catch (err) {
      console.error('[NewCustomer] Error:', err);
      setErrorMessage(err?.message || 'Failed to create customer record in database. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem 1rem', maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>New Customer Entry</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Register a new guest or restaurant customer.</p>
      </div>

      {errorMessage && (
        <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <AlertCircle size={18} /> {errorMessage}
        </div>
      )}

      <div className="card" style={{ padding: '1.5rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div className="input-group">
            <label className="input-label" style={{ fontWeight: 600 }}>Full Name *</label>
            <input name="name" type="text" className="input" value={formData.name} onChange={handleChange} placeholder="e.g. Arpan Majhi" required style={{ minHeight: '44px' }} />
          </div>
          <div className="input-group">
            <label className="input-label" style={{ fontWeight: 600 }}>Phone Number *</label>
            <input name="phone" type="tel" className="input" value={formData.phone} onChange={handleChange} placeholder="e.g. 9876543210" required style={{ minHeight: '44px' }} />
          </div>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label className="input-label" style={{ fontWeight: 600 }}>Address</label>
            <input name="address" type="text" className="input" value={formData.address} onChange={handleChange} placeholder="e.g. Kolkata, West Bengal" style={{ minHeight: '44px' }} />
          </div>
          <div className="input-group">
            <label className="input-label" style={{ fontWeight: 600 }}>Number of Guests</label>
            <input name="guests" type="number" min="1" className="input" value={formData.guests} onChange={handleChange} style={{ minHeight: '44px' }} />
          </div>
          <div className="input-group">
            <label className="input-label" style={{ fontWeight: 600 }}>Entry Date</label>
            <input name="date" type="date" className="input" value={formData.date} onChange={handleChange} style={{ minHeight: '44px' }} />
          </div>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label className="input-label" style={{ fontWeight: 600 }}>Optional Note</label>
            <textarea name="notes" className="input" value={formData.notes} onChange={handleChange} placeholder="Any special requirements..." rows={2}></textarea>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '1.25rem', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700 }}>
            Does this customer need a room?
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              type="button"
              className="btn btn-primary" 
              style={{ padding: '0.85rem 1.5rem', fontSize: '1rem', fontWeight: 700, minHeight: '48px', flex: '1 1 200px', maxWidth: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              onClick={() => handleSubmit('room_guest')}
              disabled={loading}
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : null}
              {loading ? 'Processing...' : <>YES — Book Room <ArrowRight size={18}/></>}
            </button>
            <button 
              type="button"
              className="btn btn-outline" 
              style={{ padding: '0.85rem 1.5rem', fontSize: '1rem', fontWeight: 700, minHeight: '48px', flex: '1 1 200px', maxWidth: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              onClick={() => handleSubmit('restaurant_only')}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'NO — Restaurant Only'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
