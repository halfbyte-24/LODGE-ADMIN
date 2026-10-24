import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Clock, CheckCircle2, Phone, Calendar, MessageCircle, ShoppingBag, Plus, Minus, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { MENU_ITEMS, MENU_CATEGORIES } from '../data/hotelData'; // Fallbacks
import { HOTEL_INFO } from '../config/hotelInfo';
import { contactRoutingService } from '../services/contactRoutingService';
import './RestaurantPage.css';

const DEFAULT_RESTAURANT_CATEGORIES = [
  'All',
  'Breakfast',
  'Bengali Cuisine',
  'Indian Cuisine',
  'Rice & Biryani',
  'Snacks',
  'Drinks'
];

// Helper to map hotelData MENU_ITEMS into the requested categories
function mapMenuItemCategory(cat) {
  if (!cat) return 'Indian Cuisine';
  const c = cat.toLowerCase();
  if (c.includes('breakfast')) return 'Breakfast';
  if (c.includes('biryani') || c.includes('rice')) return 'Rice & Biryani';
  if (c.includes('starter') || c.includes('snack') || c.includes('chinese')) return 'Snacks';
  if (c.includes('beverage') || c.includes('drink')) return 'Drinks';
  if (c.includes('bengali') || c.includes('mutton kasha') || c.includes('rosogolla') || c.includes('luchi')) return 'Bengali Cuisine';
  if (c.includes('main course') || c.includes('dessert') || c.includes('tandoor')) return 'Indian Cuisine';
  return cat;
}

