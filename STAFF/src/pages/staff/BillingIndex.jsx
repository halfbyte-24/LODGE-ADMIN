import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Search, FileText } from 'lucide-react';

export default function BillingIndex() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadDrafts() {
      const { data, error } = await supabase
        .from('bills')
        .select('*, customers(full_name, phone), bookings(room_id, rooms(room_number))')
        .eq('bill_status', 'draft')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setDrafts(data);
      }
      setLoading(false);
    }
    loadDrafts();
  }, []);

  const filteredDrafts = drafts.filter(draft => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      draft.invoice_number.toLowerCase().includes(term) ||
      draft.customers?.full_name.toLowerCase().includes(term) ||
      draft.customers?.phone.includes(term) ||
      draft.bookings?.rooms?.room_number.toString().includes(term)
    );
  });

  return (
    <div style={{ padding: '1.5rem 1rem', maxWidth: '1000px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Billing</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Manage active customer bills</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/staff/new-customer')} style={{ minHeight: '44px' }}>
          New Customer Bill
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div className="input-group">
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input" 
              style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', minHeight: '44px' }} 
              placeholder="Search by customer name, phone, room, or invoice..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>Active Draft Bills</h2>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading active bills...</div>
      ) : filteredDrafts.length === 0 ? (
        <div className="card" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileText size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <h3>No active draft bills found</h3>
          <p>Create a new customer or search for an existing one to start a bill.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1rem' }}>
          {filteredDrafts.map(draft => (
            <div 
              key={draft.id} 
              className="card" 
              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              onClick={() => navigate(`/staff/billing/${draft.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 600 }}>{draft.invoice_number}</span>
                <span style={{ fontSize: '0.875rem', background: '#eff6ff', color: 'var(--primary-color)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Draft</span>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Customer:</span>{' '}
                <span style={{ fontWeight: 500 }}>{draft.customers?.full_name}</span>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Room:</span>{' '}
                <span style={{ fontWeight: 500 }}>{draft.bookings?.rooms?.room_number || 'Restaurant Only'}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Amount</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>₹{Number(draft.total_amount).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
