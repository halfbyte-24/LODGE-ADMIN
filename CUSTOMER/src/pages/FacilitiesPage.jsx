import React from 'react';
import { Wind, Wifi, UtensilsCrossed, Clock, Sparkles, Car, Zap, Users, ShieldCheck, Droplets, ArrowRight } from 'lucide-react';
import { FACILITIES } from '../data/hotelData';
import './FacilitiesPage.css';

export default function FacilitiesPage({ onOpenBooking }) {
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Wind': return <Wind size={28} className="text-terracotta" />;
      case 'Wifi': return <Wifi size={28} className="text-terracotta" />;
      case 'UtensilsCrossed': return <UtensilsCrossed size={28} className="text-terracotta" />;
      case 'Clock': return <Clock size={28} className="text-terracotta" />;
      case 'Car': return <Car size={28} className="text-terracotta" />;
      case 'Zap': return <Zap size={28} className="text-terracotta" />;
      case 'Users': return <Users size={28} className="text-terracotta" />;
      case 'ShieldCheck': return <ShieldCheck size={28} className="text-terracotta" />;
      case 'Droplets': return <Droplets size={28} className="text-terracotta" />;
      default: return <Sparkles size={28} className="text-terracotta" />;
    }
  };

  return (
    <div className="bengali-page">
      {/* Editorial Page Hero */}
      <section className="bengali-page-hero editorial-hero">
        <div className="hero-texture-overlay"></div>
        <img src="/images/art7.jpg" className="editorial-hero-bg" alt="Alpana Motif" />
        
        <div className="section-wrapper text-center relative z-2">
          <span className="page-eyebrow">HOSPITALITY & CONVENIENCE</span>
          <h1 className="page-title">Facilities & Amenities</h1>
          <p className="page-description">
            Thoughtfully planned amenities and seamless services ensuring every comfort and convenience throughout your stay.
          </p>
        </div>
      </section>

      {/* Facilities Grid */}
      <section className="editorial-facilities-section">
        <div className="section-wrapper">
          <div className="editorial-facilities-grid">
            {FACILITIES.map((fac, idx) => (
              <div key={fac.id} className="editorial-facility-card">
                <div className="facility-icon-wrap">
                  {getIcon(fac.icon)}
                  {/* Small decorative motif overlay */}
                  <img src="/images/art3.jpg" className="facility-decor" alt=""/>
                </div>
                <h3 className="facility-title">{fac.name}</h3>
                <p className="facility-detail">{fac.description}</p>
                <div className="facility-number">{(idx + 1).toString().padStart(2, '0')}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights Strip */}
      <section className="editorial-cta-banner">
        <img src="/images/art1.jpg" className="cta-bg-art" alt=""/>
        <div className="cta-overlay"></div>
        
        <div className="section-wrapper text-center relative z-2">
          <h2 className="cta-heading">Need a Custom Setup for Your Group?</h2>
          <p className="cta-desc">Contact our front desk team for conference arrangements, group bookings, or special dining requests.</p>
          <div className="cta-actions">
            <button className="btn-terracotta" onClick={() => onOpenBooking({})}>
              MAKE A RESERVATION <ArrowRight size={16} className="ml-2" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
