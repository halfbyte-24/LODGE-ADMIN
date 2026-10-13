import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Receipt, Search, RefreshCw, FileText } from 'lucide-react';

export default function BillHistoryPage() {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bills')
        .select('*, customers(full_name, phone), bookings(room_id, rooms(room_number)), payments(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBills(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredBills = bills.filter(b => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (b.invoice_number || '').toLowerCase().includes(term) ||
      (b.customers?.full_name || '').toLowerCase().includes(term) ||
      (b.customers?.phone || '').includes(term) ||
      (b.bookings?.rooms?.room_number || '').toString().includes(term)
    );
  });

  return (
    <div style={{ padding: '1.5rem 1rem', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Invoice &amp; Bill History</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Complete audit trail of all generated invoices and receipts.</p>
        </div>
        <button className="btn btn-outline" onClick={loadHistory} disabled={loading} style={{ minHeight: '40px' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input" 
            style={{ width: '100%', paddingLeft: '2.25rem' }} 
            placeholder="Search invoice number, guest name, phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading invoices...</div>
      ) : filteredBills.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileText size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <h3>No invoices recorded</h3>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem' }}>Invoice #</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Room / Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Total Amount</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Bill Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Payment</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{b.invoice_number}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 500 }}>{b.customers?.full_name || 'Guest'}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{b.customers?.phone || '—'}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {b.bookings?.rooms?.room_number ? `Room ${b.bookings.rooms.room_number}` : 'Restaurant Only'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                      ₹{Number(b.total_amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem',
                        background: b.bill_status === 'completed' ? '#d1fae5' : '#eff6ff',
                        color: b.bill_status === 'completed' ? '#065f46' : '#1e40af'
                      }}>
                        {b.bill_status?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: b.payment_status === 'paid' ? '#d1fae5' : '#fee2e2',
                        color: b.payment_status === 'paid' ? '#065f46' : '#991b1b'
                      }}>
                        {b.payment_status?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => navigate(`/staff/invoice/${b.id}`)}
                      >
                        View Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
