import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { billingService } from '../../services/billingService';
import { menuService } from '../../services/menuService';
import { User, Phone, Calendar, Hash, Plus, Minus, Trash2, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function BillingWorkspace() {
  const { customerId: routeParamId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [bill, setBill] = useState(null);
  const [menu, setMenu] = useState({ food: [], drinks: [], services: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [activeTab, setActiveTab] = useState('food');
  
  const [discountValue, setDiscountValue] = useState(0);
  const [taxValue, setTaxValue] = useState(0);
  const [advancePaid, setAdvancePaid] = useState(0);

  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadBillAndMenu = useCallback(async () => {
    if (!routeParamId) {
      setLoadError({ message: 'No Customer or Bill ID provided in URL.' });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setLoadError(null);
      const [billData, menuData] = await Promise.all([
        billingService.getOrInitializeDraftBill(routeParamId, profile?.id),
        menuService.getMenu()
      ]);
      setBill(billData);
      setMenu(menuData);
      setDiscountValue(Number(billData.discount_amount) || 0);
      setTaxValue(Number(billData.tax_amount) || 0);
      setAdvancePaid(Number(billData.advance_amount) || 0);
    } catch (err) {
      console.error('[BillingWorkspace] Failed to load billing data:', err);
      const devMessage = err?.message || err?.error_description || (typeof err === 'string' ? err : 'Unknown error');
      const devDetails = err?.details || err?.hint || (err?.code ? `Supabase error code: ${err.code}` : '');
      setLoadError({
        message: devMessage,
        details: devDetails,
        raw: err
      });
    } finally {
      setLoading(false);
    }
  }, [routeParamId, profile?.id]);

  useEffect(() => {
    loadBillAndMenu();
  }, [loadBillAndMenu]);

  // Derived calculations
  const { subtotal, finalPayable, groupedItems } = useMemo(() => {
    if (!bill) return { subtotal: 0, finalPayable: 0, groupedItems: {} };
    
    let sub = 0;
    const grouped = { room: [], food: [], drinks: [], services: [], custom: [] };
    
    // Sort items so they don't jump around, room first
    const sortedItems = [...(bill.bill_items || [])].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));

    sortedItems.forEach(item => {
      sub += Number(item.total_price) || 0;
      const type = item.item_type;
      if (type === 'drink' || type === 'drinks') {
        grouped.drinks.push(item);
      } else if (type === 'service' || type === 'services') {
        grouped.services.push(item);
      } else if (type === 'food') {
        grouped.food.push(item);
      } else if (type === 'room') {
        grouped.room.push(item);
      } else {
        grouped.custom.push(item);
      }
    });

    const subAfterDiscount = Math.max(0, sub - discountValue);
    const taxAmt = subAfterDiscount * (taxValue / 100);
    const payable = Math.max(0, subAfterDiscount + taxAmt - advancePaid);

    return { subtotal: sub, finalPayable: payable, groupedItems: grouped };
  }, [bill, discountValue, taxValue, advancePaid]);

  // Debounced auto-save totals
  useEffect(() => {
    if (!bill) return;
    const taxAmt = Math.max(0, subtotal - discountValue) * (taxValue / 100);
    const timer = setTimeout(() => {
      billingService.updateBillTotals(bill.id, subtotal, discountValue, taxAmt, advancePaid, finalPayable)
        .catch(err => console.error('Failed to sync totals', err));
    }, 500);
    return () => clearTimeout(timer);
  }, [subtotal, discountValue, taxValue, advancePaid, finalPayable, bill]);

  const refreshBill = async () => {
    try {
      const targetId = bill?.id || bill?.customer_id || routeParamId;
      const updated = await billingService.getDraftBillForCustomer(targetId);
      if (updated) {
        setBill(updated);
      }
    } catch (err) {
      console.error('[BillingWorkspace] Failed to refresh bill:', err);
    }
  };

  const addItem = async (item, type) => {
    if (isProcessing || !bill) return;
    setIsProcessing(true);

    const normalizedType = (type === 'drinks' || type === 'drink')
      ? 'drink'
      : (type === 'services' || type === 'service')
      ? 'service'
      : type;

    const unitPrice = Number(item.price) || 0;

    // Immediate optimistic state update
    setBill(prev => {
      if (!prev) return prev;
      const currentItems = [...(prev.bill_items || [])];
      const existingIdx = currentItems.findIndex(i => i.reference_id && i.reference_id === item.id);

      if (existingIdx >= 0) {
        const existing = currentItems[existingIdx];
        const newQty = (Number(existing.quantity) || 0) + 1;
        currentItems[existingIdx] = {
          ...existing,
          quantity: newQty,
          total_price: Number(existing.unit_price) * newQty
        };
      } else {
        currentItems.push({
          id: 'temp-' + Date.now(),
          bill_id: prev.id,
          item_type: normalizedType,
          reference_id: item.id,
          item_name: item.name,
          quantity: 1,
          unit_price: unitPrice,
          total_price: unitPrice,
          created_at: new Date().toISOString()
        });
      }
      return { ...prev, bill_items: currentItems };
    });

    try {
      await billingService.addOrUpdateBillItem(bill.id, normalizedType, item, 1);
      await refreshBill();
    } catch (err) {
      console.error('[BillingWorkspace] Failed to add item:', err);
      alert('Failed to add item: ' + (err?.message || 'Database error'));
      await refreshBill();
    } finally {
      setIsProcessing(false);
    }
  };

  const addCustomCharge = async () => {
    if (isProcessing || !bill) return;
    const name = customName.trim();
    const price = parseFloat(customPrice);
    const qty = parseInt(customQty, 10);

    if (!name) {
      alert('Please enter an item name/description for the custom charge.');
      return;
    }
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid quantity of 1 or more.');
      return;
    }

    setIsProcessing(true);

    // Immediate optimistic state update
    setBill(prev => {
      if (!prev) return prev;
      const currentItems = [...(prev.bill_items || [])];
      currentItems.push({
        id: 'temp-' + Date.now(),
        bill_id: prev.id,
        item_type: 'custom',
        reference_id: null,
        item_name: name,
        quantity: qty,
        unit_price: price,
        total_price: price * qty,
        created_at: new Date().toISOString()
      });
      return { ...prev, bill_items: currentItems };
    });

    try {
      await billingService.addOrUpdateBillItem(bill.id, 'custom', { name, price }, qty, true);
      setCustomName('');
      setCustomPrice('');
      setCustomQty(1);
      await refreshBill();
    } catch (err) {
      console.error('[BillingWorkspace] Failed to add custom charge:', err);
      alert('Failed to add custom charge: ' + (err?.message || 'Database error'));
      await refreshBill();
    } finally {
      setIsProcessing(false);
    }
  };

  const updateQty = async (itemId, currentQty, unitPrice, delta) => {
    const newQty = currentQty + delta;
    if (newQty < 1 || isProcessing || !bill) return;
    setIsProcessing(true);

    // Immediate optimistic state update
    setBill(prev => {
      if (!prev) return prev;
      const currentItems = (prev.bill_items || []).map(i => {
        if (i.id === itemId) {
          return {
            ...i,
            quantity: newQty,
            total_price: Number(unitPrice) * newQty
          };
        }
        return i;
      });
      return { ...prev, bill_items: currentItems };
    });

    try {
      await billingService.updateItemQuantity(itemId, newQty, unitPrice);
      await refreshBill();
    } catch (err) {
      console.error('[BillingWorkspace] Failed to update item quantity:', err);
      alert('Failed to update quantity: ' + (err?.message || 'Database error'));
      await refreshBill();
    } finally {
      setIsProcessing(false);
    }
  };

  const removeItem = async (itemId) => {
    if (isProcessing || !bill) return;
    setIsProcessing(true);

    // Immediate optimistic state update
    setBill(prev => {
      if (!prev) return prev;
      const currentItems = (prev.bill_items || []).filter(i => i.id !== itemId);
      return { ...prev, bill_items: currentItems };
    });

    try {
      await billingService.removeBillItem(itemId);
      await refreshBill();
    } catch (err) {
      console.error('[BillingWorkspace] Failed to remove item:', err);
      alert('Failed to remove item: ' + (err?.message || 'Database error'));
      await refreshBill();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAndContinue = async () => {
    if (!bill || !bill.bill_items || bill.bill_items.length === 0) {
      return alert('Cannot generate empty bill.');
    }
    try {
      setIsProcessing(true);
      const taxAmt = Math.max(0, subtotal - discountValue) * (taxValue / 100);
      await billingService.updateBillTotals(bill.id, subtotal, discountValue, taxAmt, advancePaid, finalPayable);
      await billingService.confirmBill(bill.id);
      navigate(`/staff/invoice/${bill.id}`);
    } catch (err) {
      console.error('[BillingWorkspace] Failed to confirm bill:', err);
      alert('Failed to confirm bill: ' + (err?.message || 'Database error'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 1rem auto', opacity: 0.7 }} />
        <p style={{ fontWeight: 500 }}>Loading Billing Workspace...</p>
      </div>
    );
  }

  if (loadError || !bill) {
    return (
      <div style={{ padding: '2rem', maxWidth: '700px', margin: '2rem auto' }}>
        <div className="card" style={{ padding: '2rem', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#dc2626' }}>
            <AlertCircle size={24} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Failed to Load Billing Data</h2>
          </div>
          <p style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            {loadError?.message || 'Could not find or create a bill for this record.'}
          </p>
          {loadError?.details && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '4px', fontFamily: 'monospace' }}>
              {loadError.details}
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={loadBillAndMenu}>
              <RefreshCw size={15} style={{ marginRight: '0.35rem' }} /> Retry
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/staff/billing')}>
              <ArrowLeft size={15} style={{ marginRight: '0.35rem' }} /> Back to Billing
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/staff/new-customer')}>
              New Customer Bill
            </button>
          </div>
        </div>
      </div>
    );
  }

  const guest = bill.customers || { full_name: 'Guest', phone: '—' };
  const booking = bill.bookings;

  return (
    <div className="billing-layout">
      {/* LEFT SIDE - MAIN WORKSPACE */}
      <div className="main-workspace">
        <div className="page-header">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Billing Workspace</h1>
            <p style={{ color: 'var(--text-muted)' }}>Drafting Bill {bill.invoice_number}</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Customer Account</h2>
          </div>
          <div className="guest-card" style={{ marginTop: 0 }}>
            <div className="guest-info-item">
              <span className="info-label"><User size={12} style={{display:'inline', marginRight:4}}/>Name</span>
              <span className="info-value">{guest.full_name}</span>
            </div>
            <div className="guest-info-item">
              <span className="info-label"><Phone size={12} style={{display:'inline', marginRight:4}}/>Phone</span>
              <span className="info-value">{guest.phone}</span>
            </div>
            {booking ? (
              <>
                <div className="guest-info-item">
                  <span className="info-label">Type</span>
                  <span className="info-value">Room Guest</span>
                </div>
                <div className="guest-info-item">
                  <span className="info-label"><Calendar size={12} style={{display:'inline', marginRight:4}}/>Stay</span>
                  <span className="info-value">{booking.check_in} to {booking.check_out}</span>
                </div>
                <div className="guest-info-item">
                  <span className="info-label"><Hash size={12} style={{display:'inline', marginRight:4}}/>Booking ID</span>
                  <span className="info-value">{booking.booking_number}</span>
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
              <button className="btn btn-primary" onClick={addCustomCharge} disabled={isProcessing}>Add Charge</button>
            </div>
          ) : (
            <div className="charge-items-grid">
              {menu[activeTab]?.map(item => (
                <div 
                  key={item.id} 
                  className="charge-item-card" 
                  onClick={() => addItem(item, activeTab)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addItem(item, activeTab); } }}
                  title={`Click to add ${item.name} to bill`}
                >
                  {item.image_url && <img src={item.image_url} alt={item.name} />}
                  {!item.image_url && <div style={{height:'100px', background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', margin:'-1rem -1rem 0.5rem -1rem', color:'#94a3b8'}}>No Image</div>}
                  <div className="charge-item-name">{item.name}</div>
                  <div className="charge-item-price">₹{item.price}</div>
                  {item.category_name && <div style={{fontSize: '0.7rem', color:'var(--text-muted)'}}>{item.category_name}</div>}
                </div>
              ))}
              {(!menu[activeTab] || menu[activeTab].length === 0) && (
                <div style={{gridColumn: '1 / -1', textAlign:'center', color:'var(--text-muted)', padding:'2rem'}}>No {activeTab} items available in the database.</div>
              )}
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
                {(!bill.bill_items || bill.bill_items.length === 0) && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No items added yet.</td>
                  </tr>
                )}
                {(bill.bill_items || []).map(item => {
                  const isLocked = item.item_type === 'room';
                  return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 500 }}>{item.item_name}</td>
                    <td><span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'var(--bg-main)', borderRadius: '4px', textTransform: 'capitalize' }}>{item.item_type}</span></td>
                    <td>
                      <div className="qty-control">
                        <button className="qty-btn" onClick={() => updateQty(item.id, item.quantity, item.unit_price, -1)} disabled={isLocked || isProcessing}><Minus size={12}/></button>
                        <span style={{ width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQty(item.id, item.quantity, item.unit_price, 1)} disabled={isLocked || isProcessing}><Plus size={12}/></button>
                      </div>
                    </td>
                    <td>₹{Number(item.unit_price).toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>₹{Number(item.total_price).toFixed(2)}</td>
                    <td>
                      {isLocked ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Locked</span>
                      ) : (
                        <button className="btn-icon btn-danger-icon" onClick={() => removeItem(item.id)} disabled={isProcessing}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                )})}
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
            <div className="preview-hotel-name">Amontron Hotel and Restaurant</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{new Date().toLocaleDateString()}</div>
          </div>

          <div className="preview-guest-info">
            <div className="preview-info-row strong">
              <span>{guest.full_name}</span>
            </div>
            {booking && (
              <div className="preview-info-row" style={{ color: 'var(--text-muted)' }}>
                <span>Booking ID:</span>
                <span>{booking.booking_number}</span>
              </div>
            )}
          </div>

          <div className="preview-items">
            {Object.keys(groupedItems).map(category => {
              if (groupedItems[category].length === 0) return null;
              return (
                <div key={category} className="preview-category">
                  <div className="preview-category-title" style={{ textTransform: 'capitalize' }}>{category} Charges</div>
                  {groupedItems[category].map(item => (
                    <div key={item.id} className="preview-item-row">
                      <span className="preview-item-name">{item.item_name} <span style={{color:'var(--text-muted)'}}>× {item.quantity}</span></span>
                      <span className="preview-item-price">₹{Number(item.total_price).toFixed(2)}</span>
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
                <input type="number" className="input" style={{padding: '0.25rem 0.5rem'}} value={discountValue} onChange={e => setDiscountValue(Number(e.target.value) || 0)} />
              </div>
              <div className="input-group">
                <label className="input-label" style={{fontSize: '0.75rem'}}>Tax (%)</label>
                <input type="number" className="input" style={{padding: '0.25rem 0.5rem'}} value={taxValue} onChange={e => setTaxValue(Number(e.target.value) || 0)} />
              </div>
              <div className="input-group">
                <label className="input-label" style={{fontSize: '0.75rem'}}>Advance (₹)</label>
                <input type="number" className="input" style={{padding: '0.25rem 0.5rem'}} value={advancePaid} onChange={e => setAdvancePaid(Number(e.target.value) || 0)} />
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
            <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} onClick={handleConfirmAndContinue} disabled={isProcessing}>
              Confirm & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
