import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { billingService } from '../../services/billingService';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

export default function PaymentScreen() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState('cash');
  const [received, setReceived] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadBill() {
      try {
        const data = await billingService.getBillDetails(billId);
        setBill(data);
        if (data) {
          setReceived(data.total_amount || '');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load bill details');
      } finally {
        setLoading(false);
      }
    }
    loadBill();
  }, [billId]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading bill details...</div>;
  if (!bill) return <div style={{ padding: '2rem', textAlign: 'center' }}>Bill not found</div>;

  const totalAmount = Number(bill.total_amount) || 0;
  const change = method === 'cash' && Number(received) > totalAmount ? Number(received) - totalAmount : 0;

  const handleConfirm = async () => {
    const payAmount = Number(received) || totalAmount;
    if (payAmount <= 0) {
      alert('Payment amount must be greater than zero.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await billingService.recordPayment({
        billId: bill.id,
        amount: Math.min(payAmount, totalAmount),
        paymentMethod: method,
        staffId: profile?.id,
        notes
      });
      // Refresh bill state
      const refreshed = await billingService.getBillDetails(billId);
      setBill(refreshed);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 520 }}>
        <button 
          onClick={() => navigate(`/staff/invoice/${bill.id}`)} 
          className="btn btn-outline" 
          style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={16} /> Back to Invoice
        </button>

        {bill.payment_status === 'paid' ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <CheckCircle2 size={64} style={{ color: 'var(--success-color)', margin: '0 auto 1rem auto' }} />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Payment Completed</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Invoice #{bill.invoice_number} has been settled in full.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => navigate(`/staff/invoice/${bill.id}`)} style={{ fontWeight: 700 }}>
                Print Bill
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/staff/dashboard')}>
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="card-title" style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Receive Payment</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Bill #{bill.invoice_number} • Customer: {bill.customers?.full_name}
            </p>

            {error && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Amount Due</p>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>₹{totalAmount.toFixed(2)}</p>
            </div>

            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label className="input-label">Payment Method</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['cash', 'upi', 'card', 'other'].map(m => (
                  <button 
                    key={m}
                    type="button"
                    className={`btn ${method === m ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1, textTransform: 'uppercase', fontSize: '0.8rem' }}
                    onClick={() => setMethod(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

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

            {method === 'cash' && change > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#d1fae5', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                <span style={{ fontWeight: 600, color: '#065f46' }}>Change to Return:</span>
                <span style={{ fontWeight: 700, fontSize: '1.125rem', color: '#065f46' }}>₹{change.toFixed(2)}</span>
              </div>
            )}

            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label className="input-label">Payment Notes / Ref # (Optional)</label>
              <input 
                type="text" 
                className="input" 
                placeholder="e.g. UPI Ref 92837482, Card ending 4412"
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
              />
            </div>

            <button 
              className="btn btn-success" 
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 600 }} 
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? 'Recording Payment...' : 'Confirm Payment & Close Bill'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
