import React from 'react';
import { Calendar, Users, Check, ArrowRight } from 'lucide-react';
import { EVENTS_AND_OFFERS } from '../data/hotelData';
import './EventsOffersSection.css';

export default function EventsOffersSection({ onEnquireEvent }) {
  return (
    <section className="events-section" id="events">
      <div className="section-wrapper">
        
        {/* Section Header */}
        <div className="section-header">
          <span className="section-eyebrow">CELEBRATE & CONVENE</span>
          <h2 className="section-title">Banquets & Special Gatherings</h2>
          <div className="section-title-line" />
          <p className="section-subtitle">
            Host memorable marriage receptions, corporate seminars, and family celebrations 
            supported by our spacious AC banquet hall and dedicated event team.
          </p>
        </div>

        {/* Events Grid */}
        <div className="events-cards-grid">
          {EVENTS_AND_OFFERS.map((item) => (
            <div key={item.id} className="event-card">
              <div className="event-media">
                <img src={item.image} alt={item.title} className="event-img" loading="lazy" />
                <div className="event-overlay" />
              </div>

              <div className="event-body">
                <h3 className="event-title">{item.title}</h3>
                <p className="event-desc">{item.subtitle}</p>

                <div className="event-features-list">
                  {item.features.map((feat, i) => (
                    <div key={i} className="event-feature-row">
                      <Check size={14} className="feature-check" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="event-card-actions">
                  <button 
                    className="btn-outline-gold w-100"
                    onClick={() => onEnquireEvent(item.title)}
                  >
                    <span>ENQUIRE FOR BOOKING</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