export default function RestaurantPage({ onOpenBooking }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [menuItems, setMenuItems] = useState(() => 
    MENU_ITEMS.map(item => ({
      ...item,
      normalizedCategory: mapMenuItemCategory(item.category)
    }))
  );
  const [categories, setCategories] = useState(DEFAULT_RESTAURANT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [menuError, setMenuError] = useState(null);
  
  // Table reservation
  const [reserved, setReserved] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [partySize, setPartySize] = useState('2');
  const [diningTime, setDiningTime] = useState('Dinner (08:00 PM)');

  // Item Selection / Order Cart
  const [cart, setCart] = useState({});
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderCustomerName, setOrderCustomerName] = useState('');
  const [orderLocation, setOrderLocation] = useState('Dine-In Table');
  const [orderNotes, setOrderNotes] = useState('');

  useEffect(() => {
    async function fetchMenu() {
      setLoading(true);
      setMenuError(null);
      try {
        if (!isSupabaseConfigured || !supabase) {
          throw new Error('Supabase not configured');
        }

        const { data, error } = await supabase
          .from('menu_items')
          .select('*, menu_categories(id, name, type)')
          .eq('is_available', true)
          .order('name', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const mapped = data.map(item => {
            const catName = item.menu_categories?.name || item.category_name || item.category || '';
            return {
              ...item,
              price: Number(item.price || 0),
              isVeg: item.is_veg,
              available: item.is_available,
              category_name: catName,
              normalizedCategory: mapMenuItemCategory(catName)
            };
          });
          setMenuItems(mapped);

          const dbCats = [...new Set(mapped.map(m => m.normalizedCategory))].filter(Boolean);
          const merged = ['All', ...DEFAULT_RESTAURANT_CATEGORIES.slice(1).filter(c => dbCats.includes(c)), ...dbCats.filter(c => !DEFAULT_RESTAURANT_CATEGORIES.includes(c))];
          setCategories([...new Set(merged)]);
        } else {
          setMenuItems(MENU_ITEMS.map(item => ({ ...item, price: Number(item.price || 0), normalizedCategory: mapMenuItemCategory(item.category) })));
        }
      } catch (err) {
        console.warn('RestaurantPage: Supabase fetch error, using local fallback:', err.message);
        setMenuError('Could not load live menu. Showing saved menu data.');
        setMenuItems(MENU_ITEMS.map(item => ({ ...item, price: Number(item.price || 0), normalizedCategory: mapMenuItemCategory(item.category) })));
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, []);

  const addToCart = (item) => {
    setCart(prev => {
      const currentQty = prev[item.id]?.quantity || 0;
      return {
        ...prev,
        [item.id]: {
          id: item.id,
          name: item.name,
          price: Number(item.price || 0),
          quantity: currentQty + 1
        }
      };
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const currentQty = prev[itemId]?.quantity || 0;
      if (currentQty <= 1) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          quantity: currentQty - 1
        }
      };
    });
  };

  const cartList = Object.values(cart);
  const totalCartCount = cartList.reduce((sum, i) => sum + i.quantity, 0);
  const totalCartPrice = cartList.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  const handleSendWhatsAppOrder = async () => {
    if (cartList.length === 0) return;

    const res = await contactRoutingService.getRestaurantWhatsAppAction({
      items: cartList,
      customerName: orderCustomerName || guestName || 'Guest',
      tableOrRoom: orderLocation,
      specialNotes: orderNotes
    });

    if (res.configured && res.url) {
      window.open(res.url, '_blank', 'noopener,noreferrer');
      setShowOrderModal(false);
    } else {
      alert(res.errorMessage || 'Restaurant Orders WhatsApp recipient is not configured in Admin Settings. Please call the hotel at +91 94334 24718.');
    }
  };

  const handleTableWhatsAppEnquiry = async () => {
    const res = await contactRoutingService.getRestaurantWhatsAppAction({
      items: [],
      customerName: guestName || 'Guest',
      tableOrRoom: 'Table Reservation',
      specialNotes: `Table request for ${partySize} guests at ${diningTime}.`
    });

    if (res.configured && res.url) {
      window.open(res.url, '_blank', 'noopener,noreferrer');
    } else {
      alert(res.errorMessage || 'Restaurant Orders WhatsApp recipient is not configured in Admin Settings. Please call the hotel at +91 94334 24718.');
    }
  };

  const handleTableReserve = (e) => {
    e.preventDefault();
    setReserved(true);
  };

  const filteredItems = (Array.isArray(menuItems) ? menuItems : []).filter(item => {
    if (item.available === false || item.is_available === false) return false;
    if (selectedCategory === 'All') return true;
    const cat = item.normalizedCategory || item.category;
    return cat?.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="bengali-page">
      {/* Clean Compact Page Header */}
      <section className="bengali-page-hero">
        <div className="section-wrapper text-center">
          <span className="page-eyebrow">TASTE THE TRADITION</span>
          <h1 className="page-title">Authentic Bengali Flavours</h1>
          <div className="page-title-line" />
          <p className="page-description">
            Experience delightful multi-cuisine dining near Kamarpukur. From fragrant Indian biryanis 
            and smoky tandoor specialties to comforting Bengali thalis.
          </p>
        </div>
      </section>

      {/* Timings */}
      <section className="editorial-timings-section">
        <div className="section-wrapper">
          <div className="timings-grid">
            <div className="editorial-timing-box">
              <Clock size={24} className="text-terracotta mb-3" />
              <h4>Breakfast</h4>
              <p>{HOTEL_INFO.timings.restaurantBreakfast}</p>
              <span>Buffet & A La Carte</span>
            </div>
            <div className="editorial-timing-box">
              <Clock size={24} className="text-terracotta mb-3" />
              <h4>Lunch</h4>
              <p>{HOTEL_INFO.timings.restaurantLunch}</p>
              <span>Thali & Multi-Cuisine</span>
            </div>
            <div className="editorial-timing-box">
              <Clock size={24} className="text-terracotta mb-3" />
              <h4>Dinner</h4>
              <p>{HOTEL_INFO.timings.restaurantDinner}</p>
              <span>Tandoor & Fine Dining</span>
            </div>
            <div className="editorial-timing-box">
              <UtensilsCrossed size={24} className="text-terracotta mb-3" />
              <h4>Room Service</h4>
              <p>24 Hours Active</p>
              <span>Bedside Delivery</span>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Menu Layout */}
      <section className="editorial-menu-section" style={{ position: 'relative', paddingBottom: totalCartCount > 0 ? '120px' : '60px' }}>
        <img src="/images/art6.jpg" className="menu-decor left-decor" alt="Folk Decor" />
        <img src="/images/art3.jpg" className="menu-decor right-decor" alt="Alpana Motif" />
        
        <div className="section-wrapper relative z-2">
          {menuError && (
            <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#92400e' }}>
              ⚠️ {menuError}
            </div>
          )}

          <div className="bengali-category-pills" style={{marginBottom: '50px'}}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`bengali-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-10" style={{ padding: '3rem 0', opacity: 0.7 }}>
              <UtensilsCrossed size={32} style={{ margin: '0 auto 0.75rem auto', display: 'block', opacity: 0.5 }} />
              Loading menu from kitchen…
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-10" style={{ padding: '3rem 0', opacity: 0.7 }}>
              <UtensilsCrossed size={40} style={{ margin: '0 auto 1rem auto', display: 'block', opacity: 0.35 }} />
              <p>No items currently available in this category.</p>
            </div>
          ) : (
            <div className="editorial-menu-grid">
              {filteredItems.map((item) => {
                const itemQty = cart[item.id]?.quantity || 0;
                return (
                  <div key={item.id} className="editorial-menu-item" style={{ position: 'relative' }}>
                    <div className="menu-item-text">
                      <div className="menu-item-header">
                        <h3 className="item-name">
                          {item.name}
                          {(item.isVeg !== undefined || item.is_veg !== undefined) && (
                            <span className={`diet-dot ${(item.isVeg ?? item.is_veg) ? 'veg' : 'non-veg'}`}></span>
                          )}
                        </h3>
                        <div className="menu-item-dots"></div>
                        <span className="item-price">₹{Number(item.price).toFixed(0)}</span>
                      </div>
                      <p className="item-desc">{item.description}</p>
                      
                      {/* Quantity Selector / Add to Order Button */}
                      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {itemQty === 0 ? (
                          <button
                            type="button"
                            onClick={() => addToCart(item)}
                            className="btn-outline-gold"
                            style={{ padding: '4px 12px', fontSize: '0.8rem', cursor: 'pointer', background: 'transparent', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Plus size={13} /> Add to Order
                          </button>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', background: '#fdf6e7', border: '1px solid var(--accent-gold, #c68a4c)', borderRadius: '4px', overflow: 'hidden' }}>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              style={{ border: 'none', background: 'transparent', padding: '4px 8px', cursor: 'pointer', color: 'var(--accent-terracotta, #b83d26)' }}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={13} />
                            </button>
                            <span style={{ padding: '0 8px', fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>
                              {itemQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(item)}
                              style={{ border: 'none', background: 'transparent', padding: '4px 8px', cursor: 'pointer', color: 'var(--accent-terracotta, #b83d26)' }}
                              aria-label="Increase quantity"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {(item.image || item.image_url) && (
                      <div className="menu-item-thumb">
                        <img src={item.image_url || item.image} alt={item.name} loading="lazy" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Cart & WhatsApp Order Bar */}
        {totalCartCount > 0 && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            width: '90%',
            maxWidth: '650px',
            background: '#1a1412',
            color: '#fff',
            borderRadius: '50px',
            padding: '12px 24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            border: '1px solid rgba(212,175,55,0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'var(--accent-terracotta, #b83d26)', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '0.95rem', display: 'block' }}>{totalCartCount} item{totalCartCount > 1 ? 's' : ''} selected</strong>
                <span style={{ fontSize: '0.82rem', color: '#e2b25e' }}>Estimated: ₹{totalCartPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowOrderModal(true)}
                className="btn-terracotta"
                style={{
                  borderRadius: '30px',
                  padding: '8px 20px',
                  fontSize: '0.88rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <MessageCircle size={16} /> Order via WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setCart({})}
                title="Clear selection"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* WhatsApp Order Details Dialog */}
      {showOrderModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            maxWidth: '480px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            border: '1px solid #e2e8f0',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                Confirm Restaurant Order
              </h3>
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', marginBottom: '16px', maxHeight: '140px', overflowY: 'auto' }}>
              <strong style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                Selected Items ({totalCartCount}):
              </strong>
              {cartList.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', padding: '3px 0' }}>
                  <span>{item.quantity}x {item.name}</span>
                  <strong>₹{item.price * item.quantity}</strong>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '8px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Total Estimated</span>
                <span style={{ color: 'var(--accent-terracotta, #b83d26)' }}>₹{totalCartPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Customer Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={orderCustomerName}
                  onChange={(e) => setOrderCustomerName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Order Type / Table or Room</label>
                <input
                  type="text"
                  placeholder="Enter table, room number or takeaway"
                  value={orderLocation}
                  onChange={(e) => setOrderLocation(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Special Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Describe your enquiry or special requests"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="btn-outline-gold"
                style={{ flex: 1, padding: '10px' }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSendWhatsAppOrder}
                className="btn-terracotta"
                style={{ flex: 2, padding: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <MessageCircle size={16} /> Send to WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Reservation - Editorial */}
      <section className="editorial-reservation-section">
        <div className="section-wrapper">
          <div className="editorial-reservation-split">
            <div className="reservation-info">
              <span className="page-eyebrow">RESERVE A TABLE</span>
              <h2 className="section-title">Table Reservations</h2>
              <p className="res-desc mt-4">
                Planning a special lunch, business dinner, or family gathering near Kamarpukur? Reserve your preferred table in advance 
                and enjoy priority hospitality.
              </p>
              <div className="res-phone mt-6">
                <Phone size={20} className="text-terracotta mr-2" />
                <span>Call front desk: <strong className="ml-2">{HOTEL_INFO.phoneDisplay || HOTEL_INFO.phone}</strong></span>
              </div>
            </div>

            <div className="reservation-form-container">
              {!reserved ? (
                <form onSubmit={handleTableReserve} className="editorial-form">
                  <div className="input-group">
                    <label>Guest Name *</label>
                    <input type="text" required placeholder="Enter your full name" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                  </div>
                  <div className="form-row-2">
                    <div className="input-group">
                      <label>Guests</label>
                      <select value={partySize} onChange={(e) => setPartySize(e.target.value)}>
                        <option value="1">1 Person</option>
                        <option value="2">2 Persons</option>
                        <option value="4">4 Persons</option>
                        <option value="6">6+ Persons</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Preferred Time</label>
                      <select value={diningTime} onChange={(e) => setDiningTime(e.target.value)}>
                        <option value="Breakfast">Breakfast</option>
                        <option value="Lunch">Lunch</option>
                        <option value="Dinner">Dinner</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
                    <button type="submit" className="btn-terracotta" style={{ flex: 1 }}>
                      <Calendar size={18} className="mr-2" /> CONFIRM REQUEST
                    </button>
                    <button
                      type="button"
                      onClick={handleTableWhatsAppEnquiry}
                      className="btn-outline-gold"
                      style={{ padding: '0.65rem 1rem', cursor: 'pointer', background: 'transparent', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <MessageCircle size={16} /> WhatsApp Enquiry
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-10">
                  <CheckCircle2 size={50} className="text-terracotta mx-auto mb-4" />
                  <h3 className="section-title">Request Received!</h3>
                  <p className="text-secondary mt-2">Thank you, {guestName}. Our restaurant team will reserve your table.</p>
                  <button
                    type="button"
                    onClick={handleTableWhatsAppEnquiry}
                    className="btn-outline-gold mt-4"
                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <MessageCircle size={16} /> Also Send via WhatsApp
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
