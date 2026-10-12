import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function GuestEntry() {
  const { addGuest } = useStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', phone: '', notes: '' });

  const handleSubmit = (needRoom) => {
    if (!formData.name || !formData.phone) return alert('Name and Phone are required.');
    
    const guest = addGuest({ ...formData, isRoomGuest: needRoom, status: needRoom ? 'Pending Room' : 'Restaurant' });
    
    if (needRoom) {
      navigate(`/rooms/book/${guest.id}`);
    } else {
      navigate(`/billing/guest/${guest.id}`);
    }
  };

  return (
    <div className="page-container">
      <div className="card" style={{ maxWidth: 600, margin: '0 auto', marginTop: '2rem' }}>
        <h2 className="card-title">New Guest Entry</h2>
        <p className="card-subtitle" style={{marginBottom: '1.5rem'}}>Enter details when a tourist or customer arrives.</p>

        <div className="input-group" style={{marginBottom: '1rem'}}>
          <label className="input-label">Full Name</label>
          <input type="text" className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div className="input-group" style={{marginBottom: '1rem'}}>
          <label className="input-label">Phone Number</label>
          <input type="text" className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        </div>
        <div className="input-group" style={{marginBottom: '2rem'}}>
          <label className="input-label">Optional Notes</label>
          <textarea className="input" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2} />
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <h3 style={{fontSize: '1rem', marginBottom: '1rem'}}>Does this guest need a room?</h3>
          <div style={{display: 'flex', gap: '1rem'}}>
            <button className="btn btn-primary" style={{flex: 1}} onClick={() => handleSubmit(true)}>
              Yes, Book Room
            </button>
            <button className="btn btn-outline" style={{flex: 1}} onClick={() => handleSubmit(false)}>
              No, Restaurant Only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
