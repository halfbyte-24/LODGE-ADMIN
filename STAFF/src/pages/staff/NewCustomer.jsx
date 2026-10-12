import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import { UserPlus, ArrowRight } from 'lucide-react';

export default function NewCustomer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    guests: 1,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (type) => {
    if (!formData.name || !formData.phone) return alert('Name and phone are required.');
    
    setLoading(true);
    try {
      const customer = await customerService.createCustomer({
        ...formData,
        type: type // 'room_guest' or 'restaurant_only'
      });
      
      if (type === 'room_guest') {
        navigate(`/staff/rooms/book/${customer.id}`);
      } else {
        // Need to create a draft bill for restaurant and go to billing
        navigate(`/staff/billing/${customer.id}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text-main)' }}>New Customer Entry</h1>
        <p style={{ color: 'var(--text-muted)' }}>Register a new guest or restaurant customer.</p>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="input-group">
            <label className="input-label">Full Name *</label>
            <input name="name" type="text" className="input" value={formData.name} onChange={handleChange} placeholder="e.g. Arpan Majhi" required />
          </div>
          <div className="input-group">
            <label className="input-label">Phone Number *</label>
            <input name="phone" type="text" className="input" value={formData.phone} onChange={handleChange} placeholder="e.g. 9876543210" required />
          </div>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label className="input-label">Address</label>
            <input name="address" type="text" className="input" value={formData.address} onChange={handleChange} placeholder="e.g. Kolkata, West Bengal" />
          </div>
          <div className="input-group">
            <label className="input-label">Number of Guests</label>
            <input name="guests" type="number" min="1" className="input" value={formData.guests} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label className="input-label">Entry Date</label>
            <input name="date" type="date" className="input" value={formData.date} onChange={handleChange} />
          </div>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label className="input-label">Optional Note</label>
            <textarea name="notes" className="input" value={formData.notes} onChange={handleChange} placeholder="Any special requirements..." rows={2}></textarea>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Does this customer need a room?</h3>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              className="btn btn-primary" 
              style={{ padding: '1rem 2rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={() => handleSubmit('room_guest')}
              disabled={loading}
            >
              YES — Book Room <ArrowRight size={20}/>
            </button>
            <button 
              className="btn btn-outline" 
              style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
              onClick={() => handleSubmit('restaurant_only')}
              disabled={loading}
            >
              NO — Restaurant Only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
