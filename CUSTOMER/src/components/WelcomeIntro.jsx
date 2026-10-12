import React from 'react';
import { BedDouble, Utensils, HeartHandshake } from 'lucide-react';
import { Link } from 'react-router-dom';
import './WelcomeIntro.css';

export default function WelcomeIntro() {
  return (
    <section className="bengali-about-preview">
      {/* Background paper texture & alpana */}
      <div className="about-bg-texture"></div>
      
      <div className="section-wrapper">
        <div className="about-editorial-layout">
          

          {/* Center: Content */}
          <div className="about-center-content">
            <span className="section-eyebrow">ABOUT US</span>
            <h2 className="section-title">A Place Rooted <br /> in Bengali Hospitality</h2>
            
            <p className="about-description">
              At AMONTRON, we bring together the warmth of Bengali culture,
              comfortable lodging and delicious food. Whether you are here
              for a family trip, a short stay, or a special occasion, we want
              your experience to feel warm and memorable.
            </p>
            
            <Link to="/about" className="about-cta-link">
              Our Story <span className="cta-arrow">&rarr;</span>
            </Link>
          </div>

          {/* Right: Hotel Room Visual + Red Decorative Info Panel */}
          <div className="about-right-composition">
            <div className="about-hotel-image-wrapper">
              <img 
                src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=85" 
                alt="AMONTRON Accommodations & Ambience" 
                className="about-hotel-img"
                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=85'; }}
              />
            </div>
            
            {/* Red decorative information panel */}
            <div className="about-red-info-panel">
              <div className="info-feature-item">
                <div className="info-feature-icon">
                  <BedDouble size={20} />
                </div>
                <span>Comfortable Rooms</span>
              </div>
              <div className="info-feature-item">
                <div className="info-feature-icon">
                  <Utensils size={20} />
                </div>
                <span>Authentic Bengali Food</span>
              </div>
              <div className="info-feature-item">
                <div className="info-feature-icon">
                  <HeartHandshake size={20} />
                </div>
                <span>Warm Hospitality</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
