import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, ArrowRight } from 'lucide-react';
import { MENU_ITEMS, MENU_CATEGORIES } from '../data/hotelData';
import './DiningSection.css';

export default function DiningSection() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredItems = (selectedCategory === 'All'
    ? MENU_ITEMS
    : MENU_ITEMS.filter(item => item.category === selectedCategory)
  ).slice(0, 6);

  return (
    <section className="bengali-dining-preview">
      <div className="section-wrapper">
        <div className="dining-header">
          <span className="section-eyebrow">TASTE THE TRADITION</span>
          <h2 className="section-title">Authentic Bengali Flavours</h2>
          <div className="section-title-line" />
          <p className="dining-description">
            Relish fresh aromas and rich authentic flavors crafted by our experienced culinary team. 
            A journey of taste that celebrates the culinary heritage of Bengal.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="dining-decoration left-deco">
          <img src="/images/art6.jpg" alt="Bengali Food Decoration" />
        </div>
        <div className="dining-decoration right-deco">
          <img src="/images/art7.jpg" alt="Alpana Motif" />
        </div>

        <div className="menu-category-pills">
          {MENU_CATEGORIES.slice(0, 6).map((cat) => (
            <button
              key={cat}
              className={`menu-pill-btn ${selectedCategory === cat ? 'pill-btn-active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="bengali-food-grid">
          {filteredItems.map((item) => (
            <div key={item.id} className="bengali-food-card">
              <div className="food-card-media">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  loading="lazy"
                />
                <div className={`diet-indicator ${item.isVeg ? 'diet-veg' : 'diet-nonveg'}`}>
                  <span className="diet-dot" />
                </div>
              </div>

              <div className="food-card-details">
                <div className="food-title-row">
                  <h4 className="food-name">{item.name}</h4>
                  <span className="food-price">₹{item.price}</span>
                </div>
                <p className="food-desc">{item.description}</p>
                <div className="food-cat-tag">{item.category}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="dining-footer-cta">
          <Link to="/restaurant" className="btn-outline-gold">
            <UtensilsCrossed size={16} style={{marginRight: '8px'}} />
            <span>VIEW COMPLETE MENU</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
