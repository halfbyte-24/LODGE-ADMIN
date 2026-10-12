import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { User, Phone, Calendar, Hash, Plus, Minus, Trash2 } from 'lucide-react';

const mockMenu = {
  food: [
    { id: 'f1', name: 'Chicken Biriyani', price: 180, img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&h=150&fit=crop' },
    { id: 'f2', name: 'Mutton Biriyani', price: 250, img: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=200&h=150&fit=crop' },
    { id: 'f3', name: 'Veg Fried Rice', price: 120, img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=200&h=150&fit=crop' },
    { id: 'f4', name: 'Chicken Fried Rice', price: 160, img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=200&h=150&fit=crop' },
    { id: 'f5', name: 'Chicken Curry', price: 160, img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200&h=150&fit=crop' },
    { id: 'f6', name: 'Paneer Butter Masala', price: 150, img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?w=200&h=150&fit=crop' },
    { id: 'f7', name: 'Chicken Roll', price: 90, img: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=150&fit=crop' },
    { id: 'f8', name: 'Roti', price: 10, img: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&h=150&fit=crop' }
  ],
  drinks: [
    { id: 'd1', name: 'Mineral Water', price: 20, img: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=200&h=150&fit=crop' },
    { id: 'd2', name: 'Tea', price: 15, img: 'https://images.unsplash.com/photo-1544787219-7f47cc3c5f66?w=200&h=150&fit=crop' },
    { id: 'd3', name: 'Coffee', price: 40, img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=150&fit=crop' },
    { id: 'd4', name: 'Cold Drink', price: 40, img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&h=150&fit=crop' },
    { id: 'd5', name: 'Lassi', price: 50, img: 'https://images.unsplash.com/photo-1572490122747-3968b75bb811?w=200&h=150&fit=crop' }
  ],
  services: [
    { id: 's1', name: 'Extra Bed', price: 300, img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=200&h=150&fit=crop' },
    { id: 's2', name: 'Laundry', price: 200, img: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=200&h=150&fit=crop' },
    { id: 's3', name: 'Room Service', price: 100, img: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=200&h=150&fit=crop' },
    { id: 's4', name: 'Late Checkout', price: 500, img: 'https://images.unsplash.com/photo-1562438668-bcf0ca6578f0?w=200&h=150&fit=crop' }
  ],
  room: []
};

export default function BillingWorkspace() {
  const { guestId } = useParams();
  const navigate = useNavigate();
  const { guests, rooms, saveBill, draftBills, updateDraftBill, hotelConfig } = useStore();
  
  const guest = guests.find(g => g.id === guestId);

  const [activeTab, setActiveTab] = useState('food');
  
  // Local state mapped directly from the Draft Store
  const draft = draftBills[guestId] || { items: [], discount: 0, tax: 0, advance: 0 };
  const billItems = draft.items;
  const discountValue = draft.discount;
  const taxValue = draft.tax;
  const advancePaid = draft.advance;

  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState(1);

  // Initialize room charge if needed
  useEffect(() => {
    if (guest && guest.isRoomGuest && billItems.length === 0) {
      const room = rooms.find(r => r.id === guest.room);
      if (room && guest.checkIn && guest.checkOut) {
        const inDate = new Date(guest.checkIn);
        const outDate = new Date(guest.checkOut);
        const nights = Math.max(1, Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24)));
        updateDraftBill(guestId, draft => ({
          ...draft,
          items: [{
            id: 'room_initial',
            itemId: room.id,
            name: `${room.type} Room (${room.id})`,
            type: 'room',
            qty: nights,
            price: room.price,
            locked: true // Room charges cannot be deleted
          }]
        }));
      }
    }
  }, [guest, rooms, guestId]); // Empty dependency array omitted, but handled effectively

  if (!guest) return <div style={{padding:'2rem'}}>Guest not found</div>;

  const setBillItems = (updater) => {
    updateDraftBill(guestId, draft => ({ ...draft, items: updater(draft.items) }));
  };

  const addItem = (item, type) => {
    setBillItems(prev => {
      const existing = prev.find(i => i.itemId === item.id && i.type === type && !i.locked);
      if (existing) {
        return prev.map(i => i.id === existing.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        id: Date.now().toString() + Math.random(),
        itemId: item.id,
        name: item.name,
        type,
        qty: 1,
        price: item.price
      }];
    });
  };

  const addCustomCharge = () => {
    if (!customName || !customPrice) return;
    setBillItems(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        itemId: 'custom-' + Date.now(),
        name: customName,
        type: 'custom',
        qty: parseInt(customQty) || 1,
        price: parseFloat(customPrice) || 0
      }
    ]);
    setCustomName('');
    setCustomPrice('');
    setCustomQty(1);
  };

  const updateQty = (id, newQty) => {
    if (newQty < 1) return;
    setBillItems(prev => prev.map(i => i.id === id ? { ...i, qty: newQty } : i));
  };

  const removeItem = (id) => {
    setBillItems(prev => prev.filter(i => i.id !== id));
  };

  const { subtotal, finalPayable, groupedItems } = useMemo(() => {
    let sub = 0;
    const grouped = { room: [], food: [], drinks: [], services: [], custom: [] };
    
    billItems.forEach(item => {
      sub += item.qty * item.price;
      if (grouped[item.type]) {
        grouped[item.type].push(item);
      } else {
        grouped.custom.push(item);
      }
    });

    const subAfterDiscount = Math.max(0, sub - discountValue);
    const tax = subAfterDiscount * (taxValue / 100);
    const payable = Math.max(0, subAfterDiscount + tax - advancePaid);

    return { subtotal: sub, finalPayable: payable, groupedItems: grouped };
  }, [billItems, discountValue, taxValue, advancePaid]);

  const handleConfirmAndContinue = () => {
    if (billItems.length === 0) return alert('Cannot generate empty bill.');
    
    const newBill = saveBill({
      guestId: guest.id,
      items: billItems,
      subtotal,
      discount: discountValue,
      tax: taxValue,
      taxAmount: Math.max(0, subtotal - discountValue) * (taxValue / 100),
      advancePaid,
      total: finalPayable,
      paymentStatus: 'PENDING',
      date: new Date().toISOString()
    });

    navigate(`/invoice/${newBill.id}`);
  };

  return (
    <div className="billing-layout">
      {/* LEFT SIDE - MAIN WORKSPACE */}
      <div className="main-workspace">
        <div className="page-header">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Billing for {guest.name}</h1>
            <p style={{ color: 'var(--text-muted)' }}>Add charges to the guest's running bill.</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Guest Account</h2>
          </div>
          <div className="guest-card" style={{ marginTop: 0 }}>
            <div className="guest-info-item">
              <span className="info-label"><User size={12} style={{display:'inline', marginRight:4}}/>Guest Name</span>
              <span className="info-value">{guest.name}</span>
            </div>
            <div className="guest-info-item">
              <span className="info-label"><Phone size={12} style={{display:'inline', marginRight:4}}/>Phone</span>
              <span className="info-value">{guest.phone}</span>
            </div>
            {guest.isRoomGuest ? (
              <>
                <div className="guest-info-item">
                  <span className="info-label">Room</span>
                  <span className="info-value">{guest.room}</span>
                </div>
                <div className="guest-info-item">
                  <span className="info-label"><Calendar size={12} style={{display:'inline', marginRight:4}}/>Stay</span>
                  <span className="info-value">{guest.checkIn} to {guest.checkOut}</span>
                </div>
                <div className="guest-info-item">
                  <span className="info-label"><Hash size={12} style={{display:'inline', marginRight:4}}/>Booking ID</span>
                  <span className="info-value">{guest.bookingId}</span>
                </div>
              </>
            ) : (
              <div className="guest-info-item">
                <span className="info-label">Type</span>
                <span className="info-value">Restaurant Only</span>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Add Charges</h2>
          </div>
          <div className="charge-tabs">
            {['food', 'drinks', 'services', 'custom'].map(tab => (
              <button 
                key={tab}
                className={`charge-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'custom' ? (
            <div className="custom-charge-form">
              <div className="input-group">
                <label className="input-label">Item Name</label>
                <input type="text" className="input" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g. Broken Glass Penalty" />
              </div>
              <div className="input-group">
                <label className="input-label">Amount (₹)</label>
                <input type="number" className="input" value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder="0.00" />
              </div>
              <div className="input-group">
                <label className="input-label">Quantity</label>
                <input type="number" className="input" value={customQty} onChange={e => setCustomQty(e.target.value)} min="1" />
              </div>
              <button className="btn btn-primary" onClick={addCustomCharge}>Add Charge</button>
            </div>
          ) : (
            <div className="charge-items-grid">
              {mockMenu[activeTab]?.map(item => (
                <div key={item.id} className="charge-item-card" onClick={() => addItem(item, activeTab)}>
                  {item.img && <img src={item.img} alt={item.name} />}
                  <div className="charge-item-name">{item.name}</div>
                  <div className="charge-item-price">₹{item.price}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Bill Items</h2>
          </div>
          <div className="bill-table-container">
            <table className="bill-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {billItems.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No items added yet.</td>
                  </tr>
                )}
                {billItems.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                    <td><span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'var(--bg-main)', borderRadius: '4px', textTransform: 'capitalize' }}>{item.type}</span></td>
                    <td>
                      <div className="qty-control">
                        <button className="qty-btn" onClick={() => updateQty(item.id, item.qty - 1)} disabled={item.locked}><Minus size={12}/></button>
                        <span style={{ width: '20px', textAlign: 'center' }}>{item.qty}</span>
                        <button className="qty-btn" onClick={() => updateQty(item.id, item.qty + 1)} disabled={item.locked}><Plus size={12}/></button>
                      </div>
                    </td>
                    <td>₹{item.price}</td>
                    <td style={{ fontWeight: 600 }}>₹{item.qty * item.price}</td>
                    <td>
                      {item.locked ? (
                        <button className="btn btn-outline" style={{padding: '0.25rem 0.5rem', fontSize: '0.75rem'}}>Edit Stay</button>
                      ) : (
                        <button className="btn-icon btn-danger-icon" onClick={() => removeItem(item.id)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - LIVE PREVIEW */}
      <div className="live-preview-panel">
        <div className="live-preview-content">
          <div className="preview-header">
            <div className="preview-title">Live Bill Preview</div>
            <div className="preview-hotel-name">{hotelConfig.name}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{new Date().toLocaleDateString()}</div>
          </div>

          <div className="preview-guest-info">
            <div className="preview-info-row strong">
              <span>{guest.name}</span>
              {guest.room && <span>Room {guest.room}</span>}
            </div>
            {guest.bookingId && (
              <div className="preview-info-row" style={{ color: 'var(--text-muted)' }}>
                <span>Booking ID:</span>
                <span>{guest.bookingId}</span>
              </div>
            )}
          </div>

          <div className="preview-items">
            {Object.keys(groupedItems).map(category => {
              if (groupedItems[category].length === 0) return null;
              return (
                <div key={category} className="preview-category">
                  <div className="preview-category-title">{category} Charges</div>
                  {groupedItems[category].map(item => (
                    <div key={item.id} className="preview-item-row">
                      <span className="preview-item-name">{item.name} <span style={{color:'var(--text-muted)'}}>× {item.qty}</span></span>
                      <span className="preview-item-price">₹{item.qty * item.price}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

          <div className="preview-totals">
            <div className="adjustments-grid" style={{ marginTop: 0, marginBottom: '1rem', gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="input-group">
                <label className="input-label" style={{fontSize: '0.75rem'}}>Discount (₹)</label>
                <input type="number" className="input" style={{padding: '0.25rem 0.5rem'}} value={discountValue} onChange={e => updateDraftBill(guestId, d => ({...d, discount: Number(e.target.value) || 0}))} />
              </div>
              <div className="input-group">
                <label className="input-label" style={{fontSize: '0.75rem'}}>Tax (%)</label>
                <input type="number" className="input" style={{padding: '0.25rem 0.5rem'}} value={taxValue} onChange={e => updateDraftBill(guestId, d => ({...d, tax: Number(e.target.value) || 0}))} />
              </div>
              <div className="input-group">
                <label className="input-label" style={{fontSize: '0.75rem'}}>Advance (₹)</label>
                <input type="number" className="input" style={{padding: '0.25rem 0.5rem'}} value={advancePaid} onChange={e => updateDraftBill(guestId, d => ({...d, advance: Number(e.target.value) || 0}))} />
              </div>
            </div>

            <div className="preview-total-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="preview-total-row">
              <span>Discount</span>
              <span>- ₹{discountValue.toFixed(2)}</span>
            </div>
            <div className="preview-total-row">
              <span>Tax ({taxValue}%)</span>
              <span>+ ₹{(Math.max(0, subtotal - discountValue) * (taxValue / 100)).toFixed(2)}</span>
            </div>
            <div className="preview-total-row">
              <span>Advance Paid</span>
              <span>- ₹{advancePaid.toFixed(2)}</span>
            </div>
            
            <div className="preview-grand-total">
              <span>FINAL AMOUNT</span>
              <span>₹{finalPayable.toFixed(2)}</span>
            </div>
          </div>
          
          <div style={{ padding: '1rem', flexShrink: 0, borderTop: '1px solid var(--border-color)' }}>
            <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} onClick={handleConfirmAndContinue}>
              Confirm & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
