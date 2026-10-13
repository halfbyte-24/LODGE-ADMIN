import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { billingService } from '../../services/billingService';
import { menuService } from '../../services/menuService';
import { 
  User, Phone, Calendar, Hash, Plus, Minus, Trash2, AlertCircle, 
  ArrowLeft, RefreshCw, Search, UtensilsCrossed, ChevronDown, CheckCircle2,
  Receipt, ShoppingBag
} from 'lucide-react';

export default function BillingWorkspace() {
  const { customerId: routeParamId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [bill, setBill] = useState(null);
  const [menu, setMenu] = useState({ items: [], categories: [], services: [], food: [], drinks: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  
  // Active Category Filter ('ALL' | category.id | 'services' | 'custom')
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
  const [dishSearchQuery, setDishSearchQuery] = useState('');
  
  const [discountValue, setDiscountValue] = useState(0);
  const [taxValue, setTaxValue] = useState(0);
  const [advancePaid, setAdvancePaid] = useState(0);

  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const billReviewRef = useRef(null);

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

      // Accurately restore tax percentage from saved tax_amount without ballooning
      const sub = Number(billData.subtotal) || 0;
      const disc = Number(billData.discount_amount) || 0;
      const savedTaxAmt = Number(billData.tax_amount) || 0;
      const taxable = Math.max(0, sub - disc);
      const computedRate = (savedTaxAmt > 0 && taxable > 0) ? (savedTaxAmt / taxable) * 100 : 0;
      setTaxValue(Math.round(computedRate * 100) / 100);

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
  const { subtotal, finalPayable, groupedItems, totalItemCount } = useMemo(() => {
    if (!bill) return { subtotal: 0, finalPayable: 0, groupedItems: {}, totalItemCount: 0 };
    
    let sub = 0;
    let count = 0;
    const grouped = { room: [], food: [], drinks: [], services: [], custom: [] };
    
    // Sort items so they don't jump around, room first
    const sortedItems = [...(bill.bill_items || [])].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));

    sortedItems.forEach(item => {
      sub += Number(item.total_price) || 0;
      count += Number(item.quantity) || 1;
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

    return { subtotal: sub, finalPayable: payable, groupedItems: grouped, totalItemCount: count };
  }, [bill, discountValue, taxValue, advancePaid]);

  // Debounced auto-save totals to database
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

  // Map of reference_id -> quantity currently in bill for live badges
  const itemQuantitiesInBill = useMemo(() => {
    const map = {};
    (bill?.bill_items || []).forEach(item => {
      if (item.reference_id) {
        map[item.reference_id] = {
          id: item.id,
          qty: Number(item.quantity) || 0,
          unitPrice: Number(item.unit_price) || 0
        };
      }
    });
    return map;
  }, [bill?.bill_items]);

  const addItem = async (item, type = 'food') => {
    if (!bill) return;

    const normalizedType = (type === 'drinks' || type === 'drink' || item.category_type === 'drink')
      ? 'drink'
      : (type === 'services' || type === 'service')
      ? 'service'
      : 'food';

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
      await refreshBill();
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
      return alert('Cannot generate an empty bill. Please add at least one charge or room item.');
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

  const scrollToBillReview = () => {
    billReviewRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Filtered menu items based on activeCategoryFilter & dishSearchQuery
  const displayedMenuItems = useMemo(() => {
    if (activeCategoryFilter === 'services') {
      return (menu.services || []).filter(s => {
        if (!dishSearchQuery.trim()) return true;
        return s.name.toLowerCase().includes(dishSearchQuery.toLowerCase());
      });
    }

    if (activeCategoryFilter === 'custom') {
      return [];
    }

    let itemsToFilter = menu.items || [];

    // Filter by category
    if (activeCategoryFilter !== 'ALL') {
      itemsToFilter = itemsToFilter.filter(i => i.category_id === activeCategoryFilter);
    }

    // Filter by search query
    if (dishSearchQuery.trim()) {
      const q = dishSearchQuery.toLowerCase();
      itemsToFilter = itemsToFilter.filter(i => 
        i.name.toLowerCase().includes(q) ||
        (i.category_name || '').toLowerCase().includes(q)
      );
    }

    return itemsToFilter;
  }, [menu.items, menu.services, activeCategoryFilter, dishSearchQuery]);

  if (loading) {
    return (
      <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto', opacity: 0.7 }} />
        <p style={{ fontWeight: 600 }}>Loading Billing Workspace...</p>
      </div>
    );
  }

  if (loadError || !bill) {
    return (
      <div style={{ padding: '1.5rem', maxWidth: '650px', margin: '1.5rem auto' }}>
        <div className="card" style={{ padding: '1.75rem', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#dc2626' }}>
            <AlertCircle size={24} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Failed to Load Billing Data</h2>
          </div>
          <p style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            {loadError?.message || 'Could not find or create a bill for this record.'}
          </p>
          {loadError?.details && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.25rem', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '4px', fontFamily: 'monospace' }}>
              {loadError.details}
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={loadBillAndMenu} style={{ minHeight: '44px' }}>
              <RefreshCw size={15} style={{ marginRight: '0.35rem' }} /> Retry
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/staff/billing')} style={{ minHeight: '44px' }}>
              <ArrowLeft size={15} style={{ marginRight: '0.35rem' }} /> Back to Billing
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/staff/new-customer')} style={{ minHeight: '44px' }}>
              New Customer Bill
            </button>
          </div>
        </div>
      </div>
    );
  }

  const guest = bill.customers || { full_name: 'Walk-in Guest', phone: '—' };
  const booking = bill.bookings;

  return (
    <div className="billing-layout">
      {/* LEFT SIDE - MAIN WORKSPACE */}
      <div className="main-workspace">
        {/* Header with Title and Invoice ID */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Billing Workspace
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Draft Invoice #{bill.invoice_number}
            </p>
          </div>
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={refreshBill}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', minHeight: '38px' }}
            title="Refresh Bill"
          >
            <RefreshCw size={14} /> Sync Bill
          </button>
        </div>

        {/* Customer & Booking Quick Banner */}
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{guest.full_name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Phone size={12} style={{ display: 'inline', marginRight: 4 }} />
                  {guest.phone || 'No phone'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {booking ? (
                <span style={{ 
                  background: '#dbeafe', 
                  color: '#1e40af', 
                  padding: '0.3rem 0.65rem', 
                  borderRadius: '9999px', 
                  fontSize: '0.78rem', 
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  <Calendar size={13} /> Room Guest ({booking.booking_number})
                </span>
              ) : (
                <span style={{ 
                  background: '#fef3c7', 
                  color: '#92400e', 
                  padding: '0.3rem 0.65rem', 
                  borderRadius: '9999px', 
                  fontSize: '0.78rem', 
                  fontWeight: 600 
                }}>
                  Restaurant Only
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ADD CHARGES SECTION - Mobile First Menu Experience */}
        <div className="card" style={{ padding: '1.25rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 className="card-title" style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UtensilsCrossed size={18} /> Menu &amp; Charges
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Tap any item to add to bill
            </div>
          </div>

          {/* Dish Search Input */}
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input" 
              placeholder="Search food, beverage, or service..." 
              value={dishSearchQuery}
              onChange={e => setDishSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.25rem', width: '100%', minHeight: '42px', fontSize: '0.9rem' }}
            />
            {dishSearchQuery && (
              <button 
                type="button" 
                onClick={() => setDishSearchQuery('')}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Dynamic Category Filter Pills */}
          <div className="category-pills-bar" style={{ marginBottom: '1rem' }}>
            <button 
              type="button"
              className={`category-pill ${activeCategoryFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveCategoryFilter('ALL')}
            >
              All Dishes ({(menu.items || []).length})
            </button>
            {(menu.categories || []).map(cat => {
              const count = (menu.items || []).filter(i => i.category_id === cat.id).length;
              return (
                <button
                  type="button"
                  key={cat.id}
                  className={`category-pill ${activeCategoryFilter === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveCategoryFilter(cat.id)}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
            <button 
              type="button"
              className={`category-pill ${activeCategoryFilter === 'services' ? 'active' : ''}`}
              onClick={() => setActiveCategoryFilter('services')}
            >
              Services ({(menu.services || []).length})
            </button>
            <button 
              type="button"
              className={`category-pill ${activeCategoryFilter === 'custom' ? 'active' : ''}`}
              onClick={() => setActiveCategoryFilter('custom')}
            >
              + Custom Item
            </button>
          </div>

          {/* Category Content: Custom Charge Form vs Menu Items Grid */}
          {activeCategoryFilter === 'custom' ? (
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Add Custom Charge</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Add items not listed in the regular restaurant menu (e.g. Special order, Room service fee, Extra laundry).
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Item Description *</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={customName} 
                    onChange={e => setCustomName(e.target.value)} 
                    placeholder="e.g. Special Cooking Request" 
                    style={{ minHeight: '44px' }}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Amount (₹) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="1" 
                    className="input" 
                    value={customPrice} 
                    onChange={e => setCustomPrice(e.target.value)} 
                    placeholder="0.00" 
                    style={{ minHeight: '44px' }}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Quantity</label>
                  <input 
                    type="number" 
                    className="input" 
                    value={customQty} 
                    onChange={e => setCustomQty(e.target.value)} 
                    min="1" 
                    style={{ minHeight: '44px' }}
                  />
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={addCustomCharge} 
                disabled={isProcessing}
                style={{ width: '100%', minHeight: '44px', fontWeight: 600 }}
              >
                + Add Custom Charge to Bill
              </button>
            </div>
          ) : (
            <div className="charge-items-grid">
              {displayedMenuItems.map(item => {
                const inBill = itemQuantitiesInBill[item.id];
                const isService = activeCategoryFilter === 'services';

                return (
                  <div 
                    key={item.id} 
                    className="charge-item-card" 
                    onClick={() => addItem(item, isService ? 'service' : item.category_type || 'food')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { 
                      if (e.key === 'Enter' || e.key === ' ') { 
                        e.preventDefault(); 
                        addItem(item, isService ? 'service' : item.category_type || 'food'); 
                      } 
                    }}
                    title={`Tap to add ${item.name} to bill`}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderColor: inBill ? 'var(--primary-color)' : 'var(--border-color)',
                      background: inBill ? '#f8faff' : 'var(--bg-card)',
                      boxShadow: inBill ? '0 2px 6px rgba(37, 99, 235, 0.12)' : 'var(--shadow-sm)'
                    }}
                  >
                    {/* Live in-bill quantity badge */}
                    {inBill && (
                      <span style={{ 
                        position: 'absolute', 
                        top: '6px', 
                        right: '6px', 
                        background: 'var(--primary-color)', 
                        color: 'white', 
                        fontSize: '0.72rem', 
                        fontWeight: 800,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '9999px',
                        zIndex: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        {inBill.qty} in bill
                      </span>
                    )}

                    {/* Thumbnail Image */}
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        style={{ 
                          width: '100%', 
                          height: '75px', 
                          objectFit: 'cover', 
                          borderRadius: 'var(--radius-md)', 
                          marginBottom: '0.5rem' 
                        }} 
                      />
                    ) : (
                      <div style={{ 
                        width: '100%', 
                        height: '70px', 
                        background: '#f1f5f9', 
                        borderRadius: 'var(--radius-md)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        marginBottom: '0.5rem',
                        color: '#94a3b8' 
                      }}>
                        <UtensilsCrossed size={22} />
                      </div>
                    )}

                    {/* Dish Name */}
                    <div className="charge-item-name" style={{ marginBottom: '0.25rem', lineHeight: 1.25, fontWeight: 700 }}>
                      {item.name}
                    </div>

                    {/* Veg indicator & Category Name */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                      {item.is_veg !== undefined && (
                        <span style={{ 
                          fontSize: '0.65rem', 
                          fontWeight: 700, 
                          color: item.is_veg ? '#059669' : '#dc2626' 
                        }}>
                          {item.is_veg ? '● VEG' : '● NON-VEG'}
                        </span>
                      )}
                      {item.category_name && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          • {item.category_name}
                        </span>
                      )}
                    </div>

                    {/* Price and Instant Tap Button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.35rem', borderTop: '1px solid #f1f5f9' }}>
                      <div className="charge-item-price" style={{ fontSize: '0.95rem', fontWeight: 800 }}>
                        ₹{Number(item.price).toFixed(2)}
                      </div>
                      <div style={{ 
                        background: inBill ? 'var(--primary-color)' : '#eff6ff', 
                        color: inBill ? 'white' : 'var(--primary-color)', 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.85rem'
                      }}>
                        +
                      </div>
                    </div>
                  </div>
                );
              })}

              {displayedMenuItems.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem 1rem' }}>
                  No available items found in this category.
                </div>
              )}
            </div>
          )}
        </div>

        {/* BILL ITEMS REVIEW SECTION */}
        <div className="card" ref={billReviewRef} style={{ padding: '1.25rem' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 className="card-title" style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShoppingBag size={18} /> Bill Items ({totalItemCount})
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Review items, quantities, or remove charges
              </div>
            </div>
            {totalItemCount > 0 && (
              <span style={{ fontWeight: 800, color: 'var(--primary-color)', fontSize: '1.1rem' }}>
                ₹{subtotal.toFixed(2)}
              </span>
            )}
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
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(!bill.bill_items || bill.bill_items.length === 0) && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                      No items added yet. Tap items from the menu above to build the bill.
                    </td>
                  </tr>
                )}
                {(bill.bill_items || []).map(item => {
                  const isLocked = item.item_type === 'room';
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ fontWeight: 600, padding: '0.75rem 0.5rem' }}>
                        {item.item_name}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem', background: '#f1f5f9', borderRadius: '4px', textTransform: 'capitalize', fontWeight: 600 }}>
                          {item.item_type}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div className="qty-control" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <button 
                            type="button"
                            className="qty-btn" 
                            onClick={() => updateQty(item.id, item.quantity, item.unit_price, -1)} 
                            disabled={isLocked || isProcessing}
                            aria-label="Decrease quantity"
                            style={{ minWidth: '38px', minHeight: '38px', borderRadius: '4px' }}
                          >
                            <Minus size={13}/>
                          </button>
                          <span style={{ width: '28px', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                            {item.quantity}
                          </span>
                          <button 
                            type="button"
                            className="qty-btn" 
                            onClick={() => updateQty(item.id, item.quantity, item.unit_price, 1)} 
                            disabled={isLocked || isProcessing}
                            aria-label="Increase quantity"
                            style={{ minWidth: '38px', minHeight: '38px', borderRadius: '4px' }}
                          >
                            <Plus size={13}/>
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', whiteSpace: 'nowrap' }}>
                        ₹{Number(item.unit_price).toFixed(2)}
                      </td>
                      <td style={{ fontWeight: 700, padding: '0.75rem 0.5rem', whiteSpace: 'nowrap' }}>
                        ₹{Number(item.total_price).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>
                        {isLocked ? (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Room</span>
                        ) : (
                          <button 
                            type="button"
                            className="btn-icon btn-danger-icon" 
                            onClick={() => removeItem(item.id)} 
                            disabled={isProcessing}
                            aria-label={`Remove ${item.item_name}`}
                            style={{ minWidth: '38px', minHeight: '38px' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - LIVE BILL PREVIEW & SUMMARY */}
      <div className="live-preview-panel">
        <div className="live-preview-content">
          <div className="preview-header">
            <div className="preview-title">Live Bill Preview</div>
            <div className="preview-hotel-name">Amontron Hotel and Restaurant</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date().toLocaleDateString()}</div>
          </div>

          <div className="preview-guest-info">
            <div className="preview-info-row strong">
              <span>{guest.full_name}</span>
            </div>
            {booking && (
              <div className="preview-info-row" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <span>Booking ID:</span>
                <span>{booking.booking_number}</span>
              </div>
            )}
          </div>

          {/* Grouped Items List */}
          <div className="preview-items" style={{ flex: 1, overflowY: 'auto' }}>
            {Object.keys(groupedItems).map(category => {
              if (groupedItems[category].length === 0) return null;
              return (
                <div key={category} className="preview-category">
                  <div className="preview-category-title" style={{ textTransform: 'capitalize' }}>
                    {category} Charges
                  </div>
                  {groupedItems[category].map(item => (
                    <div key={item.id} className="preview-item-row">
                      <span className="preview-item-name">
                        {item.item_name} <span style={{ color: 'var(--text-muted)' }}>× {item.quantity}</span>
                      </span>
                      <span className="preview-item-price">₹{Number(item.total_price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Totals & Tax / Discount Adjustments */}
          <div className="preview-totals">
            <div className="adjustments-grid" style={{ marginTop: 0, marginBottom: '0.75rem', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <div className="input-group">
                <label className="input-label" style={{ fontSize: '0.72rem' }}>Discount (₹)</label>
                <input 
                  type="number" 
                  className="input" 
                  inputMode="decimal"
                  style={{ padding: '0.35rem 0.4rem', fontSize: '0.85rem', minHeight: '38px' }} 
                  value={discountValue} 
                  onChange={e => setDiscountValue(Math.max(0, Number(e.target.value) || 0))} 
                />
              </div>
              <div className="input-group">
                <label className="input-label" style={{ fontSize: '0.72rem' }}>Tax (%)</label>
                <input 
                  type="number" 
                  className="input" 
                  inputMode="decimal"
                  style={{ padding: '0.35rem 0.4rem', fontSize: '0.85rem', minHeight: '38px' }} 
                  value={taxValue} 
                  onChange={e => setTaxValue(Math.max(0, Number(e.target.value) || 0))} 
                />
              </div>
              <div className="input-group">
                <label className="input-label" style={{ fontSize: '0.72rem' }}>Advance (₹)</label>
                <input 
                  type="number" 
                  className="input" 
                  inputMode="decimal"
                  style={{ padding: '0.35rem 0.4rem', fontSize: '0.85rem', minHeight: '38px' }} 
                  value={advancePaid} 
                  onChange={e => setAdvancePaid(Math.max(0, Number(e.target.value) || 0))} 
                />
              </div>
            </div>

            <div className="preview-total-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discountValue > 0 && (
              <div className="preview-total-row" style={{ color: '#16a34a' }}>
                <span>Discount</span>
                <span>- ₹{discountValue.toFixed(2)}</span>
              </div>
            )}
            {taxValue > 0 && (
              <div className="preview-total-row">
                <span>Tax ({taxValue}%)</span>
                <span>+ ₹{(Math.max(0, subtotal - discountValue) * (taxValue / 100)).toFixed(2)}</span>
              </div>
            )}
            {advancePaid > 0 && (
              <div className="preview-total-row" style={{ color: '#0284c7' }}>
                <span>Advance Paid</span>
                <span>- ₹{advancePaid.toFixed(2)}</span>
              </div>
            )}
            
            <div className="preview-grand-total" style={{ borderTop: '2px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <span>FINAL AMOUNT</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>₹{finalPayable.toFixed(2)}</span>
            </div>
          </div>
          
          <div style={{ padding: '1rem', flexShrink: 0, borderTop: '1px solid var(--border-color)' }}>
            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 700, minHeight: '48px' }} 
              onClick={handleConfirmAndContinue} 
              disabled={isProcessing}
            >
              Confirm &amp; Continue to Invoice
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM BILLING BAR */}
      <aside className="mobile-billing-bar" aria-label="Mobile billing checkout bar">
        <div className="bar-total">
          <span className="bar-label">Total ({totalItemCount} items)</span>
          <span className="bar-amount">₹{finalPayable.toFixed(2)}</span>
        </div>
        <div className="bar-actions">
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={scrollToBillReview}
            style={{ color: '#f8fafc', borderColor: '#475569', minHeight: '44px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
          >
            Review ({totalItemCount})
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleConfirmAndContinue}
            disabled={isProcessing || totalItemCount === 0}
            style={{ minHeight: '44px', padding: '0.4rem 0.9rem', fontSize: '0.85rem', fontWeight: 700 }}
          >
            Confirm &amp; Pay
          </button>
        </div>
      </aside>
    </div>
  );
}
