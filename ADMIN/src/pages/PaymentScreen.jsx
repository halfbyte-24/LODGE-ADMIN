import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { CheckCircle2 } from 'lucide-react';

export default function PaymentScreen() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const { bills, guests, markBillPaid } = useStore();
  
  const bill = bills.find(b => b.id === billId);
  const guest = guests.find(g => g.id === bill?.guestId);

  const [method, setMethod] = useState('Cash');
  const [received, setReceived] = useState('');

  if (!bill || !guest) return <div style={{padding:'2rem'}}>Bill not found</div>;

  const handleConfirm = () => {
    markBillPaid(bill.id, {
      paymentMethod: method,
      paymentDate: new Date().toISOString()
    });
    // navigate to somewhere or show success
    navigate(`/invoice/${bill.id}`);
  };

  const change = method === 'Cash' && received ? Math.max(0, Number(received) - bill.total) : 0;

  return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 500 }}>
        {bill.paymentStatus === 'PAID' ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <CheckCircle2 size={64} style={{ color: 'var(--success-color)', margin: '0 auto 1rem auto' }} />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Payment Completed</h2>
            <button className="btn btn-primary" onClick={() => navigate(`/invoice/${bill.id}`)}>
              View Invoice
            </button>
          </div>
        ) : (
          <>
            <h2 className="card-title" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Receive Payment</h2>
            
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Amount Due</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>₹{bill.total.toFixed(2)}</p>
            </div>

            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label className="input-label">Payment Method</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['Cash', 'UPI', 'Card'].map(m => (
                  <button 
                    key={m}
                    className={`btn ${method === m ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                    onClick={() => setMethod(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {method === 'Cash' && (
              <>
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <label className="input-label">Amount Received (₹)</label>
                  <input 
                    type="number" 
                    className="input" 
                    style={{ fontSize: '1.25rem', padding: '0.75rem' }}
                    value={received} 
                    onChange={e => setReceived(e.target.value)} 
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: change > 0 ? '#d1fae5' : '#f1f5f9', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                  <span style={{ fontWeight: 600 }}>Change to Return:</span>
                  <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>₹{change.toFixed(2)}</span>
                </div>
              </>
            )}

            <button className="btn btn-success" style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }} onClick={handleConfirm}>
              Confirm Payment
            </button>
          </>
        )}
      </div>
    </div>
  );
}
