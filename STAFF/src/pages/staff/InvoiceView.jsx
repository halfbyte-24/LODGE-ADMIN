import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { billingService } from '../../services/billingService';
import { supabase } from '../../lib/supabase';
import { Printer, ArrowLeft, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function InvoiceView() {
  const { billId } = useParams();
  const navigate = useNavigate();
  
  const [bill, setBill] = useState(null);
  const [hotelSettings, setHotelSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paperWidth, setPaperWidth] = useState('80mm'); // '80mm' or '58mm'

  useEffect(() => {
    async function loadBillAndHotel() {
      try {
        setLoading(true);
        const [billData, hotelRes] = await Promise.all([
          billingService.getBillDetails(billId),
          supabase.from('hotel_settings').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle()
        ]);
        setBill(billData);
        if (hotelRes?.data) {
          setHotelSettings(hotelRes.data);
        }
      } catch (err) {
        console.error('[InvoiceView] Error loading bill:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBillAndHotel();
  }, [billId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto', opacity: 0.7 }} />
        <p>Loading Invoice &amp; Receipt Data...</p>
      </div>
    );
  }

  if (!bill) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Invoice Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Could not locate invoice record with ID: {billId}
        </p>
        <button className="btn btn-outline" onClick={() => navigate('/staff/billing')}>
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

  // Sum payments made from payments table
  const totalPaidThroughPayments = (bill.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const isPaid = bill.payment_status === 'paid' || totalPaidThroughPayments >= finalTotal;
  
  const totalAmountReceived = isPaid 
    ? Math.max(finalTotal, totalPaidThroughPayments)
    : (totalPaidThroughPayments > 0 ? totalPaidThroughPayments : advance);

  const balanceDue = isPaid ? 0 : Math.max(0, finalTotal - totalAmountReceived);

  // Format date and time
  const billDate = bill.created_at ? new Date(bill.created_at) : new Date();
  const dateFormatted = billDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const timeFormatted = billDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Hotel Business Details from settings or official business configuration
  const businessName = 'Amontron Hotel and Restaurant';
  const businessAddress = hotelSettings?.address 
    ? `${hotelSettings.address}${hotelSettings.city ? ', ' + hotelSettings.city : ''}${hotelSettings.pin_code ? ' - ' + hotelSettings.pin_code : ''}`
    : 'WM55+6MH, Dasghara, West Bengal 722161';
  const businessPhone = hotelSettings?.phone || '+91 94334 24718';
  const businessEmail = hotelSettings?.email || 'amontronhotelandrestaurant@gmail.com';

  return (
    <div className="invoice-screen-wrapper">
      {/* ACTIONS BAR - STRICTLY HIDDEN IN PRINT */}
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

      {/* THERMAL RECEIPT CONTAINER — STRICT BLACK TEXT ON WHITE BACKGROUND ONLY */}
      <div 
        id="thermal-bill-container" 
        className={`thermal-receipt ${paperWidth === '58mm' ? 'width-58mm' : 'width-80mm'}`}
      >
        {/* OFFICIAL BUSINESS HEADER */}
        <div className="receipt-header">
          <h2 className="receipt-hotel-title">
            {businessName}
          </h2>
          <p className="receipt-info-text">{businessAddress}</p>
          <p className="receipt-info-text">Phone: {businessPhone}</p>
          <p className="receipt-info-text">{businessEmail}</p>
        </div>
        
        <div className="receipt-divider">--------------------------------</div>
        
        {/* INVOICE METADATA */}
        <div className="receipt-meta">
          <div className="receipt-meta-row">
            <span>Invoice No:</span>
            <strong>{bill.invoice_number}</strong>
          </div>
          <div className="receipt-meta-row">
            <span>Date:</span>
            <span>{dateFormatted}</span>
          </div>
          <div className="receipt-meta-row">
            <span>Time:</span>
            <span>{timeFormatted}</span>
          </div>
        </div>
        
        <div className="receipt-divider">--------------------------------</div>
        
        {/* CUSTOMER & STAY / COUNTER DETAILS */}
        <div className="receipt-guest">
          <div className="receipt-meta-row">
            <span>Customer:</span>
            <strong>{guest?.full_name || 'Walk-in Guest'}</strong>
          </div>
          {guest?.phone && (
            <div className="receipt-meta-row">
              <span>Phone:</span>
              <span>{guest.phone}</span>
            </div>
          )}
          <div className="receipt-meta-row">
            <span>Reference:</span>
            <strong>
              {booking?.rooms?.room_number 
                ? `Room ${booking.rooms.room_number}` 
                : 'Restaurant Counter'}
            </strong>
          </div>
          {booking && booking.check_in && (
            <div className="receipt-meta-row">
              <span>Stay:</span>
              <span>{booking.check_in} to {booking.check_out}</span>
            </div>
          )}
        </div>

        <div className="receipt-divider">--------------------------------</div>
        
        {/* ITEMIZED TABLE / CHARGES */}
        {paperWidth === '58mm' ? (
          /* COMPACT 58mm STACKED LAYOUT (PREVENTS NARROW COLUMN CLIPPING) */
          <div className="receipt-items-58mm">
            {(bill.bill_items || []).map((item, idx) => (
              <div key={item.id || idx} className="item-row-58mm">
                <div className="item-name-58mm">{item.item_name}</div>
                <div className="item-calc-58mm">
                  <span>{item.quantity} × ₹{Number(item.unit_price || 0).toFixed(0)}</span>
                  <strong>₹{Number(item.total_price || 0).toFixed(2)}</strong>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* STANDARD 80mm ITEMIZED TABLE */
          <table className="receipt-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', width: '48%' }}>ITEM</th>
                <th style={{ textAlign: 'center', width: '14%' }}>QTY</th>
                <th style={{ textAlign: 'right', width: '18%' }}>RATE</th>
                <th style={{ textAlign: 'right', width: '20%' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {(bill.bill_items || []).map((item, idx) => (
                <tr key={item.id || idx}>
                  <td style={{ textAlign: 'left', wordBreak: 'break-word', paddingRight: '4px' }}>
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
        )}

        <div className="receipt-divider">--------------------------------</div>

        {/* FINANCIAL SUMMARY — SUB, TAX, DISC, ADVANCE, TOTAL, DUE */}
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

          <div className="receipt-divider">--------------------------------</div>

          <div className="receipt-total">
            <span>FINAL AMOUNT:</span>
            <span>₹{finalTotal.toFixed(2)}</span>
          </div>

          <div className="receipt-divider">--------------------------------</div>

          <div className="receipt-row">
            <span>Amount Received:</span>
            <span>₹{totalAmountReceived.toFixed(2)}</span>
          </div>

          <div className="receipt-row bold-row">
            <span>Balance Due:</span>
            <span>₹{balanceDue.toFixed(2)}</span>
          </div>
        </div>

        {/* PAYMENT STATUS — STRICT BLACK AND WHITE TEXT ONLY */}
        <div className="receipt-status-bw">
          {isPaid 
            ? '*** STATUS: FULLY PAID ***' 
            : `*** STATUS: PAYMENT DUE (₹${balanceDue.toFixed(2)}) ***`}
        </div>

        {/* SHORT FOOTER — CLEAN WITHOUT REPEATED ADDRESS/PHONE */}
        <div className="receipt-footer">
          <p className="footer-title">*** Thank you for visiting! ***</p>
        </div>

        <div className="receipt-cut-line">
          - - - - - - - - - - - - - - - - - - - - - - - - -
        </div>
      </div>
    </div>
  );
}
