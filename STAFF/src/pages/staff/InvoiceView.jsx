import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { billingService } from '../../services/billingService';
import { Printer, ArrowRight, ArrowLeft } from 'lucide-react';

export default function InvoiceView() {
  const { billId } = useParams();
  const navigate = useNavigate();
  
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paperWidth, setPaperWidth] = useState('80mm'); // '80mm' or '58mm'

  useEffect(() => {
    async function loadBill() {
      try {
        const data = await billingService.getBillDetails(billId);
        setBill(data);
      } catch (err) {
        console.error('[InvoiceView] Error loading bill:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBill();
  }, [billId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Invoice...
      </div>
    );
  }

  if (!bill) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Invoice Not Found</h2>
        <button className="btn btn-outline" onClick={() => navigate('/staff/billing')} style={{ marginTop: '1rem' }}>
          Back to Billing
        </button>
      </div>
    );
  }

  const guest = bill.customers;
  const booking = bill.bookings;
  const subtotal = Number(bill.subtotal || 0);
  const discount = Number(bill.discount_amount || 0);
  const tax = Number(bill.tax_amount || 0);
  const advance = Number(bill.advance_amount || 0);
  const finalTotal = Number(bill.total_amount || 0);
  const isPaid = bill.payment_status === 'paid';
  const balanceDue = isPaid ? 0 : Math.max(0, finalTotal);

  return (
    <div className="invoice-screen-wrapper">
      {/* ACTIONS BAR - HIDDEN IN PRINT */}
      <div className="actions-bar no-print">
        <button className="btn btn-outline" onClick={() => navigate(`/staff/billing/${bill.id}`)}>
          <ArrowLeft size={16} /> Edit Charges
        </button>
        
        {/* Paper Size Toggle */}
        <div style={{ display: 'inline-flex', background: '#e2e8f0', borderRadius: '6px', padding: '2px' }}>
          <button
            type="button"
            className="btn"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: paperWidth === '80mm' ? 700 : 500,
              background: paperWidth === '80mm' ? '#ffffff' : 'transparent',
              color: paperWidth === '80mm' ? '#0f172a' : '#64748b',
              boxShadow: paperWidth === '80mm' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              borderRadius: '4px'
            }}
            onClick={() => setPaperWidth('80mm')}
          >
            80mm Standard
          </button>
          <button
            type="button"
            className="btn"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: paperWidth === '58mm' ? 700 : 500,
              background: paperWidth === '58mm' ? '#ffffff' : 'transparent',
              color: paperWidth === '58mm' ? '#0f172a' : '#64748b',
              boxShadow: paperWidth === '58mm' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              borderRadius: '4px'
            }}
            onClick={() => setPaperWidth('58mm')}
          >
            58mm Compact
          </button>
        </div>

        <button className="btn btn-primary" onClick={handlePrint} style={{ fontWeight: 700 }}>
          <Printer size={18} /> Print Bill
        </button>

        {!isPaid && (
          <button className="btn btn-success" onClick={() => navigate(`/staff/payment/${bill.id}`)} style={{ fontWeight: 700 }}>
            Receive Payment <ArrowRight size={16} />
          </button>
        )}
      </div>

      {/* THERMAL RECEIPT CONTAINER */}
      <div 
        id="thermal-bill-container" 
        className={`thermal-receipt ${paperWidth === '58mm' ? 'width-58mm' : 'width-80mm'}`}
      >
        {/* HEADER */}
        <div className="receipt-header">
          <h2 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Amontron Hotel and Restaurant
          </h2>
          <p style={{ margin: '0.2rem 0', fontSize: '0.75rem' }}>123 Highway Road, Cityville</p>
          <p style={{ margin: '0.2rem 0', fontSize: '0.75rem' }}>Phone: +91 94334 24718</p>
          <p style={{ margin: '0.2rem 0', fontSize: '0.7rem', color: '#333' }}>
            amontronhotelandrestaurant@gmail.com
          </p>
        </div>
        
        <div className="receipt-divider">================================</div>
        
        {/* METADATA */}
        <div className="receipt-meta">
          <p><span>Bill No:</span> <strong>{bill.invoice_number}</strong></p>
          <p><span>Date:</span> <span>{new Date(bill.created_at).toLocaleDateString()}</span></p>
          <p><span>Time:</span> <span>{new Date(bill.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
        </div>
        
        <div className="receipt-divider">--------------------------------</div>
        
        {/* GUEST & ROOM INFO */}
        <div className="receipt-guest">
          <p><span>Customer:</span> <strong>{guest?.full_name || 'Guest'}</strong></p>
          {guest?.phone && <p><span>Phone:</span> <span>{guest.phone}</span></p>}
          {booking?.rooms?.room_number ? (
            <p><span>Room No:</span> <strong>Room {booking.rooms.room_number}</strong></p>
          ) : (
            <p><span>Service:</span> <span>Restaurant / Counter</span></p>
          )}
          {booking && booking.check_in && (
            <p><span>Stay Period:</span> <span>{booking.check_in} to {booking.check_out}</span></p>
          )}
        </div>

        <div className="receipt-divider">================================</div>
        
        {/* ITEMIZED TABLE */}
        <table className="receipt-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', width: '46%' }}>ITEM</th>
              <th style={{ textAlign: 'center', width: '16%' }}>QTY</th>
              <th style={{ textAlign: 'right', width: '18%' }}>RATE</th>
              <th style={{ textAlign: 'right', width: '20%' }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {(bill.bill_items || []).map(item => (
              <tr key={item.id}>
                <td style={{ textAlign: 'left', wordBreak: 'break-word', paddingRight: '2px' }}>
                  {item.item_name}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {item.quantity}
                </td>
                <td style={{ textAlign: 'right' }}>
                  ₹{Number(item.unit_price || 0).toFixed(0)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  ₹{Number(item.total_price || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="receipt-divider">--------------------------------</div>

        {/* FINANCIAL SUMMARY */}
        <div className="receipt-summary">
          <div className="receipt-row">
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          {discount > 0 && (
            <div className="receipt-row">
              <span>Discount:</span>
              <span>- ₹{discount.toFixed(2)}</span>
            </div>
          )}

          {tax > 0 && (
            <div className="receipt-row">
              <span>Tax / GST:</span>
              <span>+ ₹{tax.toFixed(2)}</span>
            </div>
          )}

          {advance > 0 && (
            <div className="receipt-row">
              <span>Advance Paid:</span>
              <span>- ₹{advance.toFixed(2)}</span>
            </div>
          )}

          <div className="receipt-total">
            <span>TOTAL AMOUNT:</span>
            <span>₹{finalTotal.toFixed(2)}</span>
          </div>

          <div className="receipt-row" style={{ marginTop: '0.35rem', fontWeight: 600 }}>
            <span>Amount Paid:</span>
            <span>₹{isPaid ? finalTotal.toFixed(2) : (advance > 0 ? advance.toFixed(2) : '0.00')}</span>
          </div>

          <div className="receipt-row" style={{ fontWeight: 700, color: balanceDue > 0 ? '#b91c1c' : '#15803d' }}>
            <span>Balance Due:</span>
            <span>₹{balanceDue.toFixed(2)}</span>
          </div>
        </div>

        {/* PAYMENT STATUS BADGE */}
        <div className={`receipt-status ${isPaid ? 'status-paid-box' : 'status-due-box'}`}>
          STATUS: {bill.payment_status ? bill.payment_status.toUpperCase() : 'PENDING'}
        </div>

        {/* FOOTER */}
        <div className="receipt-footer">
          <p style={{ fontWeight: 700, letterSpacing: '1px' }}>*** THANK YOU! VISIT AGAIN ***</p>
          <p>Location: https://maps.app.goo.gl/rSui7ryM9LkorzYk6</p>
          <p>For inquiries: +91 94334 24718</p>
        </div>

        <div className="receipt-cut-line">
          ✂ - - - - - - - - - - - - - - - - - - - ✂
        </div>
      </div>
    </div>
  );
}
