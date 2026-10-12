import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Search, User } from 'lucide-react';

export default function BillingIndex() {
  const { guests } = useStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGuests = guests.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.phone.includes(searchTerm) ||
    (g.room && g.room.includes(searchTerm)) ||
    (g.bookingId && g.bookingId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="page-container" style={{ padding: '2rem' }}>
      <h1 style={{fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem'}}>Billing</h1>
      <p style={{color: 'var(--text-muted)', marginBottom: '2rem'}}>Search guest to create or view a bill.</p>

      <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
          <div className="input-with-addon">
            <span className="input-addon"><Search size={16} /></span>
            <input 
              type="text" 
              className="input" 
              placeholder="Search by Name, Phone, Room, or Booking ID" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredGuests.map(guest => (
            <div key={guest.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <User size={16}/> {guest.name}
                </h3>
                <div style={{fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem'}}>
                  Phone: {guest.phone} {guest.room ? `| Room: ${guest.room}` : '| Restaurant Only'} {guest.bookingId ? `| Booking: ${guest.bookingId}` : ''}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'var(--bg-main)', borderRadius: '4px', marginRight: '1rem' }}>
                  {guest.status}
                </span>
                <button className="btn btn-primary" onClick={() => navigate(`/billing/guest/${guest.id}`)}>
                  + New Bill
                </button>
              </div>
            </div>
          ))}
          {filteredGuests.length === 0 && <p style={{textAlign: 'center', color: 'var(--text-muted)', padding: '2rem'}}>No guests found.</p>}
        </div>
      </div>
    </div>
  );
}
