import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Award, Heart, ArrowRight } from 'lucide-react';
import './AboutPage.css';

export default function AboutPage({ onOpenBooking }) {
  return (
    <div className="bengali-page">
      {/* Editorial Page Hero */}
      <section className="bengali-page-hero editorial-hero">
        <div className="hero-texture-overlay"></div>
        <img src="/images/art7.jpg" className="editorial-hero-bg" alt="Alpana Motif" />
        
        <div className="section-wrapper text-center relative z-2">
          <span className="page-eyebrow">OUR HERITAGE &amp; STORY</span>
          <h1 className="page-title">
            Our Story
          </h1>
          <p className="page-description">
            A harmonious blend of warm Bengali hospitality, rich cultural roots, and modern comfort in the heart of Midnapore.
          </p>
        </div>
      </section>

      {/* Main Story & Values - Editorial Layout */}
      <section className="editorial-about-story">
        <img src="/images/art4.jpg" className="about-decor-dancer left-dancer" alt="" />
        <img src="/images/art4.jpg" className="about-decor-dancer right-dancer" alt="" />
        
        <div className="section-wrapper">
          <div className="editorial-about-grid">
            <div className="about-editorial-text">
              <span className="section-eyebrow">WELCOME TO AMONTRON</span>
              <h2 className="about-heading">
                Tradition Meets Modern Hospitality
              </h2>
              
              <p className="about-paragraph lead">
                AMONTRON HOTEL &amp; RESTAURANT was founded with a singular purpose: to bring the authentic warmth of Bengali 
                hospitality to travellers seeking pristine comfort, gracious care, and memorable cuisine.
              </p>
              <p className="about-paragraph">
                Located conveniently in Midnapore, our property spans three meticulously designed floors featuring 9 well-appointed rooms 
                across Standard, Deluxe, and Super Deluxe categories. Each room provides whisper-quiet air conditioning, high-speed Wi-Fi, 
                flatscreen televisions, sanitized linens, and round-the-clock hot water.
              </p>
              <p className="about-paragraph">
                Complementing our accommodations is our signature in-house restaurant, renowned for traditional Bengali delicacies, fragrant 
                biryanis, authentic North Indian recipes, and savoury tandoor dishes. Whether you are visiting for business, family travels, or 
                a celebratory event, Amontron is your home away from home.
              </p>

              <div className="about-stats-grid">
                <div className="editorial-stat-box">
                  <span className="stat-num">3</span>
                  <span className="stat-label">Floors</span>
                </div>
                <div className="editorial-stat-box">
                  <span className="stat-num">9</span>
                  <span className="stat-label">Rooms</span>
                </div>
                <div className="editorial-stat-box">
                  <span className="stat-num">24/7</span>
                  <span className="stat-label">Service</span>
                </div>
              </div>
            </div>

            <div className="about-editorial-images">
              <div className="editorial-image-frame main-art-frame">
                <img src="/images/art5.jpg" alt="Bengali Hospitality Artwork" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars of Hospitality - Editorial */}
      <section className="editorial-pillars-section">
        <div className="section-wrapper">
          <div className="text-center mb-10">
            <span className="section-eyebrow">OUR COMMITMENTS</span>
            <h2 className="section-title">The Amontron Promise</h2>
          </div>

          <div className="pillars-grid">
            <div className="editorial-pillar-card">
              <div className="pillar-icon-wrap">
                <ShieldCheck size={28} className="text-terracotta" />
              </div>
              <h3>Cleanliness &amp; Comfort</h3>
              <p>Rigorous hygiene protocols, sanitized rooms, crisp fresh linens, and pristine bathrooms for uninterrupted relaxation.</p>
            </div>
            <div className="editorial-pillar-card">
              <div className="pillar-icon-wrap">
                <Heart size={28} className="text-terracotta" />
              </div>
              <h3>Warm Hospitality</h3>
              <p>Attentive 24-hour front desk team and prompt room service ensuring every guest feels valued, comfortable, and cared for.</p>
            </div>
            <div className="editorial-pillar-card">
              <div className="pillar-icon-wrap">
                <Award size={28} className="text-terracotta" />
              </div>
              <h3>Authentic Bengali Flavours</h3>
              <p>Fresh local ingredients, traditional spice blends, and authentic recipes prepared hygienically by our expert culinary team.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="editorial-cta-banner">
        <img src="/images/art6.jpg" className="cta-bg-art" alt=""/>
        <div className="cta-overlay"></div>
        <div className="section-wrapper text-center relative z-2">
          <h2 className="cta-heading">
            Experience Amontron Today
          </h2>
          <p className="cta-desc">
            Book your stay directly with us for guaranteed best rates and personalized service.
          </p>
          <div className="cta-actions">
            <Link to="/rooms" className="btn-outline-gold">VIEW ROOMS</Link>
            <button className="btn-terracotta" onClick={() => onOpenBooking && onOpenBooking({})}>
              BOOK YOUR STAY <ArrowRight size={16} className="ml-2" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
