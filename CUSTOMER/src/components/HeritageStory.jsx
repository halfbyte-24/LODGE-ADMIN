import React from 'react';
import { ShieldCheck, Wifi, Zap, Utensils, Award, UtensilsCrossed } from 'lucide-react';
import { HOTEL_INFO } from '../config/hotelInfo';
import './Story.css';

// AMONTRON hotel highlights — safe static data, no external dependency
const AMONTRON_HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: 'Round-the-Clock Service',
    desc: '24-hour front desk, room service, and security ensuring a safe and comfortable stay.'
  },
  {
    icon: Wifi,
    title: 'High-Speed Wi-Fi',
    desc: 'Seamless high-bandwidth internet in all rooms and common areas — ideal for business and leisure.'
  },
  {
    icon: Zap,
    title: 'Full Power Backup',
    desc: 'Generator backup ensures uninterrupted electricity, cooling, and water supply throughout your stay.'
  },
];

// Recognitions / milestones — safe static data
const AMONTRON_RECOGNITIONS = [
  'Guests\' Choice — 3 Years Running',
  'TripAdvisor Certificate of Excellence',
  '4-Star Certified Property',
  'ISO Hygiene Compliant',
];

export default function HeritageStory() {
  // Safe guard — always an array
  const recognitions = Array.isArray(AMONTRON_RECOGNITIONS) ? AMONTRON_RECOGNITIONS : [];

  return (
    <section id="story" className="story-section">
      <div className="section-wrapper">
        
        <div className="story-grid-layout">
          
          {/* Narrative Column */}
          <div className="story-text-column">
            <span className="section-tag">OUR STORY</span>
            <h2 className="story-main-heading">Warm Hospitality, Modern Comfort</h2>
            <div className="gold-divider story-left-divider" />
            
            <p className="story-lead-p">
              AMONTRON HOTEL &amp; RESTAURANT was founded on a simple belief — that every guest deserves a 
              welcoming, comfortable, and memorable stay. Located in the heart of Midnapore, we have served 
              thousands of business travellers, families, and tourists with genuine warmth and professional care.
            </p>

            <p className="story-body-p">
              Our thoughtfully designed rooms, multi-cuisine restaurant, and 24-hour hospitality make AMONTRON 
              the preferred choice for travellers visiting West Bengal. From a hearty breakfast to a restful night's 
              sleep — every detail is crafted with care to make you feel at home.
            </p>

            {/* Service Pillars */}
            <div className="story-pillars-grid">
              {AMONTRON_HIGHLIGHTS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="pillar-item">
                    <Icon size={22} className="text-gold" />
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recognition Strip */}
            {recognitions.length > 0 && (
              <div className="story-awards-bar">
                {recognitions.map((rec, i) => (
                  <div key={i} className="award-badge-item">
                    <Award size={14} className="text-gold" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visual Showcase Column */}
          <div className="story-visual-column">
            <div className="story-media-main glass-card">
              <img 
                src="https://images.unsplash.com/photo-1551882547-ff40c4eacf6b?auto=format&fit=crop&w=1200&q=80" 
                alt="AMONTRON Hotel Lobby and Reception" 
                className="story-main-img" 
              />
              <div className="story-img-badge">
                <span className="elev-number">MIDNAPORE</span>
                <span className="elev-label">WEST BENGAL, INDIA</span>
              </div>
            </div>

            <div className="story-media-sub glass-card">
              <img 
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80" 
                alt="AMONTRON Multi-Cuisine Restaurant" 
                className="story-sub-img" 
              />
              <div className="story-sub-overlay">
                <strong>Multi-Cuisine Restaurant</strong>
                <span>North Indian · Tandoor · Chinese · Bengali</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
