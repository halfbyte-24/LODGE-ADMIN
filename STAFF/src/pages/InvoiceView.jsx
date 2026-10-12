import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Printer, ArrowRight } from 'lucide-react';

export default function InvoiceView() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const { bills, guests, hotelConfig } = useStore();
  
  const bill = bills.find(b => b.id === billId);
  const guest = guests.find(g => g.id === bill?.guestId);

  if (!bill || !guest) return <div style={{padding:'2rem'}}>Invoice not found</div>;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
      <div className="actions-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn btn-outline" onClick={() => window.print()}>
          <Printer size={16}/> Print Invoice
        </button>
        <button className="btn btn-success" onClick={() => navigate(`/payment/${bill.id}`)}>
          Continue to Payment <ArrowRight size={16}/>
        </button>
      </div>

      <div className="thermal-receipt">
        <div className="receipt-header">
          <h2>{hotelConfig.name}</h2>
          <p>{hotelConfig.address}</p>
          <p>{hotelConfig.city}, {hotelConfig.state} {hotelConfig.pin}</p>
          <p>Ph: {hotelConfig.phone}</p>
        </div>
        
        <div className="receipt-divider">--------------------------------</div>
        
        <div className="receipt-meta">
          <p>Invoice: {bill.invoiceId}</p>
          <p>Date: {new Date(bill.date).toLocaleDateString()}</p>
          <p>Time: {new Date(bill.date).toLocaleTimeString()}</p>
        </div>
        
        <div className="receipt-divider">--------------------------------</div>
        
        <div className="receipt-guest">
          <p>Guest: {guest.name}</p>
          <p>Phone: {guest.phone}</p>
          {guest.room && <p>Room: {guest.room}</p>}
        </div>

        <div className="receipt-divider">--------------------------------</div>
        
        <table className="receipt-table">
          <thead>
            <tr>
              <th style={{textAlign: 'left'}}>ITEM</th>
              <th style={{textAlign: 'center'}}>QTY</th>
              <th style={{textAlign: 'right'}}>AMT</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan="3"><div className="receipt-divider">--------------------------------</div></td></tr>
            {bill.items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.name}</td>
                <td style={{textAlign: 'center'}}>{item.qty}</td>
                <td style={{textAlign: 'right'}}>₹{item.qty * item.price}</td>
              </tr>
            ))}
            <tr><td colSpan="3"><div className="receipt-divider">--------------------------------</div></td></tr>
          </tbody>
        </table>

        <div className="receipt-summary">
          <div className="receipt-row">
            <span>Subtotal</span>
            <span>₹{bill.subtotal.toFixed(2)}</span>
          </div>
          <div className="receipt-row">
            <span>Discount</span>
            <span>₹{bill.discount.toFixed(2)}</span>
          </div>
          <div className="receipt-row">
            <span>Tax</span>
            <span>₹{bill.taxAmount.toFixed(2)}</span>
          </div>
          <div className="receipt-row">
            <span>Advance Paid</span>
            <span>₹{bill.advancePaid.toFixed(2)}</span>
          </div>
        </div>

        <div className="receipt-divider">--------------------------------</div>
        
        <div className="receipt-total">
          <span>TOTAL</span>
          <span>₹{bill.total.toFixed(2)}</span>
        </div>

        <div className="receipt-divider">--------------------------------</div>
        
        <div className="receipt-status">
          PAYMENT: {bill.paymentStatus}
        </div>

        <div className="receipt-footer">
          <p>Thank You!</p>
          <p>Visit Again</p>
        </div>
      </div>
    </div>
  );
}
