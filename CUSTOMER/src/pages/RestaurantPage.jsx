import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Clock, CheckCircle2, Phone, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { MENU_ITEMS, MENU_CATEGORIES } from '../data/hotelData'; // Fallbacks
import { HOTEL_INFO } from '../config/hotelInfo';
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

export default function RestaurantPage({ onOpenBooking }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_RESTAURANT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  
  const [reserved, setReserved] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [partySize, setPartySize] = useState('2');
  const [diningTime, setDiningTime] = useState('Dinner (08:00 PM)');

  useEffect(() => {
    async function fetchMenu() {
      try {
        const { data, error } = await supabase.from('menu_items').select('*');
        if (error) throw error;
        
        if (data && data.length > 0) {
          setMenuItems(data);
          const uniqueCats = ['All', ...new Set(data.map(item => item.category).filter(Boolean))];
          setCategories(uniqueCats.length > 1 ? uniqueCats : DEFAULT_RESTAURANT_CATEGORIES);
        } else {
          setMenuItems(MENU_ITEMS);
        }
      } catch (err) {
        setMenuItems(MENU_ITEMS);
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, []);

  const filteredItems = (Array.isArray(menuItems) ? menuItems : []).filter(item => {
    if (selectedCategory === 'All') return true;
    return item.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  const handleTableReserve = (e) => {
    e.preventDefault();
    setReserved(true);
  };

  return (
    <div className="bengali-page">
      {/* Editorial Page Hero */}
      <section className="bengali-page-hero editorial-hero">
        <div className="hero-texture-overlay"></div>
        <img src="/images/art4.jpg" className="editorial-hero-bg" alt="Bengali Food Art" />
        
        <div className="section-wrapper text-center relative z-2">
          <span className="page-eyebrow">TASTE THE TRADITION</span>
          <h1 className="page-title">Authentic Bengali Flavours</h1>
          <p className="page-description">
            Experience delightful multi-cuisine dining. From fragrant Indian biryanis 
            and smoky tandoor specialties to comforting breakfast spreads.
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
      <section className="editorial-menu-section">
        <img src="/images/art6.jpg" className="menu-decor left-decor" alt="Folk Decor" />
        <img src="/images/art3.jpg" className="menu-decor right-decor" alt="Alpana Motif" />
        
        <div className="section-wrapper relative z-2">
          <div className="bengali-category-pills" style={{marginBottom: '60px'}}>
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
            <div className="text-center py-10">Loading menu...</div>
          ) : (
            <div className="editorial-menu-grid">
              {filteredItems.map((item) => (
                <div key={item.id} className="editorial-menu-item">
                  <div className="menu-item-text">
                    <div className="menu-item-header">
                      <h3 className="item-name">
                        {item.name}
                        {item.isVeg !== undefined && (
                          <span className={`diet-dot ${item.isVeg ? 'veg' : 'non-veg'}`}></span>
                        )}
                      </h3>
                      <div className="menu-item-dots"></div>
                      {item.available === false ? (
                        <span className="item-unavailable-badge">Currently Unavailable</span>
                      ) : (
                        <span className="item-price">₹{item.price}</span>
                      )}
                    </div>
                    <p className="item-desc">{item.description}</p>
                  </div>
                  {item.image && (
                    <div className="menu-item-thumb">
                      <img src={item.image_url || item.image} alt={item.name} loading="lazy" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Table Reservation - Editorial */}
      <section className="editorial-reservation-section">
        <div className="section-wrapper">
          <div className="editorial-reservation-split">
            <div className="reservation-info">
              <span className="page-eyebrow">RESERVE A TABLE</span>
              <h2 className="section-title">Table Reservations</h2>
              <p className="res-desc mt-4">
                Planning a special lunch, business dinner, or family gathering? Reserve your preferred table in advance 
                and enjoy priority hospitality.
              </p>
              <div className="res-phone mt-6">
                <Phone size={20} className="text-terracotta mr-2" />
                <span>Call us: <strong className="ml-2">{HOTEL_INFO.phoneDisplay || HOTEL_INFO.phone}</strong></span>
              </div>
            </div>

            <div className="reservation-form-container">
              {!reserved ? (
                <form onSubmit={handleTableReserve} className="editorial-form">
                  <div className="input-group">
                    <label>Guest Name *</label>
                    <input type="text" required placeholder="e.g. Amit Banerjee" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
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
                  <button type="submit" className="btn-terracotta w-100 mt-6">
                    <Calendar size={18} className="mr-2" /> CONFIRM REQUEST
                  </button>
                </form>
              ) : (
                <div className="text-center py-10">
                  <CheckCircle2 size={50} className="text-terracotta mx-auto mb-4" />
                  <h3 className="section-title">Request Received!</h3>
                  <p className="text-secondary mt-2">Thank you, {guestName}. Our captain will reserve your table.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
